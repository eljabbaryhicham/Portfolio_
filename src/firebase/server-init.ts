
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * This function is now environment-aware and will not throw an error if credentials are not found,
 * allowing the application to run but disabling features that require the Admin SDK.
 *
 * @returns {Promise<admin.app.App | null>} A promise that resolves to the initialized Firebase Admin App instance, or null if initialization fails.
 */
export async function initializeServerApp(): Promise<admin.app.App | null> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Vercel environment variable check
  if (process.env.VERCEL_ENV && process.env.FIREBASE_PRIVATE_KEY) {
    console.log("Initializing Firebase Admin SDK using Vercel environment variables...");
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      } as admin.ServiceAccount;

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("Firebase Admin SDK initialized successfully from environment variables.");
      return app;
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK from environment variables:", error);
      return null;
    }
  }

  // Local development fallback using service-account.json
  console.log("Attempting to initialize Firebase Admin SDK using local service-account.json...");
  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  
  try {
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    
    if (!serviceAccountString || serviceAccountString.trim().length === 0 || serviceAccountString.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
        console.warn('Local development: "docs/service-account.json" is missing or is a placeholder. Server-side admin features will be disabled. See README.md for setup instructions.');
        return null;
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully from local file.");
    return app;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.warn('Local development: "docs/service-account.json" not found. Server-side admin features will be disabled. See README.md for setup instructions.');
    } else {
      console.error("Failed to initialize Firebase Admin SDK from file.", error);
    }
    return null;
  }
}
