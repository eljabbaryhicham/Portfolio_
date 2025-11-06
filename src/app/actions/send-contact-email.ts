
'use server';

import { z } from 'zod';
import { Resend } from 'resend';

// This is the new schema for the form data, including the template info
const ContactFormSchemaWithTemplate = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  emailHtmlTemplate: z.string(),
  emailLogoUrl: z.string().url(),
  emailLogoScale: z.coerce.number(),
});

interface ActionState {
    success: boolean;
    message: string;
}

export async function sendContactEmail(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    console.log("`sendContactEmail` server action invoked (v-client-driven).");
    
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        const errorMsg = 'Server is not configured for sending emails: RESEND_API_KEY is missing.';
        console.error(errorMsg);
        return { success: false, message: errorMsg };
    }

    const validatedFields = ContactFormSchemaWithTemplate.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        emailHtmlTemplate: formData.get('emailHtmlTemplate'),
        emailLogoUrl: formData.get('emailLogoUrl'),
        emailLogoScale: formData.get('emailLogoScale'),
    });

    if (!validatedFields.success) {
        console.error("Form validation failed:", validatedFields.error.flatten().fieldErrors);
        return { success: false, message: 'Invalid form data.' };
    }

    const { 
        name, 
        email, 
        message, 
        emailHtmlTemplate,
        emailLogoUrl,
        emailLogoScale 
    } = validatedFields.data;
    
    try {
        const resend = new Resend(apiKey);
        const TO_EMAIL = 'eljabbaryhicham@gmail.com';
        const FROM_EMAIL = 'onboarding@resend.dev';

        // The template is now guaranteed to be a string because it comes directly from the validated form data.
        const finalHtml = emailHtmlTemplate
          .replace(/{{name}}/g, name)
          .replace(/{{email}}/g, email)
          .replace(/{{message}}/g, message)
          .replace(/{{emailLogoUrl}}/g, emailLogoUrl)
          .replace(/{{emailLogoScale}}/g, emailLogoScale.toString());

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
        
        console.log("Email sent successfully using client-provided settings:", data);
        return { success: true, message: 'Message Sent Successfully!' };

    } catch (e: any) {
        console.error('An unexpected error occurred in sendContactEmail action:', e);
        return { success: false, message: `An unexpected server error occurred: ${e.message}` };
    }
}
