import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

fal.config({
  credentials: process.env.FAL_KEY,
});

// Helper: Poll for queue completion with timeout
async function pollForResult(requestId: string, maxWaitMs: number = 120000): Promise<any> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds between polls
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const status = await fal.queue.status("fal-ai/nano-banana-pro/edit", {
        requestId,
        logs: true,
      });
      
      console.log(`📊 Queue status: ${status.status}`);
      
      // Check if completed - the status type is IN_PROGRESS | IN_QUEUE
      // When completed, we can get the result directly
      if (status.status !== "IN_PROGRESS" && status.status !== "IN_QUEUE") {
        // Any other status means we should try to get the result
        const result = await fal.queue.result("fal-ai/nano-banana-pro/edit", {
          requestId,
        });
        return result;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (pollError: any) {
      // If result fetch succeeds, return it
      if (pollError.data) {
        return pollError.data;
      }
      // If it's a "not found" error, the request might still be processing
      if (pollError.status === 404) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue;
      }
      // Check if it's a failed generation error
      if (pollError.message?.includes('failed') || pollError.status === 500) {
        throw new Error("Generation failed in queue: " + (pollError.message || 'Unknown error'));
      }
      throw pollError;
    }
  }
  
  throw new Error("Generation timed out after " + (maxWaitMs / 1000) + " seconds");
}

export async function POST(request: NextRequest) {
  const FAL_KEY = process.env.FAL_KEY;
  
  if (!FAL_KEY) {
    console.error("❌ Error: FAL_KEY is missing in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Key (FAL_KEY)' }, { status: 500 });
  }
  
  // Validate FAL_KEY format (should be a UUID-like string)
  if (FAL_KEY.length < 20) {
    console.error("❌ Error: FAL_KEY appears to be invalid (too short).");
    return NextResponse.json({ success: false, error: 'Server configuration error: Invalid API Key format' }, { status: 500 });
  }
  
  console.log(`🔑 FAL_KEY configured (ends with: ...${FAL_KEY.slice(-6)})`);

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

        const isSvg = trimmedUrl.toLowerCase().endsWith('.svg');
        
        if (isSvg) {
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

    for (const url of imageUrls) {
        if (!url || typeof url !== 'string') continue;
        
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('data:image')) continue;

        // Skip placeholder images or known bad assets
        if (trimmedUrl.includes('placehold.co') || trimmedUrl.includes('placeholder')) continue;

        // Check for SVG or potentially problematic extensions in URL (simple check)
        // Note: Some URLs might not have extension, so we ideally fetch and check content-type, 
        // but for performance we'll do a mix.
        const isSvg = trimmedUrl.toLowerCase().endsWith('.svg');
        
        // If it's SVG or we want to be safe, we convert. 
        // For now, let's convert SVGs specifically as requested.
        if (isSvg) {
            try {
                console.log(`🔄 Converting SVG to PNG: ${trimmedUrl}`);
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
                processedImageUrls.push(`data:image/png;base64,${base64}`);
            } catch (e) {
                console.error(`Error converting image ${trimmedUrl}:`, e);
                // If conversion fails, maybe skip it or try original? 
                // If it's SVG and failed, original won't work either on Fal. Skip.
            }
        } else {
            // Pass through other images (assuming they are JPG/PNG/WEBP)
            // We could also check HEAD request for content-type if needed later.
            processedImageUrls.push(trimmedUrl);
        }
    }

    // Combine reference images FIRST (they define style), then content images
    // Reference images are prioritized to ensure the model picks up the style
    const allImageUrls = [...processedReferenceUrls, ...processedImageUrls];
    
    // For Flux Pro, we don't strictly need images, but we process them in case we switch back
    // or if we implement a specific img2img endpoint later.
    
    // Replace processedImageUrls with combined list for generation
    const finalImageUrls: string[] = [];
    let totalDataUriSize = 0;
    const MAX_DATA_URI_SIZE = 5 * 1024 * 1024; // 5MB total for data URIs
    
    for (const url of allImageUrls.slice(0, 5)) {
      if (url.startsWith('data:')) {
        const size = url.length * 0.75; // Approximate decoded size
        if (totalDataUriSize + size > MAX_DATA_URI_SIZE) {
          console.warn(`⚠️ Skipping data URI - total size would exceed limit`);
          continue;
        }
        totalDataUriSize += size;
      }
      finalImageUrls.push(url);
    }
    
    // For Flux Pro 1.1, images are not required (Text-to-Image)
    // We only log if we have them
    if (finalImageUrls.length > 0) {
      console.log(`📸 Images provided: ${finalImageUrls.length} (Note: Flux Pro 1.1 ignores image_urls input, using for prompt context only if handled)`);
    }

    // Build image context prefix for the prompt
    // This helps the model understand what each image is for
    let imageContextPrefix = '';
    // ... (keep existing prompt context building logic if valuable for future or other models) ...
    if (processedReferenceUrls.length > 0 || processedImageUrls.length > 0) {
      const imageDescriptions: string[] = [];
      
      if (processedReferenceUrls.length > 0) {
        imageDescriptions.push(`[STYLE INSPIRATION] Images 1-${processedReferenceUrls.length} are STYLE REFERENCES for artistic direction. Use them for:
- Layout composition and visual hierarchy
- Overall mood and artistic intention
- Element placement and spacing
- Visual storytelling approach

⚠️ DO NOT copy from these references:
- Colors (use the BRAND colors from the prompt instead)
- Typography (use the BRAND fonts from the prompt instead)  
- Logo or brand elements (use the USER'S brand assets)

The references show HOW to compose, not WHAT colors/fonts to use.`);
      }
      
      if (processedImageUrls.length > 0) {
        const startIdx = processedReferenceUrls.length + 1;
        // processedImageUrls contains the final content images. 
        // We need to map them back to their roles if available.
        
        processedImageUrls.forEach((url, i) => {
            const idx = startIdx + i;
            // Check if we have specific context for this image (fuzzy match if needed)
            let role = "CONTENT ELEMENT";
            
            // Try exact match first
            if (imageContextMap[url]) {
                role = imageContextMap[url];
            } else {
                // Try finding key that is part of the url or vice versa (for data uris vs original)
                const matchingKey = Object.keys(imageContextMap).find(k => url.includes(k) || k.includes(url));
                if (matchingKey) {
                    role = imageContextMap[matchingKey];
                }
            }
            
            // If role mentions "LOGO", make it ALL CAPS and VERY EXPLICIT
            if (role.toLowerCase().includes('logo')) {
                imageDescriptions.push(`Image ${idx}: [CRITICAL] BRAND LOGO. ${role}. DO NOT MODIFY. DO NOT DISTORT.`);
            } else {
                imageDescriptions.push(`Image ${idx}: ${role}`);
            }
        });
      }
      
      imageContextPrefix = `[IMAGE CONTEXT]
${imageDescriptions.join('\n')}

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
      const enhancedPrompt = imageContextPrefix + prompt;
      prompts = [enhancedPrompt, enhancedPrompt, enhancedPrompt, enhancedPrompt].slice(0, numImages);
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
      
      // NANO BANANA PRO CONFIGURATION
      // As requested: Google SOTA / Flagship model
      // Supported ratios: auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16
      const validRatios = ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'];
      const finalAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';
      
      const input: Record<string, any> = {
        prompt: singlePrompt.trim(),
        num_images: 1, // One at a time for variations
        aspect_ratio: finalAspectRatio,
        output_format: "png",
        image_urls: finalImageUrls, // CRITICAL: We restore image inputs
        resolution: resolution 
      };

      if (negativePrompt && negativePrompt.trim()) {
        input.negative_prompt = negativePrompt.trim();
      }

      console.log(`   🍌 Nano Banana Pro | Variation ${index + 1}:`, singlePrompt.slice(0, 60) + '...');

      try {
        // Reverting to Nano Banana Pro as requested
        const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
          input,
          logs: true, 
        });
        
        console.log(`   ✅ Variation ${index + 1} completed`);
        return result;
      } catch (err: any) {
        // Log detailed error info
        console.error(`   ❌ Variation ${index + 1} error:`, {
          message: err.message,
          status: err.status,
          body: err.body,
          detail: err.body?.detail,
          fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        });
        // Create a proper error with message
        const errorMessage = err?.body?.detail || err?.message || JSON.stringify(err);
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }
    };

    try {
        // Generate all images in parallel with their respective prompts
        console.log(`🚀 Launching ${actualNumImages} parallel generations...`);
        console.log(`   📸 Images being sent to Fal:`, finalImageUrls.map(u => u.startsWith('data:') ? 'data:image...' : u.slice(0, 60)));
        
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

        return NextResponse.json({
          success: true,
          images: finalImages,
          generatedCount: finalImages.length,
          requestedCount: actualNumImages
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
