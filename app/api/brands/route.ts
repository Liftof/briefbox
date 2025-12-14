import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq, desc, and, or, isNull } from 'drizzle-orm';

// GET - List all brands for the current user (and team if applicable)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's personal brands + team brands if applicable
    const userBrands = await db.query.brands.findMany({
      where: eq(brands.userId, userId),
      orderBy: [desc(brands.createdAt)],
    });

    // TODO: Also fetch team brands when team system is fully implemented
    // For now, just return personal brands

    return NextResponse.json({ 
      success: true, 
      brands: userBrands.map(b => ({
        id: b.id,
        name: b.name,
        url: b.url,
        logo: b.logo,
        tagline: b.tagline,
        colors: b.colors,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      count: userBrands.length,
    });

  } catch (error: any) {
    console.error('List Brands Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
