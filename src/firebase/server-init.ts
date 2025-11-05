
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * This function is environment-aware and handles credentials differently for production (Vercel)
 * and local development.
 *
 * @returns {Promise<admin.app.App | null>} A promise that resolves to the initialized Firebase Admin App instance, or null if initialization fails because credentials are not configured.
 */
export async function initializeServerApp(): Promise<admin.app.App | null> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // --- PRODUCTION: Vercel Environment ---
  // When deployed on Vercel, the app will use secure environment variables.
  // The `service-account.json` file is NOT used in production.
  if (process.env.VERCEL_ENV && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log("Attempting to initialize Firebase Admin SDK from Vercel environment variables...");
    try {
      // Vercel escapes newlines in multiline environment variables. We need to un-escape them.
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("Firebase Admin SDK initialized successfully from environment variables.");
      return app;
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK from environment variables:", error);
      // In production, if env vars are set but fail, it's a critical error.
      // However, we return null to allow the app to run with degraded functionality.
      return null;
    }
  }

  // --- LOCAL DEVELOPMENT: service-account.json file ---
  // For local development, the app looks for a `docs/service-account.json` file.
  // This file is listed in `.gitignore` and MUST NOT be committed to your repository.
  console.log("Vercel environment variables not found. Attempting to initialize Firebase Admin SDK using local 'docs/service-account.json'...");
  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  
  try {
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    
    // Check if the file is empty or still contains the placeholder text.
    if (!serviceAccountString || serviceAccountString.trim().length === 0) {
        console.warn('Local development: "docs/service-account.json" is empty. Server-side admin features will be disabled. See README.md for setup instructions.');
        return null;
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully from local file.");
    return app;

  } catch (error: any) {
    // If the file doesn't exist, it's not a critical error for local dev, just a limitation.
    if (error.code === 'ENOENT') {
        console.warn('Local development: "docs/service-account.json" not found. Server-side admin features will be disabled. See README.md for setup instructions.');
    } else {
      // If the file exists but is malformed or another error occurs.
      console.error("Failed to initialize Firebase Admin SDK from local file.", error);
    }
    return null;
  }
}
