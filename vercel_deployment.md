# Deploying DropVault on Vercel (Single Free Site)

This guide explains how to deploy both the **React Frontend** and **Node.js/Express Backend** of DropVault on Vercel as a single unified project for free.

---

## ⚠️ Important Serverless Limitations on Vercel

Before deploying, please note how Vercel's free serverless runtime impacts file sharing:
1. **Request Size Limit:** Vercel has a hard limit of **4.5 MB** on request payloads for serverless functions on the free tier. Files larger than this will fail to upload.
2. **Ephemeral File System:** The local disk system on Vercel is read-only (except for the temporary `/tmp` directory, which is wiped frequently when serverless functions spin down).
3. **Storage Workaround:** For a true production deployment on Vercel, you should swap the local backend upload folder with a free cloud storage bucket (e.g., **Vercel Blob** (250MB free), **Supabase Storage** (1GB free), or **Cloudinary**).

---

## Step-by-Step Deployment Guide

To deploy DropVault as a single site, we will configure Vercel to route frontend requests to our static Vite build, and api requests `/api/*` to our Express server running as a serverless function.

### 1. Create a `vercel.json` file at the Root Directory

Create a file named `vercel.json` in the root folder of your project (`k:/projects/sydions-scheduler-task3/vercel.json`) to define routes and builds:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 2. Adjust Backend for Serverless Compatibility

Vercel expects serverless Node.js endpoints to export the Express app object rather than calling `app.listen()` directly. 

Modify the bottom of your `backend/server.js` from:
```javascript
app.listen(PORT, () => { ... });
```
To:
```javascript
// Expose the app for Vercel serverless execution
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`DropVault backend server running on port ${PORT}`);
  });
}
export default app;
```

Additionally, update directories to write metadata to `/tmp` in serverless environments:
```javascript
const isProduction = process.env.NODE_ENV === 'production';
const UPLOADS_DIR = isProduction ? '/tmp' : path.join(__dirname, 'uploads');
const DB_FILE = isProduction ? '/tmp/metadata.json' : path.join(__dirname, 'metadata.json');
```

### 3. Update Frontend API Client URL

In `src/App.jsx`, change your API base URL requests from `http://localhost:5000/api` to relative paths `/api` so it requests from the same host:

```javascript
// Change this:
const response = await axios.post('http://localhost:5000/api/upload', ...);

// To this:
const response = await axios.post('/api/upload', ...);
```

### 4. Deploying to Vercel via CLI or Github

#### Option A: Deploy via Github (Recommended)
1. Commit your repository changes and push them to a Github repository.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
3. Import your Github repository.
4. Keep the default settings (Vercel automatically detects Vite).
5. Click **Deploy**.

#### Option B: Deploy via Vercel CLI
Run the following commands in the project root:
```bash
npm install -g vercel
vercel login
vercel
```
Follow the interactive prompts to link and deploy your site instantly.
