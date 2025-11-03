
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
import { useAuth, useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { doc } from 'firebase/firestore';

interface HomePageSettings {
    registrationSecretCode?: string;
}

const createFormSchema = (secretCode?: string) => z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  secretCode: z.string().superRefine((val, ctx) => {
    if (val !== (secretCode || 'BELOFTED')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid secret code.',
      });
    }
  }),
});


export default function RegisterPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);
  
  const formSchema = createFormSchema(homeSettings?.registrationSecretCode);
  type RegisterFormValues = z.infer<typeof formSchema>;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      secretCode: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin');
    }
  }, [isUserLoading, user, router]);

  const handleSignUp = async (values: RegisterFormValues) => {
    if (!auth || !firestore) return;
    setIsSubmitting(true);
    
    const email = `${values.username.toLowerCase()}@example.com`;
    try {
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

      toast({
        title: 'Account Created',
        description: 'You have successfully signed up.',
      });
      router.push('/admin');
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

  if (isUserLoading || user) {
    return null;
  }

  return (
    <div className="flex h-full min-h-full w-full items-center justify-center p-4">
      <Card className="w-full md:w-1/2 glass-effect">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Create Admin Account</CardTitle>
            <CardDescription>
                Enter your details and the secret code to register.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-6 pt-4">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                        <Input placeholder="newadmin" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="secretCode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Secret Code</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="Secret Code" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register'}
                </Button>
                </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="underline text-muted-foreground hover:text-foreground">
                Already have an account? Sign In
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    