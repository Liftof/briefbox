import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { teams, teamMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST - Invite a member to team
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user's team (must be owner or admin)
    const membership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({
        error: 'Not authorized to invite members',
      }, { status: 403 });
    }

    // Get team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, membership.teamId),
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check member limit (3 for business plan)
    const currentMembers = await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, team.id),
    });

    if (currentMembers.length >= 3) {
      return NextResponse.json({
        error: 'Team member limit reached (3 members max)',
      }, { status: 400 });
    }

    // Find invitee by email
    const invitee = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!invitee) {
      // For now, we require the user to exist
      // In the future, we could send an email invitation
      return NextResponse.json({
        error: 'User not found. They must create an account first.',
      }, { status: 404 });
    }

    // Check if already a member
    const existingMembership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, invitee.clerkId),
    });

    if (existingMembership) {
      return NextResponse.json({
        error: 'User is already part of a team',
      }, { status: 400 });
    }

    // Add as pending member
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: invitee.clerkId,
      role: role as 'member' | 'admin',
      invitedBy: userId,
      // acceptedAt will be null until they accept
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
      member: {
        userId: invitee.clerkId,
        email: invitee.email,
        role,
        status: 'pending',
      },
    });

  } catch (error: any) {
    console.error('Invite Member Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Accept invitation or update role
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, memberId, newRole } = body;

    if (action === 'accept') {
      // User accepting their own invitation
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.userId, userId),
          // acceptedAt should be null for pending invitations
        ),
      });

      if (!membership) {
        return NextResponse.json({
          error: 'No pending invitation found',
        }, { status: 404 });
      }

      if (membership.acceptedAt) {
        return NextResponse.json({
          error: 'Already a member of this team',
        }, { status: 400 });
      }

      // Accept invitation
      await db.update(teamMembers)
        .set({ acceptedAt: new Date() })
        .where(eq(teamMembers.id, membership.id));

      // Update user's teamId
      await db.update(users)
        .set({ teamId: membership.teamId, updatedAt: new Date() })
        .where(eq(users.clerkId, userId));

      return NextResponse.json({
        success: true,
        message: 'Invitation accepted',
      });
    }

    if (action === 'update_role' && memberId && newRole) {
      // Admin/owner changing a member's role
      const adminMembership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, userId),
      });

      if (!adminMembership || adminMembership.role !== 'owner') {
        return NextResponse.json({
          error: 'Only team owner can change roles',
        }, { status: 403 });
      }

      await db.update(teamMembers)
        .set({ role: newRole })
        .where(and(
          eq(teamMembers.teamId, adminMembership.teamId),
          eq(teamMembers.userId, memberId)
        ));

      return NextResponse.json({
        success: true,
        message: 'Role updated',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Update Member Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove member or decline invitation
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    // If no memberId, user is leaving the team
    if (!memberId) {
      const membership = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, userId),
      });

      if (!membership) {
        return NextResponse.json({
          error: 'Not a member of any team',
        }, { status: 404 });
      }

      if (membership.role === 'owner') {
        return NextResponse.json({
          error: 'Owner cannot leave team. Transfer ownership or delete the team.',
        }, { status: 400 });
      }

      // Remove from team
      await db.delete(teamMembers).where(eq(teamMembers.id, membership.id));

      // Update user's teamId
      await db.update(users)
        .set({ teamId: null, updatedAt: new Date() })
        .where(eq(users.clerkId, userId));

      return NextResponse.json({
        success: true,
        message: 'Left the team',
      });
    }

    // Admin/owner removing a member
    const adminMembership = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, userId),
    });

    if (!adminMembership || !['owner', 'admin'].includes(adminMembership.role)) {
      return NextResponse.json({
        error: 'Not authorized to remove members',
      }, { status: 403 });
    }

    // Can't remove the owner
    const targetMembership = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, adminMembership.teamId),
        eq(teamMembers.userId, memberId)
      ),
    });

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMembership.role === 'owner') {
      return NextResponse.json({
        error: 'Cannot remove team owner',
      }, { status: 400 });
    }

    // Admin can't remove other admins
    if (adminMembership.role === 'admin' && targetMembership.role === 'admin') {
      return NextResponse.json({
        error: 'Admins cannot remove other admins',
      }, { status: 403 });
    }

    // Remove member
    await db.delete(teamMembers).where(eq(teamMembers.id, targetMembership.id));

    // Update user's teamId
    await db.update(users)
      .set({ teamId: null, updatedAt: new Date() })
      .where(eq(users.clerkId, memberId));

    return NextResponse.json({
      success: true,
      message: 'Member removed',
    });

  } catch (error: any) {
    console.error('Remove Member Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
