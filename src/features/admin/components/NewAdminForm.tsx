'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth, useFirestore, setDocumentNonBlocking, initiateEmailSignIn } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';


const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers.'),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

type RegisterFormValues = z.infer<typeof formSchema>;

interface NewAdminFormProps {
    onSuccess: () => void;
}

export default function NewAdminForm({ onSuccess }: NewAdminFormProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleSignUp = async (values: RegisterFormValues) => {
    if (!auth || !firestore) return;
    setIsSubmitting(true);
    
    // 1. Get the current superadmin's credentials (assuming they are still logged in)
    const currentSuperAdmin = auth.currentUser;
    if (!currentSuperAdmin || !currentSuperAdmin.email) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not identify the current admin. Please sign in again.",
        });
        setIsSubmitting(false);
        return;
    }
    const superAdminEmail = currentSuperAdmin.email;
    const superAdminPassword = prompt("For security, please re-enter your password to create a new admin:");

    if (!superAdminPassword) {
        toast({
            variant: "destructive",
            title: "Action Cancelled",
            description: "Password not provided.",
        });
        setIsSubmitting(false);
        return;
    }

    const newAdminEmail = `${values.username.toLowerCase()}@example.com`;
    try {
      // 2. Create the new admin user. This will automatically sign them in.
      const newUserCredential = await createUserWithEmailAndPassword(auth, newAdminEmail, values.password);
      
      // 3. Create the user's document in Firestore
      const userDocRef = doc(firestore, 'users', newUserCredential.user.uid);
      await setDocumentNonBlocking(userDocRef, {
        uid: newUserCredential.user.uid,
        username: values.username,
        email: newUserCredential.user.email,
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
      }, {});

      toast({
        title: 'Account Created',
        description: `Admin user '${values.username}' has been successfully created.`,
      });
      
      // 4. IMPORTANT: Sign the superadmin back in to restore their session
      await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);

      onSuccess();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.code === 'auth/email-already-in-use' ? 'This username is already taken.' : error.message,
      });

      // Attempt to sign back in the superadmin even if creation fails
      try {
        await signInWithEmailAndPassword(auth, superAdminEmail, superAdminPassword);
      } catch (reauthError) {
        console.error("Failed to re-authenticate superadmin:", reauthError);
        toast({
            variant: 'destructive',
            title: 'Session Warning',
            description: 'Failed to restore your session. You may need to sign in again.',
        });
        // Optionally redirect to login if re-auth fails
        // router.push('/login');
      }

    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6 pt-4">
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                <Input placeholder="newadmin" {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Admin'}
            </Button>
        </div>
        </form>
    </Form>
  );
}
