
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, type NextRequest } from 'next/server';
import { cloudinaryConfig } from '@/lib/server-config';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paramsToSign, libraryId } = body;

  const isPrimary = libraryId === 'primary';
  const config = isPrimary ? cloudinaryConfig.library1 : cloudinaryConfig.library2;

  if (!config.apiSecret || !config.apiKey) {
    return NextResponse.json(
      { success: false, message: `Cloudinary API secret or key for library '${libraryId}' is not configured.` },
      { status: 500 }
    );
  }

  try {
    const signature = cloudinary.utils.api_sign_request(paramsToSign, config.apiSecret);
    return NextResponse.json({ success: true, signature, apiKey: config.apiKey });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { success: false, message: `Failed to generate signature: ${error.message}` },
      { status: 500 }
    );
  }
}
