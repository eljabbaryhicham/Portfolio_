
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

**VERY IMPORTANT: Fixing `Invalid JWT Signature` Error**

If your Vercel deployment fails with an error like `Invalid JWT Signature` or `invalid_grant`, it means your `FIREBASE_PRIVATE_KEY` is corrupted or incorrectly formatted in Vercel's environment variable settings. This is a very common issue with multi-line keys.

The only way to fix this is to **generate a new private key** and paste it correctly.

**Step-by-Step Instructions:**

1.  **Go to your Firebase Project Settings**:
    *   Navigate to: `https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk`
    *   Select your project from the dropdown if prompted.

2.  **Generate a New Private Key**:
    *   Click the **"Generate new private key"** button.
    *   A `.json` file will be downloaded. This file contains your new, uncorrupted private key.

3.  **Copy the Key from the Downloaded File**:
    *   Open the downloaded `.json` file in a text editor.
    *   The `private_key` value will look like this: `-----BEGIN PRIVATE KEY-----\n...some content...\n...more content...\n-----END PRIVATE KEY-----\n`
    *   **Select and copy the entire value**, starting from `-----BEGIN PRIVATE KEY-----` and ending with `-----END PRIVATE KEY-----\n`. Make sure you get everything inside the quotes.

4.  **Update the Key in Vercel**:
    *   Go to your Vercel project's **Settings > Environment Variables**.
    *   Find the `FIREBASE_PRIVATE_KEY` variable and click to edit it.
    *   **Delete the old value completely.**
    *   **Paste the new key** you just copied. Vercel is designed to handle multi-line keys correctly. Do not try to convert it to a single line or remove the newline characters yourself.
    *   Save the environment variable.

5.  **Redeploy**:
    *   Go to the "Deployments" tab in your Vercel project.
    *   Find the most recent deployment, click the "..." menu, and select **"Redeploy"** to apply the new environment variable.

This process will guarantee that Vercel has a fresh, correctly formatted key, which should resolve the authentication error.

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
