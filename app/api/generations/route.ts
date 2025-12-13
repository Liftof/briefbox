import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { generations, folders } from '@/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';

// GET - Fetch user's generations (with optional folder filter)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(generations.userId, userId)];
    
    if (folderId === 'null' || folderId === '') {
      // Get unorganized generations (no folder)
      conditions.push(isNull(generations.folderId));
    } else if (folderId) {
      conditions.push(eq(generations.folderId, folderId));
    }

    const result = await db.query.generations.findMany({
      where: and(...conditions),
      orderBy: [desc(generations.createdAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const allUserGens = await db.query.generations.findMany({
      where: eq(generations.userId, userId),
      columns: { id: true },
    });

    return NextResponse.json({
      success: true,
      generations: result.map(g => ({
        id: g.id.toString(),
        url: g.imageUrl,
        prompt: g.prompt,
        templateId: g.templateId,
        brandName: g.brandName,
        createdAt: g.createdAt?.toISOString() || new Date().toISOString(),
        folderId: g.folderId,
        feedback: g.feedback,
      })),
      total: allUserGens.length,
      page,
      limit,
    });

  } catch (error: any) {
    console.error('Get Generations Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new generation(s)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { generations: newGens } = body;

    if (!newGens || !Array.isArray(newGens) || newGens.length === 0) {
      return NextResponse.json({ error: 'generations array required' }, { status: 400 });
    }

    const toInsert = newGens.map((gen: any) => {
      const item: any = {
        userId,
        imageUrl: gen.url,
        prompt: gen.prompt || null,
        templateId: gen.templateId || null,
        brandName: gen.brandName || null,
        format: gen.format || null,
        type: gen.type || 'social_post',
      };
      // Only add brandId if it's a valid number
      if (gen.brandId) {
        item.brandId = parseInt(gen.brandId);
      }
      return item;
    });

    const result = await db.insert(generations).values(toInsert).returning();

    return NextResponse.json({
      success: true,
      generations: result.map(g => ({
        id: g.id.toString(),
        url: g.imageUrl,
        prompt: g.prompt,
        templateId: g.templateId,
        brandName: g.brandName,
        createdAt: g.createdAt?.toISOString() || new Date().toISOString(),
        folderId: g.folderId,
        feedback: g.feedback,
      })),
    });

  } catch (error: any) {
    console.error('Create Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update generation (feedback, folder, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, folderId, feedback, liked } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.query.generations.findFirst({
      where: and(
        eq(generations.id, parseInt(id)),
        eq(generations.userId, userId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};
    if (folderId !== undefined) updateData.folderId = folderId || null;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (liked !== undefined) updateData.liked = liked;

    const result = await db.update(generations)
      .set(updateData)
      .where(eq(generations.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      success: true,
      generation: {
        id: result[0].id.toString(),
        url: result[0].imageUrl,
        prompt: result[0].prompt,
        templateId: result[0].templateId,
        brandName: result[0].brandName,
        createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
        folderId: result[0].folderId,
        feedback: result[0].feedback,
      },
    });

  } catch (error: any) {
    console.error('Update Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete generation
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify ownership and delete
    const existing = await db.query.generations.findFirst({
      where: and(
        eq(generations.id, parseInt(id)),
        eq(generations.userId, userId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    await db.delete(generations).where(eq(generations.id, parseInt(id)));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
