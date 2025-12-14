import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, dailySignupCounts, batchGenerationQueue } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Credit limits per plan
const PLAN_CREDITS = {
  free: 2, // Reduced from 3 to 2
  pro: 50,
  premium: 150,
} as const;

// Early bird limit per day
const EARLY_BIRD_LIMIT = 30;

// Helper: Get today's date as YYYY-MM-DD string
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper: Check and increment daily signup count, returns if user is early bird
async function checkAndIncrementDailySignups(): Promise<boolean> {
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
    return result[0].count <= EARLY_BIRD_LIMIT;
  }
  
  // Increment existing counter
  const result = await db.update(dailySignupCounts)
    .set({ count: dailyCount.count + 1 })
    .where(eq(dailySignupCounts.date, today))
    .returning();
  
  return result[0].count <= EARLY_BIRD_LIMIT;
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

    // If not, create from Clerk data
    if (!user) {
      const clerkUser = await currentUser();
      
      // Check if this user qualifies as early bird (first 30 of the day)
      const isEarlyBird = await checkAndIncrementDailySignups();
      
      // Early birds get 2 credits (1 auto + 1 manual)
      // Non-early birds get 1 credit only (auto-consumed, nothing left)
      const creditsForNewUser = isEarlyBird ? 2 : 1;
      
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
      
      console.log(`📝 New user created: ${userId}, earlyBird: ${isEarlyBird}, credits: ${creditsForNewUser}`);
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
