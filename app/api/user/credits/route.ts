import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, teams, teamMembers, dailySignupCounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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

  let dailyCount = await db.query.dailySignupCounts.findFirst({
    where: eq(dailySignupCounts.date, today),
  });

  if (!dailyCount) {
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

// GET - Check current credits
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    // Track if this is a new signup at capacity
    let capacityReached = false;

    // IMPORTANT: Create user if not exists (ensures early bird is properly set)
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
      console.log(`📝 [Credits API] New user created: ${userId}, tier: ${tier}, signupCount: ${count}, credits: ${creditsForNewUser}`);
    }

    // Check if user is part of a team with shared credits
    let credits = user.creditsRemaining;
    let total = PLAN_CREDITS[user.plan as keyof typeof PLAN_CREDITS] || PLAN_CREDITS.free;
    let isTeamCredits = false;

    if (user.teamId) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, user.teamId),
      });
      
      if (team) {
        credits = team.creditsPool;
        total = PLAN_CREDITS.premium;
        isTeamCredits = true;
      }
    }

    return NextResponse.json({
      success: true,
      credits: {
        remaining: credits,
        total,
        plan: user.plan,
        canGenerate: credits > 0,
        resetAt: user.creditsResetAt?.toISOString(),
        isTeamCredits,
        isEarlyBird: user.isEarlyBird ?? false,
        capacityReached, // True if signup happened during high traffic (400+/day)
      },
    });

  } catch (error: any) {
    console.error('Get Credits Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Consume credits (called after successful generation)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount = 1 } = body; // Default: consume 1 credit per generation

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is part of a team (use team credits)
    if (user.teamId) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, user.teamId),
      });

      if (team) {
        if (team.creditsPool < amount) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient team credits',
            creditsRemaining: team.creditsPool,
          }, { status: 402 }); // Payment Required
        }

        // Deduct from team pool
        await db.update(teams)
          .set({ 
            creditsPool: team.creditsPool - amount,
            updatedAt: new Date(),
          })
          .where(eq(teams.id, user.teamId));

        return NextResponse.json({
          success: true,
          creditsRemaining: team.creditsPool - amount,
          isTeamCredits: true,
        });
      }
    }

    // Use personal credits
    if (user.creditsRemaining < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        creditsRemaining: user.creditsRemaining,
        plan: user.plan,
      }, { status: 402 }); // Payment Required
    }

    // Deduct credits
    await db.update(users)
      .set({ 
        creditsRemaining: user.creditsRemaining - amount,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId));

    return NextResponse.json({
      success: true,
      creditsRemaining: user.creditsRemaining - amount,
    });

  } catch (error: any) {
    console.error('Consume Credits Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Reset credits (called by Stripe webhook or cron)
export async function PUT(request: NextRequest) {
  try {
    // This should be called by a webhook or admin, not regular users
    // For now, we'll check for a secret header
    const authHeader = request.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY;
    
    if (!expectedKey || authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clerkId, plan } = body;

    if (!clerkId || !plan) {
      return NextResponse.json({ error: 'clerkId and plan required' }, { status: 400 });
    }

    const newCredits = PLAN_CREDITS[plan as keyof typeof PLAN_CREDITS] || PLAN_CREDITS.free;
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);

    await db.update(users)
      .set({
        plan,
        creditsRemaining: newCredits,
        creditsResetAt: nextReset,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkId));

    return NextResponse.json({
      success: true,
      creditsRemaining: newCredits,
      resetAt: nextReset.toISOString(),
    });

  } catch (error: any) {
    console.error('Reset Credits Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
