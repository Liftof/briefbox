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
  if (!process.env.FAL_KEY) {
    console.error("❌ Error: FAL_KEY is missing in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Key (FAL_KEY)' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { 
      prompt, 
      promptVariations, // NEW: Array of 4 different prompts for diversity
      negativePrompt = "", 
      imageUrls = [], 
      numImages = 4, 
      aspectRatio = "1:1", 
      resolution = "1K", 
      useAsync = false 
    } = body;

    // Basic Validation - accept either prompt or promptVariations
    const hasPrompt = prompt && typeof prompt === 'string';
    const hasVariations = Array.isArray(promptVariations) && promptVariations.length > 0;
    
    if (!hasPrompt && !hasVariations) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    if (imageUrls.length === 0) {
        return NextResponse.json({ success: false, error: 'At least one reference image is required for Nano Banana Pro' }, { status: 400 });
    }

    // Filter & Convert URLs
    // 1. Filter valid HTTP/HTTPS or data URI
    // 2. Convert unsupported formats (SVG, etc.) to PNG Data URI using sharp
    // 3. Filter out small or low-quality images if possible (optional, simplified here)
    const processedImageUrls: string[] = [];

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

    if (processedImageUrls.length === 0) {
         return NextResponse.json({ success: false, error: 'No valid or convertible image URLs provided' }, { status: 400 });
    }

    // Determine prompts to use
    // If we have variations, we'll generate each image with a different prompt
    // IMPORTANT: Filter out any null/undefined/empty prompts
    let prompts: string[];
    
    if (hasVariations) {
      // Filter valid strings from variations
      prompts = promptVariations
        .filter((p: any) => p && typeof p === 'string' && p.trim().length > 0)
        .slice(0, 4);
      
      // If all variations were invalid, fall back to single prompt
      if (prompts.length === 0 && hasPrompt) {
        prompts = [prompt];
      }
    } else if (hasPrompt) {
      prompts = [prompt, prompt, prompt, prompt].slice(0, numImages);
    } else {
      return NextResponse.json({ success: false, error: 'No valid prompts provided' }, { status: 400 });
    }
    
    // Final safety check
    if (prompts.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid prompts after filtering' }, { status: 400 });
    }
    
    const actualNumImages = Math.min(prompts.length, 4);
    
    console.log('📝 Valid prompts:', prompts.length, prompts.map(p => p.slice(0, 30) + '...'));

    console.log('🍌 Generating with Nano Banana Pro:');
    console.log('   📝 Prompts:', actualNumImages, hasVariations ? '(with variations)' : '(same prompt)');
    console.log('   🚫 Negative:', negativePrompt?.substring(0, 50) || 'none');
    console.log('   🖼️ Reference images:', processedImageUrls.length);

    // Generate each image with its own prompt (for variations) or batch
    const generateSingleImage = async (singlePrompt: string, index: number) => {
      // Safety check - skip if prompt is invalid
      if (!singlePrompt || typeof singlePrompt !== 'string' || !singlePrompt.trim()) {
        console.warn(`⚠️ Skipping generation ${index + 1}: invalid prompt`);
        return null;
      }
      
      const input: Record<string, any> = {
        prompt: singlePrompt.trim(),
        num_images: 1, // One at a time for variations
        aspect_ratio: aspectRatio === "1:1" ? "1:1" : "4:5", 
        output_format: "png",
        image_urls: processedImageUrls,
        resolution: resolution 
      };

      if (negativePrompt && negativePrompt.trim()) {
        input.negative_prompt = negativePrompt.trim();
      }

      console.log(`   🎨 Variation ${index + 1}:`, singlePrompt.slice(-60) + '...');

      return fal.subscribe("fal-ai/nano-banana-pro/edit", {
        input,
        logs: false,
      });
    };

    try {
        // Generate all images in parallel with their respective prompts
        console.log(`🚀 Launching ${actualNumImages} parallel generations...`);
        
        const generationPromises = prompts.map((p, i) => 
          generateSingleImage(p, i).catch(err => {
            console.warn(`⚠️ Generation ${i + 1} failed:`, err.message);
            return null; // Return null for failed generations
          })
        );

        const results = await Promise.all(generationPromises);
        
        // Extract images from results
        const finalImages: any[] = [];
        
        for (const result of results) {
          if (!result) continue; // Skip failed generations
          
          // Cast to any to handle various response formats from Fal
          const r = result as any;
          
          // Extract image URL from various response formats
          if (r.data?.images && Array.isArray(r.data.images)) {
            finalImages.push(...r.data.images);
          } else if (r.images && Array.isArray(r.images)) {
            finalImages.push(...r.images);
          } else if (r.image) {
            finalImages.push(r.image);
          } else if (r.data?.image) {
            finalImages.push(r.data.image);
          }
        }

        console.log(`✅ Generated ${finalImages.length}/${actualNumImages} images successfully`);

        if (finalImages.length === 0) {
          throw new Error('Aucune image générée. Réessayez.');
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
