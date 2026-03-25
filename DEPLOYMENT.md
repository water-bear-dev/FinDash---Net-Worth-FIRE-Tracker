# Deploying FinDash

FinDash is a 100% client-side React application built with Vite. It does not require a backend server or a database, making it extremely easy and completely **free** to host on modern static web hosting platforms.

Because FinDash uses `HashRouter` for its navigation, you won't need to configure complex server-side routing rules for deep linking—it works out-of-the-box on any static file server.

Here are the step-by-step guides for deploying FinDash to the most popular free hosting services.

---

## 1. Deploying to Vercel (Recommended)

Vercel is the creator of Next.js and offers arguably the fastest and easiest deployment experience for front-end apps.

**Prerequisites:** Your FinDash code must be pushed to a repository on GitHub, GitLab, or Bitbucket.

1. Create a free account at [Vercel.com](https://vercel.com/signup).
2. Click **Add New** -> **Project**.
3. Import your `FinDash` repository from your Git provider.
4. Vercel will automatically detect that you are using Vite. The default build settings should be pre-filled:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. Within a minute, Vercel will build your app and provide you with a live, secure HTTPS URL. Any future pushes to your `main` Git branch will automatically trigger a new deployment.

---

## 2. Deploying to Netlify

Netlify is another excellent platform for hosting static site applications with a very generous free tier.

**Prerequisites:** Your FinDash code must be pushed to a repository on GitHub, GitLab, or Bitbucket.

1. Create a free account at [Netlify.com](https://app.netlify.com/signup).
2. Click **Add new site** -> **Import an existing project**.
3. Choose your Git provider and authorize Netlify.
4. Select your `FinDash` repository.
5. In the Build settings, confirm the following:
   - **Base directory**: (leave blank)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Deploy site**.
7. Netlify will build your application and assign it a random URL (which you can change later in the site settings). Future commits to your `main` branch will automatically redeploy the site.

---

## 3. Deploying to GitHub Pages

If you already have your code on GitHub, you can host it directly from your repository for free using GitHub Pages.

1. In your `package.json`, add a `"homepage"` field at the top level with your GitHub Pages URL. E.g., `"homepage": "https://yourusername.github.io/FinDash-Net-Worth-FIRE-Tracker",`
2. Update your `vite.config.ts` to include the `base` path (which is your repository name):
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/FinDash-Net-Worth-FIRE-Tracker/', // Replace with your actual repo name
   })
   ```
3. Install the `gh-pages` package as a dev dependency:
   ```bash
   npm install gh-pages --save-dev
   ```
4. Add the following scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist",
     // ... your other scripts
   }
   ```
5. Run the deployment command from your terminal:
   ```bash
   npm run deploy
   ```
6. Go to your GitHub repository settings on the web. Navigate to **Pages** on the left sidebar. Ensure the source is set to build from the `gh-pages` branch. 
7. Your site is now live! (You will need to manually run `npm run deploy` each time you want to update the live site, unlike Vercel/Netlify which use auto-deployments).

---

## Post-Deployment: API Keys

Because FinDash prioritizes privacy, you **do not** add your FMP (Financial Modeling Prep) API key or Google Gemini API key into the environment variables of Vercel or Netlify. 

Instead, once your app is live:
1. Navigate to your new live URL.
2. Go to the **Settings** page within the FinDash app.
3. Paste your API keys directly into the app. They will be saved securely within that specific browser's LocalStorage.
