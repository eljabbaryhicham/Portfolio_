
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paramsToSign, libraryId } = body;

  const suffix = libraryId === 'primary' ? '_1' : '_2';
  const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];
  const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];

  if (!apiSecret || !apiKey) {
    return NextResponse.json(
      { success: false, message: `Cloudinary API secret or key for library '${libraryId}' is not configured.` },
      { status: 500 }
    );
  }

  try {
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
    return NextResponse.json({ success: true, signature, apiKey });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { success: false, message: `Failed to generate signature: ${error.message}` },
      { status: 500 }
    );
  }
}
