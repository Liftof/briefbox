import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const startStr = searchParams.get('start'); // ISO Date string
    const endStr = searchParams.get('end');     // ISO Date string

    if (!brandId) {
        return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    // Build where clause
    let whereClause = and(
        eq(posts.brandId, parseInt(brandId)),
        eq(posts.userId, userId)
    );

    if (startStr && endStr) {
        whereClause = and(
            whereClause,
            gte(posts.scheduledDate, new Date(startStr)),
            lte(posts.scheduledDate, new Date(endStr))
        );
    }

    const result = await db.query.posts.findMany({
      where: whereClause,
      orderBy: [desc(posts.scheduledDate)]
    });

    return NextResponse.json({ success: true, posts: result });

  } catch (error: any) {
    console.error('Get Calendar Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { brandId, content, mediaUrl, platform, scheduledDate, campaignId } = body;

    if (!brandId || !mediaUrl || !scheduledDate) {
        return NextResponse.json({ error: 'Missing required fields (brandId, mediaUrl, date)' }, { status: 400 });
    }

    const result = await db.insert(posts).values({
      userId,
      brandId: parseInt(brandId),
      campaignId: campaignId ? parseInt(campaignId) : undefined,
      content,
      mediaUrl,
      platform: platform || 'instagram',
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled'
    }).returning();

    return NextResponse.json({ success: true, post: result[0] });

  } catch (error: any) {
    console.error('Create Post Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

