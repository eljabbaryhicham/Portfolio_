
'use client';
    
import { useFirebase } from '../provider';
import type { UserHookResult } from '../provider';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// This combines the Auth user with their Firestore profile
export interface AppUser {
    uid: string;
    email: string | null;
    username?: string;
    role?: 'admin' | 'superadmin';
    permissions?: {
      canUploadMedia?: boolean;
      canDeleteMedia?: boolean;
      canEditProjects?: boolean;
      canEditAbout?: boolean;
      canEditContact?: boolean;
      canEditHome?: boolean;
    }
}

/**
 * Hook specifically for accessing the authenticated user's state,
 * including their profile data from Firestore.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): { user: AppUser | null, isUserLoading: boolean, userError: Error | null } => {
  const { user: authUser, isUserLoading: isAuthLoading, userError: authError, firestore } = useFirebase();
  
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  
  const { data: userDoc, isLoading: isDocLoading, error: docError } = useDoc(userDocRef);

  useEffect(() => {
    setIsUserLoading(isAuthLoading || isDocLoading);
    setUserError(authError || docError);

    if (isAuthLoading || isDocLoading) {
      return;
    }

    if (!authUser) {
      setAppUser(null);
      return;
    }

    if (userDoc) {
      // If a document exists in Firestore, combine it with the auth data.
      setAppUser({
        uid: authUser.uid,
        email: authUser.email,
        username: userDoc.username,
        role: userDoc.role,
        permissions: userDoc.permissions,
        ...userDoc
      });
    } else {
        // If no document exists, fall back to just auth data.
        // This can happen for newly created users before their doc is written.
        setAppUser({
            uid: authUser.uid,
            email: authUser.email,
        });
    }

  }, [authUser, isAuthLoading, authError, userDoc, isDocLoading, docError]);


  return { user: appUser, isUserLoading, userError };
};
