import * as dotenv from 'dotenv';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    dotenv.config();
    console.log('Instrumentation: .env file loaded for server-side execution.');
  }
}
