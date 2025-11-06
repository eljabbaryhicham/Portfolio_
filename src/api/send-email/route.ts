
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

interface HomePageSettings {
    emailLogoUrl?: string;
    emailLogoScale?: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured on the server.');
    return NextResponse.json(
      { success: false, message: 'Server is not configured for sending emails.' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parseResult = formSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ success: false, message: 'Invalid form data.', errors: parseResult.error.flatten() }, { status: 400 });
  }

  const { name, email, message } = parseResult.data;
  const resend = new Resend(apiKey);
  const TO_EMAIL = 'eljabbaryhicham@gmail.com';
  const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requires this for free tier

  let emailLogoUrl = 'https://i.imgur.com/N9c8oEJ.png'; // Default logo
  let emailLogoScale = 1; // Default scale
  
  try {
      const adminApp = await initializeServerApp();
      if (adminApp) {
          const firestore = admin.firestore(adminApp);
          const settingsDoc = await firestore.collection('homepage').doc('settings').get();
          if (settingsDoc.exists) {
              const settings = settingsDoc.data() as HomePageSettings;
              emailLogoUrl = settings.emailLogoUrl || emailLogoUrl;
              emailLogoScale = settings.emailLogoScale || emailLogoScale;
          }
      } else {
          console.warn('Could not connect to settings database. Falling back to default email styles.');
      }
  } catch (error) {
      console.error('Error fetching email settings:', error);
      console.warn('Falling back to default email styles.');
  }

  const logoWidth = 150 * emailLogoScale;

  try {
    // Read the HTML template from the file system
    const templatePath = path.join(process.cwd(), 'src', 'lib', 'email-templates', 'contact-form.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with actual data
    htmlTemplate = htmlTemplate
      .replace('{{name}}', name)
      .replace('{{email}}', email)
      .replace('{{message}}', message)
      .replace('{{emailLogoUrl}}', emailLogoUrl)
      .replace('{{logoWidth}}', String(logoWidth));

    const { data, error } = await resend.emails.send({
      from: `BELOFTED <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: `New Message from ${name}`,
      reply_to: email,
      html: htmlTemplate,
    });

    if (error) {
      console.error('Error sending email from Resend:', error);
      return NextResponse.json({ success: false, message: `Failed to send email: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Message Sent Successfully!' });

  } catch (e: any) {
    console.error('An unexpected error occurred while sending email:', e);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${e.message}` }, { status: 500 });
  }
}
