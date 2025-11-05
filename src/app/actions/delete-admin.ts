
'use server';

import { initializeServerApp } from "@/firebase/server-init";
import admin from 'firebase-admin';

interface DeleteAdminUserResult {
    success: boolean;
    error?: string;
}

export async function deleteAdminUser(uid: string): Promise<DeleteAdminUserResult> {
  try {
    const adminApp = await initializeServerApp();
    if (!adminApp) {
        return { success: false, error: 'Firebase Admin SDK not initialized. "Fully Revoke Access" requires the "docs/service-account.json" file for local development. See README.md.' };
    }
    const auth = admin.auth(adminApp);
    const firestore = admin.firestore(adminApp);
    
    // 1. Delete the user from Firebase Authentication
    await auth.deleteUser(uid);
    
    // 2. Delete the user document from Firestore
    // Note: The document ID in the 'users' collection is the same as the Auth UID.
    const userDocRef = firestore.collection('users').doc(uid);
    await userDocRef.delete();

    console.log(`Successfully deleted user with UID: ${uid}`);
    return { success: true };

  } catch (error: any) {
    console.error('Error deleting admin user:', error);

    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found in Firebase Authentication. They may have already been deleted.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}
