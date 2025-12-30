import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/brand/[id]/rescrape
 *
 * Allows paid users to re-scrape a brand that was initially scraped in "light" mode.
 * This triggers a full deep scrape (15 pages + socials) regardless of daily limits.
 *
 * Use case: User signed up, got light scrape (daily limit reached), then upgraded to Pro.
 * Now they can get the full analysis they deserve.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const brandId = parseInt(id);

    if (isNaN(brandId)) {
      return NextResponse.json({ error: 'Invalid brand ID' }, { status: 400 });
    }

    // 1. Get user and check if they're on a paid plan
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPaidUser = user.plan === 'pro' || user.plan === 'premium';
    if (!isPaidUser) {
      return NextResponse.json({
        error: 'Re-scrape is only available for Pro and Premium users',
        upgradeRequired: true
      }, { status: 403 });
    }

    // 2. Get the brand and verify ownership
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (brand.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Check if brand was light scraped (otherwise no need to re-scrape)
    if (brand.scrapeDepth === 'deep') {
      return NextResponse.json({
        success: true,
        message: 'Brand was already deep scraped',
        brand,
        alreadyDeep: true
      });
    }

    // 4. Redirect to the analyze endpoint with forceRescrape flag
    // This will bypass the daily limit check and force a deep scrape
    const analyzeUrl = new URL('/api/brand/analyze', request.url);

    const analyzeResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        url: brand.url,
        forceRescrape: true, // This bypasses daily limit and triggers deep scrape
      }),
    });

    const result = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      return NextResponse.json(result, { status: analyzeResponse.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Brand re-scraped with deep analysis',
      brand: result.brand,
      wasRescrape: true,
    });

  } catch (error: any) {
    console.error('Rescrape Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during rescrape' },
      { status: 500 }
    );
  }
}
