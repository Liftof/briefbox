import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { brands } from '@/db/schema';

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

    // Insert into DB
    const result = await db.insert(brands).values({
      userId: userId,
      name: brand.name,
      url: brand.url || '',
      tagline: brand.tagline,
      description: brand.description,
      industry: brand.industry,
      logo: brand.logo,
      colors: brand.colors,
      fonts: brand.fonts,
      aesthetic: brand.aesthetic,
      toneVoice: brand.toneVoice,
      values: brand.values,
      features: brand.features,
      services: brand.services,
      keyPoints: brand.keyPoints,
      visualMotifs: brand.visualMotifs,
      marketingAngles: brand.marketingAngles,
      backgroundPrompts: brand.backgroundPrompts,
      
      // Save V2 extracted content
      contentNuggets: brand.contentNuggets,
      industryInsights: brand.industryInsights,
      suggestedPosts: brand.suggestedPosts,

      labeledImages: brand.labeledImages,
      // Store extracted backgrounds in the 'backgrounds' column
      backgrounds: brand.backgrounds || [] 
    }).returning({ id: brands.id });

    return NextResponse.json({ success: true, brandId: result[0].id });

  } catch (error: any) {
    console.error('Save Brand Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
