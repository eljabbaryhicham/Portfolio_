
import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured on the server.');
    return NextResponse.json(
      { success: false, message: 'Server is not configured for sending emails.' },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);
  const TO_EMAIL = 'eljabbaryhicham@gmail.com';
  const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requires this for free tier

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

  try {
    const { data, error } = await resend.emails.send({
      from: `BELOFTED <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: `New Message from ${name}`,
      reply_to: email,
      html: `
        <body style="background-color: #0d1a2e; color: #e5e7eb; margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1a2b42; border-radius: 8px; border: 1px solid #2a3f5f;">
            <tr>
              <td style="padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <img src="https://i.imgur.com/N9c8oEJ.png" alt="Logo" style="max-width: 150px; height: auto;">
                </div>
                <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0 0 24px; text-align: center;">Message From BELOFTED</h1>
                <p style="margin: 0 0 16px; text-align: center;">You have received a new message from your portfolio website.</p>
                
                <div style="background-color: #0d1a2e; padding: 20px; border-radius: 8px;">
                  <p style="margin: 0 0 8px;"><strong>Name:</strong> ${name}</p>
                  <p style="margin: 0 0 16px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #60a5fa; text-decoration: none;">${email}</a></p>
                  <hr style="border: none; border-top: 1px solid #2a3f5f; margin: 16px 0;">
                  <p style="margin: 0 0 8px; font-weight: bold; color: #d1d5db;">Message:</p>
                  <p style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${message}</p>
                </div>

                <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">You can reply directly to this email to contact the user.</p>
              </td>
            </tr>
          </table>
        </body>
      `,
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
