import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, dailySignupCounts, batchGenerationQueue } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { scheduleEmail } from '@/lib/email/scheduler';

// Credit limits per plan
const PLAN_CREDITS = {
  free: 2, // Reduced from 3 to 2
  pro: 50,
  premium: 150,
} as const;

// Early bird limit per day (first 30 get 2 credits)
const EARLY_BIRD_LIMIT = 30;

// Capacity limit per day (above this, 0 credits - safeguard against viral traffic)
const CAPACITY_LIMIT = 300;

// Signup tier status
type SignupTier = 'early_bird' | 'normal' | 'capacity_reached';

// Helper: Get today's date as YYYY-MM-DD string
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper: Check and increment daily signup count, returns signup tier
async function checkAndIncrementDailySignups(): Promise<{ tier: SignupTier; count: number }> {
  const today = getTodayDateString();

  // Try to get or create today's counter
  let dailyCount = await db.query.dailySignupCounts.findFirst({
    where: eq(dailySignupCounts.date, today),
  });

  if (!dailyCount) {
    // Create new counter for today
    const result = await db.insert(dailySignupCounts)
      .values({ date: today, count: 1 })
      .onConflictDoUpdate({
        target: dailySignupCounts.date,
        set: { count: sql`${dailySignupCounts.count} + 1` }
      })
      .returning();
    const count = result[0].count;
    return { tier: count <= EARLY_BIRD_LIMIT ? 'early_bird' : 'normal', count };
  }

  // Increment existing counter
  const result = await db.update(dailySignupCounts)
    .set({ count: dailyCount.count + 1 })
    .where(eq(dailySignupCounts.date, today))
    .returning();

  const count = result[0].count;

  if (count <= EARLY_BIRD_LIMIT) {
    return { tier: 'early_bird', count };
  } else if (count <= CAPACITY_LIMIT) {
    return { tier: 'normal', count };
  } else {
    return { tier: 'capacity_reached', count };
  }
}

// GET - Get or create user profile
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in our DB
    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // Track if this is a new signup at capacity
    let capacityReached = false;

    // If not, create from Clerk data
    if (!user) {
      const clerkUser = await currentUser();

      // Check signup tier (early bird / normal / capacity reached)
      const { tier, count } = await checkAndIncrementDailySignups();
      const isEarlyBird = tier === 'early_bird';
      capacityReached = tier === 'capacity_reached';

      // Credits based on tier:
      // - Early birds (1-30): 2 credits
      // - Normal (31-400): 1 credit
      // - Capacity reached (400+): 0 credits
      const creditsForNewUser = tier === 'early_bird' ? 2 : tier === 'normal' ? 1 : 0;

      const result = await db.insert(users).values({
        clerkId: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
        avatarUrl: clerkUser?.imageUrl || null,
        plan: 'free',
        creditsRemaining: creditsForNewUser,
        isEarlyBird,
      }).returning();

      user = result[0];

      console.log(`📝 New user created: ${userId}, tier: ${tier}, signupCount: ${count}, credits: ${creditsForNewUser}`);

      // Schedule welcome email (immediate)
      scheduleEmail({
        userId: user.clerkId,
        userEmail: user.email,
        userName: user.name || undefined,
        emailType: 'welcome',
        delayMinutes: 0,
      });

      // Schedule conversion email for free users (3 days = 4320 minutes)
      if (user.plan === 'free') {
        scheduleEmail({
          userId: user.clerkId,
          userEmail: user.email,
          userName: user.name || undefined,
          emailType: 'conversion',
          delayMinutes: 60 * 24 * 3, // 3 days
          metadata: {
            discountCode: 'WELCOME50',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        creditsRemaining: user.creditsRemaining,
        creditsResetAt: user.creditsResetAt?.toISOString(),
        teamId: user.teamId,
        isEarlyBird: user.isEarlyBird ?? false, // For auto-generation eligibility
        capacityReached, // True if signup happened during high traffic (400+/day)
      },
    });

  } catch (error: any) {
    console.error('Get User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user (mainly for internal use)
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatarUrl } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.clerkId, userId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result[0].id,
        email: result[0].email,
        name: result[0].name,
        avatarUrl: result[0].avatarUrl,
        plan: result[0].plan,
        creditsRemaining: result[0].creditsRemaining,
      },
    });

  } catch (error: any) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
