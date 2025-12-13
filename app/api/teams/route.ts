import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { teams, teamMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET - Get user's team
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's team membership
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });

    if (!membership) {
      return NextResponse.json({
        success: true,
        team: null,
        message: 'User is not part of a team',
      });
    }

    // Get team details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (!team) {
      return NextResponse.json({
        success: true,
        team: null,
        message: 'Team not found',
      });
    }

    // Get all team members
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, team.id),
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        ownerId: team.ownerId,
        creditsPool: team.creditsPool,
        creditsResetAt: team.creditsResetAt?.toISOString(),
        memberCount: members.length,
      },
      membership: {
        role: membership.role,
        joinedAt: membership.acceptedAt?.toISOString() || membership.invitedAt?.toISOString(),
      },
      members: members.map(m => ({
        userId: m.userId,
        role: m.role,
        invitedAt: m.invitedAt?.toISOString(),
        acceptedAt: m.acceptedAt?.toISOString(),
      })),
    });

  } catch (error: any) {
    console.error('Get Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new team
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Team name required' }, { status: 400 });
    }

    // Check if user already has a team
    const existingMembership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });

    if (existingMembership) {
      return NextResponse.json({
        error: 'User already belongs to a team',
      }, { status: 400 });
    }

    // Create team
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);

    const teamResult = await db.insert(teams).values({
      name: name.trim(),
      ownerId: userId,
      creditsPool: 150, // Business plan credits
      creditsResetAt: nextReset,
    }).returning();

    const team = teamResult[0];

    // Add owner as team member
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId,
      role: 'owner',
      acceptedAt: new Date(),
    });

    // Update user's teamId
    await db.update(users)
      .set({ teamId: team.id, updatedAt: new Date() })
      .where(eq(users.clerkId, userId));

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        creditsPool: team.creditsPool,
      },
    });

  } catch (error: any) {
    console.error('Create Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update team (name, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Find user's team (must be owner or admin)
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, userId),
      ),
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({
        error: 'Not authorized to update team',
      }, { status: 403 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name.trim();

    const result = await db.update(teams)
      .set(updateData)
      .where(eq(teams.id, membership.teamId))
      .returning();

    return NextResponse.json({
      success: true,
      team: {
        id: result[0].id,
        name: result[0].name,
      },
    });

  } catch (error: any) {
    console.error('Update Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete team (owner only)
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find team where user is owner
    const team = await db.query.teams.findFirst({
      where: eq(teams.ownerId, userId),
    });

    if (!team) {
      return NextResponse.json({
        error: 'Not authorized to delete team',
      }, { status: 403 });
    }

    // Remove all members' teamId reference
    const members = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, team.id),
    });

    for (const member of members) {
      await db.update(users)
        .set({ teamId: null, updatedAt: new Date() })
        .where(eq(users.clerkId, member.userId));
    }

    // Delete team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, team.id));

    // Delete team
    await db.delete(teams).where(eq(teams.id, team.id));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete Team Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
