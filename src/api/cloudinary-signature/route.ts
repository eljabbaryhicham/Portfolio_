
'use server';

// This file is deprecated. Please use src/app/api/cloudinary-signature/route.ts instead.
// I'm leaving it here as an empty shell to prevent build errors if it's imported elsewhere, 
// but it should be removed completely once all references are updated.

export async function POST() {
  return new Response("This API route has moved to /app/api/cloudinary-signature/route.ts", { status: 410 });
}
