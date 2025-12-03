import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brand } = body;

    if (!brand || !brand.name) {
      return NextResponse.json({ error: 'Invalid brand data' }, { status: 400 });
    }

    // Common data object - ensure all JSONB fields have defaults to avoid SQL errors
    const brandData = {
      userId: userId,
      name: brand.name,
      url: brand.url || '',
      tagline: brand.tagline || '',
      description: brand.description || '',
      industry: brand.industry || '',
      logo: brand.logo || '',
      colors: brand.colors || [],
      fonts: brand.fonts || [],
      aesthetic: brand.aesthetic || [],
      toneVoice: brand.toneVoice || [],
      values: brand.values || [],
      features: brand.features || [],
      services: brand.services || [],
      keyPoints: brand.keyPoints || [],
      visualMotifs: brand.visualMotifs || [],
      marketingAngles: brand.marketingAngles || [],
      backgroundPrompts: brand.backgroundPrompts || [],

      // Save V2 extracted content
      contentNuggets: brand.contentNuggets || null,
      industryInsights: brand.industryInsights || [],
      suggestedPosts: brand.suggestedPosts || [],

      // NOTE: editorialAngles, painPoints, vocabulary columns need migration first
      // Uncomment after running: drizzle/0002_add_editorial_columns.sql
      // editorialAngles: brand.editorialAngles || [],
      // painPoints: brand.painPoints || [],
      // vocabulary: brand.vocabulary || [],

      labeledImages: brand.labeledImages || [],
      backgrounds: brand.backgrounds || []
    };

    let result;
    
    // UPDATE if ID exists and belongs to user
    if (brand.id) {
      // Verify ownership first
      const existing = await db.query.brands.findFirst({
        where: and(eq(brands.id, brand.id), eq(brands.userId, userId))
      });

      if (existing) {
        result = await db.update(brands)
          .set({ ...brandData, updatedAt: new Date() })
          .where(eq(brands.id, brand.id))
          .returning({ id: brands.id });
      } else {
        // If ID provided but not found/owned, fall back to create (or could error)
        // For safety in this MVP, we create new to avoid data loss
        result = await db.insert(brands).values(brandData).returning({ id: brands.id });
      }
    } else {
      // CREATE
      result = await db.insert(brands).values(brandData).returning({ id: brands.id });
    }

    return NextResponse.json({ success: true, brandId: result[0].id });

  } catch (error: any) {
    console.error('Save Brand Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
