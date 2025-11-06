
'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { ContactFormInputSchema } from '@/features/contact/data/contact-form-types';

interface HomePageSettings {
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

interface ActionState {
    success: boolean;
    message: string;
}

// This is a basic fallback template used ONLY if the database connection fails
// or if the template field in Firestore is empty.
const basicFallbackTemplate = `
    <p><strong>Name:</strong> {{name}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Message:</strong></p>
    <p>{{message}}</p>
`;


export async function sendContactEmail(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
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
        return {
            success: false,
            message: 'Invalid form data. Please check your inputs.',
        };
    }

    const { name, email, message } = validatedFields.data;
    const resend = new Resend(apiKey);
    const TO_EMAIL = 'eljabbaryhicham@gmail.com';
    const FROM_EMAIL = 'onboarding@resend.dev';

    try {
        let settings: HomePageSettings = {};
        const adminApp = await initializeServerApp();
        
        if (adminApp) {
            const firestore = admin.firestore(adminApp);
            const settingsDoc = await firestore.collection('homepage').doc('settings').get();
            if (settingsDoc.exists) {
                settings = settingsDoc.data() as HomePageSettings;
                console.log("Successfully fetched email settings from Firestore.");
            } else {
                console.warn("Could not find 'homepage/settings' document in Firestore. Using fallback template.");
            }
        } else {
             console.error("Failed to initialize Firebase Admin SDK. Cannot fetch email settings. Using fallback template.");
        }
        
        let htmlTemplate = settings.emailHtmlTemplate || basicFallbackTemplate;
        const logoUrl = settings.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png'; // Default logo if not set
        const logoScale = settings.emailLogoScale || 1;

        // Perform the placeholder replacements
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
          html: finalHtml, // Use the processed HTML
        });

        if (error) {
            console.error('Error sending email from Resend:', error);
            return { success: false, message: `Failed to send email: ${error.message}` };
        }
        
        return { success: true, message: 'Message Sent Successfully!' };

    } catch (e: any) {
        console.error('An unexpected error occurred in sendContactEmail action:', e);
        return { success: false, message: `An unexpected server error occurred: ${e.message}` };
    }
}
