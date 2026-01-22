# Google Authentication Setup Guide

This guide will help you set up Google Sign-In for your Mak AI application.

## Prerequisites

- Firebase project with Authentication enabled
- Google Cloud Console access
- Expo project configured

## Step 1: Enable Google Sign-In in Firebase

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Enable Google Provider**
   - Go to **Authentication** > **Sign-in method**
   - Find **Google** in the list
   - Click on it
   - Toggle **Enable** to ON
   - Enter your **Support email** (project support email)
   - Click **Save**

3. **Get OAuth Client IDs**
   - After enabling, Firebase will show you OAuth 2.0 Client IDs
   - You'll need:
     - **Web client ID** (for web and Firebase)
     - **iOS client ID** (for iOS app)
     - **Android client ID** (for Android app)

## Step 2: Configure Google Cloud Console (If Needed)

If you need to create OAuth credentials manually:

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project

2. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - Select application type:
     - **Web application** (for web client ID)
     - **iOS** (for iOS client ID)
     - **Android** (for Android client ID)

3. **Configure OAuth Consent Screen** (if not done)
   - Go to **APIs & Services** > **OAuth consent screen**
   - Fill in required information
   - Add scopes: `email`, `profile`, `openid`
   - Save

## Step 3: Get Client IDs

### Web Client ID
- Found in Firebase Console > Authentication > Sign-in method > Google
- Format: `xxxxx.apps.googleusercontent.com`
- This is the **Web client ID** (not Web client secret)

### iOS Client ID
- Found in Firebase Console > Authentication > Sign-in method > Google
- Or create in Google Cloud Console > Credentials > iOS
- Format: `xxxxx.apps.googleusercontent.com`

### Android Client ID
- Found in Firebase Console > Authentication > Sign-in method > Google
- Or create in Google Cloud Console > Credentials > Android
- Format: `xxxxx.apps.googleusercontent.com`
- **Note:** You'll also need your Android package name and SHA-1 certificate fingerprint

## Step 4: Configure Frontend

1. **Update `.env` file**
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
   ```

2. **Install Dependencies** (if not already installed)
   ```bash
   npm install expo-auth-session expo-web-browser
   ```

3. **Restart Expo**
   ```bash
   npm start
   ```

## Step 5: Android Configuration (For Android App)

1. **Get SHA-1 Certificate Fingerprint**
   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release keystore (if you have one)
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

2. **Add SHA-1 to Firebase**
   - Go to Firebase Console > Project Settings
   - Scroll to **Your apps** section
   - Click on your Android app
   - Click **Add fingerprint**
   - Paste your SHA-1 fingerprint
   - Download updated `google-services.json` (if needed)

3. **Add SHA-1 to Google Cloud Console**
   - Go to Google Cloud Console > Credentials
   - Edit your Android OAuth client
   - Add SHA-1 fingerprint
   - Save

## Step 6: iOS Configuration (For iOS App)

1. **Get Bundle ID**
   - Found in `app.json` or Xcode project
   - Format: `com.yourcompany.yourapp`

2. **Add Bundle ID to Firebase**
   - Go to Firebase Console > Project Settings
   - Scroll to **Your apps** section
   - Click on your iOS app
   - Verify Bundle ID matches

3. **Add Bundle ID to Google Cloud Console**
   - Go to Google Cloud Console > Credentials
   - Edit your iOS OAuth client
   - Add Bundle ID
   - Save

## Step 7: Test Google Sign-In

1. **Start the app**
   ```bash
   npm start
   ```

2. **Test Sign-Up**
   - Click "Continue with Google" on SignUp screen
   - Select Google account
   - Verify user is created in Firebase Auth
   - Verify user document is created in Firestore

3. **Test Login**
   - Click "Continue with Google" on Login screen
   - Select same Google account
   - Verify login is successful

## Troubleshooting

### "Google sign-in was cancelled"
- User cancelled the sign-in flow
- This is normal behavior

### "No ID token received from Google"
- Check that OAuth client IDs are correct in `.env`
- Verify Google provider is enabled in Firebase
- Check OAuth consent screen is configured

### "Account exists with different credential"
- User already signed up with email/password
- They need to use email/password login instead
- Or link accounts in Firebase Console

### Android: "DEVELOPER_ERROR"
- SHA-1 fingerprint not added to Firebase/Google Cloud
- Package name mismatch
- OAuth client ID incorrect

### iOS: Sign-in doesn't work
- Bundle ID mismatch
- OAuth client ID incorrect
- Check iOS client ID in `.env`

## How It Works

1. **User clicks "Continue with Google"**
2. **Expo Auth Session** opens Google sign-in
3. **User selects Google account**
4. **Google returns ID token**
5. **Firebase creates/authenticates user** with Google credential
6. **Backend creates Firestore document** (or frontend fallback)
7. **User is logged in**

## Security Notes

- ✅ OAuth client IDs are safe to expose (they're public)
- ✅ ID tokens are verified by Firebase
- ✅ User data is stored securely in Firestore
- ✅ Tokens are stored securely in AsyncStorage

## Next Steps

After setting up Google authentication:
- ✅ Test sign-up flow
- ✅ Test login flow
- ✅ Verify users in Firebase Console
- ✅ Verify Firestore documents
- ✅ Test on both iOS and Android (if applicable)

## Quick Reference

- **Firebase Console:** https://console.firebase.google.com/
- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Firebase Auth Settings:** https://console.firebase.google.com/project/_/authentication/providers

