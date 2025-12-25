import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { generations, folders, brands } from '@/db/schema';
import { eq, and, desc, isNull, inArray } from 'drizzle-orm';

// GET - Fetch user's generations (with optional folder filter)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const brandIdParam = searchParams.get('brandId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('📥 GET /api/generations:', { brandIdParam, folderId, userId });

    // Build query conditions
    const conditions = [eq(generations.userId, userId)];

    if (brandIdParam) {
      const brandId = parseInt(brandIdParam);
      if (!isNaN(brandId)) {
        conditions.push(eq(generations.brandId, brandId));
      } else {
        console.warn(`⚠️ Invalid brandId param: ${brandIdParam}`);
      }
    }

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
        brandId: g.brandId, // FIXED: Include brandId for filtering
        brandName: g.brandName,
        createdAt: g.createdAt?.toISOString() || new Date().toISOString(),
        folderId: g.folderId,
        feedback: g.feedback,
        aspectRatio: g.format || '1:1', // Map DB 'format' to 'aspectRatio'
      })),
      total: allUserGens.length,
      page,
      limit,
    });

  } catch (error: any) {
    console.error('❌ GET Generations Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    return NextResponse.json({
      error: error.message || 'Failed to fetch generations',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
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

    // Validate brandIds exist before inserting
    const brandIds = newGens
      .map((g: any) => g.brandId)
      .filter((id: any) => id != null)
      .map((id: any) => parseInt(id));

    let validBrandIds = new Set<number>();
    if (brandIds.length > 0) {
      const existingBrands = await db.query.brands.findMany({
        where: and(
          eq(brands.userId, userId),
          inArray(brands.id, brandIds)
        ),
        columns: { id: true },
      });
      validBrandIds = new Set(existingBrands.map(b => b.id));
    }

    const toInsert = newGens.map((gen: any) => {
      const item: any = {
        userId,
        imageUrl: gen.url,
        prompt: gen.prompt || null,
        templateId: gen.templateId || null,
        brandName: gen.brandName || null,
        // Accept both 'format' and 'aspectRatio' for backwards compatibility
        format: gen.aspectRatio || gen.format || '1:1',
        type: gen.type || 'social_post',
        campaignId: gen.campaignId ? parseInt(gen.campaignId) : null,
        brandId: null, // Default to null
      };
      // Only set brandId if it exists in DB (prevents foreign key errors)
      if (gen.brandId && validBrandIds.has(parseInt(gen.brandId))) {
        item.brandId = parseInt(gen.brandId);
      } else if (gen.brandId) {
        console.warn(`⚠️ Invalid brandId ${gen.brandId} - setting to null (brand not found for user ${userId})`);
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
        brandId: g.brandId, // FIXED: Include brandId for filtering
        brandName: g.brandName,
        createdAt: g.createdAt?.toISOString() || new Date().toISOString(),
        folderId: g.folderId,
        feedback: g.feedback,
        aspectRatio: g.format || '1:1',
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
        brandId: result[0].brandId, // FIXED: Include brandId for filtering
        brandName: result[0].brandName,
        createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
        folderId: result[0].folderId,
        feedback: result[0].feedback,
        aspectRatio: result[0].format || '1:1',
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
