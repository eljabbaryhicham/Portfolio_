
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paramsToSign, libraryId } = body;

    if (!libraryId) {
      return NextResponse.json(
        { success: false, message: 'libraryId is required.' },
        { status: 400 }
      );
    }

    const suffix = libraryId === 'primary' ? '_1' : '_2';
    const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];
    const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];

    if (!apiSecret || !apiKey) {
      console.error(`Missing Cloudinary credentials for ${libraryId} library. suffix: ${suffix}`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Cloudinary API secret or key for library '${libraryId}' is not configured in environment variables.` 
        },
        { status: 500 }
      );
    }

    // api_sign_request is a local utility that doesn't need global config
    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
    
    return NextResponse.json({ 
      success: true, 
      signature, 
      apiKey 
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { success: false, message: `Failed to generate signature: ${error.message}` },
      { status: 500 }
    );
  }
}
