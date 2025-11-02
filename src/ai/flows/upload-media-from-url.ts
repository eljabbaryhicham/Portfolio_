
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to a specified Cloudinary library and saving to Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';

const UploadMediaFromUrlInputSchema = z.object({
  mediaUrl: z.string().url(),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8']).optional(),
});
export type UploadMediaFromUrlInput = z.infer<typeof UploadMediaFromUrlInputSchema>;

const UploadMediaFromUrlOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  mediaId: z.string().optional(),
  resource_type: z.enum(['image', 'video', 'raw']).optional(),
});
export type UploadMediaFromUrlOutput = z.infer<typeof UploadMediaFromUrlOutputSchema>;

/**
 * A server-side function to handle the upload process.
 * This is a wrapper around the Genkit flow.
 * @param input The media URL and library ID.
 * @returns A promise that resolves with the result of the upload.
 */
export async function uploadMediaFromUrl(
  input: UploadMediaFromUrlInput
): Promise<UploadMediaFromUrlOutput> {
    // If all checks pass, proceed with the flow
    return await uploadMediaFromUrlFlow(input);
}


/**
 * A Genkit flow that uploads a file from a URL to a specific Cloudinary library,
 * then creates a corresponding document in Firestore.
 */
const uploadMediaFromUrlFlow = ai.defineFlow(
  {
    name: 'uploadMediaFromUrlFlow',
    inputSchema: UploadMediaFromUrlInputSchema,
    outputSchema: UploadMediaFromUrlOutputSchema,
  },
  async (input): Promise<UploadMediaFromUrlOutput> => {
    try {
      const { libraryId, videoFormat } = input;
      const suffix = libraryId === 'primary' ? '_1' : '_2';
      
      const cloudName = libraryId === 'primary' 
        ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1 
        : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
      const apiKey = process.env[`CLOUDINARY_API_KEY${suffix}`];
      const apiSecret = process.env[`CLOUDINARY_API_SECRET${suffix}`];

      if (!cloudName || !apiKey || !apiSecret) {
        const errorMessage = `Cloudinary credentials for ${libraryId} library are missing. Please check your .env file for NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME${suffix}, CLOUDINARY_API_KEY${suffix}, and CLOUDINARY_API_SECRET${suffix}.`;
        console.error('Error in uploadMediaFromUrlFlow:', errorMessage);
        return {
          success: false,
          message: errorMessage,
          mediaId: undefined,
          resource_type: undefined,
        };
      }

      const cloudinary = (await import('cloudinary')).v2;
      cloudinary.config({
        cloud_name: cloudName, 
        api_key: apiKey, 
        api_secret: apiSecret,
        secure: true
      });
      
      console.log(`Uploading to ${libraryId} library from URL: ${input.mediaUrl}`);

      // 1. Upload to Cloudinary.
      const uploadResult = await cloudinary.uploader.upload(input.mediaUrl, {
        resource_type: 'auto', // Let Cloudinary detect the resource type
      });

      console.log('Cloudinary upload successful:', uploadResult);

      let finalUrl = uploadResult.secure_url;
      
      if (uploadResult.resource_type === 'video' && videoFormat === 'm3u8') {
          finalUrl = `https://res.cloudinary.com/${cloudName}/video/upload/sp_auto/v${uploadResult.version}/${uploadResult.public_id}.m3u8`;
          console.log(`Generated adaptive streaming (HLS) URL: ${finalUrl}`);
      } else if (uploadResult.resource_type === 'image' || uploadResult.resource_type === 'video') {
          finalUrl = cloudinary.url(uploadResult.public_id, {
              fetch_format: 'auto',
              quality: 'auto',
              secure: true,
              resource_type: uploadResult.resource_type,
          });
          console.log(`Generated optimized ${uploadResult.resource_type} URL: ${finalUrl}`);
      }

      // 2. Initialize Firebase Admin SDK and save metadata to Firestore
      const serverApp = await initializeServerApp();
      const firestore = getAdminFirestore(serverApp);
      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      const mediaData = {
        public_id: uploadResult.public_id,
        url: finalUrl,
        resource_type: uploadResult.resource_type,
        created_at: uploadResult.created_at,
        filename: filename || uploadResult.public_id,
        libraryId: libraryId, // Save the library ID
        ...(uploadResult.resource_type === 'video' && { videoFormat: videoFormat || 'mp4' }),
      };

      const docRef = await firestore.collection('media').add(mediaData);

      console.log('Firestore document written with ID:', docRef.id);

      return {
        success: true,
        message: 'Media successfully added.',
        mediaId: docRef.id,
        resource_type: uploadResult.resource_type as 'image' | 'video' | 'raw',
      };
    } catch (error: any) {
      console.error('Error in uploadMediaFromUrlFlow:', error);

      let errorMessage = 'An unexpected error occurred.';
      if (error.http_code === 400 && error.message && error.message.includes('File size too large')) {
          errorMessage = 'The provided file is too large. Cloudinary\'s free plan limit is 100MB. Please use a smaller file.';
      } else if (error.http_code && error.message) {
        errorMessage = `Cloudinary error: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
        mediaId: undefined,
        resource_type: undefined,
      };
    }
  }
);
