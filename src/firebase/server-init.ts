
'use server';
import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * This function uses environment variables for credentials and is designed to work
 * for both local development and production deployments (e.g., Vercel).
 *
 * @returns {Promise<admin.app.App | null>} A promise that resolves to the initialized Firebase Admin App instance, or null if credentials are not configured.
 */
export async function initializeServerApp(): Promise<admin.app.App | null> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Directly access and log each environment variable for debugging on Vercel.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel's build process automatically handles multiline variables.
  // The .replace() logic is still a good failsafe for different environments.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log("Attempting to initialize Firebase Admin SDK...");
  console.log("Vercel ENV:", process.env.VERCEL_ENV || 'Not set');
  console.log("FIREBASE_PROJECT_ID:", projectId ? `Present (Value: ${projectId})` : "MISSING or undefined");
  console.log("FIREBASE_CLIENT_EMAIL:", clientEmail ? "Present" : "MISSING or undefined");
  console.log("FIREBASE_PRIVATE_KEY:", privateKey ? "Present" : "MISSING or undefined");

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
      console.error("Firebase Admin SDK Initialization Error:", error);
      // Log the specific error to help diagnose certificate or parsing issues.
      return null;
    }
  }

  // This message will now be much more informative.
  const errorMessage = "Firebase Admin SDK not initialized: One or more required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing, empty, or not accessible in this server environment.";
  console.error(errorMessage);
  return null;
}
