import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Credit limits per plan
const PLAN_CREDITS = {
  free: 3,
  pro: 50,
  premium: 150,
} as const;

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
      
      const result = await db.insert(users).values({
        clerkId: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
        name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : null,
        avatarUrl: clerkUser?.imageUrl || null,
        plan: 'free',
        creditsRemaining: PLAN_CREDITS.free,
      }).returning();
      
      user = result[0];
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
