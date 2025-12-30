import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scheduledEmails, users } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send';

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pending emails that are due
    const pendingEmails = await db.query.scheduledEmails.findMany({
      where: and(
        eq(scheduledEmails.status, 'pending'),
        lte(scheduledEmails.scheduledFor, new Date())
      ),
      limit: BATCH_SIZE,
      orderBy: (emails, { asc }) => [asc(emails.scheduledFor)],
    });

    if (pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending emails',
        processed: 0,
      });
    }

    console.log(`📧 Processing ${pendingEmails.length} pending emails...`);

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const email of pendingEmails) {
      // Check if user has unsubscribed
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, email.userId),
        columns: { emailUnsubscribed: true, plan: true },
      });

      // Skip if unsubscribed
      if (user?.emailUnsubscribed) {
        await db.update(scheduledEmails)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(scheduledEmails.id, email.id));
        skipped++;
        console.log(`⏭️ Skipped ${email.emailType} for ${email.userEmail} (unsubscribed)`);
        continue;
      }

      // Skip conversion email if user is no longer on free plan
      if (email.emailType === 'conversion' && user?.plan !== 'free') {
        await db.update(scheduledEmails)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(scheduledEmails.id, email.id));
        skipped++;
        console.log(`⏭️ Skipped conversion for ${email.userEmail} (upgraded to ${user?.plan})`);
        continue;
      }

      // Attempt to send
      const result = await sendEmail({
        to: email.userEmail,
        userName: email.userName || undefined,
        emailType: email.emailType,
        metadata: email.metadata as {
          generationId?: number;
          generationUrl?: string;
          brandName?: string;
          discountCode?: string;
        },
      });

      if (result.success) {
        await db.update(scheduledEmails)
          .set({
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, email.id));

        sent++;
        console.log(`✅ Sent ${email.emailType} email to ${email.userEmail}`);
      } else {
        const newAttempts = email.attempts + 1;
        const newStatus = newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending';

        await db.update(scheduledEmails)
          .set({
            status: newStatus,
            attempts: newAttempts,
            error: result.error,
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, email.id));

        if (newStatus === 'failed') {
          failed++;
          console.log(`❌ Failed ${email.emailType} email to ${email.userEmail} after ${MAX_ATTEMPTS} attempts: ${result.error}`);
        } else {
          console.log(`⚠️ Retry ${newAttempts}/${MAX_ATTEMPTS} for ${email.emailType} to ${email.userEmail}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingEmails.length,
      sent,
      failed,
      skipped,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email process error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint for debugging/monitoring
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get stats
    const allEmails = await db.query.scheduledEmails.findMany();

    const stats = allEmails.reduce((acc, email) => {
      const key = `${email.emailType}_${email.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get next pending emails
    const pending = await db.query.scheduledEmails.findMany({
      where: eq(scheduledEmails.status, 'pending'),
      limit: 10,
      orderBy: (emails, { asc }) => [asc(emails.scheduledFor)],
    });

    return NextResponse.json({
      stats,
      totalEmails: allEmails.length,
      nextPending: pending.map(e => ({
        id: e.id,
        type: e.emailType,
        email: e.userEmail,
        scheduledFor: e.scheduledFor,
        attempts: e.attempts,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
