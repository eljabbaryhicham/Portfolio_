
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
    
    const email = `${values.username.toLowerCase()}@example.com`;
    try {
      // We create the user but don't sign them in on this client
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

      // Sign out the newly created user from the current session
      // This is important because createUserWithEmailAndPassword automatically signs the user in
      await auth.signOut();

      toast({
        title: 'Account Created',
        description: `Admin user '${values.username}' has been successfully created.`,
      });
      onSuccess();
    } catch (error: any) {
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
