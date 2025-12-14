import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands, users } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

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

// DELETE - Delete a brand (requires brand ID in body)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    // Verify ownership
    const brand = await db.query.brands.findFirst({
      where: and(eq(brands.id, brandId), eq(brands.userId, userId)),
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found or not owned' }, { status: 404 });
    }

    // Delete the brand
    await db.delete(brands).where(eq(brands.id, brandId));

    return NextResponse.json({ success: true, message: 'Brand deleted' });

  } catch (error: any) {
    console.error('Delete Brand Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Check if user can add more brands (plan limits)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'check-can-add') {
      // Get user's plan
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      const plan = user?.plan || 'free';
      
      // Get current brand count
      const userBrands = await db.query.brands.findMany({
        where: eq(brands.userId, userId),
      });

      // Plan limits
      const limits: Record<string, number> = {
        free: 1,      // Free: 1 brand only
        pro: 5,       // Pro: up to 5 brands
        premium: 20,  // Premium: up to 20 brands
      };

      const limit = limits[plan] || 1;
      const canAdd = userBrands.length < limit;

      return NextResponse.json({
        success: true,
        canAdd,
        currentCount: userBrands.length,
        limit,
        plan,
        message: canAdd 
          ? null 
          : plan === 'free'
            ? 'Passez à Pro pour ajouter plus de marques'
            : `Limite atteinte (${limit} marques)`,
      });
    }

    if (action === 'check-can-rescrape') {
      // Get user's plan
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      });

      const plan = user?.plan || 'free';
      
      // Free users cannot re-scrape (they must upgrade)
      const canRescrape = plan !== 'free';

      return NextResponse.json({
        success: true,
        canRescrape,
        plan,
        message: canRescrape 
          ? null 
          : 'Passez à Pro pour actualiser votre marque',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Brand Action Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
