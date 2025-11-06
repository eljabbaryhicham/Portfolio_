
'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { ContactFormInputSchema } from '@/features/contact/data/contact-form-types';
import { unstable_noStore as noStore } from 'next/cache';
import { defaultEmailTemplate } from '@/features/admin/components/HomeAdmin';


interface HomePageSettings {
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

interface ActionState {
    success: boolean;
    message: string;
}

/**
 * Fetches the latest email settings from Firestore dynamically.
 * noStore() ensures this function's result is never cached.
 */
async function getLatestEmailSettings(): Promise<HomePageSettings> {
    // This is the crucial line to prevent caching of the data fetch.
    noStore();
    
    console.log("Attempting to get latest email settings from Firestore...");

    const adminApp = await initializeServerApp();
    if (!adminApp) {
        console.error("sendContactEmail Error: Failed to initialize Firebase Admin SDK. Cannot fetch email settings. Using default template.");
        return {
            emailHtmlTemplate: defaultEmailTemplate,
            emailLogoUrl: 'https://i.imgur.com/N9c8oEJ.png',
            emailLogoScale: 1,
        };
    }

    try {
        const firestore = admin.firestore(adminApp);
        const settingsDoc = await firestore.collection('homepage').doc('settings').get();
        
        const settingsData = settingsDoc.data();
        // **CRITICAL FIX**: Ensure that emailHtmlTemplate is a non-empty string.
        if (settingsDoc.exists && settingsData && typeof settingsData.emailHtmlTemplate === 'string' && settingsData.emailHtmlTemplate) {
            console.log("Successfully fetched dynamic settings from database.");
            return {
                emailHtmlTemplate: settingsData.emailHtmlTemplate,
                emailLogoUrl: settingsData.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png',
                emailLogoScale: settingsData.emailLogoScale || 1,
            };
        } else {
            console.warn("Could not find 'homepage/settings' document in Firestore or `emailHtmlTemplate` is missing/invalid. Using default template.");
            return {
                emailHtmlTemplate: defaultEmailTemplate,
                emailLogoUrl: settingsData?.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png',
                emailLogoScale: settingsData?.emailLogoScale || 1,
            };
        }
    } catch (error) {
        console.error("Error fetching dynamic settings from Firestore. Using default template:", error);
        return {
            emailHtmlTemplate: defaultEmailTemplate,
            emailLogoUrl: 'https://i.imgur.com/N9c8oEJ.png',
            emailLogoScale: 1,
        };
    }
}

export async function sendContactEmail(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    console.log("`sendContactEmail` server action invoked.");
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        const errorMsg = 'Server is not configured for sending emails: RESEND_API_KEY is missing.';
        console.error(errorMsg);
        return { success: false, message: errorMsg };
    }

    const validatedFields = ContactFormInputSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Invalid form data.' };
    }

    const { name, email, message } = validatedFields.data;
    
    try {
        // ALWAYS fetch the latest settings. This function is NOT cached.
        const settings = await getLatestEmailSettings();

        // **DEFINITIVE FIX**: Guarantee `template` is a string before using .replace().
        const template = (typeof settings.emailHtmlTemplate === 'string' && settings.emailHtmlTemplate)
            ? settings.emailHtmlTemplate
            : defaultEmailTemplate;
        
        const resend = new Resend(apiKey);
        const TO_EMAIL = 'eljabbaryhicham@gmail.com';
        const FROM_EMAIL = 'onboarding@resend.dev';

        // Ensure all placeholders are replaced using the fresh settings
        const finalHtml = template
          .replace(/{{name}}/g, name)
          .replace(/{{email}}/g, email)
          .replace(/{{message}}/g, message)
          .replace(/{{emailLogoUrl}}/g, settings.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png')
          .replace(/{{emailLogoScale}}/g, (settings.emailLogoScale || 1).toString());

        const { data, error } = await resend.emails.send({
          from: `BELOFTED <${FROM_EMAIL}>`,
          to: TO_EMAIL,
          subject: `New Message from ${name}`,
          reply_to: email,
          html: finalHtml,
        });

        if (error) {
            console.error('Error from Resend:', error);
            return { success: false, message: `Failed to send email: ${error.message}` };
        }
        
        console.log("Email sent successfully using live settings:", data);
        return { success: true, message: 'Message Sent Successfully!' };

    } catch (e: any) {
        console.error('An unexpected error occurred in sendContactEmail action:', e);
        return { success: false, message: `An unexpected server error occurred: ${e.message}` };
    }
}
