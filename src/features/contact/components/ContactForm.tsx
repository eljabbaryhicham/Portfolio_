
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { ContactFormInputSchema, type ContactFormInput } from '@/features/contact/data/contact-form-types';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const formSchema = ContactFormInputSchema;
type ContactFormValues = z.infer<typeof formSchema>;

interface ContactInfo {
    whatsApp?: string;
}

interface ContactFormProps {
    onSuccess?: () => void;
    defaultMessage?: string;
}

export default function ContactForm({ onSuccess, defaultMessage = '' }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc<ContactInfo>(contactDocRef);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: defaultMessage,
    },
  });

  useEffect(() => {
    form.setValue('message', defaultMessage);
  }, [defaultMessage, form]);


  const handleSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSent(true);
        if (onSuccess) {
            setTimeout(() => {
                onSuccess();
                // Reset form state after dialog closes
                setTimeout(() => {
                    setIsSent(false);
                    form.reset({ name: '', email: '', message: defaultMessage });
                }, 500);
            }, 2000);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Message Failed to Send",
          description: result.message || "An unexpected error occurred. Please try again.",
          duration: 8000,
        });
        setIsSubmitting(false);
      }
    } catch (error) {
       toast({
          variant: "destructive",
          title: "An Error Occurred",
          description: "A network error occurred. Please check your connection and try again.",
        });
       setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
        <div className="text-center flex flex-col items-center justify-center h-full min-h-[350px]">
           <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
           >
            <FontAwesomeIcon icon={faCheckCircle} className="w-16 h-16 text-green-400 mb-4" />
           </motion.div>
          <h3 className="text-xl font-bold">Message Sent!</h3>
          <p className="text-foreground/80 mt-2 max-w-sm">
            Thank you for reaching out. We will get back to you shortly.
          </p>
          {!onSuccess && ( // Only show "Send Another" if it's not in a dialog that will close
            <Button onClick={() => setIsSent(false)} className="mt-6">
              Send Another Message
            </Button>
          )}
          {!onSuccess && contactInfo?.whatsApp && (
            <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 mt-4">
                <Link href={`https://wa.me/${contactInfo.whatsApp.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faWhatsapp} className="mr-2 h-5 w-5" />
                    Chat on WhatsApp
                </Link>
            </Button>
          )}
        </div>
      )
  }

  return (
    <div className='w-full'>
        <div className="flex flex-col items-center mb-8">
            <p className="font-handwriting text-xl md:text-2xl text-white transform -rotate-6">send a message we are always avalaible</p>
            <svg className="w-12 h-12 md:w-20 md:h-20 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10 C51 30, 51 50, 50 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M45 65 L50 75 L55 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormControl>
                    <Input placeholder="Name" {...field} className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormControl>
                    <Input type="email" placeholder="Email" {...field} className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
                <FormItem>
                <FormControl>
                    <Textarea
                    placeholder="Message"
                    className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors min-h-[100px] placeholder:text-foreground/80"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" size="lg" className="w-full glass-effect" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
        </form>
        </Form>
    </div>
  );
}

    