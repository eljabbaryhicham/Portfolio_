
'use server';

import { initializeServerApp } from "@/firebase/server-init";
import admin from 'firebase-admin';

// Input validation schema
interface CreateAdminUserInput {
    username: string;
    password: string;
}

interface CreateAdminUserResult {
    success: boolean;
    userId?: string;
    error?: string;
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<CreateAdminUserResult> {
  try {
    // 1. Initialize the Firebase Admin App
    const adminApp = await initializeServerApp();
    if (!adminApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. Creating new admins requires the "docs/service-account.json" file for local development. See README.md.' };
    }
    const auth = admin.auth(adminApp);
    const firestore = admin.firestore(adminApp);
    
    // 2. Validate input
    if (!input.username || input.username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(input.username)) {
      return { success: false, error: 'Username can only contain letters and numbers.' };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const email = `${input.username.toLowerCase()}@example.com`;

    // 3. Create the user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: input.password,
      displayName: input.username,
    });

    // 4. Create the corresponding user document in Firestore
    const userDocRef = firestore.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      username: input.username,
      email: email,
      role: 'admin', // Default role for new admins
      createdAt: new Date().toISOString(),
      permissions: {
        canUploadMedia: false,
        canDeleteMedia: false,
        canEditProjects: false,
        canEditAbout: false,
        canEditContact: false,
        canEditHome: false,
      }
    });

    console.log(`Successfully created new admin user: ${userRecord.uid}`);
    return { success: true, userId: userRecord.uid };

  } catch (error: any) {
    console.error('Error creating admin user:', error);

    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This username is already taken. Please choose another one.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = 'The password must be at least 6 characters long.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}
