import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cancelAllPendingEmails } from '@/lib/email/scheduler';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.redirect(`${baseUrl}?error=invalid_unsubscribe`);
  }

  try {
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (user) {
      // Mark as unsubscribed
      await db.update(users)
        .set({ emailUnsubscribed: true, updatedAt: new Date() })
        .where(eq(users.clerkId, user.clerkId));

      // Cancel all pending emails
      await cancelAllPendingEmails(user.clerkId);

      console.log(`📧 User ${email} unsubscribed from emails`);
    }

    // Redirect to confirmation page (or home with success message)
    return NextResponse.redirect(`${baseUrl}?unsubscribed=true`);

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(`${baseUrl}?error=unsubscribe_failed`);
  }
}
