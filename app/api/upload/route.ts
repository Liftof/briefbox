import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed content types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  // Auth check - prevent unauthenticated uploads
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for Blob token first
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is not set!');
    return NextResponse.json({
      error: 'Storage not configured. Please set BLOB_READ_WRITE_TOKEN in Vercel.'
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { imageData, filename } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    // Handle base64 data URL
    let buffer: Buffer;
    let contentType = 'image/png';

    if (imageData.startsWith('data:')) {
      // Extract content type and base64 data
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
      }
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // Assume raw base64
      buffer = Buffer.from(imageData, 'base64');
    }

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = contentType.split('/')[1] || 'png';
    const finalFilename = filename || `generation-${timestamp}-${randomId}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(finalFilename, buffer, {
      access: 'public',
      contentType,
    });

    console.log(`✅ Uploaded to Vercel Blob: ${blob.url}`);

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      size: buffer.length 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
}

