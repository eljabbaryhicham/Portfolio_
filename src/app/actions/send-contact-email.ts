'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { ContactFormInputSchema } from '@/features/contact/data/contact-form-types';
import { unstable_noStore as noStore } from 'next/cache';

interface HomePageSettings {
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

interface ActionState {
    success: boolean;
    message: string;
}

const basicFallbackTemplate = `
    <p><strong>Name:</strong> {{name}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Message:</strong></p>
    <p>{{message}}</p>
`;

/**
 * Fetches the latest email settings from Firestore dynamically, bypassing any cache.
 * This is the key to ensuring admin panel changes are reflected immediately.
 */
async function getLatestEmailSettings(): Promise<HomePageSettings> {
    noStore(); // Explicitly tell Next.js not to cache this function's result.
    console.log("Fetching latest email settings from Firestore...");
    try {
        const adminApp = await initializeServerApp();
        if (!adminApp) {
            throw new Error("Failed to initialize Firebase Admin SDK. Cannot fetch email settings.");
        }
        const firestore = admin.firestore(adminApp);
        const settingsDoc = await firestore.collection('homepage').doc('settings').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data() as HomePageSettings;
            console.log("Successfully fetched dynamic settings:", { hasTemplate: !!settings.emailHtmlTemplate });
            return settings;
        } else {
            console.warn("Could not find 'homepage/settings' document. Will use fallback.");
            return {};
        }
    } catch (error) {
        console.error("Error fetching dynamic settings:", error);
        // In case of error, return empty object to use fallbacks
        return {};
    }
}

export async function sendContactEmail(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    console.log("sendContactEmail action started dynamically.");
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not configured on the server.');
        return { success: false, message: 'Server is not configured for sending emails.' };
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
        // Fetch the most recent settings directly from the database
        const settings = await getLatestEmailSettings();
        
        const resend = new Resend(apiKey);
        const TO_EMAIL = 'eljabbaryhicham@gmail.com';
        const FROM_EMAIL = 'onboarding@resend.dev';

        let htmlTemplate = settings.emailHtmlTemplate || basicFallbackTemplate;
        const logoUrl = settings.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png';
        const logoScale = settings.emailLogoScale || 1;

        console.log(`Using template: ${settings.emailHtmlTemplate ? 'Custom DB Template (Live)' : 'Fallback Template'}`);
        console.log(`Using logo URL: ${logoUrl}`);
        console.log(`Using logo scale: ${logoScale}`);

        const finalHtml = htmlTemplate
          .replace(/{{name}}/g, name)
          .replace(/{{email}}/g, email)
          .replace(/{{message}}/g, message)
          .replace(/{{emailLogoUrl}}/g, logoUrl)
          .replace(/{{emailLogoScale}}/g, logoScale.toString());

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
        
        console.log("Email sent successfully using live settings.");
        return { success: true, message: 'Message Sent Successfully!' };

    } catch (e: any) {
        console.error('An unexpected error occurred in sendContactEmail action:', e);
        return { success: false, message: `An unexpected server error occurred: ${e.message}` };
    }
}
