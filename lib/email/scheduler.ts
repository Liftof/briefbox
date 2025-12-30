import { db } from '@/db';
import { scheduledEmails, users, EmailType } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface ScheduleEmailOptions {
  userId: string;
  userEmail: string;
  userName?: string;
  emailType: EmailType;
  delayMinutes?: number;
  metadata?: {
    generationId?: number;
    generationUrl?: string;
    brandName?: string;
    discountCode?: string;
  };
}

/**
 * Schedule an email to be sent later
 */
export async function scheduleEmail(options: ScheduleEmailOptions): Promise<void> {
  const { userId, userEmail, userName, emailType, delayMinutes = 0, metadata } = options;

  try {
    // Check if user has unsubscribed
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      columns: { emailUnsubscribed: true },
    });

    if (user?.emailUnsubscribed) {
      console.log(`⏭️ User ${userId} has unsubscribed, skipping ${emailType} email`);
      return;
    }

    // Check for existing pending email of same type (avoid duplicates)
    const existing = await db.query.scheduledEmails.findFirst({
      where: and(
        eq(scheduledEmails.userId, userId),
        eq(scheduledEmails.emailType, emailType),
        eq(scheduledEmails.status, 'pending')
      ),
    });

    if (existing) {
      console.log(`⏭️ ${emailType} email already scheduled for user ${userId}`);
      return;
    }

    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);

    await db.insert(scheduledEmails).values({
      userId,
      userEmail,
      userName,
      emailType,
      scheduledFor,
      metadata,
      status: 'pending',
    });

    console.log(`📧 Scheduled ${emailType} email for ${userId} at ${scheduledFor.toISOString()}`);
  } catch (error) {
    console.error(`Failed to schedule ${emailType} email for ${userId}:`, error);
  }
}

/**
 * Cancel a pending email (e.g., if user upgrades before conversion email)
 */
export async function cancelScheduledEmail(userId: string, emailType: EmailType): Promise<void> {
  try {
    const result = await db.update(scheduledEmails)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(scheduledEmails.userId, userId),
        eq(scheduledEmails.emailType, emailType),
        eq(scheduledEmails.status, 'pending')
      ));

    console.log(`🚫 Cancelled pending ${emailType} email for user ${userId}`);
  } catch (error) {
    console.error(`Failed to cancel ${emailType} email for ${userId}:`, error);
  }
}

/**
 * Cancel all pending emails for a user (e.g., on unsubscribe)
 */
export async function cancelAllPendingEmails(userId: string): Promise<void> {
  try {
    await db.update(scheduledEmails)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(scheduledEmails.userId, userId),
        eq(scheduledEmails.status, 'pending')
      ));

    console.log(`🚫 Cancelled all pending emails for user ${userId}`);
  } catch (error) {
    console.error(`Failed to cancel emails for ${userId}:`, error);
  }
}
