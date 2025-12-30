import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cancelAllPendingEmails } from '@/lib/email/scheduler';
import crypto from 'crypto';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://palette.app';

// Generate HMAC signature for email (use this when creating unsubscribe links)
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.INTERNAL_API_KEY || process.env.CLERK_SECRET_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

// Verify HMAC signature
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  // Require both email and valid token
  if (!email || !token) {
    return NextResponse.redirect(`${baseUrl}?error=invalid_unsubscribe`);
  }

  // Verify the token to prevent unauthorized unsubscribes
  try {
    if (!verifyUnsubscribeToken(email, token)) {
      console.warn(`⚠️ Invalid unsubscribe token for ${email}`);
      return NextResponse.redirect(`${baseUrl}?error=invalid_unsubscribe`);
    }
  } catch {
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
