
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Preloader from '@/components/preloader';
import type { AppUser } from '@/firebase/auth/use-user';
import { Slider } from '@/components/ui/slider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faSave } from '@fortawesome/free-solid-svg-icons';
import MediaAdmin from './MediaAdmin';

const formSchema = z.object({
  avatarUrl: z.string().url().optional().or(z.literal('')),
  name: z.string().min(2).optional().or(z.literal('')),
  title: z.string().min(2).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  whatsApp: z.string().optional().or(z.literal('')),
  behanceUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  fiverrUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url({ message: 'Please enter a valid URL for the logo.' }).optional().or(z.literal('')),
  logoScale: z.number().min(0.05).max(5).optional(),
  avatarScale: z.number().min(0.05).max(5).optional(),
});

type ContactInfo = z.infer<typeof formSchema>;

const defaultFormValues: ContactInfo = {
    avatarUrl: '',
    name: '',
    title: '',
    email: '',
    whatsApp: '',
    behanceUrl: '',
    linkedinUrl: '',
    fiverrUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    logoUrl: '',
    logoScale: 1,
    avatarScale: 1,
};

export default function ContactAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditContact = isSuperAdmin || (typedUser?.permissions?.canEditContact ?? true);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void; field: keyof ContactInfo } | null>(null);

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo, isLoading } = useDoc<ContactInfo>(contactDocRef);

  const form = useForm<ContactInfo>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (contactInfo) {
        form.reset({
            avatarUrl: contactInfo.avatarUrl || '',
            name: contactInfo.name || '',
            title: contactInfo.title || '',
            email: contactInfo.email || '',
            whatsApp: contactInfo.whatsApp || '',
            behanceUrl: contactInfo.behanceUrl || '',
            linkedinUrl: contactInfo.linkedinUrl || '',
            fiverrUrl: contactInfo.fiverrUrl || '',
            instagramUrl: contactInfo.instagramUrl || '',
            facebookUrl: contactInfo.facebookUrl || '',
            twitterUrl: contactInfo.twitterUrl || '',
            logoUrl: contactInfo.logoUrl || '',
            logoScale: contactInfo.logoScale || 1,
            avatarScale: contactInfo.avatarScale || 1,
        });
    }
  }, [contactInfo, form]);

  const onSubmit = (values: ContactInfo) => {
    if (!contactDocRef || !canEditContact) return;

    setDocumentNonBlocking(contactDocRef, values, { merge: true });
    toast({
        title: 'Settings Saved',
        description: 'Your contact and site settings have been updated.',
    });
  };

  const handleChooseImage = (field: keyof ContactInfo) => {
    if (!canEditContact) return;
    setLibrarySelectionConfig({
      onSelect: (url, type) => {
        if (type === 'image') {
          form.setValue(field, url, { shouldValidate: true, shouldDirty: true });
        } else {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image.' });
        }
        setIsLibraryOpen(false);
      },
      field: field,
    });
    setIsLibraryOpen(true);
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Preloader />
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6">
          <h2 className="text-xl font-headline">Contact Page &amp; Site Settings</h2>
          <p className="text-muted-foreground">
              Update the information displayed on your public contact page and other site-wide settings.
          </p>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
          <ScrollArea className="h-full">
              <div className="p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                    <fieldset disabled={!canEditContact} className="group space-y-8">
                    
                    <div className="space-y-4 p-4 rounded-lg border glass-effect">
                        <h3 className="font-headline text-lg">Site Assets</h3>
                        <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Site Logo URL</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="https://example.com/your-logo.png" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('logoUrl')}>
                                        <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                </div>
                                <FormDescription>The main logo for the entire website.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                        control={form.control}
                        name="logoScale"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Site Logo Scale ({Math.round((field.value || 1) * 100)}%)</FormLabel>
                            <FormControl>
                                <Slider
                                value={[field.value || 1]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={0.05}
                                max={5}
                                step={0.05}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="avatarUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avatar Image URL</FormLabel>
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Input placeholder="https://example.com/your-avatar.png" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('avatarUrl')}>
                                        <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                </div>
                                <FormDescription>The circular avatar image on the contact page.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                        control={form.control}
                        name="avatarScale"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Avatar Scale ({Math.round((field.value || 1) * 100)}%)</FormLabel>
                            <FormControl>
                                <Slider
                                value={[field.value || 1]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={0.05}
                                max={2}
                                step={0.05}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="space-y-4 p-4 rounded-lg border glass-effect">
                        <h3 className="font-headline text-lg">Contact Details</h3>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Your Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title / Profession</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., Motion Graphics Designer" {...field} />
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="your.email@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="whatsApp"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>WhatsApp Number</FormLabel>
                                <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4 p-4 rounded-lg border glass-effect">
                        <h3 className="font-headline text-lg">Social Media URLs</h3>
                        <FormField
                            control={form.control}
                            name="behanceUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Behance URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.behance.net/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="linkedinUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.linkedin.com/in/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fiverrUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fiverr URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.fiverr.com/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instagramUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instagram URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.instagram.com/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="facebookUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Facebook URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.facebook.com/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="twitterUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Twitter (X) URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://www.twitter.com/yourprofile" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex justify-end pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-4 z-10">
                        <Button type="submit" size="lg" disabled={!canEditContact}>
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                            Save Changes
                        </Button>
                    </div>
                    </fieldset>
                    </form>
                </Form>
              </div>
          </ScrollArea>
      </div>
      <MediaAdmin
        isDialog={true}
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onMediaSelect={(url, type, filename) => {
          if (librarySelectionConfig?.onSelect) {
            librarySelectionConfig.onSelect(url, type, filename);
          }
        }}
        isSelectionMode={!!librarySelectionConfig}
        onSelectionComplete={() => {
          setIsLibraryOpen(false);
          setLibrarySelectionConfig(null);
        }}
        activeTab="images"
        setActiveTab={() => {}}
        activeLibrary="primary"
        setActiveLibrary={() => {}}
        newlyUploadedId={null}
      />
    </div>
  );
}
