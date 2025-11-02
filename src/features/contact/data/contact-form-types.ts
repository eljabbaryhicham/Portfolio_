import { z } from 'zod';

// Define the schema for the contact form input
export const ContactFormInputSchema = z.object({
  name: z.string().describe('The name of the person sending the message.'),
  email: z.string().email().describe('The email address of the sender.'),
  message: z.string().describe('The content of the message.'),
});
export type ContactFormInput = z.infer<typeof ContactFormInputSchema>;
