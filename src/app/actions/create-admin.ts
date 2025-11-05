'use server';

import { initializeServerApp } from "@/firebase/server-init";
import { z } from "zod";

// Define the schema for input validation
const createAdminUserSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9]+$/),
  password: z.string().min(6),
});

/**
 * A server action to create a new admin user in Firebase.
 * This uses the Firebase Admin SDK to create the user without affecting
 * the current user's session.
 * 
 * @param data - An object containing the new user's username and password.
 * @returns An object indicating success or failure.
 */
export async function createAdminUser(data: unknown) {
  try {
    // 1. Validate the input data
    const validation = createAdminUserSchema.safeParse(data);
    if (!validation.success) {
      throw new Error('Invalid input data.');
    }
    const { username, password } = validation.data;
    const email = `${username.toLowerCase()}@example.com`;

    // 2. Initialize the Firebase Admin SDK
    const adminApp = await initializeServerApp();
    const adminAuth = adminApp.auth();
    const adminFirestore = adminApp.firestore();

    // 3. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: username,
      emailVerified: true, // Mark as verified since we control creation
    });

    // 4. Create the corresponding user document in Firestore
    const userDocRef = adminFirestore.collection('users').doc(userRecord.uid);
    await userDocRef.set({
        uid: userRecord.uid,
        username: username,
        email: userRecord.email,
        role: 'admin',
        createdAt: new Date().toISOString(),
        permissions: {
            canUploadMedia: true,
            canDeleteMedia: false,
            canEditProjects: true,
            canEditAbout: false,
            canEditContact: false,
            canEditHome: false,
        }
    });

    return { success: true };

  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.';
    // Provide more specific error messages
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This username is already taken.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'Password must be at least 6 characters long.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    console.error('Error creating admin user:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
