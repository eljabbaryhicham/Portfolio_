
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect, useState } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppUser } from '@/firebase/auth/use-user';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
    workPagePlayer?: 'plyr' | 'clappr';
    isTestPageEnabled?: boolean;
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
    homePageLogoScale?: number;
    themeColor?: string;
    registrationSecretCode?: string;
    plyrPlayerAssetSource?: 'cdn' | 'local';
    plyrPlayerCdnCssUrl?: string;
    plyrPlayerCdnJsUrl?: string;
    emailFromName?: string;
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

const settingsSchema = z.object({
  homePageBackgroundType: z.enum(['video', 'image']).optional(),
  homePageBackgroundMediaId: z.string().optional(),
  websiteBackgroundType: z.enum(['video', 'image']).optional(),
  websiteBackgroundMediaId: z.string().optional(),
  isHomePageVideoEnabled: z.boolean().optional(),
  isWebsiteVideoEnabled: z.boolean().optional(),
  workPagePlayer: z.enum(['plyr', 'clappr']).optional(),
  isTestPageEnabled: z.boolean().optional(),
  homePageLogoUrl: z.string().url().optional().or(z.literal('')),
  isHomePageLogoVisible: z.boolean().optional(),
  homePageLogoScale: z.number().min(0.05).max(5).optional(),
  themeColor: z.string().optional(),
  registrationSecretCode: z.string().optional(),
  plyrPlayerAssetSource: z.enum(['cdn', 'local']).optional(),
  plyrPlayerCdnCssUrl: z.string().url().optional().or(z.literal('')),
  plyrPlayerCdnJsUrl: z.string().url().optional().or(z.literal('')),
  emailFromName: z.string().optional(),
  emailLogoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  emailLogoScale: z.number().min(0.05).max(5).optional(),
  emailHtmlTemplate: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface MediaAsset {
    id: string;
    url: string;
    filename: string;
    resource_type: 'image' | 'video' | 'raw';
    title?: string;
}

export const defaultEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Message</title>
</head>
<body style="background-color: #0d1a2e; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1a2b42; border-radius: 8px; border: 1px solid #2a3f5f;">
    <tr>
        <td style="padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <img src="{{emailLogoUrl}}" alt="Logo" style="max-width: 150px; height: auto; transform: scale({{emailLogoScale}});">
        </div>
        <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px; text-align: center;">Message From {{name}}</h1>
        <p style="margin: 0 0 16px; text-align: center;">You have received a new message from your portfolio website.</p>
        
        <div style="background-color: #0d1a2e; padding: 20px; border-radius: 8px;">
            <p style="margin: 0 0 8px;"><strong>Name:</strong> {{name}}</p>
            <p style="margin: 0 0 16px;"><strong>Email:</strong> <a href="mailto:{{email}}" style="color: #60a5fa; text-decoration: none;">{{email}}</a></p>
            <hr style="border: none; border-top: 1px solid #2a3f5f; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">{{message}}</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">You can reply directly to this email to contact the user.</p>
        </td>
    </tr>
    </table>
</body>
</html>`;


export default function HomeAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditHome = isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);

  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: portfolioItems, isLoading: isLoadingProjects } = useCollection<PortfolioItem>(projectsCollection);
  
  const mediaCollection = useMemoFirebase(() => firestore ? collection(firestore, 'media') : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollection);

  const isLoading = isLoadingSettings || isLoadingProjects || isLoadingMedia;

  const videoItems = portfolioItems?.filter(item => item.type === 'video') || [];
  const imageAssets = mediaAssets?.filter(asset => asset.resource_type === 'image') || [];
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      homePageBackgroundType: 'video',
      homePageBackgroundMediaId: '',
      websiteBackgroundType: 'video',
      websiteBackgroundMediaId: '',
      isHomePageVideoEnabled: true,
      isWebsiteVideoEnabled: true,
      workPagePlayer: 'clappr',
      isTestPageEnabled: false,
      homePageLogoUrl: '',
      isHomePageLogoVisible: true,
      homePageLogoScale: 1,
      themeColor: '#d81e38',
      registrationSecretCode: 'BELOFTED',
      plyrPlayerAssetSource: 'local',
      plyrPlayerCdnCssUrl: 'https://cdn.plyr.io/3.7.8/plyr.css',
      plyrPlayerCdnJsUrl: 'https://cdn.plyr.io/3.7.8/plyr.js',
      emailFromName: 'BELOFTED',
      emailLogoUrl: 'https://i.imgur.com/N9c8oEJ.png',
      emailLogoScale: 1,
      emailHtmlTemplate: defaultEmailTemplate,
    },
  });

  const { watch, control, setValue } = form;

  useEffect(() => {
    setIsMounted(true);
    if (homeSettings) {
      form.reset({
        homePageBackgroundType: homeSettings.homePageBackgroundType || 'video',
        homePageBackgroundMediaId: homeSettings.homePageBackgroundMediaId || '',
        websiteBackgroundType: homeSettings.websiteBackgroundType || 'video',
        websiteBackgroundMediaId: homeSettings.websiteBackgroundMediaId || '',
        isHomePageVideoEnabled: homeSettings.isHomePageVideoEnabled ?? true,
        isWebsiteVideoEnabled: homeSettings.isWebsiteVideoEnabled ?? true,
        workPagePlayer: homeSettings.workPagePlayer || 'clappr',
        isTestPageEnabled: homeSettings.isTestPageEnabled ?? false,
        homePageLogoUrl: homeSettings.homePageLogoUrl || '',
        isHomePageLogoVisible: homeSettings.isHomePageLogoVisible ?? true,
        homePageLogoScale: homeSettings.homePageLogoScale || 1,
        themeColor: homeSettings.themeColor || '#d81e38',
        registrationSecretCode: homeSettings.registrationSecretCode || 'BELOFTED',
        plyrPlayerAssetSource: homeSettings.plyrPlayerAssetSource || 'local',
        plyrPlayerCdnCssUrl: homeSettings.plyrPlayerCdnCssUrl || 'https://cdn.plyr.io/3.7.8/plyr.css',
        plyrPlayerCdnJsUrl: homeSettings.plyrPlayerCdnJsUrl || 'https://cdn.plyr.io/3.7.8/plyr.js',
        emailFromName: homeSettings.emailFromName || 'BELOFTED',
        emailLogoUrl: homeSettings.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png',
        emailLogoScale: homeSettings.emailLogoScale || 1,
        emailHtmlTemplate: homeSettings.emailHtmlTemplate || defaultEmailTemplate,
      });
    }
  }, [homeSettings, form]);

  useEffect(() => {
    if (!canEditHome || !isMounted || isLoading) return;

    const debouncedSave = debounce((fieldName, value) => {
        if (settingsDocRef) {
            const dataToSave = { [fieldName]: value };
            setDocumentNonBlocking(settingsDocRef, dataToSave, { merge: true });
            toast({
                title: 'Setting Saved',
                description: 'Your change has been saved automatically.',
            });
        }
    }, 500);

    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && name) {
        const fieldName = name as keyof SettingsFormValues;
        debouncedSave(fieldName, value[fieldName]);
      }
    });

    return () => {
        subscription.unsubscribe();
        debouncedSave.cancel();
    };
  }, [watch, settingsDocRef, canEditHome, toast, isMounted, isLoading]);

  if (isLoading && !isMounted) {
    return (
        <div className="flex justify-center items-center h-full">
            <Preloader />
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
        <div className="mb-6">
            <h2 className="text-xl font-headline">Home Page Settings</h2>
            <p className="text-muted-foreground">
                Manage background videos and other global settings. Changes save automatically.
            </p>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <Form {...form}>
                        <div className="space-y-8 max-w-2xl mx-auto">
                            <fieldset disabled={!canEditHome} className="group space-y-8">
                                
                                {/* Homepage Background Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
                                    <h3 className="font-headline text-lg">Homepage</h3>
                                    
                                    <FormField
                                        control={control}
                                        name="homePageLogoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Homepage Logo URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com/logo.png" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                      control={form.control}
                                      name="homePageLogoScale"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Homepage Logo Scale ({Math.round((field.value || 1) * 100)}%)</FormLabel>
                                          <FormControl>
                                            <Slider
                                              value={[field.value || 1]}
                                              onValueChange={(value) => field.onChange(value[0])}
                                              min={0.05}
                                              max={5}
                                              step={0.05}
                                            />
                                          </FormControl>
                                          <FormDescription>Adjust the size of the logo on the homepage.</FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                        control={control}
                                        name="isHomePageLogoVisible"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Show Homepage Logo</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <Separator />
                                    
                                    <h3 className="font-headline text-lg pt-4">Homepage Background</h3>
                                    <FormField
                                      control={control}
                                      name="homePageBackgroundType"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>Background Type</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={(value) => {
                                                  field.onChange(value);
                                                  setValue('homePageBackgroundMediaId', ''); // Reset selection on type change
                                              }}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="video" /></FormControl>
                                                <FormLabel className="font-normal">Video</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="image" /></FormControl>
                                                <FormLabel className="font-normal">Image</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                        control={control}
                                        name="homePageBackgroundMediaId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Background Media</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select a ${watch('homePageBackgroundType')}`} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {(watch('homePageBackgroundType') === 'video' ? videoItems : imageAssets).map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.title || item.filename}
                                                    </SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {watch('homePageBackgroundType') === 'video' && (
                                        <FormField
                                            control={control}
                                            name="isHomePageVideoEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Enable Homepage Video</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>

                                <Separator />

                                {/* Website Background Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
                                     <h3 className="font-headline text-lg">Other Pages Background</h3>
                                    <FormField
                                      control={control}
                                      name="websiteBackgroundType"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>Background Type</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={(value) => {
                                                  field.onChange(value);
                                                  setValue('websiteBackgroundMediaId', ''); // Reset selection on type change
                                              }}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="video" /></FormControl>
                                                <FormLabel className="font-normal">Video</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="image" /></FormControl>
                                                <FormLabel className="font-normal">Image</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                        control={control}
                                        name="websiteBackgroundMediaId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Background Media</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Select a ${watch('websiteBackgroundType')}`} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {(watch('websiteBackgroundType') === 'video' ? videoItems : imageAssets).map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.title || item.filename}
                                                    </SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {watch('websiteBackgroundType') === 'video' && (
                                        <FormField
                                            control={control}
                                            name="isWebsiteVideoEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Enable Website Video</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                <Separator />

                                {/* Email Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
                                     <h3 className="font-headline text-lg">Email Settings</h3>
                                     <FormField
                                        control={control}
                                        name="emailFromName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email "From" Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your Company Name" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The name that appears as the sender in contact form notifications.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />
                                     <FormField
                                        control={control}
                                        name="emailLogoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Logo URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com/email-logo.png" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The logo to display at the top of notification emails.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />
                                     <FormField
                                        control={control}
                                        name="emailLogoScale"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Logo Scale ({Math.round((field.value || 1) * 100)}%)</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                    value={[field.value || 1]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                    min={0.05}
                                                    max={2}
                                                    step={0.05}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Adjust the size of the logo in emails.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />
                                     <FormField
                                        control={control}
                                        name="emailHtmlTemplate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contact Form Email Template</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter the full HTML for the email..."
                                                        className="min-h-[300px] font-mono text-xs"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    The full HTML of the notification email. Use placeholders: {`"{{name}}"`}, {`"{{email}}"`}, {`"{{message}}"`}, {`"{{emailLogoUrl}}"`}, and {`"{{emailLogoScale}}"`}.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Separator />

                                {/* Player Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
                                     <h3 className="font-headline text-lg">Global Settings</h3>

                                     <FormField
                                        control={control}
                                        name="themeColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Theme Color</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input type="color" {...field} className="p-1 h-10 w-14 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} placeholder="#d81e38" />
                                                </div>
                                                <FormDescription>
                                                    Set the primary color for the website theme.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />

                                    <Separator />
                                    
                                    <FormField
                                      control={control}
                                      name="workPagePlayer"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>Work Page Video Player</FormLabel>
                                           <FormDescription>
                                            Choose which player to use for videos on the public "Work" page.
                                          </FormDescription>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={field.onChange}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="plyr" /></FormControl>
                                                <FormLabel className="font-normal">Plyr (Optimized)</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="clappr" /></FormControl>
                                                <FormLabel className="font-normal">Clappr (Feature-rich)</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <Separator />

                                    <FormField
                                      control={control}
                                      name="plyrPlayerAssetSource"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>Plyr Player Asset Source</FormLabel>
                                           <FormDescription>
                                            Choose how to load the Plyr player's files.
                                          </FormDescription>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={field.onChange}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="local" /></FormControl>
                                                <FormLabel className="font-normal">Local</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="cdn" /></FormControl>
                                                <FormLabel className="font-normal">CDN</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    {watch('plyrPlayerAssetSource') === 'cdn' && (
                                        <div className="space-y-4 pl-4 border-l-2 border-primary/50 ml-2">
                                            <FormField
                                                control={control}
                                                name="plyrPlayerCdnCssUrl"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Plyr CDN CSS URL</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="https://cdn.plyr.io/3.7.8/plyr.css" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={control}
                                                name="plyrPlayerCdnJsUrl"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Plyr CDN JS URL</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="https://cdn.plyr.io/3.7.8/plyr.js" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

                                    <Separator />

                                    <FormField
                                        control={control}
                                        name="registrationSecretCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Registration Secret Code</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter secret code" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    The code users must enter to register a new admin account.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />
                                    <Separator />

                                     <FormField
                                        control={control}
                                        name="isTestPageEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Enable Test Page</FormLabel>
                                                     <FormDescription>
                                                        Show or hide the "Test" page link in the main navigation.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>
                        </div>
                    </Form>
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
