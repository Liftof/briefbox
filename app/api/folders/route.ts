import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { folders, generations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET - Fetch user's folders
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    const conditions = [eq(folders.userId, userId)];

    // If brandId is provided, filter by it. 
    // If not provided, we might show all (legacy behavior) or unassigned ones.
    // For this strict update, let's filter by brandId if present.
    if (brandId) {
      conditions.push(eq(folders.brandId, parseInt(brandId)));
    }

    const result = await db.query.folders.findMany({
      where: and(...conditions),
      orderBy: [desc(folders.createdAt)],
    });

    return NextResponse.json({
      success: true,
      folders: result.map(f => ({
        id: f.externalId,
        name: f.name,
        color: f.color,
        createdAt: f.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });

  } catch (error: any) {
    console.error('Get Folders Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new folder
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, brandId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }

    const externalId = `folder_${Date.now()}`;

    const folderData: any = {
      externalId,
      userId,
      name: name.trim(),
      color: color || '#6B7280',
    };

    if (brandId) {
      folderData.brandId = parseInt(brandId);
    }

    const result = await db.insert(folders).values(folderData).returning();

    return NextResponse.json({
      success: true,
      folder: {
        id: result[0].externalId,
        name: result[0].name,
        color: result[0].color,
        createdAt: result[0].createdAt?.toISOString() || new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Create Folder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete folder (moves generations back to unorganized)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('id');

    if (!folderId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.query.folders.findFirst({
      where: and(
        eq(folders.externalId, folderId),
        eq(folders.userId, userId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Move generations back to unorganized
    await db.update(generations)
      .set({ folderId: null })
      .where(and(
        eq(generations.folderId, folderId),
        eq(generations.userId, userId)
      ));

    // Delete folder
    await db.delete(folders).where(eq(folders.externalId, folderId));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete Folder Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
