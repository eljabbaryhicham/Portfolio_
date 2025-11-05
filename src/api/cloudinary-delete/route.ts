
'use server';

import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '@/lib/server-config';

interface DeleteFromCloudinaryInput {
  public_id: string;
  resource_type: string;
  libraryId: 'primary' | 'extented';
}

interface DeleteFromCloudinaryOutput {
  success: boolean;
  message: string;
}

// This is a server action that can be called from client components.
export async function deleteFromCloudinary(
  input: DeleteFromCloudinaryInput
): Promise<DeleteFromCloudinaryOutput> {
    try {
        const { public_id, resource_type, libraryId } = input;
        
        const isPrimary = libraryId === 'primary';
        const config = isPrimary ? cloudinaryConfig.library1 : cloudinaryConfig.library2;

        if (!config.cloudName || !config.apiKey || !config.apiSecret) {
            const errorMessage = `Cloudinary credentials for ${libraryId} library are missing.`;
            console.error(errorMessage);
            return { success: false, message: errorMessage };
        }

        cloudinary.config({
            cloud_name: config.cloudName, 
            api_key: config.apiKey, 
            api_secret: config.apiSecret,
            secure: true
        });

        console.log(`Attempting to delete ${public_id} from Cloudinary...`);

        // Use the destroy method to delete the asset
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: resource_type
        });

        console.log('Cloudinary deletion result:', result);

        if (result.result === 'ok' || result.result === 'not found') {
             return { success: true, message: `Successfully deleted ${public_id}.` };
        } else {
            return { success: false, message: `Cloudinary deletion failed: ${result.result}` };
        }

    } catch (error: any) {
        console.error('Error in deleteFromCloudinary server action:', error);
        return {
            success: false,
            message: error.message || 'An unexpected error occurred while deleting from Cloudinary.',
        };
    }
}
