
'use server';
/**
 * @fileOverview A Genkit flow for uploading media from a URL to a specified Cloudinary library.
 * This flow only handles the upload and returns the metadata; it does not write to Firestore.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.server.local' });

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const UploadMediaFromUrlInputSchema = z.object({
  mediaUrl: z.string().url(),
  libraryId: z.enum(['primary', 'extented']),
  videoFormat: z.enum(['mp4', 'm3u8']).optional(),
});
export type UploadMediaFromUrlInput = z.infer<typeof UploadMediaFromUrlInputSchema>;

const UploadMediaFromUrlOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  // Add all necessary metadata fields for Firestore
  public_id: z.string().optional(),
  url: z.string().optional(),
  resource_type: z.enum(['image', 'video', 'raw']).optional(),
  created_at: z.string().optional(),
  filename: z.string().optional(),
  libraryId: z.enum(['primary', 'extented']).optional(),
  videoFormat: z.enum(['mp4', 'm3u8']).optional(),
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
 * but does NOT create a Firestore document. It returns the metadata instead.
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
      
      const isPrimary = libraryId === 'primary';
      const cloudName = isPrimary ? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1 : process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2;
      const apiKey = isPrimary ? process.env.CLOUDINARY_API_KEY_1 : process.env.CLOUDINARY_API_KEY_2;
      const apiSecret = isPrimary ? process.env.CLOUDINARY_API_SECRET_1 : process.env.CLOUDINARY_API_SECRET_2;

      if (!cloudName || !apiKey || !apiSecret) {
        const errorMessage = `Cloudinary credentials for ${libraryId} library are missing. Please check your environment variables.`;
        console.error('Error in uploadMediaFromUrlFlow:', errorMessage);
        return {
          success: false,
          message: errorMessage,
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

      const filename = input.mediaUrl.substring(input.mediaUrl.lastIndexOf('/') + 1);

      // Return all necessary metadata to the client
      return {
        success: true,
        message: 'Media successfully uploaded to Cloudinary.',
        public_id: uploadResult.public_id,
        url: finalUrl,
        resource_type: uploadResult.resource_type as 'image' | 'video' | 'raw',
        created_at: uploadResult.created_at,
        filename: filename || uploadResult.public_id,
        libraryId: libraryId,
        videoFormat: uploadResult.resource_type === 'video' ? (videoFormat || 'mp4') : undefined,
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
      };
    }
  }
);
