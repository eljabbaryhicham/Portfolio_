
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import MediaAdmin from './MediaAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import ClientAdmin from './ClientAdmin';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AppUser } from '@/firebase/auth/use-user';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  title_en: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  title_fr: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  content_en: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
  content_fr: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  logoScale: z.number().min(0.05).max(5).optional(),
});

type AboutFormValues = z.infer<typeof formSchema>;

interface AboutPageContent extends AboutFormValues {}

export default function AboutAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditAbout = isSuperAdmin || (typedUser?.permissions?.canEditAbout ?? true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void; field: 'imageUrl' | 'logoUrl' } | null>(null);

  const [dialogActiveTab, setDialogActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [dialogActiveLibrary, setDialogActiveLibrary] = useState<'primary' | 'extented'>('primary');

  const aboutContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about', 'content') : null),
    [firestore]
  );
  const { data: aboutContent, isLoading } = useDoc<AboutPageContent>(aboutContentRef);

  const form = useForm<AboutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title_en: '',
      title_fr: '',
      content_en: '',
      content_fr: '',
      imageUrl: '',
      logoUrl: '',
      logoScale: 1,
    },
  });

  useEffect(() => {
    if (aboutContent) {
      form.reset({
        title_en: aboutContent.title_en || '',
        title_fr: aboutContent.title_fr || '',
        content_en: aboutContent.content_en || '',
        content_fr: aboutContent.content_fr || '',
        imageUrl: aboutContent.imageUrl || '',
        logoUrl: aboutContent.logoUrl || '',
        logoScale: aboutContent.logoScale || 1,
      });
    }
  }, [aboutContent, form]);

  const onSubmit = (values: AboutFormValues) => {
    if (!aboutContentRef || !canEditAbout) return;
    const dataToSave = {
      ...values,
      logoUrl: values.logoUrl || '', 
      logoScale: values.logoScale || 1,
    };
    setDocumentNonBlocking(aboutContentRef, dataToSave, { merge: true });
    toast({
      title: 'About Page Updated',
      description: 'Your "About Us" page has been successfully updated.',
    });
    setIsFormOpen(false);
  };

  const handleChooseImage = (field: 'imageUrl' | 'logoUrl') => {
    if (!canEditAbout) return;
    setLibrarySelectionConfig({
      onSelect: (url, type) => {
        if (type === 'image') {
          form.setValue(field, url, { shouldValidate: true });
        } else {
          toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image.' });
        }
        setIsLibraryOpen(false);
      },
      field: field,
    });
    setIsLibraryOpen(true);
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-8 min-h-0">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <div className="flex flex-col min-h-0">
              <div className="mb-6 flex-shrink-0 flex items-start justify-between">
                  <div>
                      <h2 className="text-xl font-headline">Client Management</h2>
                      <p className="text-muted-foreground">Manage the clients displayed on your "About Us" page.</p>
                  </div>
                  <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!canEditAbout}>
                          <FontAwesomeIcon icon={faPencilAlt} className="mr-2 h-4 w-4" />
                          Edit Page Content
                      </Button>
                  </DialogTrigger>
              </div>
              <ClientAdmin />
          </div>
          <DialogContent className="w-[80vw] h-[90vh] flex flex-col glass-effect p-0 rounded-lg">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="font-headline">Edit About Page Content</DialogTitle>
                <DialogDescription>
                  Update the content displayed on your public "About Us" page.
                  {!canEditAbout && <span className="text-destructive font-bold block mt-2"> (Read-only)</span>}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Preloader />
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          <fieldset disabled={!canEditAbout} className="group">
                            <FormField
                              control={form.control}
                              name="logoUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>About Page Logo URL</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input placeholder="https://example.com/your-logo.png" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('logoUrl')}>
                                      <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name="logoScale"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>About Page Logo Scale ({Math.round((field.value || 1) * 100)}%)</FormLabel>
                                  <FormControl>
                                    <Slider
                                      value={[field.value || 1]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                      min={0.05}
                                      max={5}
                                      step={0.05}
                                    />
                                  </FormControl>
                                   <FormDescription>
                                    Adjust the size of the logo on the about page.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Separator className="my-8" />

                            <Tabs defaultValue="en" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="en">English Content</TabsTrigger>
                                <TabsTrigger value="fr">French Content</TabsTrigger>
                              </TabsList>
                              <TabsContent value="en" className="space-y-4 pt-4">
                                <FormField
                                  control={form.control}
                                  name="title_en"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Heading (English)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="About Section Heading" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="content_en"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Paragraph (English)</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Write your paragraph here..." className="min-h-[150px]" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TabsContent>
                              <TabsContent value="fr" className="space-y-4 pt-4">
                                <FormField
                                  control={form.control}
                                  name="title_fr"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Heading (French)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Titre de la section À propos" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="content_fr"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Paragraph (French)</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Écrivez votre paragraphe ici..." className="min-h-[150px]" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TabsContent>
                            </Tabs>

                            <Separator className="my-8" />

                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Side Image URL</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input placeholder="https://example.com/your-image.png" {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('imageUrl')}>
                                      <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end pt-4 gap-4">
                              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                              <Button type="submit" disabled={!canEditAbout}>Save Changes</Button>
                            </div>
                          </fieldset>
                        </form>
                      </Form>
                    )}
                  </div>
                </ScrollArea>
              </div>
          </DialogContent>
        </Dialog>
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
        activeTab={dialogActiveTab}
        setActiveTab={setDialogActiveTab}
        activeLibrary={dialogActiveLibrary}
        setActiveLibrary={setDialogActiveLibrary}
        newlyUploadedId={null}
      />
    </>
  );
}
