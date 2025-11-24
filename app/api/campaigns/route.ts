import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    const result = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.brandId, parseInt(brandId)),
        eq(campaigns.userId, userId)
      ),
      orderBy: [desc(campaigns.createdAt)]
    });

    return NextResponse.json({ success: true, campaigns: result });

  } catch (error: any) {
    console.error('Get Campaigns Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, brandId, startDate, endDate } = body;

    if (!name || !brandId) {
        return NextResponse.json({ error: 'Name and Brand ID are required' }, { status: 400 });
    }

    const result = await db.insert(campaigns).values({
      userId,
      brandId: parseInt(brandId),
      name,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'active'
    }).returning();

    return NextResponse.json({ success: true, campaign: result[0] });

  } catch (error: any) {
    console.error('Create Campaign Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

