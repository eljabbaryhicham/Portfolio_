'use client';

import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

const GENERIC_ERROR_MESSAGE = 'Please check if a browser extension (like an ad blocker) is interfering, or if you have the necessary permissions.';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'write', // or 'create'/'update' based on options
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
    toast({
      variant: 'destructive',
      title: 'Save Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
  // Execution continues immediately
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data).catch(error => {
    const contextualError = new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
     toast({
      variant: 'destructive',
      title: 'Save Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
  return promise;
}

/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data).catch(error => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', contextualError);
     toast({
      variant: 'destructive',
      title: 'Update Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch(error => {
    const contextualError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', contextualError);
     toast({
      variant: 'destructive',
      title: 'Delete Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
}
