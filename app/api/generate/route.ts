import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

// NOTE: Fal has been removed - we now use Google AI (Gemini 3 Pro) exclusively
// This is cheaper ($0.067/image vs $0.15) and supports more features (14 images, thinking)

// Credit limits per plan
const PLAN_CREDITS = {
  free: 3,
  pro: 50,
  premium: 150,
} as const;

// Helper: Check and consume credits (1 credit = 1 image)
async function checkAndConsumeCredits(clerkId: string, numImages: number = 1): Promise<{ 
  allowed: boolean; 
  error?: string; 
  remaining?: number;
  plan?: string;
  creditsConsumed?: number;
}> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    // If user doesn't exist in DB yet, allow with free tier limit
    if (!user) {
      const remaining = PLAN_CREDITS.free - numImages;
      return { 
        allowed: remaining >= 0, 
        remaining: Math.max(0, remaining), 
        plan: 'free',
        creditsConsumed: numImages,
        error: remaining < 0 ? `Pas assez de crédits. Vous avez besoin de ${numImages} crédits.` : undefined,
      };
    }

    // Check if user is part of a team (use team credits)
    if (user.teamId) {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, user.teamId),
      });

      if (team) {
        if (team.creditsPool < numImages) {
          return { 
            allowed: false, 
            error: `Crédits équipe insuffisants. ${team.creditsPool} restant(s), ${numImages} requis.`,
            remaining: team.creditsPool,
            plan: 'premium',
          };
        }

        // Consume team credits (1 per image)
        await db.update(teams)
          .set({ creditsPool: team.creditsPool - numImages })
          .where(eq(teams.id, user.teamId));

        return { 
          allowed: true, 
          remaining: team.creditsPool - numImages, 
          plan: 'premium',
          creditsConsumed: numImages,
        };
      }
    }

    // Use personal credits (1 per image)
    if (user.creditsRemaining < numImages) {
      return { 
        allowed: false, 
        error: user.plan === 'free' 
          ? `Crédits gratuits insuffisants. ${user.creditsRemaining} restant(s), ${numImages} requis. Passez au plan Pro !` 
          : `Crédits mensuels insuffisants. ${user.creditsRemaining} restant(s), ${numImages} requis.`,
        remaining: user.creditsRemaining,
        plan: user.plan,
      };
    }

    // Consume credits (1 per image)
    await db.update(users)
      .set({ creditsRemaining: user.creditsRemaining - numImages })
      .where(eq(users.clerkId, clerkId));

    return { 
      allowed: true, 
      remaining: user.creditsRemaining - numImages, 
      plan: user.plan,
      creditsConsumed: numImages,
    };
  } catch (error) {
    console.error('Credit check error:', error);
    // On error, allow generation (fail open for better UX)
    return { allowed: true };
  }
}

// Initialize Google AI
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

// Helper: Convert SVG to PNG data URL using sharp
async function convertSvgToPng(svgDataUrl: string): Promise<string | null> {
  try {
    const match = svgDataUrl.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (!match) return null;
    
    const svgBuffer = Buffer.from(match[1], 'base64');
    const pngBuffer = await sharp(svgBuffer)
      .png()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: false })
      .toBuffer();
    
    const pngBase64 = pngBuffer.toString('base64');
    console.log('🔄 Converted SVG to PNG');
    return `data:image/png;base64,${pngBase64}`;
  } catch (e) {
    console.warn('Failed to convert SVG to PNG:', e);
    return null;
  }
}

// Helper: Convert URL to base64 for Google AI (handles SVG conversion)
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    // Check if SVG and convert to PNG first
    if (url.startsWith('data:image/svg+xml')) {
      const pngUrl = await convertSvgToPng(url);
      if (pngUrl) {
        const match = pngUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return { mimeType: match[1], data: match[2] };
        }
      }
      console.warn('⚠️ SVG conversion failed, skipping image');
      return null;
    }
    
    if (url.startsWith('data:')) {
      // Already base64 (non-SVG)
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], data: match[2] };
      }
      return null;
    }
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    // If fetched URL is SVG, convert to PNG
    if (contentType.includes('svg')) {
      const pngBuffer = await sharp(Buffer.from(buffer))
        .png()
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: false })
        .toBuffer();
      console.log('🔄 Converted fetched SVG to PNG');
      return { data: pngBuffer.toString('base64'), mimeType: 'image/png' };
    }
    
    const base64 = Buffer.from(buffer).toString('base64');
    return { data: base64, mimeType: contentType };
  } catch (e) {
    console.warn(`Failed to convert URL to base64: ${url.slice(0, 50)}...`);
    return null;
  }
}

// Helper: Generate with Google Gemini 3 Pro Image
async function generateWithGoogle(
  prompt: string,
  imageUrls: string[],
  aspectRatio: string,
  resolution: string
): Promise<{ url: string } | null> {
  if (!genAI) {
    console.warn('⚠️ Google AI not configured, skipping');
    return null;
  }
  
  console.log('🌐 Generating with Google Gemini 3 Pro Image...');
  
  try {
    // Determine image size based on resolution
    // Gemini 3 Pro supports: 1K (1024), 2K (2048), 4K (4096)
    let baseSize = 1024;
    if (resolution === "2K") baseSize = 2048;
    if (resolution === "4K") baseSize = 4096;
    
    // Map aspect ratio to Google format (width x height)
    const aspectToSize: Record<string, string> = {
      '1:1': `${baseSize}x${baseSize}`,
      '4:5': `${Math.round(baseSize * 0.8)}x${baseSize}`,
      '9:16': `${Math.round(baseSize * 0.5625)}x${baseSize}`,
      '16:9': `${baseSize}x${Math.round(baseSize * 0.5625)}`,
      '3:2': `${baseSize}x${Math.round(baseSize * 0.667)}`,
      '21:9': `${baseSize}x${Math.round(baseSize * 0.429)}`,
    };
    const finalSize = aspectToSize[aspectRatio] || `${baseSize}x${baseSize}`;
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-image-preview", // Nano Banana Pro - best quality
      generationConfig: {
        // @ts-ignore - responseModalities is valid for image generation
        responseModalities: ["image", "text"],
      },
      // Gemini 3 Pro uses "thinking" by default for complex prompts
      // This improves quality for multi-step instructions
    });
    
    // Build content parts
    const parts: any[] = [{ text: prompt }];
    
    // Gemini 3 Pro Image supports up to 14 reference images!
    // First 5 get "high fidelity", 6-14 still used but less precisely
    const imagesToProcess = imageUrls.slice(0, 14); // Max capacity
    
    // PARALLEL Base64 conversion for speed
    const imageDataResults = await Promise.all(
      imagesToProcess.map(url => urlToBase64(url).catch(() => null))
    );
    
    for (const imageData of imageDataResults) {
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data
          }
        });
      }
    }
    
    console.log(`   📸 Sending ${parts.length - 1} images to Google AI`);
    console.log(`   📏 Target size: ${finalSize}`);
    
    // 🔍 LOGO DEBUG: Check which images were successfully converted
    console.log(`   🔍 Image order sent to Gemini:`);
    imagesToProcess.forEach((url, i) => {
      const wasConverted = imageDataResults[i] !== null;
      const urlPreview = url.startsWith('data:') ? `data:${url.slice(5, 25)}...` : url.slice(0, 60) + '...';
      console.log(`      ${i + 1}. ${wasConverted ? '✅' : '❌'} ${urlPreview}`);
    });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });
    
    const response = result.response;
    
    // Extract image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          // Convert base64 to data URL
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log('   ✅ Google AI generated image successfully');
          return { url: dataUrl };
        }
      }
    }
    
    console.warn('   ⚠️ No image in Google AI response');
    return null;
  } catch (error: any) {
    console.error('   ❌ Google AI error:', error.message || error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // ====== AUTHENTICATION ======
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ====== GOOGLE AI IS NOW THE PRIMARY (AND ONLY) GENERATOR ======
  if (!GOOGLE_AI_API_KEY || !genAI) {
    console.error("❌ Error: GOOGLE_AI_API_KEY is missing in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing Google AI API Key' }, { status: 500 });
  }
  
  console.log(`🔑 Google AI configured (key ends: ...${GOOGLE_AI_API_KEY.slice(-6)})`);

  try {
    const body = await request.json();
    const { 
      prompt, 
      promptVariations, // NEW: Array of 4 different prompts for diversity
      negativePrompt = "", 
      imageUrls = [], 
      referenceImages = [], // Style reference images (tagged as 'reference')
      numImages = 4, 
      aspectRatio = "1:1", 
      resolution = "2K", // Same price as 1K, better quality 
      useAsync = false,
      imageContextMap = {} // NEW: Map of URL -> Description (e.g. "logo", "product")
    } = body;

    // Basic Validation - accept either prompt or promptVariations
    const hasPrompt = prompt && typeof prompt === 'string';
    const hasVariations = Array.isArray(promptVariations) && promptVariations.length > 0;
    
    if (!hasPrompt && !hasVariations) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }
    
    // ====== CREDITS CHECK (1 credit = 1 image) ======
    const requestedImages = Math.min(numImages, 4); // Cap at 4 images max
    const creditCheck = await checkAndConsumeCredits(userId, requestedImages);
    
    if (!creditCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: creditCheck.error,
        creditsRemaining: creditCheck.remaining,
        plan: creditCheck.plan,
        upgradeRequired: true,
      }, { status: 402 }); // Payment Required
    }
    
    console.log(`💳 Credits: ${requestedImages} consumed, ${creditCheck.remaining} remaining (plan: ${creditCheck.plan})`);
    
    // 🔍 LOGO DEBUG
    console.log('📥 LOGO DEBUG - Input:');
    console.log(`   imageUrls: ${imageUrls?.length || 0}, referenceImages: ${referenceImages?.length || 0}`);
    const logoInContext = Object.entries(imageContextMap || {}).find(([, v]) => 
      typeof v === 'string' && v.toLowerCase().includes('logo')
    );
    console.log(`   Logo in contextMap: ${logoInContext ? `YES (${logoInContext[0].slice(0, 50)}...)` : 'NO ⚠️'}`);

    // Filter & Convert URLs
    // 1. Filter valid HTTP/HTTPS or data URI
    // 2. Convert unsupported formats (SVG, etc.) to PNG Data URI using sharp
    // 3. Filter out small or low-quality images if possible (optional, simplified here)
    // 4. PRIORITIZE reference images (they define the style)
    const processedImageUrls: string[] = [];
    const processedReferenceUrls: string[] = [];

    // NANO BANANA PRO REQUIREMENT: At least one image is strongly recommended for best results
    if (imageUrls.length === 0 && referenceImages.length === 0) {
        console.warn('⚠️ No images provided for Nano Banana Pro - results might be suboptimal');
    }

    // Process reference images FIRST - they define the style
    for (const url of referenceImages) {
        if (!url || typeof url !== 'string') continue;
        
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('data:image')) continue;
        if (trimmedUrl.includes('placehold.co') || trimmedUrl.includes('placeholder')) continue;

        // Check for SVG (both URL extension and data URI)
        const isSvgUrl = trimmedUrl.toLowerCase().endsWith('.svg');
        const isSvgDataUri = trimmedUrl.startsWith('data:image/svg+xml');
        
        if (isSvgDataUri) {
            // Convert data URI SVG to PNG
            const pngUrl = await convertSvgToPng(trimmedUrl);
            if (pngUrl) {
                processedReferenceUrls.push(pngUrl);
            } else {
                console.warn('⚠️ Skipping unconvertible SVG data URI');
            }
        } else if (isSvgUrl) {
            try {
                console.log(`🔄 Converting reference SVG to PNG: ${trimmedUrl}`);
                const response = await fetch(trimmedUrl);
                if (!response.ok) continue;
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const pngBuffer = await sharp(buffer).png().toBuffer();
                const base64 = pngBuffer.toString('base64');
                processedReferenceUrls.push(`data:image/png;base64,${base64}`);
            } catch (e) {
                console.error(`Error converting reference image ${trimmedUrl}:`, e);
            }
        } else {
            processedReferenceUrls.push(trimmedUrl);
        }
    }

    if (processedReferenceUrls.length > 0) {
        console.log(`🎨 Using ${processedReferenceUrls.length} reference images for style guidance`);
        console.log('   Style refs:', processedReferenceUrls.map(u => u.startsWith('data:') ? 'data:image...' : u.slice(0, 80)));
    }

    // Track original URL -> processed URL mapping for context preservation
    // CRITICAL: SVG logos get converted to base64, losing their original URL
    // Without this mapping, logo context ("BRAND_LOGO") would be lost!
    const urlMapping: Record<string, string> = {};

    for (const url of imageUrls) {
        if (!url || typeof url !== 'string') continue;
        
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('data:image')) continue;

        // Skip placeholder images or known bad assets
        if (trimmedUrl.includes('placehold.co') || trimmedUrl.includes('placeholder')) continue;

        // Check for SVG (both URL extension and data URI)
        const isSvgUrl = trimmedUrl.toLowerCase().endsWith('.svg');
        const isSvgDataUri = trimmedUrl.startsWith('data:image/svg+xml');
        
        if (isSvgDataUri) {
            // Convert data URI SVG to PNG
            console.log(`🔄 Converting SVG data URI to PNG`);
            const pngUrl = await convertSvgToPng(trimmedUrl);
            if (pngUrl) {
                processedImageUrls.push(pngUrl);
                urlMapping[pngUrl] = trimmedUrl; // Map converted -> original
            } else {
                console.warn('⚠️ Skipping unconvertible SVG data URI');
            }
        } else if (isSvgUrl) {
            try {
                console.log(`🔄 Converting SVG URL to PNG: ${trimmedUrl}`);
                const response = await fetch(trimmedUrl);
                if (!response.ok) {
                    console.warn(`Failed to fetch image for conversion: ${trimmedUrl}`);
                    continue;
                }
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // Convert to PNG
                const pngBuffer = await sharp(buffer).png().toBuffer();
                const base64 = pngBuffer.toString('base64');
                const convertedUrl = `data:image/png;base64,${base64}`;
                processedImageUrls.push(convertedUrl);
                urlMapping[convertedUrl] = trimmedUrl; // Map converted -> original
                console.log(`   ✅ SVG converted, mapped for context: ${trimmedUrl.slice(0, 50)}...`);
            } catch (e) {
                console.error(`Error converting image ${trimmedUrl}:`, e);
                // If conversion fails, skip (SVG won't work on Fal anyway)
            }
        } else {
            // Pass through other images (assuming they are JPG/PNG/WEBP)
            processedImageUrls.push(trimmedUrl);
            urlMapping[trimmedUrl] = trimmedUrl; // Identity mapping
        }
    }

    // CRITICAL FIX: Logo must be FIRST for the model to prioritize it
    // Extract logo from processed images (it's marked in imageContextMap)
    const logoUrl = processedImageUrls.find(url => {
      const originalUrl = urlMapping[url] || url;
      const context = imageContextMap[originalUrl] || imageContextMap[url] || '';
      return context.toLowerCase().includes('logo') && context.toLowerCase().includes('brand');
    });
    
    // Build final order: LOGO FIRST, then style refs, then other content
    const contentWithoutLogo = processedImageUrls.filter(url => url !== logoUrl);
    const allImageUrls = [
      ...(logoUrl ? [logoUrl] : []), // Logo first if exists
      ...processedReferenceUrls,      // Style refs second
      ...contentWithoutLogo           // Other content last
    ];
    
    console.log(`🎯 IMAGE ORDER: Logo=${logoUrl ? 'Position 1' : 'NOT FOUND'}, StyleRefs=${processedReferenceUrls.length}, Content=${contentWithoutLogo.length}`);
    
    // For Flux Pro, we don't strictly need images, but we process them in case we switch back
    // or if we implement a specific img2img endpoint later.
    
    // Replace processedImageUrls with combined list for generation
    let totalDataUriSize = 0;
    const MAX_DATA_URI_SIZE = 5 * 1024 * 1024; // 5MB total for data URIs
    
    // Gemini 3 Pro supports up to 14 images
    // First 5 = high fidelity, 6-14 = still used but less precisely
    const urlsToValidate = allImageUrls.slice(0, 14).filter(url => url && typeof url === 'string');
    
    // PARALLEL URL validation for speed
    const validationResults = await Promise.all(
      urlsToValidate.map(async (url): Promise<string | null> => {
        // Validate URL format
        if (!url.startsWith('http') && !url.startsWith('data:image')) {
          console.warn(`⚠️ Skipping invalid URL: ${url.slice(0, 50)}`);
          return null;
        }
        
        // Check if URL is accessible (quick HEAD check for http URLs)
        if (url.startsWith('http')) {
          try {
            const headCheck = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(2000) }); // Reduced timeout
            if (!headCheck.ok) {
              console.warn(`⚠️ Skipping inaccessible URL (${headCheck.status}): ${url.slice(0, 60)}`);
              return null;
            }
          } catch (e) {
            console.warn(`⚠️ Skipping unreachable URL: ${url.slice(0, 60)}`);
            return null;
          }
        }
        
        return url;
      })
    );
    
    // Filter valid URLs and check data URI size limits
    const finalImageUrls: string[] = [];
    for (const url of validationResults) {
      if (!url) continue;
      
      if (url.startsWith('data:')) {
        const size = url.length * 0.75;
        if (totalDataUriSize + size > MAX_DATA_URI_SIZE) {
          console.warn(`⚠️ Skipping data URI - total size would exceed limit`);
          continue;
        }
        totalDataUriSize += size;
      }
      finalImageUrls.push(url);
    }
    
    // For Flux Pro 1.1, images are not required (Text-to-Image)
    // Log image breakdown
    if (finalImageUrls.length > 0) {
      console.log(`📸 Images breakdown:`);
      console.log(`   🎨 Style references: ${processedReferenceUrls.length} (FIRST in list = high priority)`);
      console.log(`   📦 Content images: ${processedImageUrls.length}`);
      console.log(`   ✅ Total valid: ${finalImageUrls.length}`);
    }

    // Build image context prefix for the prompt
    // This helps the model understand what each image is for
    let imageContextPrefix = '';
    
    // NEW: Track image positions based on new order (Logo first, then refs, then content)
    const hasLogo = !!logoUrl;
    const logoPosition = hasLogo ? 1 : 0;
    const styleRefStart = logoPosition + 1;
    const styleRefEnd = styleRefStart + processedReferenceUrls.length - 1;
    const contentStart = styleRefEnd + 1;
    
    if (allImageUrls.length > 0) {
      const imageDescriptions: string[] = [];
      
      // Describe logo if present (always position 1)
      if (hasLogo) {
        imageDescriptions.push(`Image 1: ⚠️⚠️⚠️ BRAND LOGO ⚠️⚠️⚠️
THIS IS THE OFFICIAL LOGO. REPRODUCE IT EXACTLY AS SHOWN:
- Copy pixel by pixel - no modifications
- Same colors, shapes, proportions
- Do not stylize, simplify, or redraw
- Place prominently in the final image
TREAT THIS AS A SACRED ELEMENT - DO NOT ALTER.`);
      }
      
      // Describe style refs
      if (processedReferenceUrls.length > 0) {
        const refRange = processedReferenceUrls.length === 1 
          ? `Image ${styleRefStart}` 
          : `Images ${styleRefStart}-${styleRefEnd}`;
        imageDescriptions.push(`🎨 [STYLE INSPIRATION] ${refRange} ${processedReferenceUrls.length === 1 ? 'is' : 'are'} visual INSPIRATION (not templates to copy).

GET INSPIRED BY:
→ The general composition approach (how elements are arranged)
→ The mood and artistic direction
→ The level of minimalism or richness
→ How text and visuals interact
→ The overall "energy" of the design

⚠️ BUT ALWAYS PRIORITIZE THE CLIENT'S BRAND:
✅ Use the CLIENT'S colors from the brand palette (not the reference colors)
✅ Use the CLIENT'S typography style (not the reference fonts)
✅ Use the CLIENT'S logo exactly as provided (Image 1)
✅ Match the CLIENT'S brand personality and tone

The reference is a MOOD BOARD, not a template. Create something ORIGINAL that captures a similar vibe while being 100% true to the client's brand identity.`);
      }
      
      // Describe content images (excluding logo which is already described)
      if (contentWithoutLogo.length > 0) {
        contentWithoutLogo.forEach((url, i) => {
            const idx = contentStart + i;
            let role = "CONTENT ELEMENT";
            
            // Get original URL from mapping (for converted SVGs)
            const originalUrl = urlMapping[url] || url;
            
            // Try exact match with original URL first
            if (imageContextMap[originalUrl]) {
                role = imageContextMap[originalUrl];
            } else if (imageContextMap[url]) {
                role = imageContextMap[url];
            } else {
                // Fuzzy match as last resort
                const matchingKey = Object.keys(imageContextMap).find(k => 
                    originalUrl.includes(k) || k.includes(originalUrl) ||
                    url.includes(k) || k.includes(url)
                );
                if (matchingKey) {
                    role = imageContextMap[matchingKey];
                }
            }
            
            // Log for debugging
            if (role !== "CONTENT ELEMENT") {
                console.log(`   🏷️ Image ${idx} role: ${role.slice(0, 50)}...`);
            }
            
            // Skip logo context (already handled above)
            if (!role.toLowerCase().includes('brand_logo')) {
                imageDescriptions.push(`Image ${idx}: ${role}`);
            }
        });
      }
      
      console.log(`   📊 IMAGE CONTEXT: Logo=${hasLogo ? 'Pos 1' : 'NONE'}, StyleRefs=${processedReferenceUrls.length}, Content=${contentWithoutLogo.length}`);
      
      // Add quality handling instructions
      imageDescriptions.push(`
⚠️ LOW QUALITY ASSET HANDLING:
If any image contains very small text or low-resolution details that would be hard to reproduce clearly:
- SIMPLIFY diagrams: keep the concept but make it cleaner and more readable
- SIMPLIFY UI screenshots: capture the essence but improve clarity
- Never reproduce blurry or illegible text - either make it readable or remove it
- Prioritize visual clarity over exact reproduction

🚫 CRITICAL - DO NOT INVENT UI/INTERFACES:
For SaaS, apps, or software products:
- DO NOT invent or generate fake UI screens, dashboards, or interfaces
- DO NOT create fictional app interfaces that don't exist
- If no real UI screenshot is provided, be EVOCATIVE instead:
  → Use abstract shapes, gradients, icons to suggest "tech/digital"
  → Show the CONCEPT or BENEFIT, not a fake interface
  → Use typography-focused designs with the message
  → Show lifestyle/results imagery rather than fake product screens
- If a real UI screenshot IS provided, you may use it as-is or simplify it, but don't add fictional UI elements`);
      
      // Add logo protection rule ONLY if logo exists
      const logoRule = hasLogo ? `
🛡️🛡️🛡️ LOGO PROTECTION - ABSOLUTE RULE 🛡️🛡️🛡️

IMAGE 1 IS THE BRAND LOGO. THIS IS NON-NEGOTIABLE:

1. COPY IT EXACTLY - pixel-perfect reproduction
2. DO NOT modify colors, shapes, proportions, or any detail
3. DO NOT stylize, simplify, or "improve" it
4. DO NOT add effects, shadows, or modifications
5. PLACE IT PROMINENTLY in the composition (corner or center)
6. If you cannot reproduce it exactly, show it SMALLER but UNCHANGED

Think of the logo as a PHOTOGRAPH of a physical object - you can resize it, but you cannot redraw or alter it.

FAILURE TO PRESERVE THE LOGO EXACTLY WILL RUIN THE BRAND'S IDENTITY.

` : '';
      
      imageContextPrefix = `[IMAGE CONTEXT]
${logoRule}${imageDescriptions.join('\n')}

`;
    }

    // Determine prompts to use
    // If we have variations, we'll generate each image with a different prompt
    // IMPORTANT: Filter out any null/undefined/empty prompts
    let prompts: string[];
    
    if (hasVariations) {
      // Filter valid strings from variations and add image context
      prompts = promptVariations
        .filter((p: any) => p && typeof p === 'string' && p.trim().length > 0)
        .map((p: string) => imageContextPrefix + p.trim())
        .slice(0, numImages); // Respect requested numImages limit (default 4)
      
      // If all variations were invalid, fall back to single prompt
      if (prompts.length === 0 && hasPrompt) {
        prompts = [imageContextPrefix + prompt];
      }
    } else if (hasPrompt) {
      // Create TWO distinct versions: FAITHFUL and INTERPRETED
      const faithfulPrompt = imageContextPrefix + prompt + `

[GENERATION MODE: FAITHFUL]
- Stay close to the provided assets and references
- Reproduce UI screenshots and diagrams as accurately as possible
- Maintain the exact layout and structure shown in references
- Be precise with brand elements`;

      const interpretedPrompt = imageContextPrefix + prompt + `

[GENERATION MODE: CREATIVE INTERPRETATION]
- Take more artistic liberty while respecting the brand
- Simplify complex diagrams into cleaner, more impactful visuals
- Reinterpret UI elements in a fresh, modern way
- Add creative flair while keeping the core message
- Make it visually striking and scroll-stopping`;

      // First image = faithful, second = interpreted
      prompts = [faithfulPrompt, interpretedPrompt, faithfulPrompt, interpretedPrompt].slice(0, numImages);
      console.log('🎨 Generation modes: Faithful + Interpreted');
    } else {
      return NextResponse.json({ success: false, error: 'No valid prompts provided' }, { status: 400 });
    }
    
    // Final safety check
    if (prompts.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid prompts after filtering' }, { status: 400 });
    }
    
    const actualNumImages = Math.min(prompts.length, 4);
    
    console.log('📝 Valid prompts:', prompts.length, prompts.map(p => p.slice(0, 50) + '...'));

    console.log('🍌 Generating with Nano Banana Pro:');
    console.log('   📝 Prompts:', actualNumImages, hasVariations ? '(with variations)' : '(same prompt)');
    console.log('   🚫 Negative:', negativePrompt?.substring(0, 50) || 'none');
    console.log('   🖼️ Total images:', finalImageUrls.length, `(${processedReferenceUrls.length} style refs, ${processedImageUrls.length} content)`);

    // Generate each image with its own prompt (for variations) or batch
    const generateSingleImage = async (singlePrompt: string, index: number) => {
      // Safety check - skip if prompt is invalid
      if (!singlePrompt || typeof singlePrompt !== 'string' || !singlePrompt.trim()) {
        console.warn(`⚠️ Skipping generation ${index + 1}: invalid prompt`);
        return null;
      }
      
      const validRatios = ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'];
      const finalAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';
      
      console.log(`   🎨 Variation ${index + 1}:`, singlePrompt.slice(0, 60) + '...');
      
      // ====== GOOGLE AI ONLY (Gemini 3 Pro Image Preview) ======
      try {
        const googleResult = await generateWithGoogle(
          singlePrompt.trim(),
          finalImageUrls,
          finalAspectRatio,
          resolution
        );
        
        if (googleResult) {
          console.log(`   ✅ Variation ${index + 1} completed (Google AI)`);
          return { images: [googleResult] };
        } else {
          throw new Error('Google AI returned no image');
        }
      } catch (googleError: any) {
        console.error(`   ❌ Variation ${index + 1} Google AI error:`, googleError.message || googleError);
        throw googleError;
      }
    };

    try {
        // Generate all images in parallel with their respective prompts
        console.log(`🚀 Launching ${actualNumImages} parallel generations (Google AI)...`);
        console.log(`   📸 Images being sent:`, finalImageUrls.map(u => u.startsWith('data:') ? 'data:image...' : u.slice(0, 60)));
        
        const errors: string[] = [];
        
        const generationPromises = prompts.map((p, i) => 
          generateSingleImage(p, i).catch(err => {
            // Better error extraction
            let errorMsg = 'Unknown error';
            if (err?.body?.detail) {
              errorMsg = typeof err.body.detail === 'string' ? err.body.detail : JSON.stringify(err.body.detail);
            } else if (err?.message) {
              errorMsg = err.message;
            } else if (typeof err === 'object') {
              errorMsg = JSON.stringify(err);
            } else {
              errorMsg = String(err);
            }
            console.error(`❌ Generation ${i + 1} failed:`, errorMsg);
            console.error(`   Full error object:`, JSON.stringify(err, null, 2));
            errors.push(`Gen ${i + 1}: ${errorMsg}`);
            return null; // Return null for failed generations
          })
        );

        const results = await Promise.all(generationPromises);
        
        // Extract images from results
        const finalImages: any[] = [];
        
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (!result) {
            console.log(`   ⚠️ Result ${i + 1}: null (failed)`);
            continue;
          }
          
          // Log the raw result structure for debugging
          console.log(`   📦 Result ${i + 1} structure:`, Object.keys(result));
          
          // Cast to any to handle various response formats from Fal
          const r = result as any;
          
          // Extract image URL from various response formats
          if (r.data?.images && Array.isArray(r.data.images)) {
            console.log(`   ✅ Found images in r.data.images:`, r.data.images.length);
            finalImages.push(...r.data.images);
          } else if (r.images && Array.isArray(r.images)) {
            console.log(`   ✅ Found images in r.images:`, r.images.length);
            finalImages.push(...r.images);
          } else if (r.image) {
            console.log(`   ✅ Found single image in r.image`);
            finalImages.push(r.image);
          } else if (r.data?.image) {
            console.log(`   ✅ Found single image in r.data.image`);
            finalImages.push(r.data.image);
          } else {
            console.log(`   ⚠️ Result ${i + 1} has unknown structure:`, JSON.stringify(r).slice(0, 200));
          }
        }

        console.log(`✅ Generated ${finalImages.length}/${actualNumImages} images successfully`);

        if (finalImages.length === 0) {
          // Provide more detail about what went wrong
          const errorDetail = errors.length > 0 
            ? `Erreurs: ${errors.join('; ')}` 
            : 'Aucun résultat retourné par le service';
          throw new Error(`Aucune image générée. ${errorDetail}`);
        }

        // Normalize images and include aspect ratio
        const normalizedImages = finalImages.map((img: any) => {
          const url = typeof img === 'string' ? img : img?.url || img?.image || img;
          return {
            url,
            aspect_ratio: aspectRatio // Include the requested aspect ratio
          };
        });

        return NextResponse.json({
          success: true,
          images: normalizedImages,
          generatedCount: normalizedImages.length,
          requestedCount: actualNumImages,
          aspectRatio, // Also return it at top level for reference
          creditsRemaining: creditCheck.remaining,
          plan: creditCheck.plan,
        });
    } catch (falError: any) {
        // Catch Fal specific errors
        console.error("Fal API Error:", falError);
        
        let errorMessage = falError.message || "Failed to generate images";
        let statusCode = 500;
        
        // Check for specific error types
        if (falError.status === 403 || errorMessage.toLowerCase().includes('forbidden')) {
            errorMessage = "Service de génération temporairement indisponible. Réessayez dans quelques instants.";
            statusCode = 503;
        } else if (falError.status === 429 || errorMessage.toLowerCase().includes('rate limit')) {
            errorMessage = "Trop de requêtes. Attendez quelques secondes avant de réessayer.";
            statusCode = 429;
        } else if (falError.body) {
            try {
                const body = typeof falError.body === 'string' ? JSON.parse(falError.body) : falError.body;
                errorMessage = body.message || errorMessage;
                if (body.detail && Array.isArray(body.detail)) {
                    errorMessage += ` Details: ${JSON.stringify(body.detail)}`;
                }
            } catch (e) {
                errorMessage = typeof falError.body === 'object' ? JSON.stringify(falError.body) : String(falError.body);
            }
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
          },
          { status: statusCode } 
        );
    }
  } catch (error: any) {
    console.error("Error generating images:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate images",
      },
      { status: 500 }
    );
  }
}
