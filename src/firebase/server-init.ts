
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * It is idempotent and will only initialize the app once.
 *
 * This function now reads credentials directly from a service account JSON file
 * located at `docs/service-account.json`. This file must be created manually for local development.
 *
 * @returns {Promise<admin.app.App>} A promise that resolves to the initialized Firebase Admin App instance.
 */
export async function initializeServerApp(): Promise<admin.app.App> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Construct the absolute path to the service account file.
  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  
  try {
    // Read the file contents.
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    
    // Check if the file is empty or still contains the placeholder key.
    if (!serviceAccountString || serviceAccountString.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
        throw new Error('The service account file at "docs/service-account.json" is a placeholder or empty. Please see the instructions in README.md to add your Firebase service account key.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully from service account file.");
    return app;

  } catch (error: any) {
    // If the file doesn't exist (code 'ENOENT'), provide a helpful message.
    if (error.code === 'ENOENT') {
        console.error('Firebase Admin initialization failed: The file "docs/service-account.json" was not found.');
        throw new Error('The "docs/service-account.json" file is missing. Please create this file and add your Firebase service account credentials to it for server-side functionality. See README.md for more details.');
    }
    
    console.error("Failed to initialize Firebase Admin SDK.", error);
    // Provide a more specific error if parsing fails.
    if (error instanceof SyntaxError) {
        throw new Error('Failed to parse "docs/service-account.json". Please ensure it contains valid JSON.');
    }
    // Re-throw other errors
    throw error;
  }
}
