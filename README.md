
# Firebase Studio

This is a NextJS starter in Firebase Studio.

## IMPORTANT: Service Account & API Keys for Production

For security reasons, sensitive credentials required for server-side features are **not** included in the code repository. To enable full functionality in both local development and production (on Vercel), you must configure them as environment variables.

### 1. Local Development (`.env.local` file)

For local development, create a file named `.env.local` in the root of your project and add the following keys. This file is ignored by Git and should never be committed.

```
# .env.local

# --- Firebase Admin (for server-side admin tasks) ---
# See instructions below for generating a service account file.
# These are only needed if you are NOT using the service-account.json file method.
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# --- Cloudinary Credentials (for media uploads) ---
# Get these from your Cloudinary dashboard(s)
CLOUDINARY_API_KEY_1="your_primary_api_key"
CLOUDINARY_API_SECRET_1="your_primary_api_secret"
CLOUDINARY_API_KEY_2="your_extended_api_key"
CLOUDINARY_API_SECRET_2="your_extended_api_secret"

# --- Public Cloudinary Variables (safe for the client) ---
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1="your_primary_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1="your_primary_upload_preset"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2="your_extended_cloud_name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2="your_extended_upload_preset"

# --- Email Service (Resend) ---
RESEND_API_KEY="your_resend_api_key"

# --- Generative AI (Google Gemini) ---
GEMINI_API_KEY="your_gemini_api_key"
```

### 2. Production Deployment (Vercel Environment Variables)

When you deploy to Vercel, you **must** add the same variables from your `.env.local` file to your Vercel project's settings.

1.  Go to your project dashboard on Vercel.
2.  Click the **Settings** tab.
3.  Click **Environment Variables** in the left menu.
4.  Add each secret key from your `.env.local` file (e.g., `FIREBASE_PROJECT_ID`, `CLOUDINARY_API_SECRET_1`, `RESEND_API_KEY`, etc.). **Do not** add the `NEXT_PUBLIC_` prefix to your secret keys.
5.  After adding all variables, **redeploy** your project for the changes to take effect.

---

## Firebase Service Account File (Alternative for Local Dev)

As an alternative for **local development only**, you can use a service account JSON file for Firebase Admin tasks.

### Steps:

1.  **Generate a New Private Key:**
    *   Navigate to your Firebase project's settings: `Project settings` > `Service accounts`.
    *   Click the **"Generate new private key"** button. A JSON file containing your service account credentials will be downloaded.

2.  **Create the File:**
    *   In the root of this project, navigate into the `docs` directory.
    *   Create a new file named `service-account.json`.

3.  **Add Credentials to the File:**
    *   Open the JSON file you downloaded from Firebase.
    *   Copy the **entire contents** of the downloaded file.
    *   Paste the contents into the `docs/service-account.json` file you created.

**This `docs/service-account.json` file is explicitly ignored by Git (`.gitignore`) and will not be committed to your repository.**
# myportfolio
# myportfolio
