// IMPORTANT: This file is for SERVER-SIDE use only.
// It loads sensitive environment variables and should not be imported into client-side code.

import * as dotenv from 'dotenv';

// Load server-specific environment variables from .env.server.local
// This is necessary because Next.js only automatically loads .env.local for server components,
// but our API routes and Genkit flows run in a separate Node.js context.
dotenv.config({ path: '.env.server.local' });


// Cloudinary credentials (both libraries)
export const cloudinaryConfig = {
    library1: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1,
        apiKey: process.env.CLOUDINARY_API_KEY_1,
        apiSecret: process.env.CLOUDINARY_API_SECRET_1,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1,
    },
    library2: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2,
        apiKey: process.env.CLOUDINARY_API_KEY_2,
        apiSecret: process.env.CLOUDINARY_API_SECRET_2,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2,
    }
};

// Resend API Key for sending emails
export const resendApiKey = process.env.RESEND_API_KEY;

// Google Generative AI (Gemini) API Key
export const geminiApiKey = process.env.GEMINI_API_KEY;
