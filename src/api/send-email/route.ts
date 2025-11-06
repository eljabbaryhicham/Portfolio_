
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

interface HomePageSettings {
    emailLogoUrl?: string;
    emailLogoScale?: number;
    emailHtmlTemplate?: string;
}

const basicFallbackTemplate = `
    <p><strong>Name:</strong> {{name}}</p>
    <p><strong>Email:</strong> {{email}}</p>
    <p><strong>Message:</strong></p>
    <p>{{message}}</p>
`;

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

  try {
    let settings: HomePageSettings = {};
    const adminApp = await initializeServerApp();
    
    if (adminApp) {
        const firestore = admin.firestore(adminApp);
        const settingsDoc = await firestore.collection('homepage').doc('settings').get();
        if (settingsDoc.exists) {
            settings = settingsDoc.data() as HomePageSettings;
        }
    }
    
    // Use template from Firestore if available, otherwise use a basic hardcoded fallback.
    let htmlTemplate = settings.emailHtmlTemplate || basicFallbackTemplate;

    // Replace placeholders
    htmlTemplate = htmlTemplate
      .replace('{{name}}', name)
      .replace('{{email}}', email)
      .replace('{{message}}', message)
      .replace('{{emailLogoUrl}}', settings.emailLogoUrl || 'https://i.imgur.com/N9c8oEJ.png')
      .replace('{{emailLogoScale}}', (settings.emailLogoScale || 1).toString());

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
