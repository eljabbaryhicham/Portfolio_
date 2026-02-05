
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

    const isPrimary = libraryId === 'primary';
    
    // Explicit access is safer and clearer for Next.js server-side environment variables
    const apiSecret = isPrimary ? process.env.CLOUDINARY_API_SECRET_1 : process.env.CLOUDINARY_API_SECRET_2;
    const apiKey = isPrimary ? process.env.CLOUDINARY_API_KEY_1 : process.env.CLOUDINARY_API_KEY_2;

    if (!apiSecret || !apiKey) {
      console.error(`Missing Cloudinary credentials for ${libraryId} library.`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Cloudinary API secret or key for library '${libraryId}' is not configured in environment variables. Please check your Vercel settings.` 
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
