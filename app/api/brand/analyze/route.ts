import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import getColors from 'get-image-colors';
import sharp from 'sharp';
import { rateLimitByUser, rateLimitGlobal, rateLimitByIP } from '@/lib/rateLimit';
import { db } from '@/db';
import { brands, users } from '@/db/schema';
import { eq, and, like } from 'drizzle-orm';
import { firecrawlScrape, firecrawlMap, firecrawlExtract, firecrawlSearch, firecrawlBatchScrape } from '@/lib/firecrawl';
import { callGeminiWithFallback, USE_GEMINI_FOR_BRAND_ANALYSIS, type MultimodalContent } from '@/lib/gemini';

// Content nugget types for editorial extraction
interface ContentNugget {
  type: 'stat' | 'testimonial' | 'achievement' | 'fact' | 'blog_topic';
  content: string;
  source?: string;
  context?: string;
}

interface IndustryInsight {
  fact: string;
  didYouKnow: string;
  source?: string;
  url?: string;
}

interface ParallelSearchResult {
  url: string;
  title: string;
  publish_date?: string;
  excerpts: string[];
}

// ==========================================
// TRANSFORM RAW DATA → SMART EDITORIAL ANGLES
// ==========================================
// Takes raw Firecrawl data and transforms it into engaging editorial angles
// using a fast LLM (Claude Haiku) - this is the MISSING step!
async function transformToEditorialAngles(
  rawInsights: { text: string; source?: string; type: string }[],
  brandContext: { name: string; targetAudience: string; industry: string }
): Promise<{ painPoint: string; consequence: string; type: string }[]> {
  if (!rawInsights.length || !process.env.OPENROUTER_API_KEY) {
    return [];
  }

  try {
    console.log(`🎯 Transforming ${rawInsights.length} raw insights into editorial angles...`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "anthropic/claude-3-haiku", // Fast & cheap for this task
        "messages": [{
          "role": "user",
          "content": `Tu es un expert en content marketing. Transforme ces données brutes en ANGLES ÉDITORIAUX pour les réseaux sociaux de ${brandContext.name}.

⚠️ PERSPECTIVE CRITIQUE:
La cible sont les CLIENTS de ${brandContext.name}, donc: ${brandContext.targetAudience}
Ces angles seront utilisés pour créer des posts sur les réseaux sociaux de ${brandContext.name}.
Donc ils doivent PARLER AUX ${brandContext.targetAudience.toUpperCase()}, pas parler DE l'industrie ${brandContext.industry}.

EXEMPLE de ce qu'il NE FAUT PAS faire:
❌ "Le marché du ${brandContext.industry} atteindra 500 milliards" (personne ne s'en fiche)
❌ "L'industrie ${brandContext.industry} connaît une croissance de 15%" (ennuyeux)

EXEMPLE de ce qu'il FAUT faire:
✅ "Vous passez 2h/jour sur des tâches répétitives ? Voici comment..." (parle AU client)
✅ "73% des ${brandContext.targetAudience} galèrent avec X. Et vous ?" (interpelle)

DONNÉES BRUTES:
${rawInsights.map((r, i) => `${i + 1}. [${r.type}] ${r.text}`).join('\n')}

RÈGLES:
- Chaque angle doit INTERPELLER directement les ${brandContext.targetAudience}
- Utilise "vous/votre" pour s'adresser au lecteur
- Formule comme une question, une provocation, ou un hook émotionnel
- IGNORE toute stat sur la taille du marché, la croissance de l'industrie, etc.
- Garde uniquement ce qui PARLE à la cible au quotidien

Retourne un JSON array avec 6-8 angles (MINIMUM 6):
[
  { "painPoint": "L'angle reformulé comme hook", "consequence": "L'impact concret pour la cible", "type": "pain_point|trend|social_proof" }
]

IMPORTANT: Génère AU MOINS 6 angles différents. Varie les types (pain_point, trend, social_proof).
Si une donnée brute n'est pas assez spécifique, reformule-la pour la rendre percutante.
Retourne UNIQUEMENT le JSON array, rien d'autre.`
        }],
        "max_tokens": 500,
        "temperature": 0.3
      })
    });

    if (!response.ok) {
      console.warn('Editorial angle transformation failed:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const angles = JSON.parse(jsonMatch[0]);
    console.log(`✅ Transformed into ${angles.length} smart editorial angles`);
    return angles;

  } catch (error) {
    console.warn('Failed to transform insights:', error);
    return [];
  }
}

// ==========================================
// REFINE CONTENT ANGLES WITH LLM
// ==========================================
// Takes all angles (primary + secondary) and refines them for quality
async function refineContentAnglesWithLLM(params: {
  angles: any[];
  brandName: string;
  targetAudience: string;
  industry: string;
  uniqueValueProposition: string;
  detectedLanguage: string;
  features: string[];
}): Promise<any[]> {
  const { angles, brandName, targetAudience, industry, uniqueValueProposition, detectedLanguage, features } = params;

  if (!angles.length || !process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️ No angles to refine or missing API key, returning original');
    return angles;
  }

  try {
    const isFrench = detectedLanguage === 'fr';
    const languageName = isFrench ? 'FRANÇAIS' : 'ENGLISH';

    console.log(`🎨 Refining ${angles.length} angles with LLM (language: ${languageName})...`);

    const systemPrompt = isFrench
      ? `Tu es un expert en copywriting et marketing de contenu. Tu vas raffiner des angles de contenu pour les rendre plus percutants et engageants.`
      : `You are a copywriting and content marketing expert. You will refine content angles to make them more impactful and engaging.`;

    const userPrompt = isFrench
      ? `Je travaille sur les angles de contenu pour ${brandName} (${industry}).

CONTEXTE DE LA MARQUE:
- Cible: ${targetAudience}
- Proposition de valeur: ${uniqueValueProposition}
- Fonctionnalités clés: ${features.slice(0, 3).join(', ')}

ANGLES ACTUELS (${angles.length}):
${angles.map((a, i) => `${i + 1}. [${a.tier || 'unknown'}] "${a.painPoint}" ${a.consequence ? `→ ${a.consequence}` : ''}`).join('\n')}

MISSION:
1. SÉLECTIONNE les 10 meilleurs angles (les plus pertinents et impactants pour la cible)
2. REFORMULE chaque angle sélectionné pour qu'il soit:
   - ✅ Punchy et accrocheur (max 80 caractères)
   - ✅ Directement adressé à la cible (utilise "vous", "votre")
   - ✅ Spécifique au produit/service de ${brandName}
   - ✅ En FRANÇAIS correct et naturel
   - ❌ PAS générique ou bateau
   - ❌ PAS de stats de marché ou projections

3. Pour chaque angle, adapte le TON à l'industrie:
   ${industry.match(/finance|law|consulting|healthcare|enterprise|b2b/i)
     ? '→ TON PROFESSIONNEL: Focus ROI, efficacité, conformité, risque'
     : '→ TON ACCESSIBLE: Plus émotionnel, relatable, fun'}

CRITÈRES DE SÉLECTION (priorité):
- Les angles qui parlent directement d'un problème concret de la cible
- Les angles qui mettent en avant une solution spécifique de ${brandName}
- Les questions provocantes qui font réfléchir
- REJETTE: stats de marché, projections, tendances génériques

FORMAT DE SORTIE (JSON uniquement):
[
  {
    "painPoint": "Angle reformulé en français, punchy, max 80 chars",
    "consequence": "Impact concret ou bénéfice en 1 phrase courte",
    "type": "pain_point|trend|social_proof|tip|competitive|primary",
    "tier": "primary|secondary"
  }
]

IMPORTANT: Retourne EXACTEMENT 10 angles. Uniquement le JSON array, rien d'autre.`
      : `I'm working on content angles for ${brandName} (${industry}).

BRAND CONTEXT:
- Target audience: ${targetAudience}
- Value proposition: ${uniqueValueProposition}
- Key features: ${features.slice(0, 3).join(', ')}

CURRENT ANGLES (${angles.length}):
${angles.map((a, i) => `${i + 1}. [${a.tier || 'unknown'}] "${a.painPoint}" ${a.consequence ? `→ ${a.consequence}` : ''}`).join('\n')}

MISSION:
1. SELECT the 10 best angles (most relevant and impactful for the target)
2. REWRITE each selected angle to be:
   - ✅ Punchy and catchy (max 80 characters)
   - ✅ Directly addressed to target (use "you", "your")
   - ✅ Specific to ${brandName}'s product/service
   - ✅ In correct and natural ENGLISH
   - ❌ NOT generic or bland
   - ❌ NO market stats or projections

3. For each angle, adapt the TONE to the industry:
   ${industry.match(/finance|law|consulting|healthcare|enterprise|b2b/i)
     ? '→ PROFESSIONAL TONE: Focus on ROI, efficiency, compliance, risk'
     : '→ ACCESSIBLE TONE: More emotional, relatable, fun'}

SELECTION CRITERIA (priority):
- Angles that speak directly to a concrete problem of the target
- Angles that highlight a specific solution from ${brandName}
- Provocative questions that make you think
- REJECT: market stats, projections, generic trends

OUTPUT FORMAT (JSON only):
[
  {
    "painPoint": "Refined angle in English, punchy, max 80 chars",
    "consequence": "Concrete impact or benefit in 1 short sentence",
    "type": "pain_point|trend|social_proof|tip|competitive|primary",
    "tier": "primary|secondary"
  }
]

IMPORTANT: Return EXACTLY 10 angles. Only the JSON array, nothing else.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "anthropic/claude-3.5-sonnet", // Use Sonnet for better quality
        "messages": [
          { "role": "system", "content": systemPrompt },
          { "role": "user", "content": userPrompt }
        ],
        "max_tokens": 1500,
        "temperature": 0.4
      })
    });

    if (!response.ok) {
      console.warn('⚠️ LLM refinement failed:', response.status);
      return angles; // Return original if refinement fails
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in LLM response');
      return angles;
    }

    const refinedAngles = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(refinedAngles) || refinedAngles.length === 0) {
      console.warn('⚠️ Invalid refined angles, returning original');
      return angles;
    }

    console.log(`✅ Refined ${angles.length} → ${refinedAngles.length} high-quality angles (${languageName})`);
    console.log(`   Sample: "${refinedAngles[0]?.painPoint?.slice(0, 60)}..."`);

    return refinedAngles;

  } catch (error) {
    console.warn('⚠️ Failed to refine angles:', error);
    return angles; // Fallback to original angles
  }
}

// ==========================================
// INSIGHT QUALITY FILTER - Apply at SOURCE
// ==========================================
// Filter out generic market stats that nobody cares about
// This runs BEFORE adding to brandData, not at display time
function isRelevantInsight(text: string): boolean {
  if (!text || text.length < 10) return false;

  const lower = text.toLowerCase();

  // FORBIDDEN patterns - generic industry garbage
  const garbagePatterns = [
    // Market size / projections (useless for end users)
    'market is projected', 'projected to reach', 'is projected to',
    'market will reach', 'market grew', 'market growth', 'market size',
    'market is forecasted', 'market forecast',
    // Money figures (nobody cares about industry TAM)
    'billion', 'trillion', 'million dollar', 'usd ', ' usd', 'eur ', ' eur',
    '$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9',
    // Growth rates / financial metrics
    'cagr', 'compound annual', 'growth rate', 'rising at a',
    'year-over-year', 'yoy growth',
    // Generic industry talk
    'the global market', 'the industry', 'the market is', 'market players',
    'industry worth', 'industry will', 'industry is expected',
    'organizations will adopt', 'companies will', 'enterprises will',
    'adoption rate', 'adoption is growing',
    // Year projections
    'by 2024', 'by 2025', 'by 2026', 'by 2027', 'by 2028', 'by 2029', 'by 2030', 'by 2031', 'by 2032',
    'in 2024', 'in 2025', 'in 2030',
    // Random unrelated industries (Firecrawl sometimes returns garbage)
    'food safety', 'quality control market', 'healthcare market',
    'automotive market', 'manufacturing market',
    // Too vague / generic
    'digital transformation', 'artificial intelligence market', 'ai market',
    'machine learning market', 'cloud computing market',
    'according to a report', 'industry report', 'market report',
  ];

  // Check if any garbage pattern is present
  for (const pattern of garbagePatterns) {
    if (lower.includes(pattern)) {
      console.log(`🗑️ Filtered out garbage insight: "${text.slice(0, 60)}..." (matched: ${pattern})`);
      return false;
    }
  }

  return true;
}

// Helper: Use Firecrawl Extract v2 for structured data with web search enrichment
// NOW USES CENTRALIZED HELPER with polling support for async jobs
async function extractWithFirecrawl(
  url: string,
  industry: string,
  brandName: string
): Promise<{
  painPoints: { problem: string; impact: string; source?: string }[];
  trends: { trend: string; relevance: string; source?: string }[];
  competitorInsights: string[];
}> {
  const emptyResult = { painPoints: [], trends: [], competitorInsights: [] };

  const result = await firecrawlExtract<{
    painPoints: { problem: string; impact: string }[];
    trends: { trend: string; relevance: string }[];
    competitorInsights: string[];
  }>([url], {
    prompt: `For a ${industry} company called "${brandName}", extract insights about their TARGET CUSTOMERS (not about the ${industry} industry itself!):

1. Pain points the TARGET USERS face daily (with specific impact/cost on THEM)
   - Example: "73% of marketing professionals juggle 5+ tools daily" ✅
   - NOT: "The SaaS market will reach $X billion" ❌

2. Trends affecting the TARGET USERS' work/life (2024-2025)
   - Example: "Remote marketers report 30% more burnout" ✅
   - NOT: "AI adoption in enterprise is growing" ❌

3. What competitors fail to solve for these users

Focus on stats that would make the TARGET CUSTOMER stop scrolling. Be specific with percentages and time/money impact.`,
    schema: {
      type: 'object',
      properties: {
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'A specific struggle the TARGET USER faces daily' },
              impact: { type: 'string', description: 'Quantified impact on THEM (time/money/stress lost)' }
            },
            required: ['problem', 'impact']
          }
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trend: { type: 'string', description: 'A trend affecting the TARGET USERS work/life' },
              relevance: { type: 'string', description: 'Why it matters for THEM (not for the industry)' }
            },
            required: ['trend', 'relevance']
          }
        },
        competitorInsights: {
          type: 'array',
          items: { type: 'string' },
          description: 'What competitors fail to deliver for the target users'
        }
      },
      required: ['painPoints', 'trends', 'competitorInsights']
    },
    enableWebSearch: true,
    pollTimeout: 15000, // Wait up to 15s for async jobs
  });

  if (!result.success || !result.data) {
    return emptyResult;
  }

  console.log(`✅ Firecrawl Extract success:`, {
    painPoints: result.data.painPoints?.length || 0,
    trends: result.data.trends?.length || 0,
    competitorInsights: result.data.competitorInsights?.length || 0
  });

  return {
    painPoints: result.data.painPoints || [],
    trends: result.data.trends || [],
    competitorInsights: result.data.competitorInsights || []
  };
}

// Helper: Smart Firecrawl Search for competitive intelligence & market insights
// Uses: sources (news), categories (research), tbs (time filter) per docs.firecrawl.dev/features/search
async function enrichWithFirecrawlSearch(
  industry: string,
  brandName: string,
  targetAudience?: string
): Promise<{
  painPoints: { point: string; source: string }[];
  trends: { trend: string; source: string; isRecent?: boolean }[];
  marketContext: string[];
  competitors: { name: string; weakness?: string; source: string }[];
  newsHighlights: { headline: string; date?: string; url: string }[];
}> {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

  if (!FIRECRAWL_API_KEY) {
    console.warn('⚠️ FIRECRAWL_API_KEY not set, skipping enrichment search');
    return { painPoints: [], trends: [], marketContext: [], competitors: [], newsHighlights: [] };
  }

  const results = {
    painPoints: [] as { point: string; source: string }[],
    trends: [] as { trend: string; source: string; isRecent?: boolean }[],
    marketContext: [] as string[],
    competitors: [] as { name: string; weakness?: string; source: string }[],
    newsHighlights: [] as { headline: string; date?: string; url: string }[]
  };

  try {
    console.log(`🔥 Smart Firecrawl Search for: ${industry} / ${brandName}`);

    // STRATEGIC SEARCH MATRIX - Focus on TARGET AUDIENCE problems, NOT industry meta-data!
    // IMPORTANT: We want insights that speak TO the target customer, not ABOUT the client's industry
    // Example: For a "SaaS for marketers", search for "marketer problems", NOT "SaaS market growth"

    const searches = [
      // 1. PAIN POINTS - What problems does the TARGET AUDIENCE face in their daily work?
      // If targetAudience = "marketing professionals", search for THEIR struggles
      {
        query: targetAudience
          ? `"${targetAudience}" daily struggles challenges time wasted statistics survey`
          : `professionals problems with "${industry}" frustrations pain points`,
        type: 'painPoints',
        config: { limit: 5, scrapeOptions: { formats: ['markdown'] } }
      },

      // 2. TARGET AUDIENCE TRENDS - What's changing in THEIR profession?
      // NOT "Industry grew" but "More marketers are struggling with X"
      {
        query: targetAudience
          ? `"${targetAudience}" challenges trends burnout workload statistics 2024 2025`
          : `"${industry}" users challenges productivity statistics`,
        type: 'trends',
        config: { limit: 5, tbs: 'qdr:m' }
      },

      // 3. RELEVANT NEWS - Topics the TARGET AUDIENCE cares about professionally
      {
        query: targetAudience
          ? `"${targetAudience}" career challenges news`
          : `"${industry}" professionals news impact`,
        type: 'news',
        config: { limit: 5, sources: ['news'] }
      },

      // 4. COMPETITOR ANALYSIS - What are customers saying about alternatives?
      {
        query: `"${brandName}" alternatives OR competitors reviews complaints`,
        type: 'competitors',
        config: { limit: 5, scrapeOptions: { formats: ['markdown'] } }
      },

      // 5. RESEARCH/STATS - Stats about the TARGET AUDIENCE's work life
      // NOT "Market size $X billion" but "X% of [target audience] struggle with Y"
      {
        query: targetAudience
          ? `"${targetAudience}" survey study report percentage time productivity`
          : `"${industry}" users customer statistics survey percentage`,
        type: 'research',
        config: { limit: 3, categories: ['research'] }
      }
    ];

    // Add specific customer problem search
    if (targetAudience && targetAudience.length > 3) {
      searches.push({
        query: `"${targetAudience}" biggest challenges pain points statistics survey`,
        type: 'painPoints',
        config: { limit: 3, scrapeOptions: { formats: ['markdown'] } }
      });
    }

    // Execute ALL searches in parallel for speed - V2 API with sources support
    const searchPromises = searches.map(async (search) => {
      try {
        // V2: Add sources for news/images when relevant
        const searchBody: any = {
          query: search.query,
          ...search.config,
          // V2 improvements
          maxAge: 172800, // 2 days cache (faster responses)
        };

        // V2: Use sources for news searches
        if (search.type === 'news') {
          searchBody.sources = ['news'];
        }

        const response = await fetch('https://api.firecrawl.dev/v2/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
          },
          body: JSON.stringify(searchBody)
        });

        if (!response.ok) {
          console.warn(`Search failed for "${search.type}":`, response.status);
          return { type: search.type, data: null, rawResponse: null };
        }

        const data = await response.json();
        return { type: search.type, data: data.data, rawResponse: data };
      } catch (e) {
        console.warn(`Search error for "${search.type}":`, e);
        return { type: search.type, data: null, rawResponse: null };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // PROCESS EACH RESULT TYPE DIFFERENTLY
    for (const result of searchResults) {
      if (!result.data) continue;

      // Handle different response structures
      const webResults = Array.isArray(result.data) ? result.data : (result.data.web || []);
      const newsResults = result.data.news || [];

      // === PAIN POINTS: Extract frustration sentences ===
      if (result.type === 'painPoints') {
        for (const item of webResults) {
          const content = item.markdown || item.description || '';
          try {
            const hostname = new URL(item.url || '').hostname;
            const painSentences = content
              .split(/[.!?]/)
              .filter((s: string) =>
                s.length > 40 && s.length < 250 &&
                (s.toLowerCase().includes('challenge') ||
                  s.toLowerCase().includes('struggle') ||
                  s.toLowerCase().includes('frustrat') ||
                  s.toLowerCase().includes('difficult') ||
                  s.toLowerCase().includes('pain point') ||
                  s.toLowerCase().includes('problem'))
              )
              .slice(0, 2);

            for (const sentence of painSentences) {
              results.painPoints.push({ point: sentence.trim(), source: hostname });
            }
          } catch (e) { /* skip invalid URLs */ }
        }
      }

      // === TRENDS: Extract with stats/numbers ===
      if (result.type === 'trends' || result.type === 'research') {
        for (const item of webResults) {
          const content = item.markdown || item.description || item.snippet || '';
          try {
            const hostname = new URL(item.url || '').hostname;
            const trendSentences = content
              .split(/[.!?]/)
              .filter((s: string) =>
                s.length > 40 && s.length < 250 &&
                (s.match(/\d+%/) || s.match(/\$[\d,]+/) || s.match(/\d+x/) ||
                  s.toLowerCase().includes('grow') ||
                  s.toLowerCase().includes('increase') ||
                  s.toLowerCase().includes('rise') ||
                  s.toLowerCase().includes('market') ||
                  s.toLowerCase().includes('trend'))
              )
              .slice(0, 2);

            for (const sentence of trendSentences) {
              results.trends.push({
                trend: sentence.trim(),
                source: hostname,
                isRecent: result.type === 'trends' // tbs filtered = recent
              });
            }
          } catch (e) { /* skip */ }
        }
      }

      // === NEWS: Headlines for content inspiration ===
      if (result.type === 'news' && newsResults.length > 0) {
        for (const news of newsResults.slice(0, 4)) {
          results.newsHighlights.push({
            headline: news.title || news.snippet || '',
            date: news.date,
            url: news.url
          });
        }
        console.log(`📰 Found ${newsResults.length} news items`);
      }

      // === COMPETITORS: Extract names and potential weaknesses ===
      if (result.type === 'competitors') {
        for (const item of webResults) {
          const content = item.markdown || item.description || '';
          const title = item.title || '';

          // Extract competitor names from "X vs Y" or "alternatives to X" patterns
          const vsMatch = title.match(/(\w+)\s+vs\s+(\w+)/i);
          const altMatch = content.match(/alternatives?(?:\s+to)?\s+(\w+)/i);

          if (vsMatch) {
            const comp = vsMatch[1] !== brandName ? vsMatch[1] : vsMatch[2];
            if (comp && comp.toLowerCase() !== brandName.toLowerCase()) {
              // Look for weakness mentions
              const weaknessMatch = content.match(new RegExp(`${comp}[^.]*(?:lacks?|missing|doesn't|no |without)[^.]*`, 'i'));
              try {
                results.competitors.push({
                  name: comp,
                  weakness: weaknessMatch ? weaknessMatch[0].slice(0, 100) : undefined,
                  source: new URL(item.url || '').hostname
                });
              } catch (e) { /* skip */ }
            }
          }
        }
      }
    }

    // DEDUPLICATE all results
    results.painPoints = results.painPoints
      .filter((p, i, arr) => arr.findIndex(x => x.point.slice(0, 50) === p.point.slice(0, 50)) === i)
      .slice(0, 6);

    results.trends = results.trends
      .filter((t, i, arr) => arr.findIndex(x => x.trend.slice(0, 50) === t.trend.slice(0, 50)) === i)
      .slice(0, 6);

    results.competitors = results.competitors
      .filter((c, i, arr) => arr.findIndex(x => x.name.toLowerCase() === c.name.toLowerCase()) === i)
      .slice(0, 5);

    console.log(`✅ Smart Search results:`, {
      painPoints: results.painPoints.length,
      trends: results.trends.length,
      news: results.newsHighlights.length,
      competitors: results.competitors.length
    });

    return results;
  } catch (error) {
    console.error('Firecrawl enrichment error:', error);
    return results;
  }
}

// Helper: Search for real industry insights using Parallel Search API
async function searchIndustryInsights(industry: string, brandName: string): Promise<{
  rawExcerpts: string;
  sources: { url: string; title: string }[];
}> {
  const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;

  if (!PARALLEL_API_KEY) {
    console.warn('⚠️ PARALLEL_API_KEY not set, skipping industry search');
    return { rawExcerpts: '', sources: [] };
  }

  try {
    console.log(`🔍 Searching industry insights for: ${industry}`);

    const response = await fetch('https://api.parallel.ai/v1beta/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PARALLEL_API_KEY,
        'parallel-beta': 'search-extract-2025-10-10'
      },
      body: JSON.stringify({
        mode: 'agentic',
        objective: `Find specific, quantified market data and trends for the ${industry} industry, specifically related to ${brandName}. 
I do NOT want generic statements like "the market is growing".
I need:
1. Precise numbers (CAGR, Market Value in Billions, User adoption %).
2. Named trends with dates (e.g. "The shift to Headless CMS in 2024").
3. Specific pain points reported by users in this sector.
4. Competitor benchmarks if available.
Focus on data from 2024-2025 reports from Gartner, Forrester, Statista, or specialized industry blogs.`,
        search_queries: [
          `${industry} market size statistics 2024 2025`,
          `${industry} key trends and challenges 2025`,
          `${industry} user pain points report`,
          `${industry} benchmark metrics 2024`
        ],
        max_results: 8,
        excerpts: {
          max_chars_per_result: 3000,
          max_chars_total: 15000
        }
      })
    });

    if (!response.ok) {
      console.warn('Parallel Search API error:', await response.text());
      return { rawExcerpts: '', sources: [] };
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn('No search results found');
      return { rawExcerpts: '', sources: [] };
    }

    console.log(`✅ Found ${data.results.length} industry sources`);

    // Compile excerpts and sources
    const sources = data.results.map((r: ParallelSearchResult) => ({
      url: r.url,
      title: r.title
    }));

    const rawExcerpts = data.results
      .map((r: ParallelSearchResult) => {
        const excerptText = r.excerpts?.join('\n\n') || '';
        return `SOURCE: ${r.title} (${r.url})\n${excerptText}`;
      })
      .join('\n\n---\n\n');

    return { rawExcerpts, sources };
  } catch (error) {
    console.error('Industry search error:', error);
    return { rawExcerpts: '', sources: [] };
  }
}

// Helper: Extract dominant colors from an image URL
async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  try {
    console.log('🎨 Extracting colors from:', imageUrl);

    // Skip SVGs - they often have parsing issues and Sharp can't always handle them
    const isSvg = imageUrl.toLowerCase().includes('.svg') || imageUrl.includes('image/svg');
    if (isSvg) {
      console.log('⚠️ Skipping SVG for color extraction (not supported reliably)');
      return [];
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'image/*' }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('Failed to fetch image for color extraction:', response.status);
      return [];
    }

    const contentType = response.headers.get('content-type') || '';

    // Double-check for SVG in content-type
    if (contentType.includes('svg')) {
      console.log('⚠️ Detected SVG via content-type, skipping color extraction');
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if buffer looks like SVG (starts with < or <?xml)
    const bufferStart = buffer.slice(0, 100).toString('utf8').trim();
    if (bufferStart.startsWith('<') || bufferStart.startsWith('<?xml')) {
      console.log('⚠️ Buffer appears to be SVG/XML, skipping');
      return [];
    }

    // Convert to PNG using sharp (handles WEBP, etc.)
    const pngBuffer = await sharp(buffer)
      .png()
      .resize(200, 200, { fit: 'inside' })
      .toBuffer();

    // Extract colors using get-image-colors
    const colors = await getColors(pngBuffer, 'image/png');

    // Convert to hex and filter out near-white/near-black that might be background
    const hexColors = colors
      .map((color: any) => color.hex())
      .filter((hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.05 && luminance < 0.95;
      });

    console.log('🎨 Extracted colors:', hexColors);
    return hexColors.slice(0, 5);
  } catch (error: any) {
    // Don't log full error for expected SVG issues
    if (error.message?.includes('XML') || error.message?.includes('SVG')) {
      console.warn('⚠️ SVG processing skipped');
    } else {
      console.error('Color extraction error:', error.message || error);
    }
    return [];
  }
}

// Helper: Map website to find all URLs - NOW USES CENTRALIZED HELPER
async function mapWebsite(url: string): Promise<string[]> {
  return firecrawlMap(url, {
    search: 'about story mission team blog press careers values history',
    limit: 50,
    includeSubdomains: false,
    timeout: 45000,
  });
}

// Helper: Discover internal pages to crawl (blog, about, case studies, etc.)
function discoverInternalPages(baseUrl: string, markdown: string): string[] {
  const url = new URL(baseUrl);
  const baseOrigin = url.origin;

  // Keywords to find valuable internal pages
  const valuablePagePatterns = [
    /\/blog\/?$/i, /\/articles?\/?$/i, /\/news\/?$/i, /\/actualites?\/?$/i,
    /\/about\/?$/i, /\/a-propos\/?$/i, /\/qui-sommes-nous\/?$/i,
    /\/case-stud(y|ies)\/?$/i, /\/success-stories?\/?$/i, /\/temoignages?\/?$/i,
    /\/clients?\/?$/i, /\/references?\/?$/i,
    /\/services?\/?$/i, /\/solutions?\/?$/i, /\/products?\/?$/i,
    /\/pricing\/?$/i, /\/tarifs?\/?$/i
  ];

  // Extract all links from markdown
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const discoveredPages: string[] = [];
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    let href = match[2];

    // Convert relative to absolute
    if (href.startsWith('/')) {
      href = baseOrigin + href;
    }

    // Only same-origin pages
    if (!href.startsWith(baseOrigin)) continue;

    // Check if it matches valuable patterns
    const isValuable = valuablePagePatterns.some(pattern => pattern.test(href));
    if (isValuable && !discoveredPages.includes(href)) {
      discoveredPages.push(href);
    }
  }

  // Also try common paths even if not found in content
  const commonPaths = ['/blog', '/about', '/a-propos', '/case-studies', '/clients', '/temoignages'];
  for (const path of commonPaths) {
    const fullUrl = baseOrigin + path;
    if (!discoveredPages.includes(fullUrl)) {
      discoveredPages.push(fullUrl);
    }
  }

  return discoveredPages.slice(0, 10); // Limit to 10 extra pages for fallback
}

// Helper: Extract content nuggets (stats, quotes, facts) from text
function extractContentNuggets(text: string): ContentNugget[] {
  const nuggets: ContentNugget[] = [];

  // Extract statistics (numbers with context)
  const statPatterns = [
    /(\d+(?:[,\.]\d+)?(?:\s*[%xX×]|\s*(?:millions?|milliards?|K\+?|M\+?)))\s+([^.!?\n]{10,80})/gi,
    /([+\-]?\d+(?:[,\.]\d+)?%)\s*(?:de\s+)?([^.!?\n]{10,60})/gi,
    /(\d+(?:\s*\d+)*)\s+(clients?|users?|utilisateurs?|entreprises?|projets?|années?)/gi
  ];

  // patterns to exclude (pricing, dates, common UI noise)
  const excludePatterns = [
    /€|\$|£|eur|usd|prix|price|tarif|mois|month|an|year|user|utilisateur/i, // Currency & billing
    /inclus|offert|gratuit|free/i,
    /copyright|all rights reserved/i,
    /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i, // Dates
    /version\s+\d/i,
    /step\s+\d/i,
    /réduction|promo|remise|discount|save/i // Filters out "5% de réduction"
  ];

  for (const pattern of statPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const stat = match[1];
      const context = match[2] || match[0];
      const fullString = `${stat} ${context}`.toLowerCase();

      // Skip if matches exclusion patterns
      if (excludePatterns.some(p => p.test(fullString))) continue;

      if (stat && context && context.length > 5) {
        nuggets.push({
          type: 'stat',
          content: `${stat} ${context}`.trim(),
          context: context.trim()
        });
      }
    }
  }

  // Extract testimonials/quotes
  const quotePatterns = [
    /"([^"]{30,200})"\s*[-–—]\s*([^,\n]+)/g,
    /«([^»]{30,200})»\s*[-–—]\s*([^,\n]+)/g,
    /"([^"]{30,200})"\s*[-–—]\s*([^,\n]+)/g
  ];

  for (const pattern of quotePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      nuggets.push({
        type: 'testimonial',
        content: match[1].trim(),
        source: match[2]?.trim()
      });
    }
  }

  // Extract achievements/certifications
  const achievementPatterns = [
    /(certifi[ée]|labelli[ée]|récompens[ée]|award|prix|distinction|best of|top \d+)/gi
  ];

  for (const pattern of achievementPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.slice(start, end).replace(/\n/g, ' ').trim();

      if (context.length > 20) {
        nuggets.push({
          type: 'achievement',
          content: context
        });
      }
    }
  }

  // Remove duplicates and limit
  const uniqueNuggets: ContentNugget[] = [];
  const seen = new Set<string>();

  for (const nugget of nuggets) {
    const key = nugget.content.toLowerCase().slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueNuggets.push(nugget);
    }
  }

  return uniqueNuggets.slice(0, 15);
}

// Helper: Merge AI colors with extracted colors, prioritizing extracted
function mergeColorPalettes(aiColors: string[], extractedColors: string[]): string[] {
  if (extractedColors.length === 0) return aiColors;
  if (aiColors.length === 0) return extractedColors;

  // Normalize hex colors to uppercase
  const normalize = (hex: string) => hex.toUpperCase().replace(/^#/, '');

  // Start with extracted colors (they are the "truth")
  const merged = [...extractedColors];

  // Add AI colors that are significantly different from extracted ones
  for (const aiColor of aiColors) {
    const aiNorm = normalize(aiColor);
    const isDifferent = merged.every(extColor => {
      const extNorm = normalize(extColor);
      // Simple color distance check (could be improved with Delta E)
      const rDiff = Math.abs(parseInt(aiNorm.slice(0, 2), 16) - parseInt(extNorm.slice(0, 2), 16));
      const gDiff = Math.abs(parseInt(aiNorm.slice(2, 4), 16) - parseInt(extNorm.slice(2, 4), 16));
      const bDiff = Math.abs(parseInt(aiNorm.slice(4, 6), 16) - parseInt(extNorm.slice(4, 6), 16));
      const totalDiff = rDiff + gDiff + bDiff;
      return totalDiff > 60; // Threshold for "different enough"
    });

    if (isDifferent && merged.length < 6) {
      merged.push(aiColor);
    }
  }

  return merged.slice(0, 6);
}

// Helper: Merge all color sources with smart prioritization
// Priority: screenshot colors > logo colors > AI colors
// Filters out generic/bad AI guesses like #0000FF, #FF0000, etc.
function mergeAllColorSources(
  screenshotColors: string[],
  logoColors: string[],
  aiColors: string[]
): string[] {
  const normalize = (hex: string) => hex.toUpperCase().replace(/^#/, '');

  // List of generic "AI guess" colors to deprioritize or filter
  const genericColors = new Set([
    '0000FF', // Pure blue - common AI guess
    'FF0000', // Pure red
    '00FF00', // Pure green
    'FFFF00', // Pure yellow
    '00FFFF', // Pure cyan
    'FF00FF', // Pure magenta
  ]);

  // Check if a color is "interesting" (not pure black/white/gray)
  // IMPORTANT: Keep tinted backgrounds like beige (#F8F6F3), cream, warm whites
  const isInterestingColor = (hex: string): boolean => {
    const norm = normalize(hex);
    if (norm.length !== 6) return false;

    const r = parseInt(norm.slice(0, 2), 16);
    const g = parseInt(norm.slice(2, 4), 16);
    const b = parseInt(norm.slice(4, 6), 16);

    // Skip pure black
    if (r < 15 && g < 15 && b < 15) return false;

    // For light colors (potential backgrounds), check if they have a tint
    // Beige/cream/warm colors have uneven RGB channels
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const channelSpread = maxChannel - minChannel;

    // Skip PURE white (all channels very close and very high)
    // But KEEP tinted whites like beige (#F8F6F3), cream, warm backgrounds
    if (r > 240 && g > 240 && b > 240) {
      // Only skip if truly neutral (channels within 5 of each other)
      if (channelSpread < 5) return false;
      // Keep if there's a noticeable tint (warm beige, cool blue-white, etc.)
      // This preserves colors like #F8F6F3 (spread of 5) or #FFF5E6 (spread of 18)
    }

    // Skip pure gray (all channels within 15 of each other and mid-range)
    if (channelSpread < 15 && r > 40 && r < 215) return false;

    return true;
  };

  // Check if color is significantly different from existing palette
  const isDifferentEnough = (newColor: string, palette: string[]): boolean => {
    const newNorm = normalize(newColor);
    return palette.every(existing => {
      const extNorm = normalize(existing);
      const rDiff = Math.abs(parseInt(newNorm.slice(0, 2), 16) - parseInt(extNorm.slice(0, 2), 16));
      const gDiff = Math.abs(parseInt(newNorm.slice(2, 4), 16) - parseInt(extNorm.slice(2, 4), 16));
      const bDiff = Math.abs(parseInt(newNorm.slice(4, 6), 16) - parseInt(extNorm.slice(4, 6), 16));
      return (rDiff + gDiff + bDiff) > 50; // Color distance threshold
    });
  };

  const merged: string[] = [];

  // 1. PRIORITY: Screenshot colors (most accurate for overall brand feel)
  for (const color of screenshotColors) {
    if (merged.length >= 6) break;
    if (isInterestingColor(color) && isDifferentEnough(color, merged)) {
      merged.push(color.startsWith('#') ? color : `#${color}`);
    }
  }

  console.log(`   After screenshot colors: ${merged.length} colors`);

  // 2. Add logo colors (core brand identity, but often black/white)
  for (const color of logoColors) {
    if (merged.length >= 6) break;
    if (isInterestingColor(color) && isDifferentEnough(color, merged)) {
      merged.push(color.startsWith('#') ? color : `#${color}`);
    }
  }

  console.log(`   After logo colors: ${merged.length} colors`);

  // 3. Add AI colors ONLY if we don't have enough, and filter generics
  if (merged.length < 4) {
    for (const color of aiColors) {
      if (merged.length >= 6) break;
      const norm = normalize(color);

      // Skip generic AI guesses
      if (genericColors.has(norm)) {
        console.log(`   Skipping generic AI color: #${norm}`);
        continue;
      }

      if (isInterestingColor(color) && isDifferentEnough(color, merged)) {
        merged.push(color.startsWith('#') ? color : `#${color}`);
      }
    }
  }

  console.log(`   Final palette: ${merged.length} colors`);

  // 4. If still no colors, add some safe neutrals + any AI color that's not generic
  if (merged.length === 0) {
    // Try to salvage any non-generic AI colors
    for (const color of aiColors) {
      const norm = normalize(color);
      if (!genericColors.has(norm) && color.length >= 4) {
        merged.push(color.startsWith('#') ? color : `#${color}`);
        if (merged.length >= 3) break;
      }
    }

    // Last resort: add neutral palette
    if (merged.length === 0) {
      merged.push('#1A1A2E', '#16213E', '#E8E8E8');
    }
  }

  return merged.slice(0, 6);
}

export async function POST(request: Request) {
  try {
    // ====== AUTHENTICATION ======
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ====== GET USER PLAN (for rate limiting) ======
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });
    const userPlan = existingUser?.plan || 'free';
    const isFreeUser = userPlan === 'free';

    // ====== RATE LIMITING ======
    // 1. Check global rate limit (protects against mass abuse)
    const globalLimit = rateLimitGlobal('analyze');
    if (!globalLimit.success) {
      return NextResponse.json({
        error: 'Serveur surchargé. Réessayez dans quelques instants.',
        retryAfter: Math.ceil((globalLimit.reset - Date.now()) / 1000),
      }, { status: 429 });
    }

    // 2. For FREE users: Check IP-based limit ONLY (catches multi-account abuse)
    // No per-user rate limiting for free users - credits are the only limit
    if (isFreeUser) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
        || request.headers.get('x-real-ip')
        || 'unknown';

      const ipLimit = rateLimitByIP(ip, 'analyze');
      if (!ipLimit.success) {
        return NextResponse.json({
          error: `Trop d'analyses depuis cette adresse IP. Passez Pro pour des analyses illimitées.`,
        }, { status: 429 });
      }
    }

    // 3. Check per-user rate limit for PAID users only (free users = credits only)
    if (!isFreeUser) {
      const rateLimitResult = rateLimitByUser(userId, 'analyze', userPlan as 'pro' | 'premium');
      if (!rateLimitResult.success) {
        const waitTime = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
        return NextResponse.json({
          error: 'Trop de requêtes. Réessayez dans quelques secondes.',
          retryAfter: waitTime,
        }, { status: 429 });
      }
    }

    const reqBody = await request.json();
    let url = reqBody.url;
    const socialLinks = reqBody.socialLinks || [];
    const otherLinks = reqBody.otherLinks || [];

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Normalize URL for comparison (remove trailing slash, www, protocol variations)
    const normalizeUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return parsed.hostname.replace(/^www\./, '') + parsed.pathname.replace(/\/$/, '');
      } catch {
        return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
      }
    };
    const normalizedUrl = normalizeUrl(url);

    // Check if this URL already exists for this user
    const existingBrands = await db.query.brands.findMany({
      where: eq(brands.userId, userId),
    });

    const existingBrand = existingBrands.find(b =>
      b.url && normalizeUrl(b.url) === normalizedUrl
    );

    // If brand exists and we're not forcing a re-scrape, return existing brand data immediately
    // This saves API costs and time - no need to re-scrape
    const forceRescrape = reqBody.forceRescrape === true;

    if (existingBrand && !forceRescrape) {
      console.log(`♻️ Brand already exists for this URL, returning existing data (id: ${existingBrand.id})`);
      return NextResponse.json({
        success: true,
        brand: {
          ...existingBrand,
          images: (existingBrand.labeledImages as any[])?.map((img: any) => img.url) || [],
        },
        isUpdate: true,
      });
    }

    // Store existing brand ID to include in response (for update instead of create)
    let existingBrandId: number | null = existingBrand?.id || null;

    // Gather all URLs to scrape (Website + Socials + Other)
    const urlsToScrape = [url, ...socialLinks, ...otherLinks].filter(
      (u) => u && typeof u === 'string' && u.startsWith('http')
    );

    // 1. Scrape with Firecrawl (centralized helper with retry) & Parallel Web Systems
    console.log('🔥 Scraping:', urlsToScrape);
    let firecrawlMarkdown = '';
    let firecrawlMetadata: any = {};
    let parallelContent = '';

    const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY;
    const parallelHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'parallel-beta': 'search-extract-2025-10-10', // Required header value for beta API
    };
    if (PARALLEL_API_KEY) {
      parallelHeaders['x-api-key'] = PARALLEL_API_KEY;
    }

    try {
      // Firecrawl V2 via centralized helper (with retry on network errors)
      const firecrawlPromise = firecrawlScrape(url, {
        formats: ['markdown', 'html', 'screenshot'],
        onlyMainContent: false,
        removeBase64Images: true,
        timeout: 30000,
        retries: 1, // 1 retry on network/5xx errors
      });

      // Parallel AI for extracting data from ALL links (website + socials)
      const parallelPromise = fetch('https://api.parallel.ai/v1beta/extract', {
        method: 'POST',
        headers: parallelHeaders,
        body: JSON.stringify({
          urls: urlsToScrape, // Send all URLs
          objective: "Extract the brand identity, logo URL, color palette, fonts, brand values, main product images, and analyze social media vibes.",
          excerpts: true,
          full_content: false
        })
      });

      const [firecrawlResult, parallelRes] = await Promise.allSettled([firecrawlPromise, parallelPromise]);

      // Process Firecrawl (now via helper)
      if (firecrawlResult.status === 'fulfilled') {
        const scrapeResult = firecrawlResult.value;
        if (scrapeResult.success) {
          firecrawlMarkdown = scrapeResult.markdown;
          firecrawlMetadata = scrapeResult.metadata;
          console.log('✅ Firecrawl success - markdown length:', firecrawlMarkdown.length);
        } else {
          console.warn('⚠️ Firecrawl failed:', scrapeResult.error);
        }
      } else {
        console.warn('⚠️ Firecrawl promise rejected:', firecrawlResult.reason);
      }

      // Process Parallel
      if (parallelRes.status === 'fulfilled') {
        if (parallelRes.value.ok) {
          const parallelData = await parallelRes.value.json();
          if (parallelData.results && parallelData.results.length > 0) {
            // Concatenate excerpts from all sources
            parallelContent = parallelData.results
              .map((res: any) => `SOURCE (${res.url}):\n` + (res.excerpts || []).join('\n\n'))
              .join('\n\n---\n\n');
            console.log('✅ Parallel AI success - sources:', parallelData.results.length);
          } else {
            console.log('ℹ️ Parallel AI returned no results');
          }
        } else {
          const errorText = await parallelRes.value.text();
          console.warn('⚠️ Parallel API HTTP error:', parallelRes.value.status, errorText.slice(0, 300));
        }
      } else {
        console.warn('⚠️ Parallel API rejected:', parallelRes.reason);
      }

    } catch (e) {
      console.warn('Scraping error:', e);
    }

    // 1.5. DEEP CRAWL: Recursive crawling for maximum editorial content AND images
    console.log('🔍 Starting recursive deep crawl for editorial content & images...');
    let deepCrawlContent = '';
    let contentNuggets: ContentNugget[] = [];
    let deepCrawlImages: string[] = []; // NEW: Collect images from all crawled pages

    // Helper to extract images from Markdown (defined early so we can use it throughout)
    const extractImagesFromMarkdown = (md: string): string[] => {
      const images: string[] = [];

      // Pattern 1: Standard markdown ![alt](url)
      const mdRegex = /!\[.*?\]\((https?:\/\/[^)\s]+)\)/g;
      let match;
      while ((match = mdRegex.exec(md)) !== null) {
        if (match[1]) {
          const cleanUrl = match[1].split(' ')[0].replace(/\)$/, '');
          images.push(cleanUrl);
        }
      }

      // Pattern 2: HTML img tags <img src="url">
      const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
      while ((match = imgRegex.exec(md)) !== null) {
        if (match[1]) {
          images.push(match[1]);
        }
      }

      // Pattern 3: Background URLs in style attributes
      const bgRegex = /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi;
      while ((match = bgRegex.exec(md)) !== null) {
        if (match[1]) {
          images.push(match[1]);
        }
      }

      // Pattern 4: Standalone image URLs (common in markdown conversions)
      const standaloneRegex = /(?:^|\s)(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s]*)?)/gmi;
      while ((match = standaloneRegex.exec(md)) !== null) {
        if (match[1]) {
          images.push(match[1].trim());
        }
      }

      return images;
    };

    // Helper to filter valid images (no tracking pixels, icons too small, etc.)
    const isValidImageUrl = (url: string): boolean => {
      if (!url || !url.startsWith('http')) return false;

      const invalidPatterns = [
        /facebook\.com\/tr/i,
        /google-analytics/i,
        /pixel/i,
        /1x1/i,
        /tracking/i,
        /beacon/i,
        /favicon/i,
        /\.ico$/i,
        /data:image/i,
        /placeholder/i,
        /spacer/i,
        /blank\./i,
        /ad\./i,
        /ads\./i,
        /doubleclick/i,
      ];

      return !invalidPatterns.some(pattern => pattern.test(url));
    };

    // Extract nuggets and images from main page first
    contentNuggets = extractContentNuggets(firecrawlMarkdown + '\n' + parallelContent);
    console.log(`📊 Found ${contentNuggets.length} content nuggets from main page`);

    // 🚀 NEW STRATEGY: MAP & SELECT (Holistic Crawling)
    // Instead of blindly crawling links, we MAP the site to find the high-value pages.
    try {
      console.log('🗺️ Mapping site to find Story, About, and Team pages...');
      let targetPages = await mapWebsite(url);

      // Fallback if map fails or returns nothing (e.g. single page app or blocked)
      if (targetPages.length === 0) {
        console.log('⚠️ Map failed, falling back to link discovery');
        targetPages = discoverInternalPages(url, firecrawlMarkdown);
      }

      // INTELLIGENT SELECTION: Pick the most valuable pages
      const priorityKeywords = ['about', 'apropos', 'story', 'histoire', 'mission', 'team', 'equipe', 'valeurs', 'manifesto', 'presse'];
      const secondaryKeywords = ['blog', 'news', 'actualites', 'services', 'solutions', 'produits', 'case-studies', 'clients'];

      const selectedPages = targetPages.filter(link => {
        const lowerLink = link.toLowerCase();
        if (lowerLink === url || lowerLink === url + '/') return false; // Skip home
        return priorityKeywords.some(k => lowerLink.includes(k)) ||
          secondaryKeywords.some(k => lowerLink.includes(k));
      });

      // Fill up with other pages if we don't have enough, up to 10
      const finalPagesToScrape = [...new Set([...selectedPages, ...targetPages])].slice(0, 10);

      console.log(`🎯 Selected ${finalPagesToScrape.length} high-value pages to scrape:`, finalPagesToScrape);

      // BATCH SCRAPE V2: Use centralized helper with retry and controlled concurrency
      const batchResults = await firecrawlBatchScrape(finalPagesToScrape, {
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        timeout: 30000,
        retries: 1, // 1 retry on network/5xx errors
        concurrency: 5, // Process 5 pages at a time to avoid overwhelming API
      });

      // Convert Map to array of valid results
      const validResults: { url: string; content: string; html: string; metadata: any }[] = [];
      for (const [pageUrl, result] of batchResults) {
        if (result.success) {
          validResults.push({
            url: pageUrl,
            content: result.markdown,
            html: result.html || '',
            metadata: result.metadata,
          });
        }
      }

      console.log(`✅ Successfully scraped ${validResults.length} deep pages`);

      // PROCESS RESULTS
      for (const result of validResults) {
        // Aggregate content for the LLM
        deepCrawlContent += `\n\n--- PAGE: ${result.url} ---\nTITLE: ${result.metadata.title || 'No Title'}\n${result.content.substring(0, 6000)}`;

        // Extract Images
        const pageImages = [
          ...extractImagesFromMarkdown(result.content),
          ...extractImagesFromMarkdown(result.html),
          result.metadata?.ogImage,
          result.metadata?.image,
        ].filter(isValidImageUrl);

        deepCrawlImages.push(...pageImages);

        // Extract Nuggets
        const pageNuggets = extractContentNuggets(result.content);
        contentNuggets = [...contentNuggets, ...pageNuggets];

        console.log(`   📄 ${result.url}: ${pageNuggets.length} nuggets, ${pageImages.length} images`);
      }

    } catch (e) {
      console.warn('Deep crawl error:', e);
    }

    // Deduplicate nuggets
    const uniqueNuggetMap = new Map<string, ContentNugget>();
    for (const nugget of contentNuggets) {
      const key = nugget.content.toLowerCase().slice(0, 40);
      if (!uniqueNuggetMap.has(key)) {
        uniqueNuggetMap.set(key, nugget);
      }
    }
    contentNuggets = Array.from(uniqueNuggetMap.values()).slice(0, 40); // Increased from 30 to 40

    // ══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE IMAGE COLLECTION - Main page + Deep crawl + Metadata
    // ══════════════════════════════════════════════════════════════════════════════
    const allCollectedImages = [
      // Priority: Main page images
      ...extractImagesFromMarkdown(firecrawlMarkdown),

      // Metadata images (high quality, usually hero/og images)
      firecrawlMetadata.ogImage,
      firecrawlMetadata.icon,
      firecrawlMetadata.logo,
      firecrawlMetadata.screenshot,
      firecrawlMetadata.image,

      // Deep crawl images (from all crawled pages)
      ...deepCrawlImages
    ].filter(isValidImageUrl);

    // Deduplicate while preserving order (priority first)
    const uniqueImages = Array.from(new Set(allCollectedImages));

    console.log(`🖼️ TOTAL UNIQUE IMAGES COLLECTED: ${uniqueImages.length}`);
    console.log(`   - From main page: ${extractImagesFromMarkdown(firecrawlMarkdown).length}`);
    console.log(`   - From deep crawl: ${deepCrawlImages.length}`);
    console.log(`   - From metadata: 5 (og, icon, logo, screenshot, image)`);

    // Log all collected images for debugging
    console.log(`📝 Full Image List (${uniqueImages.length}):`, uniqueImages);

    // 2. Analyze with OpenRouter (Grok or other)
    console.log('🤖 Analyzing with OpenRouter...');

    // Format content nuggets for the AI
    const nuggetsFormatted = contentNuggets.length > 0
      ? `\n\nEXTRACTED CONTENT NUGGETS (USE THESE FOR POSTS):\n${contentNuggets.map(n =>
        `- [${n.type.toUpperCase()}] ${n.content}${n.source ? ` (Source: ${n.source})` : ''}`
      ).join('\n')}`
      : '';

    // Limit images sent to AI to avoid token limits and ensure quality
    const imagesForAnalysis = uniqueImages.slice(0, 40);

    // Full content - using Claude-3.5-Sonnet which has 200K context
    const combinedContent = `
    SOURCE 1 (METADATA):
    Title: ${firecrawlMetadata.title || 'Unknown'}
    Description: ${firecrawlMetadata.description || 'Unknown'}
    
    SOURCE 2 (MAIN PAGE CONTENT):
    ${firecrawlMarkdown.substring(0, 15000)}

    SOURCE 3 (PARALLEL AI):
    ${parallelContent.substring(0, 5000)}
    
    SOURCE 4 (DEEP CRAWL):
    ${deepCrawlContent.substring(0, 12000)}
    ${nuggetsFormatted}
    
    DETECTED IMAGES (${imagesForAnalysis.length}):
    ${imagesForAnalysis.join('\n')}
    `;

    console.log(`📊 Prompt content size: ~${combinedContent.length} chars (using Claude-3.5-Sonnet 200K context)`);

    const prompt = `
      Analyze this website content to extract brand identity information.
      
      Website URL: ${url}
      
      Content:
      ${combinedContent}
      
      Return ONLY a valid JSON object with the following structure:
      {
        "name": "Brand Name",
        "detectedLanguage": "fr | en (detect from website content - French or English)",
        "tagline": "Brand Tagline or Slogan",
        "description": "A short summary paragraph (max 200 chars)",
        "brandStory": "A compelling 2-3 sentence summary of the brand's origin, mission, or founding story found in the content.",
        "targetAudience": "Specific description of who this brand targets (e.g. 'Busy HR Managers', 'Eco-conscious students', 'Small Business Owners').",
        "uniqueValueProposition": "The single most important promise or benefit they offer (e.g. 'Saves 10h/week', 'Provides clean water to villages').",
        "colors": ["#hex1", "#hex2", "#hex3", "#hex4 - CRITICAL: Extract EXACT hex colors visible in the screenshot. DO NOT guess generic colors like #0000FF (pure blue), #FF0000 (pure red). Look at the actual pixels - brand blues are usually softer like #4A7BF7, #5B8DEF, not pure #0000FF. Include 4-6 distinct colors from backgrounds, buttons, accents, gradients."],
        "fonts": ["Font Name 1", "Font Name 2"],
        "values": ["Value 1", "Value 2", "Value 3"],
        "features": ["Specific Feature 1", "Specific Feature 2", "Specific Feature 3", "Specific Feature 4"],
        "painPoints": ["Customer Pain Point 1", "Pain Point 2", "Pain Point 3"],
        "vocabulary": ["Specific Term 1", "Specific Term 2", "Brand Keyword 1", "Brand Keyword 2"],
        "services": ["Service 1", "Service 2", "Service 3"],
        "keyPoints": ["Unique Selling Point 1", "USP 2", "USP 3"],
        "aesthetic": ["Adjective 1", "Adjective 2", "Adjective 3 - FROM SCREENSHOT: Describe the visual feel (e.g. 'Minimalist', 'Bold', 'Playful', 'Corporate', 'Organic', 'Tech-forward', 'Luxurious')"],
        "toneVoice": ["Adjective 1", "Adjective 2", "Adjective 3"],
        "logo": "URL to the MAIN brand logo (prioritize clear, high-res, distinct from client logos)",
        "industry": "Specific industry (e.g. 'SaaS Fintech', 'Organic Skincare', 'Industrial Manufacturing')",
        "visualMotifs": ["Motif 1", "Motif 2", "Motif 3 - FROM SCREENSHOT: What visual elements repeat? (e.g. '3D organic shapes', 'Geometric grids', 'Gradient blobs', 'Line illustrations', 'Photo cutouts', 'Glassmorphism cards')"],
        "visualStyle": {
          "designSystem": "FROM SCREENSHOT: Overall design approach (e.g. 'Apple-like minimalism', 'Stripe-inspired gradients', 'Figma-style illustrations', 'Notion-like simplicity')",
          "backgroundStyle": "FROM SCREENSHOT: What's the background like? (e.g. 'Warm off-white/cream', 'Pure white', 'Dark mode', 'Gradient mesh', 'Subtle texture')",
          "heroElement": "FROM SCREENSHOT: Main visual element in hero (e.g. '3D abstract brain shape', 'Product mockup', 'Illustration', 'Video', 'Photo')",
          "whitespace": "FROM SCREENSHOT: Amount of whitespace (e.g. 'Generous/airy', 'Moderate', 'Dense/compact')",
          "corners": "FROM SCREENSHOT: Corner style (e.g. 'Rounded/soft', 'Sharp/angular', 'Mixed')",
          "shadows": "FROM SCREENSHOT: Shadow usage (e.g. 'Soft drop shadows', 'Hard shadows', 'No shadows', 'Glassmorphism blur')",
          "gradients": "FROM SCREENSHOT: Gradient usage if any (e.g. 'Blue to purple gradient on 3D shapes', 'Subtle background gradient', 'None')"
        },
        "suggestedPosts": [
           {
             "templateId": "stat | announcement | event | quote | expert | product | didyouknow",
             "headline": "Le texte principal du post",
             "subheadline": "Texte secondaire optionnel",
             "metric": "Pour stat: le chiffre clé (ex: '87%', '10K+')",
             "metricLabel": "Pour stat: le contexte du chiffre",
             "source": "real_data | industry_insight | generated",
             "intent": "Pourquoi ce post est pertinent pour cette marque (1 phrase)"
           }
        ],
        "editorialHooks": [
           "GENERATE EXACTLY 8 HOOKS - This is MANDATORY",
           {
             "hook": "Pain point question that speaks to targetAudience (SAME LANGUAGE as detectedLanguage). Max 60 chars.",
             "subtext": "How THIS brand's product solves the pain. Reference a specific feature. Max 80 chars.",
             "emotion": "curiosity | frustration | relief | urgency"
           },
           "... 7 more hooks with different angles (mix of curiosity, frustration, relief, urgency)"
        ],
        "contentNuggets": {
           "realStats": ["Statistiques réelles trouvées sur le site"],
           "testimonials": [{"quote": "Citation client", "author": "Nom", "company": "Entreprise"}],
           "achievements": ["Prix, certifications, reconnaissances trouvées"],
           "blogTopics": ["Sujets de blog/articles trouvés sur le site"]
        },
        "analyzedImages": [
           { 
             "url": "url_from_detected_list", 
             "category": "main_logo" | "client_logo" | "product" | "app_ui" | "person" | "icon" | "texture" | "other",
             "description": "Short visual description (e.g. 'Dashboard on laptop', 'Man holding coffee cup')"
           }
        ],
        "backgroundPrompts": [
           "FROM SCREENSHOT & COLORS: Generate 3 background prompts that match the website's actual visual style. Use the REAL extracted colors (not generic). Examples based on screenshot analysis:",
           "If warm/minimal site: 'Soft cream background (#F8F6F3) with subtle warm gradient, clean and airy'",
           "If gradient-heavy: 'Smooth gradient from [actual blue like #5B8DEF] to [darker tone], organic flowing shapes'",
           "If dark mode: 'Deep charcoal (#1A1A2E) with subtle blue glow accents, tech-forward'"
        ]
      }
      
      IMPORTANT ANALYSIS RULES:
      1. **MAIN LOGO:** Identify the brand's OWN logo. Do NOT mistake 'Client' or 'Partner' logos for the main brand logo. Look for the logo usually found in the navbar or footer top.
      2. **VOCABULARY & PAIN POINTS (NEW):**
         - 'vocabulary': Extract specific terms the brand uses. E.g. instead of "software", do they say "Platform", "OS", "Hub"? Extract 4-5 distinct terms.
         - 'painPoints': What problems do they solve? Extract 3-4 specific customer struggles (e.g. "Manual data entry", "Security compliance costs").
      3. **TARGET AUDIENCE & UVP (CRITICAL):**
         - 'targetAudience': WHO uses/buys this product? Be SPECIFIC about the END CUSTOMER, not the industry.
           ⚠️ COMMON MISTAKE: If analyzing a SaaS for marketers, the target is "Marketing teams" or "Social media managers", NOT "SaaS companies" or "businesses".
           ⚠️ ASK YOURSELF: "Who will see the social media posts we create?" → THOSE are the target audience.
           Examples: "Remote-first CTOs", "Freelance designers", "E-commerce store owners", "Parents of toddlers", "HR managers in SMBs"
         - 'uniqueValueProposition': What is the #1 Benefit? If it's a non-profit, it's the Impact (e.g. "Saving oceans"). If service, it's the Outcome (e.g. "Doubling revenue"). If product, it's the Utility.
      4. **INDUSTRY vs TARGET (IMPORTANT DISTINCTION):** 
         - 'industry': What the company SELLS (e.g., "SaaS", "Consulting", "E-commerce")
         - 'targetAudience': WHO they sell TO (e.g., "Marketing professionals", "CFOs", "Small business owners")
         - These are DIFFERENT! A "SaaS company" sells software, but their TARGET might be "HR managers" or "Sales teams".
         - 'visualMotifs': List 3 visual elements typical of this industry (e.g. for Cybersec: 'Locks', 'Shields', 'Code').
      5. **IMAGE CATEGORIZATION (STRICT RULES):** 
         - 'main_logo': The brand's logo.
         - 'client_logo': Logos of customers, partners, or 'featured in' sections.
         - 'product': Physical items, packaging, devices, equipment, or direct representations of what they sell. This includes: microphones, headphones, electronics, tools, furniture, food, clothing, etc.
         - 'app_ui': Screenshots of software, dashboards, or mobile app interfaces.
         - 'person': ONLY classify as 'person' if there is a CLEARLY VISIBLE human face, human body, or human hands. Do NOT classify objects that vaguely resemble humans (like microphones, mannequins, or abstract shapes). If in doubt, choose 'product' or 'other'.
         - 'icon': Small functional icons or illustrations.
         - 'texture': Abstract backgrounds, patterns, gradients, or zoomed-in details suitable for design backgrounds.
         
         ⚠️ CRITICAL: A microphone is ALWAYS 'product', NEVER 'person'. An object with a round top and a stand is NOT a person. Apply strict visual criteria.
      6. **MAPPING:** 'analyzedImages' must map the URLs from the 'DETECTED IMAGES' list provided above.
      7. **SUGGESTED POSTS (CRITICAL - 6-8 suggestions):** Generate smart, contextual post ideas.
         
         AVAILABLE TEMPLATE IDS:
         - "stat": Big metric post (+47%, 10K+, 3x). REQUIRES: metric + metricLabel
         - "announcement": News/launch post. REQUIRES: headline + subheadline
         - "quote": Testimonial post. REQUIRES: headline (the quote text)
         - "event": Webinar/event post. REQUIRES: headline (event name)
         - "expert": Feature a speaker/expert. REQUIRES: headline + subheadline
         - "product": Product showcase. REQUIRES: headline + subheadline
         - "didyouknow": Industry insight/educational post. REQUIRES: headline (the fact) + subheadline (so what?)
         
         POST SOURCES (in priority order):
         1. REAL DATA (source: "real_data"): Use stats, quotes, achievements from EXTRACTED CONTENT NUGGETS
         2. INDUSTRY INSIGHTS (source: "industry_insight"): Use facts from industryInsights for "didyouknow" posts
         3. GENERATED (source: "generated"): Only if no real data, create plausible specific content
         
         USER-CENTRIC RULES (MANDATORY):
         - **STOP THE SCROLL:** Every headline must be a "hook". Avoid generic titles like "Nos services". Use "Comment doubler vos ventes" instead.
         - **PAIN POINTS FIRST:** Address a specific user problem or desire. "Tired of manual data entry?" is better than "We offer automation".
         - **BENEFIT ORIENTED:** Focus on what the user GETS, not just what the brand HAS.
         
         EXAMPLES WITH INTENT:
         - { "templateId": "stat", "metric": "10K+", "metricLabel": "utilisateurs actifs", "source": "real_data", "intent": "Social Proof: Show mass adoption to build trust" }
         - { "templateId": "didyouknow", "headline": "85% des équipes perdent 2h/jour", "subheadline": "Arrêtez de perdre du temps sur l'admin", "source": "industry_insight", "intent": "Agitate Pain: Highlight the problem (lost time) to introduce the solution" }
         - { "templateId": "quote", "headline": "On a réduit nos coûts de 40%", "subheadline": "— Sophie, CEO", "source": "real_data", "intent": "Result-Driven: Show concrete ROI to attract decision makers" }
         
         RULES:
         - PRIORITIZE real data from verified content nuggets
         - Include at least 2 "didyouknow" posts with industry macro insights
         - Each post MUST have an "intent" explaining WHY this post is strategic for the END USER
         - Be SPECIFIC: not "amélioration" but "+47% en 3 mois"
         
      8. **EDITORIAL HOOKS (CRITICAL - EXACTLY 8 REQUIRED):**
         
         The "editorialHooks" array MUST contain EXACTLY 8 hooks. Not 2, not 4, but 8.
         These hooks will be used as marketing angles for social media visuals.
         
         ⚠️ LANGUAGE: Write ALL hooks in the SAME LANGUAGE as 'detectedLanguage' (French if 'fr', English if 'en').
         
         ⚠️ TONE ADAPTATION BY INDUSTRY:
         - FORMAL INDUSTRIES (M&A, Finance, Law, Consulting, Healthcare, Enterprise B2B):
           → Professional, data-driven hooks. Focus on ROI, efficiency, compliance, risk.
           → Example FR: "La compliance vous coûte 40% de votre temps ?"
           → Example EN: "Compliance eating 40% of your time?"
         - CASUAL INDUSTRIES (Fashion, Food, Lifestyle, Gaming, Beauty, Consumer):
           → Punchy, emotional, fun hooks. Be relatable.
           → Example FR: "Vos posts sont beaux... mais engagent-ils ?"
           → Example EN: "Your posts look great... but do they convert?"
         
         ⚠️ GOLDEN RULE: Each hook must be DIRECTLY answerable by THIS brand's product/service.
         
         🔍 MANDATORY - Use these fields to craft relevant hooks:
         - 'targetAudience': WHO you're speaking to (e.g., "Marketing managers")
         - 'features' & 'services': WHAT the brand offers
         - 'painPoints': Problems they solve - EXPAND these into hooks!
         - 'uniqueValueProposition': The main benefit
         
         📋 REQUIRED VARIETY - Include a mix of these emotions:
         - 2-3 hooks with emotion: "frustration" (problems they face)
         - 2-3 hooks with emotion: "curiosity" (questions that intrigue)
         - 1-2 hooks with emotion: "relief" (how solution helps)
         - 1-2 hooks with emotion: "urgency" (why act now)
         
         ❌ FORBIDDEN:
         - Market size stats ("The market will reach $X billion")
         - Industry projections ("By 2030...")
         - Generic tech trends ("AI is transforming...")
         - Anything that could apply to ANY company
         
         ✅ EACH HOOK MUST PASS THIS TEST:
         1. "Is this frustration solvable by THIS brand's product?" → If not, REJECT
         2. "Would a [targetAudience] recognize this as THEIR problem?" → If not, REJECT
         3. "Does the tone match the industry?" → If too casual for Finance or too formal for Fashion, REJECT
         
         🚫 FORBIDDEN:
         - Market stats, growth rates, projections
         - Generic problems not related to the product
         - Tone mismatch (casual for M&A, formal for fashion brand)
         
         FORMAL EXAMPLE (Finance/Law/M&A):
         - "Vos dossiers M&A prennent 3 mois de trop ?"
         - "Your deal pipeline lacks visibility?"
         
         CASUAL EXAMPLE (Fashion/Lifestyle/Consumer):
         - "Votre feed manque de punch ?"
         - "Your brand deserves better than templates 🔥"
         
      9. **CONTENT VALIDATION (INTELLIGENT AGENT TASK):** 
         I have provided a raw list of "EXTRACTED CONTENT NUGGETS" above. Your job is to FILTER and CLEAN them.
         - **realStats**: Keep only legitimate business metrics (users, growth, savings). DISCARD pricing ($19/mo, 249€), discounts (-50%), version numbers, or UI elements.
         - **testimonials**: Keep only quotes with a SPECIFIC author name or company. DISCARD generic placeholders like "John Doe", "Client Satisfait", or "Lorem Ipsum".
         - **achievements**: Keep real awards/certifications. DISCARD pricing tables or feature lists.
         
         **HALLUCINATION CHECK (CRITICAL):**
         - DO NOT invent testimonials. If you see a client logo (e.g. LVMH), DO NOT assume they said "Great product". Only extract quotes that are EXPLICITLY written in the text.
         - If no testimonials are found in the text, return an empty array. Better to have nothing than a lie.
         - Verify every stat against the source text.
         
         IMPORTANT: The "EXTRACTED CONTENT NUGGETS" list provided above is just a starting point. 
         You MUST also scan the full text content (SOURCE 2, SOURCE 3, SOURCE 4) to find other nuggets that the regex might have missed.
         If you find a great testimonial or stat in the text that isn't in the nuggets list, ADD IT.
         
         If the provided nuggets are garbage, find better ones in the full text content provided.
         
      10. **BACKGROUNDS:** 'backgroundPrompts' should generate high-quality, versatile backgrounds that match the brand aesthetic, suitable for overlays.
      
      If content is empty, INFER reasonable defaults based on the URL and domain name.
    `;

    // Prepare message content for GPT-4o (Vision or Text)
    const userMessageContent: any[] = [
      { type: "text", text: prompt }
    ];

    // Add screenshot if available
    if (firecrawlMetadata.screenshot && firecrawlMetadata.screenshot.startsWith('http')) {
      console.log('📸 Adding screenshot to Vision analysis');
      userMessageContent.push({
        type: "image_url",
        image_url: {
          "url": firecrawlMetadata.screenshot
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN LLM CALL: Gemini 3 Flash (primary) → Claude Sonnet (fallback)
    // Feature flag USE_GEMINI_FOR_BRAND_ANALYSIS allows easy rollback
    // NOW WITH VISION: Screenshot is passed for accurate color/style extraction
    // ═══════════════════════════════════════════════════════════════════════════

    const systemPrompt = "You are a Brand Analyst with strong visual analysis skills. Extract brand identity from website content AND the screenshot provided. Pay special attention to the EXACT colors visible in the screenshot - extract precise hex codes, not generic values like #0000FF. Return ONLY valid JSON matching the requested schema. No markdown, no explanations, just the JSON object.";

    // Pass full multimodal content (text + screenshot) to LLM
    const multimodalContent: MultimodalContent[] = userMessageContent as MultimodalContent[];
    const hasScreenshot = userMessageContent.some((c: any) => c.type === 'image_url');

    if (hasScreenshot) {
      console.log('📸 Vision mode: Screenshot will be analyzed for accurate brand colors');
    }

    let brandData: any = null;

    if (USE_GEMINI_FOR_BRAND_ANALYSIS) {
      console.log('🌟 Using Gemini 3 Flash Preview (with Claude fallback)...');

      brandData = await callGeminiWithFallback(
        systemPrompt,
        multimodalContent,  // Pass full multimodal content, not just text!
        { temperature: 0.2, maxTokens: 8000, fallbackToOpenRouter: true }
      );

      if (brandData) {
        console.log(`📝 LLM generated editorialHooks: ${brandData.editorialHooks?.length || 0} hooks`);
        if (brandData.editorialHooks?.length) {
          console.log(`   First hook: "${brandData.editorialHooks[0]?.hook?.slice(0, 50)}..."`);
          console.log(`   Emotions: ${brandData.editorialHooks.map((h: any) => h.emotion).join(', ')}`);
        }
      }
    }

    // If Gemini disabled or both Gemini and Claude failed, use manual fallback
    if (!brandData) {
      console.log('⚠️ All LLM calls failed, using metadata fallback...');
      brandData = {
        name: firecrawlMetadata.title?.split('|')[0]?.split('-')[0]?.trim() || "Brand",
        description: firecrawlMetadata.description || "",
        tagline: firecrawlMetadata.description?.split('.')[0] || "",
        colors: ["#000000", "#ffffff"],
        fonts: ["Sans-serif"],
        values: ["Quality"],
        aesthetic: ["Modern"],
        toneVoice: ["Professional"],
        logo: firecrawlMetadata.ogImage || firecrawlMetadata.icon || null,
        industry: "Business"
      };
      console.log("ℹ️ Using fallback brand data from metadata");
    }

    // 🚀 PARALLEL OPTIMIZATION: Run color extraction and industry search in parallel
    const logoUrl = brandData.logo || firecrawlMetadata.ogImage || firecrawlMetadata.icon;
    const screenshotUrl = firecrawlMetadata.screenshot;

    const parallelTasks = [];

    // 3a. Extract Colors from Logo (if available) - REAL EXTRACTION
    // Note: SVGs will be skipped (handled in extractColorsFromImage)
    if (logoUrl && logoUrl.startsWith('http')) {
      console.log('🎨 Extracting REAL colors from logo:', logoUrl);
      parallelTasks.push(
        extractColorsFromImage(logoUrl).catch(e => {
          console.error("Logo color extraction failed:", e);
          return [];
        })
      );
    } else {
      parallelTasks.push(Promise.resolve([]));
    }

    // 3b. Extract Colors from Screenshot - CRITICAL for accurate brand colors!
    // This is especially important when logo is SVG or monochrome (black/white)
    if (screenshotUrl && screenshotUrl.startsWith('http')) {
      console.log('📸 Extracting colors from website screenshot:', screenshotUrl.slice(0, 80) + '...');
      parallelTasks.push(
        extractColorsFromImage(screenshotUrl).catch(e => {
          console.error("Screenshot color extraction failed:", e);
          return [];
        })
      );
    } else {
      parallelTasks.push(Promise.resolve([]));
    }

    // 4. Search for REAL industry insights using Parallel Search API
    if (brandData.industry) {
      console.log(`🔍 Searching real industry insights for: ${brandData.industry}`);
      parallelTasks.push(
        searchIndustryInsights(
          brandData.industry,
          brandData.name || 'the company'
        ).catch(e => {
          console.error("Industry search failed:", e);
          return { rawExcerpts: '', sources: [] };
        })
      );
    } else {
      parallelTasks.push(Promise.resolve({ rawExcerpts: '', sources: [] }));
    }

    // Wait for all tasks to complete
    const [logoColorsResult, screenshotColorsResult, industrySearchResult] = await Promise.all(parallelTasks);

    // Process color extraction results - combine logo + screenshot colors
    const logoColors = (logoColorsResult as string[]) || [];
    const screenshotColors = (screenshotColorsResult as string[]) || [];

    console.log('🎨 Logo colors extracted:', logoColors.length > 0 ? logoColors : '(none or SVG skipped)');
    console.log('📸 Screenshot colors extracted:', screenshotColors.length > 0 ? screenshotColors : '(none)');

    // Smart color merging: screenshot colors are most reliable for overall brand feel
    // Logo colors add the core brand identity (if not black/white)
    // AI colors fill gaps but are least reliable
    const aiColors = Array.isArray(brandData.colors) ? brandData.colors : [];

    // Combine all color sources with priority: screenshot > logo > AI
    let extractedColors = mergeAllColorSources(screenshotColors, logoColors, aiColors);

    if (extractedColors.length > 0) {
      brandData.colors = extractedColors;
      console.log('🎨 Final merged palette:', brandData.colors);
    } else {
      console.log('⚠️ No colors extracted, keeping AI-guessed colors:', aiColors);
    }

    // Refine the main logo selection based on AI classification
    const aiIdentifiedLogo = brandData.analyzedImages?.find((img: any) => img.category === 'main_logo')?.url;
    if (aiIdentifiedLogo) {
      brandData.logo = aiIdentifiedLogo;
    } else if (!brandData.logo && firecrawlMetadata.ogImage) {
      brandData.logo = firecrawlMetadata.ogImage;
    }

    // Process industry search results
    const { rawExcerpts, sources } = industrySearchResult as { rawExcerpts: string; sources: any[] };
    if (rawExcerpts && rawExcerpts.length > 500) {
      console.log('📊 Processing industry data from search...');

      // Use AI to extract structured insights from the search results
      const insightPrompt = `
You are an expert Market Analyst.
INDUSTRY: ${brandData.industry}
BRAND: ${brandData.name}

SEARCH RESULTS:
${rawExcerpts.substring(0, 12000)}

TASK: Extract 4-6 ultra-specific market insights.
CRITICAL RULES:
1. **NO GENERIC FLUFF**: Reject phrases like "The market is growing", "Social media is important", "Efficiency is key".
2. **MUST CONTAIN A NUMBER OR PROPER NOUN**: If an insight doesn't have a %, a $, a year, or a specific entity name (e.g. "Google"), DELETE IT.
3. **SOURCE IS MANDATORY**: Must attribute to a specific report or entity found in the text.

FORMAT: Return ONLY a valid JSON array:
[
  {
    "fact": "Specific stat (e.g. 'SaaS churn rates increased to 5.4% in 2024')",
    "didYouKnow": "Le saviez-vous ? [Hook based on the stat]",
    "source": "Source (e.g. 'Paddle 2024 Report')",
    "relevance": "Why this matters for ${brandData.name}"
  }
]`;

      try {
        const insightResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "openai/gpt-4o-mini",
            "messages": [
              { "role": "system", "content": "You extract business insights from research data and format them for social media. Always return valid JSON." },
              { "role": "user", "content": insightPrompt }
            ]
          })
        });

        if (insightResponse.ok) {
          const insightData = await insightResponse.json();
          let insightText = insightData.choices[0]?.message?.content || '';
          insightText = insightText.replace(/```json\n?/g, '').replace(/```/g, '').trim();

          try {
            const jsonMatch = insightText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const realInsights = JSON.parse(jsonMatch[0]);

              // Merge with AI-generated insights, prioritizing real data
              if (Array.isArray(realInsights) && realInsights.length > 0) {
                console.log(`✅ Extracted ${realInsights.length} real industry insights`);

                // Mark these as real data
                const enrichedInsights = realInsights.map((insight: any) => ({
                  ...insight,
                  isRealData: true
                }));

                // Replace or merge with AI-generated insights
                brandData.industryInsights = [
                  ...enrichedInsights,
                  ...(brandData.industryInsights || []).slice(0, 2) // Keep max 2 AI-generated as fallback
                ].slice(0, 6);

                // Also add source URLs for transparency
                brandData.industrySources = sources.slice(0, 5);
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse industry insights:', parseError);
          }
        }
      } catch (e) {
        console.error("Industry insights extraction failed:", e);
      }
    }

    // Prioritize the logo, then unique images found
    const rawImages = [
      brandData.logo,
      firecrawlMetadata.ogImage,
      ...uniqueImages
    ].filter((img) => img && typeof img === 'string' && img.startsWith('http'));

    // Deduplicate URLs
    const uniqueFinalImages = Array.from(new Set(rawImages));

    if (uniqueFinalImages.length === 0) {
      uniqueFinalImages.push('https://placehold.co/600x600?text=Brand+Logo');
    }

    // Merge AI categories with final list
    // If AI didn't return analyzedImages, default to 'other'
    const labeledImages = uniqueFinalImages.map(url => {
      // Robust matching: try exact match, then fuzzy match
      const aiData = brandData.analyzedImages?.find((img: any) => {
        if (!img.url) return false;
        if (img.url === url) return true;
        // Fuzzy match: check if one contains the other (handles query params or minor variations)
        if (url.includes(img.url) || img.url.includes(url)) return true;
        return false;
      });

      return {
        url,
        category: aiData?.category || (url === brandData.logo ? 'main_logo' : 'other'),
        description: aiData?.description || ""
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // INJECT REAL EXTRACTED DATA - Don't trust AI to fill contentNuggets properly
    // ═══════════════════════════════════════════════════════════════════════════

    // Helper to truncate strings that are too long (e.g. pricing tables)
    const cleanAndTruncate = (str: string, maxLength = 150) => {
      if (!str) return '';
      let clean = str.trim();
      // Check for pricing spam indicators
      if (clean.match(/(\d+€|\/mois|inclus|illimité)/i) && clean.length > 50) {
        // It's likely a pricing table row, discard or truncate heavily
        return '';
      }
      if (clean.length > maxLength) {
        return clean.substring(0, maxLength) + '...';
      }
      return clean;
    };

    // Build REAL contentNuggets from our extraction (not AI-generated)
    const realContentNuggets = {
      realStats: contentNuggets
        .filter(n => n.type === 'stat')
        .map(n => cleanAndTruncate(n.content))
        .filter(s => s.length > 5 && s.length < 150) // Filter out empty or huge strings
        .slice(0, 8),
      testimonials: contentNuggets
        .filter(n => n.type === 'testimonial')
        .map(n => ({
          quote: cleanAndTruncate(n.content, 250),
          author: cleanAndTruncate(n.source || 'Client', 50),
          company: cleanAndTruncate(n.context || '', 50)
        }))
        .filter(t => t.quote.length > 10)
        .slice(0, 5),
      achievements: contentNuggets
        .filter(n => n.type === 'achievement')
        .map(n => cleanAndTruncate(n.content))
        .filter(s => s.length > 5)
        .slice(0, 5),
      blogTopics: contentNuggets
        .filter(n => n.type === 'blog_topic')
        .map(n => cleanAndTruncate(n.content))
        .filter(s => s.length > 5)
        .slice(0, 5),
      // Keep track of extraction metadata
      _extractedCount: contentNuggets.length,
      _pagesScraped: deepCrawlContent.split('--- PAGE:').length - 1
    };

    // Helper functions for merging
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const mergeUnique = (real: string[], ai: string[]) => {
      const seen = new Set(real.map(normalize));
      const merged = [...real];

      for (const item of ai || []) {
        const norm = normalize(item);
        if (norm.length > 10 && !seen.has(norm)) {
          merged.push(item);
          seen.add(norm);
        }
      }
      return merged.slice(0, 12);
    };

    // Merge: prioritize AI data (which acted as a filter), and only fallback to regex if AI missed things
    // OR if AI returned very few items.
    // The user specifically wants an "Intelligent Agent" to filter the scrap.
    // So we trust the AI's curation over the raw regex.

    const mergePrioritizingAI = (regex: string[], ai: string[]) => {
      // If AI returned a good list (>= 2 items), trust it completely to avoid re-introducing pricing garbage
      if (ai && ai.length >= 2) {
        return ai.slice(0, 8);
      }
      // Otherwise, mix them but prioritize AI
      const seen = new Set((ai || []).map(normalize));
      const merged = [...(ai || [])];

      for (const item of regex || []) {
        const norm = normalize(item);
        // Stricter length check for regex fallback
        if (norm.length > 15 && !seen.has(norm)) {
          merged.push(item);
          seen.add(norm);
        }
      }
      return merged.slice(0, 8);
    };

    const mergeTestimonialsPrioritizingAI = (regex: any[], ai: any[]) => {
      // If AI found verified testimonials, use them
      if (ai && ai.length >= 1) {
        return ai.slice(0, 6);
      }

      // Fallback to regex but be careful
      const seen = new Set((ai || []).map((t: any) => normalize(t.quote)));
      const merged = [...(ai || [])];

      for (const item of regex || []) {
        const norm = normalize(item.quote || '');
        // Only allow regex testimonials that look substantial
        if (norm.length > 40 && !seen.has(norm)) {
          merged.push(item);
          seen.add(norm);
        }
      }
      return merged.slice(0, 6);
    };

    const mergedContentNuggets = {
      realStats: mergePrioritizingAI(realContentNuggets.realStats, brandData.contentNuggets?.realStats),
      testimonials: mergeTestimonialsPrioritizingAI(realContentNuggets.testimonials, brandData.contentNuggets?.testimonials),
      achievements: mergeUnique(
        realContentNuggets.achievements,
        brandData.contentNuggets?.achievements
      ),
      blogTopics: mergeUnique(
        realContentNuggets.blogTopics,
        brandData.contentNuggets?.blogTopics
      ),
      _meta: {
        extractedNuggets: realContentNuggets._extractedCount,
        pagesScraped: realContentNuggets._pagesScraped,
        hasRealData: realContentNuggets.realStats.length > 0 || realContentNuggets.testimonials.length > 0
      }
    };

    console.log('📊 Content Nuggets Summary:');
    console.log(`   Real stats: ${mergedContentNuggets.realStats.length}`);
    console.log(`   Testimonials: ${mergedContentNuggets.testimonials.length}`);
    console.log(`   Achievements: ${mergedContentNuggets.achievements.length}`);
    console.log(`   Blog topics: ${mergedContentNuggets.blogTopics.length}`);
    console.log(`   Pages scraped: ${mergedContentNuggets._meta.pagesScraped}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // FIRECRAWL SEARCH ENRICHMENT - When we have sparse data, search the web
    // ═══════════════════════════════════════════════════════════════════════════
    const hasMinimalData =
      (!brandData.industryInsights || brandData.industryInsights.length < 2) &&
      (mergedContentNuggets.realStats.length < 2) &&
      (!brandData.features || brandData.features.length < 3);

    if (hasMinimalData && brandData.industry) {
      console.log('⚠️ Sparse data detected, triggering Firecrawl enrichment (Search + Extract)...');

      try {
        console.log('🔄 Running Legacy Enrichment Fallback (Search + Extract)...');
        // Run BOTH Search and Extract in parallel for maximum enrichment
        const [searchEnrichment, extractEnrichment] = await Promise.all([
          enrichWithFirecrawlSearch(
            brandData.industry,
            brandData.name || 'the company',
            brandData.targetAudience
          ),
          extractWithFirecrawl(
            url,
            brandData.industry,
            brandData.name || 'the company'
          )
        ]);

        // === Process SEARCH + EXTRACT results through LLM transformation ===
        // Collect ALL raw insights for batch transformation
        const rawInsightsForTransform: { text: string; source?: string; type: string }[] = [];

        // Add pain points from Search
        for (const pp of searchEnrichment.painPoints) {
          if (isRelevantInsight(pp.point)) {
            rawInsightsForTransform.push({ text: pp.point, source: pp.source, type: 'pain_point' });
          }
        }

        // Add trends from Search
        for (const t of searchEnrichment.trends) {
          if (isRelevantInsight(t.trend)) {
            rawInsightsForTransform.push({ text: t.trend, source: t.source, type: 'trend' });
          }
        }

        // === Process COMPETITORS for market positioning ===
        if (searchEnrichment.competitors && searchEnrichment.competitors.length > 0) {
          console.log(`🎯 Found ${searchEnrichment.competitors.length} competitors:`,
            searchEnrichment.competitors.map(c => c.name));

          // Store competitors in brand data for content angles
          brandData.competitors = searchEnrichment.competitors.map(c => ({
            name: c.name,
            weakness: c.weakness,
            source: c.source
          }));

          // Also add competitor-based insights for content angles
          for (const comp of searchEnrichment.competitors.slice(0, 2)) {
            if (comp.weakness) {
              brandData.industryInsights = [
                ...(brandData.industryInsights || []),
                {
                  painPoint: `Utilisateurs de ${comp.name} se plaignent: ${comp.weakness}`,
                  consequence: `Opportunité de positionnement vs ${comp.name}`,
                  solution: '',
                  type: 'competitive' as const,
                  source: comp.source,
                  isEnriched: true
                }
              ];
            }
          }
        }

        // === NEW: Process NEWS for fresh content angles ===
        if (searchEnrichment.newsHighlights && searchEnrichment.newsHighlights.length > 0) {
          console.log(`📰 Found ${searchEnrichment.newsHighlights.length} news highlights`);

          // Store news for content inspiration
          brandData.newsHighlights = searchEnrichment.newsHighlights;

          // Add to market context
          (mergedContentNuggets as any).newsAngles = searchEnrichment.newsHighlights.map(n => ({
            headline: n.headline,
            date: n.date,
            url: n.url
          }));
        }

        // === Process EXTRACT results - add to transformation batch ===
        // Extract results also go through LLM transformation (don't append raw!)
        const extractRawInsights: { text: string; source?: string; type: string }[] = [];

        for (const pp of extractEnrichment.painPoints) {
          if (isRelevantInsight(pp.problem)) {
            extractRawInsights.push({
              text: `${pp.problem}${pp.impact ? ` (Impact: ${pp.impact})` : ''}`,
              source: pp.source,
              type: 'pain_point'
            });
          }
        }

        for (const t of extractEnrichment.trends) {
          if (isRelevantInsight(t.trend)) {
            extractRawInsights.push({
              text: `${t.trend}${t.relevance ? ` (${t.relevance})` : ''}`,
              source: t.source,
              type: 'trend'
            });
          }
        }

        // 🚀 PARALLEL OPTIMIZATION: Transform both Search and Extract insights in parallel
        const transformPromises: Promise<any>[] = [];

        if (rawInsightsForTransform.length > 0) {
          console.log(`📝 Sending ${rawInsightsForTransform.length} raw insights to LLM for editorial transformation...`);
          transformPromises.push(transformToEditorialAngles(
            rawInsightsForTransform,
            {
              name: brandData.name || 'the brand',
              targetAudience: brandData.targetAudience || 'professionals',
              industry: brandData.industry || 'general'
            }
          ));
        }

        if (extractRawInsights.length > 0) {
          console.log(`📝 Sending ${extractRawInsights.length} Extract insights to LLM for transformation...`);
          transformPromises.push(transformToEditorialAngles(
            extractRawInsights,
            {
              name: brandData.name || 'the brand',
              targetAudience: brandData.targetAudience || 'professionals',
              industry: brandData.industry || 'general'
            }
          ));
        }

        // Wait for all transformations to complete
        if (transformPromises.length > 0) {
          const transformResults = await Promise.all(transformPromises);

          // Process first transformation (Search insights)
          if (rawInsightsForTransform.length > 0 && transformResults[0]) {
            const smartAngles = transformResults[0];
            if (smartAngles.length > 0) {
              const transformedInsights = smartAngles.map((angle: any) => ({
                painPoint: angle.painPoint,
                consequence: angle.consequence || '',
                solution: '',
                type: angle.type as 'pain_point' | 'trend' | 'social_proof',
                isEnriched: true,
                isTransformed: true
              }));

              brandData.industryInsights = [
                ...(brandData.industryInsights || []),
                ...transformedInsights
              ].slice(0, 8);

              console.log(`✅ Added ${transformedInsights.length} LLM-transformed editorial angles`);
            } else {
              console.log('⚠️ LLM transformation returned no usable angles');
            }
          }

          // Process second transformation (Extract insights) if it exists
          const extractResultIndex = rawInsightsForTransform.length > 0 ? 1 : 0;
          if (extractRawInsights.length > 0 && transformResults[extractResultIndex]) {
            const smartExtractAngles = transformResults[extractResultIndex];
            if (smartExtractAngles.length > 0) {
              // Dedupe against existing insights
              const existingPains = new Set(
                (brandData.industryInsights || [])
                  .map((i: any) => i.painPoint?.toLowerCase().slice(0, 30))
              );

              const newAngles = smartExtractAngles
                .filter((a: any) => !existingPains.has(a.painPoint.toLowerCase().slice(0, 30)))
                .map((angle: any) => ({
                  painPoint: angle.painPoint,
                  consequence: angle.consequence || '',
                  solution: '',
                  type: angle.type as 'pain_point' | 'trend' | 'social_proof',
                  isEnriched: true,
                  isTransformed: true
                }));

              if (newAngles.length > 0) {
                brandData.industryInsights = [
                  ...(brandData.industryInsights || []),
                  ...newAngles
                ].slice(0, 10);
                console.log(`✅ Added ${newAngles.length} LLM-transformed angles from Extract`);
              }
            }
          }
        }

        // Add competitor insights to features/keyPoints
        if (extractEnrichment.competitorInsights.length > 0) {
          console.log(`✅ Got ${extractEnrichment.competitorInsights.length} competitor insights`);
          // Store as market context in contentNuggets
          (mergedContentNuggets as any).marketContext = [
            ...((mergedContentNuggets as any).marketContext || []),
            ...extractEnrichment.competitorInsights
          ];
        }

        // Mark that we enriched
        (mergedContentNuggets as any)._meta.enrichedFromSearch = true;
        (mergedContentNuggets as any)._meta.enrichedFromExtract = extractEnrichment.painPoints.length > 0 || extractEnrichment.trends.length > 0;

      } catch (enrichError) {
        console.warn('Firecrawl enrichment failed:', enrichError);
      }
    }

    // Also validate suggestedPosts - mark which ones use real data
    if (Array.isArray(brandData.suggestedPosts)) {
      brandData.suggestedPosts = brandData.suggestedPosts.map((post: any) => {
        // Check if this post's content matches any real extracted data
        const postText = (post.headline || '') + (post.metric || '') + (post.metricLabel || '');
        const usesRealStat = mergedContentNuggets.realStats.some((stat: string) =>
          postText.toLowerCase().includes(stat.toLowerCase().slice(0, 20))
        );
        const usesRealTestimonial = mergedContentNuggets.testimonials.some((t: any) =>
          postText.toLowerCase().includes(t.quote?.toLowerCase().slice(0, 30) || '')
        );

        return {
          ...post,
          source: usesRealStat || usesRealTestimonial ? 'real_data' : (post.source || 'generated'),
          _verified: usesRealStat || usesRealTestimonial
        };
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP C: AGGRESSIVE FILTERING - Remove ALL market stats, keep only pain points
    // ═══════════════════════════════════════════════════════════════════════════
    const BAD_PATTERNS = [
      // Market size & projections (always garbage)
      /market.*(?:reach|worth|size|grow|project|forecast|estimat)/i,
      /\$\d+\s*(?:billion|trillion|million)/i,
      /(?:billion|trillion)\s*(?:dollar|usd|eur)/i,
      /\d+\s*(?:billion|trillion|milliard)/i,
      /marché.*(?:atteindra|vaudra|représente|estimé)/i,
      // Growth rates (useless for end users)
      /cagr|compound annual/i,
      /\d+%.*(?:growth|increase|rise|croissance)/i,
      /croissance de \d+/i,
      // Industry trends (generic)
      /industry.*(?:worth|size|grow|reach|trend)/i,
      /(?:global|worldwide|mondial).*market/i,
      /le secteur.*(?:croît|représente|atteint)/i,
      /l'industrie.*(?:croît|représente|atteint)/i,
      // Future projections (nobody cares)
      /by 202[5-9]|by 203[0-9]/i,
      /d'ici 202[5-9]|d'ici 203[0-9]/i,
      /en 202[5-9]|en 203[0-9]/i,
      // Company adoption stats (not personal)
      /\d+%\s*(?:des entreprises|of companies|of organizations)/i,
      /entreprises.*(?:adoptent|utilisent|investissent)/i,
      /companies.*(?:adopt|use|invest)/i,
      // Generic AI/tech trends
      /l'ia transform|ai is transform/i,
      /digital transformation/i,
    ];

    const filterInsight = (insight: any): boolean => {
      const text = (insight.painPoint || insight.hook || insight.fact || '').toLowerCase();

      // Reject if matches any bad pattern (even if marked as real data)
      if (BAD_PATTERNS.some(pattern => pattern.test(text))) {
        console.log(`   ❌ Filtered market stat: "${text.slice(0, 60)}..."`);
        return false;
      }

      // Reject if too short
      if (text.length < 15) return false;

      // Keep otherwise
      return true;
    };

    // Filter industryInsights
    if (Array.isArray(brandData.industryInsights)) {
      const originalCount = brandData.industryInsights.length;
      brandData.industryInsights = brandData.industryInsights.filter(filterInsight);
      console.log(`🔍 Filtered industryInsights: ${originalCount} → ${brandData.industryInsights.length}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP D: TWO-TIER CONTENT ANGLES SYSTEM
    // Tier 1 (Primary): Direct from brand data - reliable, specific
    // Tier 2 (Secondary): LLM-generated editorial hooks - creative, varied
    // ═══════════════════════════════════════════════════════════════════════════

    const primaryAngles: any[] = [];
    const detectedLanguage = brandData.detectedLanguage || 'fr';
    const brandName = brandData.name || 'nous';

    console.log(`🎯 Building two-tier content angles for "${brandName}"...`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TIER 1: PRIMARY ANGLES - Direct from brand data (high reliability)
    // ─────────────────────────────────────────────────────────────────────────────

    // 1. Tagline → Direct angle (most important, brand-defining)
    if (brandData.tagline && brandData.tagline.length > 10 && brandData.tagline.length < 100) {
      primaryAngles.push({
        painPoint: brandData.tagline,
        consequence: '',
        type: 'primary',
        tier: 'primary',
        source: 'tagline'
      });
    }

    // 2. UVP → Direct angle (key value proposition)
    if (brandData.uniqueValueProposition &&
      brandData.uniqueValueProposition.length > 10 &&
      brandData.uniqueValueProposition !== brandData.tagline) {
      primaryAngles.push({
        painPoint: brandData.uniqueValueProposition,
        consequence: '',
        type: 'primary',
        tier: 'primary',
        source: 'uvp'
      });
    }

    // 3. Features → Each feature can be an angle (top 3)
    if (Array.isArray(brandData.features)) {
      brandData.features
        .filter((f: string) => f && f.length > 5 && f.length < 80)
        .slice(0, 3)
        .forEach((feature: string) => {
          primaryAngles.push({
            painPoint: feature,
            consequence: '',
            type: 'primary',
            tier: 'primary',
            source: 'feature'
          });
        });
    }

    // 4. Services → Each service can be an angle (top 2)
    if (Array.isArray(brandData.services)) {
      brandData.services
        .filter((s: string) => s && s.length > 5 && s.length < 80)
        .slice(0, 2)
        .forEach((service: string) => {
          // Format as a question if not already
          const formatted = service.endsWith('?')
            ? service
            : (detectedLanguage === 'fr'
              ? `Besoin de ${service.toLowerCase()} ?`
              : `Need ${service.toLowerCase()}?`);
          primaryAngles.push({
            painPoint: formatted,
            consequence: `${brandName} ${detectedLanguage === 'fr' ? 'peut vous aider' : 'can help'}.`,
            type: 'tip',
            tier: 'primary',
            source: 'service'
          });
        });
    }

    // 5. Pain Points (direct) → Question format
    if (Array.isArray(brandData.painPoints)) {
      brandData.painPoints
        .filter((p: string) => p && p.length > 10 && p.length < 100)
        .slice(0, 2)
        .forEach((pain: string) => {
          const isQuestion = pain.endsWith('?');
          const formatted = isQuestion
            ? pain
            : (detectedLanguage === 'fr'
              ? `Marre de ${pain.toLowerCase()} ?`
              : `Tired of ${pain.toLowerCase()}?`);
          primaryAngles.push({
            painPoint: formatted,
            consequence: `${brandName} ${detectedLanguage === 'fr' ? 'a la solution' : 'has the solution'}.`,
            type: 'pain_point',
            tier: 'primary',
            source: 'painpoint'
          });
        });
    }

    console.log(`  ⭐ Built ${primaryAngles.length} primary angles from direct brand data`);

    // ─────────────────────────────────────────────────────────────────────────────
    // TIER 2: SECONDARY ANGLES - LLM editorial hooks (varied, creative)
    // ─────────────────────────────────────────────────────────────────────────────

    let secondaryAngles: any[] = [];

    if (Array.isArray(brandData.editorialHooks) && brandData.editorialHooks.length > 0) {
      console.log(`  📝 Processing ${brandData.editorialHooks.length} LLM editorial hooks...`);

      // Light filter - only reject truly broken hooks
      const lightFilterHook = (h: any): boolean => {
        const text = h.hook || '';
        if (text.length < 10) return false;
        if (!text.includes(' ')) return false;
        return true;
      };

      secondaryAngles = brandData.editorialHooks
        .filter(lightFilterHook)
        .map((h: any) => ({
          painPoint: h.hook,
          consequence: h.subtext || '',
          type: h.emotion === 'urgency' ? 'trend' : 'pain_point',
          emotion: h.emotion,
          tier: 'secondary',
          source: 'llm'
        }));

      console.log(`  💡 Kept ${secondaryAngles.length} secondary angles from LLM`);
    } else {
      console.log(`  ⚠️ No editorial hooks from LLM, using filtered raw insights...`);
      secondaryAngles = (brandData.industryInsights || [])
        .filter(filterInsight)
        .slice(0, 4)
        .map((i: any) => ({ ...i, tier: 'secondary', source: 'raw' }));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // MERGE: Primary first (reliable), then Secondary (creative)
    // Deduplicate by similarity to avoid redundant angles
    // ─────────────────────────────────────────────────────────────────────────────

    const allAngles = [...primaryAngles, ...secondaryAngles];

    // Deduplicate by text similarity (first 30 chars lowercase)
    const seen = new Set<string>();
    const deduped = allAngles.filter(angle => {
      const text = (angle.painPoint || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      if (text.length < 5) return false; // Too short
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // LLM REFINEMENT PASS: Improve quality of all content angles
    // ─────────────────────────────────────────────────────────────────────────────
    console.log(`🔍 Running LLM refinement on ${deduped.length} content angles...`);

    const refinedAngles = await refineContentAnglesWithLLM({
      angles: deduped,
      brandName: brandData.name || 'la marque',
      targetAudience: brandData.targetAudience || '',
      industry: brandData.industry || '',
      uniqueValueProposition: brandData.uniqueValueProposition || '',
      detectedLanguage,
      features: brandData.features || []
    });

    // Final: Max 12 angles, ensure at least some primary appear first
    brandData.industryInsights = refinedAngles.slice(0, 12);

    const primaryCount = brandData.industryInsights.filter((a: any) => a.tier === 'primary').length;
    const secondaryCount = brandData.industryInsights.filter((a: any) => a.tier === 'secondary').length;

    console.log(`✅ Final content angles: ${brandData.industryInsights.length} total (${primaryCount} primary ⭐, ${secondaryCount} secondary 💡)`);

    return NextResponse.json({
      success: true,
      brand: {
        ...brandData,
        id: existingBrandId, // Include existing brand ID if found (for update instead of create)
        url: url,
        images: uniqueFinalImages,
        labeledImages: labeledImages,
        contentNuggets: mergedContentNuggets, // OVERRIDE with real data
        _crawlStats: {
          mainPageLength: firecrawlMarkdown.length,
          deepCrawlLength: deepCrawlContent.length,
          pagesScraped: mergedContentNuggets._meta.pagesScraped,
          nuggetsExtracted: mergedContentNuggets._meta.extractedNuggets
        }
      },
      isUpdate: !!existingBrandId, // Let frontend know if this is an update
    });

  } catch (error: any) {
    console.error('Analysis Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}