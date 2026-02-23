# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- Git repository with your code committed

## Deployment Steps

### 1. Link Your Project to Vercel
```bash
cd Mak-AI/Mak-AI-Backend
vercel link
```
Follow the prompts to create a new project or link to an existing one.

### 2. Set Environment Variables
Deploy your environment variables to Vercel:

```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

**For FIREBASE_SERVICE_ACCOUNT_KEY:**
- Get your `serviceAccountKey.json` from Firebase Console
- Open the file and copy its entire JSON content
- Paste it as a single line when prompted

**Environment variables needed:**
- `NODE_ENV` = production (Vercel sets this automatically)
- `PORT` (will be set automatically by Vercel)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (required)
- `GOOGLE_CLIENT_ID` (if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
- `FRONTEND_URL` (your frontend URL for CORS)

### 3. Deploy
```bash
vercel --prod
```

Or deploy from Git by pushing to main branch (if connected).

### 4. Verify Deployment
Test your API endpoints:
```bash
curl https://your-vercel-url.vercel.app/api/health
```

## Important Notes

### Firebase Service Account Key
**DO NOT commit serviceAccountKey.json to git.** Instead:
1. Use the environment variable `FIREBASE_SERVICE_ACCOUNT_KEY`
2. The backend will automatically use it if the file doesn't exist
3. Ensure the key is properly formatted as JSON in the environment variable

### CORS Configuration
Update `FRONTEND_URL` environment variable to your frontend domain:
- Mobile: `https://your-expo-app.com` or your deployment URL
- Web: `https://your-web-app.vercel.app`

### Monitoring
- View logs: `vercel logs --tail`
- Check deployment status: `vercel status`

## Troubleshooting

### Port Already in Use
Vercel automatically assigns the PORT. If you get a port error, ensure your server code uses:
```javascript
const PORT = process.env.PORT || 5000;
```

### Firebase Authentication Errors
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON
- Check Firebase project ID in the key matches your Firebase project
- Ensure the service account has proper permissions in Firestore

### CORS Errors
- Update `FRONTEND_URL` in environment variables
- Restart deployment after updating CORS settings

## Rollback
Revert to a previous deployment:
```bash
vercel rollback
```

## Local Testing with Vercel
Test locally before deploying:
```bash
vercel dev
```
This starts a local Vercel-like environment at http://localhost:3000
