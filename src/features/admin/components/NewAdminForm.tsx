
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
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
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
    
    // Store current user's credentials
    const currentSuperAdmin = auth.currentUser;
    if (!currentSuperAdmin || !currentSuperAdmin.email) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not identify the current superadmin.",
        });
        setIsSubmitting(false);
        return;
    }
    // This is a bit of a hack to re-sign in. We need a password.
    // A better long-term solution is using a server-side function to create users.
    // For now, we'll prompt the superadmin for their password.
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


    const email = `${values.username.toLowerCase()}@example.com`;
    try {
      // Create the new user. This will sign them in and sign the current user out.
      const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
      
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDocumentNonBlocking(userDocRef, {
        uid: userCredential.user.uid,
        username: values.username,
        email: userCredential.user.email,
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
      
      // Re-authenticate the superadmin to restore their session
      await signInWithEmailAndPassword(auth, currentSuperAdmin.email, superAdminPassword);

      toast({
        title: 'Account Created',
        description: `Admin user '${values.username}' has been successfully created.`,
      });
      onSuccess();
    } catch (error: any) {
        // If there was an error, try to sign the super admin back in just in case they were logged out
        if (auth.currentUser?.email !== currentSuperAdmin.email) {
            try {
                await signInWithEmailAndPassword(auth, currentSuperAdmin.email, superAdminPassword);
            } catch (reauthError) {
                console.error("Failed to re-authenticate super admin after error:", reauthError);
                toast({
                    variant: "destructive",
                    title: "Session Expired",
                    description: "Your session expired during the operation. Please sign in again.",
                });
            }
        }
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.code === 'auth/email-already-in-use' ? 'This username is already taken.' : error.message,
      });
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
