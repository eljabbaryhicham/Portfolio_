
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
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';


const formSchema = z.object({
  login: z.string().min(1, { message: 'Please enter your username or email.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const handleSignIn = async (values: LoginFormValues) => {
    if (!auth) return;
    setIsSubmitting(true);

    let emailToSignIn: string;
    // Check if the login input is an email or a username
    if (values.login.includes('@')) {
      emailToSignIn = values.login; // Assume it's an email
    } else {
      emailToSignIn = `${values.login.toLowerCase()}@example.com`; // Assume it's a username
    }
    
    try {
      await signInWithEmailAndPassword(auth, emailToSignIn, values.password);
      toast({
        title: 'Signed In',
        description: 'You have successfully signed in.',
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not sign in. Please check your credentials.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-full w-full items-center justify-center p-4">
      <Card className="w-full md:w-1/2 glass-effect">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Admin Access</CardTitle>
            <CardDescription>
                Sign in to manage the portfolio.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-6 pt-4">
                <FormField
                    control={form.control}
                    name="login"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username or Email</FormLabel>
                        <FormControl>
                        <Input placeholder="admin or admin@example.com" {...field} />
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
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
                </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              <Link href="/register" className="underline text-muted-foreground hover:text-foreground">
                Create an account
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    