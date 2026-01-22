# Backend Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication in the backend.

## Overview

The Google OAuth flow works as follows:
1. Frontend requests Google OAuth URL from backend
2. User authenticates with Google
3. Google redirects to backend callback with authorization code
4. Backend exchanges code for user info and creates Firebase user
5. Backend redirects to frontend with Firebase custom token
6. Frontend signs in to Firebase with custom token

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if needed
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `Mak-AI Backend`
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - `https://your-backend-domain.com/api/auth/google/callback` (for production)
   - Click **CREATE**
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Backend Environment Variables

Add to your backend `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:19006
```

**Important:** 
- For production, update `GOOGLE_REDIRECT_URI` and `BACKEND_URL` to your production backend URL
- Make sure the redirect URI matches exactly what you configured in Google Cloud Console

## Step 3: Install Dependencies

```bash
cd Mak-AI-Backend
npm install google-auth-library axios
```

## Step 4: Update Frontend Configuration

The frontend needs to know the backend URL. Update your frontend `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Step 5: Configure Expo Deep Linking

The app uses deep linking to handle the OAuth callback. The scheme is already configured in `app.json`:

```json
{
  "expo": {
    "scheme": "mak-ai"
  }
}
```

This allows URLs like `mak-ai://auth/google/callback` to open your app.

## Step 6: Test the Flow

1. Start the backend:
   ```bash
   cd Mak-AI-Backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd Mak-AI
   npm start
   ```

3. Click "Continue with Google" on login or signup screen
4. You should be redirected to Google sign-in
5. After authentication, you'll be redirected back to the app

## API Endpoints

### GET `/api/auth/google`
Returns the Google OAuth authorization URL.

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

### GET `/api/auth/google/callback`
Handles the Google OAuth callback. This endpoint:
- Receives authorization code from Google
- Exchanges code for user info
- Creates/updates Firebase user
- Creates/updates Firestore document
- Redirects to frontend with custom token

**Query Parameters:**
- `code` - Authorization code from Google

**Redirect:**
- Success: `mak-ai://auth/google/callback?token=<custom_token>&uid=<user_id>`
- Error: `mak-ai://auth/google/callback?error=<error_message>`

## Troubleshooting

### "Google OAuth not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the backend server after adding environment variables

### "Invalid redirect URI"
- Ensure the redirect URI in `.env` matches exactly what's configured in Google Cloud Console
- Check for trailing slashes or protocol mismatches (http vs https)

### "Authorization code expired"
- Authorization codes expire quickly (usually within minutes)
- Try the authentication flow again

### Deep linking not working
- Ensure `scheme: "mak-ai"` is set in `app.json`
- For iOS, you may need to configure URL schemes in Xcode
- For Android, check `android/app/src/main/AndroidManifest.xml`

### CORS errors
- Ensure `FRONTEND_URL` is set correctly in backend `.env`
- Check that CORS is configured in `src/app.js`

## Security Notes

1. **Never expose Client Secret**: The client secret should only be in backend `.env`, never in frontend code
2. **Use HTTPS in production**: Always use HTTPS for OAuth redirects in production
3. **Validate redirect URIs**: Only allow redirects to trusted domains
4. **Token expiration**: Custom tokens expire after 1 hour, users will need to re-authenticate

## Production Deployment

For production:

1. Update Google Cloud Console redirect URIs:
   - Add your production backend URL: `https://api.yourdomain.com/api/auth/google/callback`

2. Update backend `.env`:
   ```env
   GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
   BACKEND_URL=https://api.yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. Update frontend `.env`:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
   ```

4. Ensure your backend server is accessible at the configured URL

## Architecture

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│Frontend │────────>│ Backend │────────>│ Google  │────────>│ Backend │
│  App    │<────────│   API   │<────────│  OAuth  │<────────│Callback │
└─────────┘         └─────────┘         └─────────┘         └─────────┘
     │                   │                                        │
     │                   │                                        │
     │                   └───────────────┐                       │
     │                                   │                       │
     │                                   ▼                       │
     │                            ┌──────────┐                  │
     │                            │ Firebase │                  │
     │                            │   Auth   │                  │
     │                            └──────────┘                  │
     │                                                           │
     └───────────────────────────────────────────────────────────┘
                    Custom Token + User Data
```

Your Google OAuth is now configured in the backend! 🚀

