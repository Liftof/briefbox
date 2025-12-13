import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, teams, teamMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Credit limits per plan
const PLAN_CREDITS = {
  free: 3,
  pro: 50,
  premium: 150,
} as const;

// GET - Check current credits
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      // User not in DB yet, return free plan defaults
      return NextResponse.json({
        success: true,
        credits: {
          remaining: PLAN_CREDITS.free,
          total: PLAN_CREDITS.free,
          plan: 'free',
          canGenerate: true,
          resetAt: null,
        },
      });
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
