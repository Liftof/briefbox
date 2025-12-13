import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build errors when env vars are not set
let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    });
  }
  return stripeInstance;
}

// Credit limits per plan
const PLAN_CREDITS = {
  free: 3,
  pro: 50,
  business: 150,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
      }
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const plan = session.metadata?.plan as 'pro' | 'business';

        if (!clerkId || !plan) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update user's subscription
        const credits = PLAN_CREDITS[plan];
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);

        await db.update(users)
          .set({
            plan,
            creditsRemaining: credits,
            creditsResetAt: nextReset,
            stripeSubscriptionId: session.subscription as string,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId));

        console.log(`✅ User ${clerkId} upgraded to ${plan}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Get subscription ID from parent or subscription_details
        const subscriptionId = (invoice as any).parent?.subscription_details?.subscription 
          || (invoice as any).subscription;

        if (!subscriptionId) {
          console.error('No subscription found in invoice');
          break;
        }

        // Get subscription to find the customer/user
        const subscriptionResponse = await getStripe().subscriptions.retrieve(subscriptionId);
        const subscription = subscriptionResponse as any;
        const clerkId = subscription.metadata?.clerkId;
        const plan = subscription.metadata?.plan as 'pro' | 'business';

        if (!clerkId || !plan) {
          console.error('Missing metadata in subscription');
          break;
        }

        // Reset credits on successful payment
        const credits = PLAN_CREDITS[plan];
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);

        const periodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000) 
          : nextReset;

        await db.update(users)
          .set({
            creditsRemaining: credits,
            creditsResetAt: nextReset,
            stripeCurrentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId));

        console.log(`✅ Credits reset for ${clerkId}: ${credits}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as any;
        const clerkId = subscriptionData.metadata?.clerkId;

        if (!clerkId) break;

        // Update period end
        const periodEnd = subscriptionData.current_period_end 
          ? new Date(subscriptionData.current_period_end * 1000) 
          : new Date();

        await db.update(users)
          .set({
            stripeCurrentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId));

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkId = subscription.metadata?.clerkId;

        if (!clerkId) break;

        // Downgrade to free
        await db.update(users)
          .set({
            plan: 'free',
            creditsRemaining: PLAN_CREDITS.free,
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkId));

        console.log(`⚠️ User ${clerkId} downgraded to free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoiceData = event.data.object as any;
        const subscriptionId = invoiceData.parent?.subscription_details?.subscription 
          || invoiceData.subscription;

        if (!subscriptionId) {
          console.log('⚠️ Payment failed - no subscription ID');
          break;
        }

        // Get subscription to find the user
        const subscriptionResponse = await getStripe().subscriptions.retrieve(subscriptionId);
        const subscription = subscriptionResponse as any;
        const clerkId = subscription.metadata?.clerkId;

        if (clerkId) {
          console.log(`⚠️ Payment failed for user ${clerkId}`);
          // Could send email notification here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Disable body parsing - Stripe needs raw body
export const dynamic = 'force-dynamic';
