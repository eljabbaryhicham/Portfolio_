# myportfolio

This is a Next.js portfolio application built with Firebase, Cloudinary, and Genkit.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

For the application to run correctly, you will need to create a `.env.local` file in the root of your project and add the necessary environment variables. Refer to `.env.example` for the required variables.

### Production Deployment (Vercel)

When deploying to Vercel, you must set all the environment variables listed in `.env.example` in your Vercel project's **Settings > Environment Variables** section. This includes both the `NEXT_PUBLIC_` variables and all the server-side secret keys (Firebase Admin, Cloudinary, Resend, etc.).

**Important**: Do not commit your `.env.local` file to Git. It contains sensitive credentials and is already included in the `.gitignore` file.

---

## Troubleshooting

### Git Authentication Failed Error

If you see an error like `fatal: Authentication failed` or `Missing or invalid credentials` when trying to `git push`, it means your development environment is not properly authenticated with your Git provider (e.g., GitHub).

This is not an error in the application's code. It's an issue with the credentials your environment is using to talk to GitHub.

**How to Fix It:**

The exact steps depend on your development environment (local VS Code, a cloud IDE like Firebase Studio, etc.), but the general process is to **re-authenticate**.

1.  **Look for Account or Source Control Settings:** Check the settings or account management section of your IDE or platform. There is often a "Source Control" or "Accounts" tab where you can see your connected GitHub account.
2.  **Sign Out and Sign Back In:** If you find your connected account, look for an option to "Sign Out" or "Revoke Credentials." After signing out, you should be prompted to sign back in. This will refresh your authentication token.
3.  **Command-Line Authentication:** If you are using a standard terminal, you might need to update your Git credential helper. The specifics vary by operating system.

After you have successfully re-authenticated, try the `git push` command again.
