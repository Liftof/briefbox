import { NextRequest, NextResponse } from 'next/server';
import {
  TemplateId,
  detectTemplate,
  buildTemplatePrompt,
  extractMetric,
  getAllTemplates,
  TemplateParams
} from '@/lib/templates';

// ============================================================================
// CREATIVE DIRECTOR V2 - Template-Based System
// ============================================================================
// No more GPT creativity - just templates filled with brand data
// Predictable, fast, consistent results
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brief, brand, templateId: requestedTemplateId } = body;

    if (!brief || !brand) {
      return NextResponse.json(
        { success: false, error: 'Brief and brand data required' },
        { status: 400 }
      );
    }

    // Extract brand essentials
    const brandName = brand.name || 'Brand';
    const colors = Array.isArray(brand.colors) ? brand.colors : ['#000000'];
    const primaryColor = colors[0] || '#000000';
    const secondaryColor = colors[1] || '#ffffff';

    // Determine which template to use
    let templateId: TemplateId;
    
    if (requestedTemplateId && ['stat', 'announcement', 'event', 'quote', 'expert', 'product'].includes(requestedTemplateId)) {
      templateId = requestedTemplateId as TemplateId;
      console.log(`📋 Using requested template: ${templateId}`);
    } else {
      // Auto-detect from brief
      const detected = detectTemplate(brief);
      templateId = detected.id;
      console.log(`🔍 Auto-detected template: ${templateId} for brief: "${brief.slice(0, 50)}..."`);
    }

    // Build template params
    const params: TemplateParams = {
      brandName,
      primaryColor,
      secondaryColor,
      headline: brief.slice(0, 60), // Use brief as headline (truncated)
      subheadline: brand.tagline || '',
    };

    // Special handling for stat template - extract metric
    if (templateId === 'stat') {
      const extracted = extractMetric(brief);
      if (extracted) {
        params.metric = extracted.metric;
        params.metricLabel = extracted.label;
        console.log(`📊 Extracted metric: ${extracted.metric} (${extracted.label})`);
      } else {
        // Default metric if none found
        params.metric = '100%';
        params.metricLabel = 'satisfaction';
      }
    }

    // Special handling for quote template
    if (templateId === 'quote') {
      params.quote = brief;
      params.personName = 'Client';
      params.personTitle = brand.industry || 'Partner';
    }

    // Special handling for event template
    if (templateId === 'event') {
      params.eventDate = 'À venir';
      params.eventTime = '';
    }

    // Special handling for expert template
    if (templateId === 'expert') {
      params.personName = 'Expert';
      params.personTitle = brand.industry || 'Specialist';
    }

    // Build the final prompt
    const result = buildTemplatePrompt(templateId, params);

    console.log('🎨 Template prompt built:');
    console.log('   Template:', result.templateUsed);
    console.log('   Prompt:', result.prompt.slice(0, 100) + '...');

    return NextResponse.json({
      success: true,
      concept: {
        finalPrompt: result.prompt,
        negativePrompt: result.negativePrompt,
        templateUsed: result.templateUsed,
        params: params // Return params so frontend can edit them
      }
    });

  } catch (error: any) {
    console.error('Creative Director Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to list available templates
export async function GET() {
  const templates = getAllTemplates().map(t => ({
    id: t.id,
    name: t.name,
    nameFr: t.nameFr,
    description: t.description,
    descriptionFr: t.descriptionFr,
    icon: t.icon,
    structure: t.structure,
    fields: t.fields
  }));

  return NextResponse.json({
    success: true,
    templates
  });
}
