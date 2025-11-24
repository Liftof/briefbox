import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  if (!process.env.FAL_KEY) {
    console.error("❌ Error: FAL_KEY is missing in environment variables.");
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Key (FAL_KEY)' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { prompt, imageUrls = [], numImages = 1, aspectRatio = "1:1", resolution = "1K" } = body;

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
    const processedImageUrls: string[] = [];

    for (const url of imageUrls) {
        if (!url || typeof url !== 'string') continue;
        
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('data:image')) continue;

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
    const input = {
      prompt: prompt,
      num_images: numImages,
      aspect_ratio: aspectRatio === "1:1" ? "1:1" : "4:5", 
      output_format: "png",
      image_urls: processedImageUrls,
      resolution: resolution 
    };

    console.log('🍌 Generating with Nano Banana Pro:', JSON.stringify({ ...input, image_urls: `[${input.image_urls.length} images]` }, null, 2));

    try {
        // Ensure the model endpoint is correct. If "Nano Banana Pro" was a custom endpoint that is now offline,
        // this will fail.
        const result: any = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
          input,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });

        console.log('🍌 Fal Result:', JSON.stringify(result, null, 2));

        // Normalize images output
        // Fal API might return 'images' (array) or 'image' (object) depending on the model version or inputs
        let finalImages = [];
        if (result.images && Array.isArray(result.images)) {
            finalImages = result.images;
        } else if (result.image) {
            finalImages = [result.image];
        } else if (result.data && result.data.images) {
             finalImages = result.data.images;
        }

        return NextResponse.json({
          success: true,
          images: finalImages,
          description: result.description,
        });
    } catch (falError: any) {
        // Catch Fal specific errors
        console.error("Fal API Error:", falError);
        
        let errorMessage = falError.message || "Failed to generate images";
        if (falError.body) {
            try {
                const body = JSON.parse(falError.body);
                errorMessage = body.message || errorMessage;
                // If detail exists (pydantic validation error), show it
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
            error: `Fal Error: ${errorMessage}`,
          },
          { status: 500 } 
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
