
# Firebase Studio

This is a NextJS starter in Firebase Studio.

## IMPORTANT: Service Account Credentials for Server-Side Features

For security reasons, the Firebase service account key, which is required for certain server-side operations (like Genkit flows that use the Firebase Admin SDK), is **not** included in this repository.

To enable full server-side functionality in your local development environment, you **must** manually create and populate a `service-account.json` file.

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

**This `docs/service-account.json` file is explicitly ignored by Git (via `.gitignore`) and will not be committed to your repository.** This is standard practice for keeping sensitive credentials secure and is intended for your local development setup only. For deployed environments, you should use a secure secret management system provided by your hosting provider (e.g., Cloud Run Secret Manager).

To get started, take a look at src/app/page.tsx.
# myportfolio
# myportfolio
