
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * This function is now environment-aware.
 * - In a production/Vercel environment, it uses environment variables.
 * - In a local environment, it falls back to reading the service-account.json file.
 *
 * @returns {Promise<admin.app.App>} A promise that resolves to the initialized Firebase Admin App instance.
 */
export async function initializeServerApp(): Promise<admin.app.App> {
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
      throw new Error('Failed to initialize Firebase Admin SDK from environment variables. Please check your Vercel project settings.');
    }
  }

  // Local development fallback using service-account.json
  console.log("Initializing Firebase Admin SDK using local service-account.json...");
  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  
  try {
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    
    if (!serviceAccountString || serviceAccountString.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
        throw new Error('The service account file at "docs/service-account.json" is a placeholder or empty. Please see the instructions in README.md to add your Firebase service account key.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully from local file.");
    return app;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.error('Firebase Admin initialization failed: The file "docs/service-account.json" was not found.');
        throw new Error('For local development, the "docs/service-account.json" file is missing. Please create this file and add your Firebase service account credentials to it. See README.md for more details.');
    }
    
    console.error("Failed to initialize Firebase Admin SDK from file.", error);
    if (error instanceof SyntaxError) {
        throw new Error('Failed to parse "docs/service-account.json". Please ensure it contains valid JSON.');
    }
    throw error;
  }
}
