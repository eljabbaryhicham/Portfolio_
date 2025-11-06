
'use server';

import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * This function uses environment variables for credentials. It is designed to work
 * for both local development (via .env.local) and production deployments (e.g., Vercel).
 *
 * @returns {Promise<admin.app.App | null>} A promise that resolves to the initialized Firebase Admin App instance, or null if credentials are not configured.
 */
export async function initializeServerApp(): Promise<admin.app.App | null> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel escapes newlines in multiline environment variables. We need to un-escape them.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log("Attempting to initialize Firebase Admin SDK...");
  console.log("Project ID available:", !!projectId);
  console.log("Client Email available:", !!clientEmail);
  console.log("Private Key available:", !!privateKey);


  // Check if all required environment variables are present and not empty.
  if (projectId && clientEmail && privateKey) {
    try {
      const serviceAccount: admin.ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };

      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("Firebase Admin SDK initialized successfully.");
      return app;
    } catch (error: any) {
      console.error("Error initializing Firebase Admin SDK from environment variables:", error.message);
      return null;
    }
  }
  
  console.warn("Firebase Admin SDK not initialized: Required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing or empty.");
  return null;
}
