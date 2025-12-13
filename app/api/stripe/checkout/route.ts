import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
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

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
};

// POST - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // 'pro' or 'business'

    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get or create user in our DB
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    const clerkUser = await currentUser();

    if (!user) {
      const result = await db.insert(users).values({
        clerkId: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
        plan: 'free',
        creditsRemaining: 3,
      }).returning();
      user = result[0];
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          clerkId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID
      await db.update(users)
        .set({ stripeCustomerId, updatedAt: new Date() })
        .where(eq(users.clerkId, userId));
    }

    // Get price ID
    const priceId = plan === 'pro' ? PRICE_IDS.pro_monthly : PRICE_IDS.business_monthly;

    if (!priceId) {
      return NextResponse.json({ 
        error: 'Stripe price not configured. Please set STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_BUSINESS_MONTHLY environment variables.' 
      }, { status: 500 });
    }

    // Create checkout session
    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/playground?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?canceled=true`,
      metadata: {
        clerkId: userId,
        plan,
      },
      subscription_data: {
        metadata: {
          clerkId: userId,
          plan,
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
