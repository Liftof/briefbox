import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const brandId = parseInt(id);

    if (isNaN(brandId)) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Security check: ensure user owns the brand
    if (brand.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, brand });

  } catch (error: any) {
    console.error('Get Brand Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

