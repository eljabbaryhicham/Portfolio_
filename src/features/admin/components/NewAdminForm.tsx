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
import { createAdminUser } from '@/app/actions/create-admin';

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
    setIsSubmitting(true);
    
    try {
      const result = await createAdminUser(values);

      if (result.success) {
        toast({
          title: 'Account Created',
          description: `Admin user '${values.username}' has been successfully created.`,
        });
        onSuccess();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'An unexpected error occurred.',
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
