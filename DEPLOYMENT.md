# LunchSpin Deployment Guide

This guide covers how to set up, configure, and deploy the LunchSpin web application.

## 1. Prerequisites & Tech Stack

*   **Frontend**: React (TypeScript)
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google Gemini API (`@google/genai`)
*   **Data Persistence**: LocalStorage (Browser-based)
*   **Runtime**: Node.js (for build process)

---

## 2. Gemini API Key Setup (Required)

LunchSpin uses Google's Gemini models for restaurant discovery and formatting. You must generate an API key.

1.  **Visit Google AI Studio**: Go to [aistudio.google.com](https://aistudio.google.com/).
2.  **Sign In**: Use your Google Account.
3.  **Create API Key**:
    *   Click on **"Get API key"** in the sidebar.
    *   Click **"Create API key"**.
    *   Select an existing Google Cloud project or create a new one.
4.  **Copy the Key**: You will receive a string starting with `AIza...`. Keep this secure.
5.  **Billing (Optional but Recommended)**:
    *   The free tier allows for a generous amount of requests.
    *   For higher rate limits, enable billing on the associated Google Cloud Project.

> **Security Note**: Since this is a client-side application, the API Key will be exposed to the browser.
> *   **For Demo/Personal Use**: You can restrict the API key in the Google Cloud Console to only accept requests from your specific domain (e.g., `your-app.vercel.app`).
> *   **For Production**: It is best practice to proxy these requests through a lightweight backend (like Vercel Functions or Next.js API routes) to hide the key, though this app is configured for direct client access for simplicity.

---

## 3. Database Setup (Local Storage)

**No external database setup is required.**

LunchSpin uses a **"Local Profile"** architecture:
*   **Data Storage**: All lists, history, and preferences are stored in the user's browser `localStorage`.
*   **User Identity**: The "Login" feature generates a deterministic ID based on the email provided. This partitions data so multiple users can share a device, but data does **not** sync across different devices automatically.
*   **Backup**: Users can manually export/import their data via the **Settings > Data Management** screen (JSON format).

---

## 4. Configuration Variables

The application relies on specific environment variables to function.

| Variable Name | Description | Value Example |
| :--- | :--- | :--- |
| `API_KEY` | **(Required)** Your Google Gemini API Key. | `AIzaSyD...` |

### Modifying the Code for API Key Injection
Depending on your build tool (Vite, Next.js, CRA), you typically need to prefix environment variables or configure your bundler to expose `process.env.API_KEY`.

**If using Vite (Recommended):**
1.  Create a `.env` file.
2.  Add `VITE_API_KEY=AIzaSy...`
3.  Update `services/geminiService.ts` to use `import.meta.env.VITE_API_KEY` **OR** configure `vite.config.ts` to define `process.env`.

**If using Vercel/Netlify (Automatic):**
Most cloud providers allow you to define `API_KEY` in their dashboard, and you may need to adjust your build config to ensure it's baked into the frontend bundle.

---

## 5. Deployment Instructions

### Option A: Vercel (Recommended)

Vercel is the easiest way to deploy React apps.

1.  **Push to Git**: Push your code to a GitHub, GitLab, or Bitbucket repository.
2.  **Import Project**:
    *   Log in to [Vercel](https://vercel.com).
    *   Click **"Add New..."** > **"Project"**.
    *   Select your repository.
3.  **Configure Build**:
    *   **Framework Preset**: Vercel usually auto-detects "Create React App" or "Vite".
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist` (for Vite) or `build` (for CRA).
4.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Key: `API_KEY`
    *   Value: `Your_Gemini_Key_Here`
5.  **Deploy**: Click **"Deploy"**.

### Option B: Netlify

1.  **Connect to Git**:
    *   Log in to [Netlify](https://www.netlify.com/).
    *   Click **"Add new site"** > **"Import an existing project"**.
    *   Connect your Git provider.
2.  **Build Settings**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist` or `build`
3.  **Environment Variables**:
    *   Click **"Add environment variable"**.
    *   Key: `API_KEY`
    *   Value: `Your_Gemini_Key_Here`
4.  **Deploy**: Click **"Deploy site"**.

### Option C: Firebase Hosting

1.  **Install CLI**: `npm install -g firebase-tools`
2.  **Login**: `firebase login`
3.  **Initialize**: `firebase init`
    *   Select **Hosting**.
    *   Use an existing project or create new.
    *   **Public directory**: `dist` (or `build`).
    *   **Single-page app**: Yes.
    *   **GitHub actions**: Optional.
4.  **Build**: `npm run build` (Note: You must have a `.env` file locally for the build to pick up the API key, as Firebase Hosting serves static files).
5.  **Deploy**: `firebase deploy`

---

## 6. Troubleshooting

*   **"Gemini API Error" / 400 Bad Request**:
    *   Check that your API key is valid.
    *   Ensure the "Generative Language API" is enabled in your Google Cloud Console.
    *   Verify the key has permissions to use the `gemini-2.5-flash` model.
*   **"No maps grounding data returned"**:
    *   The Discovery mode relies on Google Search grounding. If the AI cannot find a location match, it may return generic text. Try adding a city name to your search (e.g., "Sushi in Seattle" instead of just "Sushi").
*   **Lists disappearing**:
    *   Ensure you are using the exact same email address in the Login screen. The ID generation is case-insensitive but sensitive to typos.
    *   Check if you are in "Incognito" or "Private" mode, as LocalStorage is cleared when the window closes.
