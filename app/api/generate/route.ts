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
    const { prompt, negativePrompt = "", imageUrls = [], numImages = 1, aspectRatio = "1:1", resolution = "1K", useAsync = false } = body;

    // Basic Validation
    if (!prompt || typeof prompt !== 'string') {
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

    // Prepare Input for Nano Banana Pro
    // Note: If this model is not available, consider using 'fal-ai/flux-pro/v1.1' or similar.
    const input: Record<string, any> = {
      prompt: prompt,
      num_images: numImages,
      aspect_ratio: aspectRatio === "1:1" ? "1:1" : "4:5", 
      output_format: "png",
      image_urls: processedImageUrls,
      resolution: resolution 
    };

    // Add negative prompt if provided (model-dependent support)
    if (negativePrompt && negativePrompt.trim()) {
      input.negative_prompt = negativePrompt.trim();
    }

    console.log('🍌 Generating with Nano Banana Pro:');
    console.log('   📝 Prompt:', prompt.substring(0, 100) + '...');
    console.log('   🚫 Negative:', negativePrompt?.substring(0, 50) || 'none');
    console.log('   🖼️ Images:', input.image_urls.length);

    try {
        let result: any;
        
        // Use queue-based async approach to avoid Vercel timeouts
        // This submits to queue and polls for result, avoiding long HTTP connections
        if (useAsync) {
            console.log('🔄 Using async queue mode...');
            
            // Submit to queue
            const { request_id } = await fal.queue.submit("fal-ai/nano-banana-pro/edit", {
              input,
            });
            
            console.log('📤 Queued request:', request_id);
            
            // Poll for result with 2-minute timeout
            result = await pollForResult(request_id, 120000);
        } else {
            // Standard subscribe with built-in timeout handling
            // This uses Fal's internal queue but maintains the HTTP connection
            // Works well for faster generations, falls back gracefully
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout (under Vercel's 60s limit)
            
            try {
                result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
                  input,
                  logs: true,
                  onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                      update.logs.map((log) => log.message).forEach(console.log);
                    }
                  },
                });
            } catch (subscribeError: any) {
                clearTimeout(timeoutId);
                
                // If it timed out or connection dropped, try queue mode as fallback
                if (subscribeError.name === 'AbortError' || subscribeError.message?.includes('timeout') || subscribeError.message?.includes('connection')) {
                    console.log('⚠️ Subscribe timed out, retrying with queue mode...');
                    
                    const { request_id } = await fal.queue.submit("fal-ai/nano-banana-pro/edit", {
                      input,
                    });
                    
                    result = await pollForResult(request_id, 120000);
                } else {
                    throw subscribeError;
                }
            }
            
            clearTimeout(timeoutId);
        }

        console.log('🍌 Fal Result:', JSON.stringify(result, null, 2));

        // Normalize images output
        // Fal API might return 'images' (array) or 'image' (object) depending on the model version or inputs
        let finalImages = [];
        if (result.data?.images && Array.isArray(result.data.images)) {
            finalImages = result.data.images;
        } else if (result.images && Array.isArray(result.images)) {
            finalImages = result.images;
        } else if (result.image) {
            finalImages = [result.image];
        } else if (result.data?.image) {
            finalImages = [result.data.image];
        }

        return NextResponse.json({
          success: true,
          images: finalImages,
          description: result.description || result.data?.description,
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
