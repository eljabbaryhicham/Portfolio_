'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sendContactEmail } from '@/app/actions/send-contact-email';


interface ContactInfo {
    whatsApp?: string;
}

interface ContactFormProps {
    onSuccess?: () => void;
    defaultMessage?: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="lg" className="w-full glass-effect" disabled={pending}>
            {pending && <FontAwesomeIcon icon={faSpinner} className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Sending...' : 'Send Message'}
        </Button>
    );
}

export default function ContactForm({ onSuccess, defaultMessage = '' }: ContactFormProps) {
  const [state, formAction] = useActionState(sendContactEmail, { success: false, message: '' });
  const [isSent, setIsSent] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc<ContactInfo>(contactDocRef);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        setIsSent(true);
        if (onSuccess) {
            setTimeout(() => {
                onSuccess();
                setTimeout(() => {
                    setIsSent(false);
                    formRef.current?.reset();
                }, 500);
            }, 2000);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Message Failed to Send",
          description: state.message,
          duration: 8000,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Effect to update the message field when defaultMessage prop changes
  useEffect(() => {
    if (formRef.current) {
        const messageTextarea = formRef.current.elements.namedItem('message') as HTMLTextAreaElement | null;
        if (messageTextarea) {
            messageTextarea.value = defaultMessage;
        }
    }
  }, [defaultMessage]);


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
          {!onSuccess && ( 
            <Button onClick={() => { setIsSent(false); formRef.current?.reset(); }} className="mt-6">
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
        <form ref={formRef} action={formAction} className="space-y-8 w-full">
            <Input 
                name="name"
                placeholder="Name" 
                className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" 
                required 
            />
            <Input 
                name="email"
                type="email"
                placeholder="Email" 
                className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors placeholder:text-foreground/80" 
                required 
            />
            <Textarea
                name="message"
                placeholder="Message"
                className="text-center bg-transparent border-0 border-b border-foreground/30 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors min-h-[100px] placeholder:text-foreground/80"
                defaultValue={defaultMessage}
                required
            />
            <SubmitButton />
        </form>
    </div>
  );
}