'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { ContactFormInputSchema } from '@/features/contact/data/contact-form-types';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic'; // This is the crucial line to prevent caching of the entire action.

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
<!DOCTYPE html>
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

/**
 * Fetches the latest email settings from Firestore dynamically, bypassing any cache.
 */
async function getLatestEmailSettings(): Promise<HomePageSettings> {
    noStore(); // Explicitly tells Next.js not to cache this function's result.
    console.log("Fetching latest email settings from Firestore dynamically...");
    try {
        const adminApp = await initializeServerApp();
        if (!adminApp) {
            throw new Error("Failed to initialize Firebase Admin SDK. Cannot fetch email settings.");
        }
        const firestore = admin.firestore(adminApp);
        const settingsDoc = await firestore.collection('homepage').doc('settings').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data() as HomePageSettings;
            console.log("Successfully fetched dynamic settings:", { hasTemplate: !!settings.emailHtmlTemplate, logoUrl: settings.emailLogoUrl, logoScale: settings.emailLogoScale });
            return settings;
        } else {
            console.warn("Could not find 'homepage/settings' document. Will use fallback.");
            return {};
        }
    } catch (error) {
        console.error("Error fetching dynamic settings:", error);
        return {};
    }
}

export async function sendContactEmail(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    console.log("sendContactEmail server action started dynamically.");
    
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
        console.log(`Sending email to: ${TO_EMAIL} from: ${FROM_EMAIL}`);


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
        
        console.log("Email sent successfully using live settings:", data);
        return { success: true, message: 'Message Sent Successfully!' };

    } catch (e: any) {
        console.error('An unexpected error occurred in sendContactEmail action:', e);
        return { success: false, message: `An unexpected server error occurred: ${e.message}` };
    }
}
