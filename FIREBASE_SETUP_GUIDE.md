# Complete Firebase Credentials Setup Guide

This guide will walk you through setting up Firebase credentials for both the frontend and backend of your Mak AI application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Create Firebase Project](#step-1-create-firebase-project)
3. [Step 2: Enable Firebase Services](#step-2-enable-firebase-services)
4. [Step 3: Get Frontend Credentials](#step-3-get-frontend-credentials)
5. [Step 4: Get Backend Credentials](#step-4-get-backend-credentials)
6. [Step 5: Configure Frontend](#step-5-configure-frontend)
7. [Step 6: Configure Backend](#step-6-configure-backend)
8. [Step 7: Verify Setup](#step-7-verify-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google account
- Node.js installed
- Firebase project (we'll create this)

---

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `mak-ai` (or your preferred name)
   - Click **"Continue"**

3. **Configure Google Analytics** (Optional)
   - Choose whether to enable Google Analytics
   - Select or create an Analytics account
   - Click **"Create project"**

4. **Wait for Project Creation**
   - Firebase will create your project (takes 30-60 seconds)
   - Click **"Continue"** when ready

---

## Step 2: Enable Firebase Services

### Enable Authentication

1. **Navigate to Authentication**
   - In Firebase Console, click **"Authentication"** in the left sidebar
   - Click **"Get started"** if prompted

2. **Enable Email/Password Provider**
   - Click on the **"Sign-in method"** tab
   - Find **"Email/Password"** in the list
   - Click on it
   - Toggle **"Enable"** to ON
   - Click **"Save"**

### Enable Firestore Database

1. **Navigate to Firestore Database**
   - Click **"Firestore Database"** in the left sidebar
   - Click **"Create database"**

2. **Choose Security Rules**
   - Select **"Start in test mode"** (we'll update rules later)
   - Click **"Next"**

3. **Choose Location**
   - Select a location closest to your users
   - Click **"Enable"**
   - Wait for database creation (takes 1-2 minutes)

---

## Step 3: Get Frontend Credentials

These credentials are used by your React Native/Expo app to connect to Firebase.

### Option A: Add Web App (Recommended for Expo)

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select **"Project settings"**

2. **Add Web App**
   - Scroll down to **"Your apps"** section
   - Click the **Web icon** `</>` to add a web app
   - Register app:
     - App nickname: `Mak AI Web` (or any name)
     - Check **"Also set up Firebase Hosting"** (optional)
     - Click **"Register app"**

3. **Copy Firebase Configuration**
   - You'll see a code snippet with your config
   - Copy these values (you'll need them):
     ```javascript
     const firebaseConfig = {
       apiKey: "AIza...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abcdef"
     };
     ```
   - Click **"Continue to console"**

### Option B: Get from General Settings

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select **"Project settings"**

2. **Find Your Config**
   - Scroll to **"Your apps"** section
   - If you already have a web app, click on it
   - You'll see the config values

---

## Step 4: Get Backend Credentials

These credentials are used by your Express.js backend to authenticate with Firebase Admin SDK.

### Method 1: Service Account Key File (Recommended for Development)

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select **"Project settings"**

2. **Navigate to Service Accounts**
   - Click on the **"Service accounts"** tab

3. **Generate Private Key**
   - Click **"Generate new private key"** button
   - A dialog will appear warning about keeping the key secure
   - Click **"Generate key"**
   - A JSON file will download automatically

4. **Save the File**
   - The file will be named something like: `your-project-id-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
   - **Rename it to:** `serviceAccountKey.json`
   - **Move it to:** `Mak-AI-Backend/` directory (root of backend folder)

### Method 2: Environment Variable (Recommended for Production)

1. **Open the Downloaded JSON File**
   - Open the service account key JSON file you downloaded
   - Copy the entire content

2. **Convert to Single Line** (for .env file)
   - Remove all line breaks and spaces
   - Or use an online JSON minifier
   - It should look like: `{"type":"service_account","project_id":"...",...}`

---

## Step 5: Configure Frontend

### 5.1 Create Frontend .env File

1. **Navigate to Frontend Directory**
   ```bash
   cd Mak-AI
   ```

2. **Copy Example File**
   ```bash
   # Windows
   copy env.example .env
   
   # Mac/Linux
   cp env.example .env
   ```

3. **Open .env File**
   - Open `Mak-AI/.env` in a text editor

4. **Fill in Firebase Credentials**
   ```env
   # Replace these with your actual Firebase config values
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your_actual_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   
   # Backend API URL
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```

   **Where to find each value:**
   - `apiKey`: From Firebase config (starts with "AIza")
   - `authDomain`: `your-project-id.firebaseapp.com`
   - `projectId`: Your Firebase project ID
   - `storageBucket`: `your-project-id.appspot.com`
   - `messagingSenderId`: The numeric sender ID
   - `appId`: The app ID (format: `1:xxxxx:web:xxxxx`)

### 5.2 Verify Frontend Config File

1. **Check config/firebase.js**
   - Open `Mak-AI/config/firebase.js`
   - It should read from environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "...",
     // ... etc
   };
   ```
   - ✅ This is already configured correctly

---

## Step 6: Configure Backend

### Option A: Using serviceAccountKey.json File (Easier)

1. **Place Service Account Key File**
   - Copy `serviceAccountKey.json` to `Mak-AI-Backend/` directory
   - File structure should be:
     ```
     Mak-AI-Backend/
     ├── serviceAccountKey.json  ← Place it here
     ├── server.js
     ├── package.json
     └── src/
     ```

2. **Create Backend .env File** (Optional but Recommended)
   ```bash
   cd Mak-AI-Backend
   copy env.example .env
   ```

3. **Update .env File**
   ```env
   PORT=5000
   NODE_ENV=development
   ```
   - The Firebase config will be read from `serviceAccountKey.json` automatically

### Option B: Using Environment Variable

1. **Create Backend .env File**
   ```bash
   cd Mak-AI-Backend
   copy env.example .env
   ```

2. **Open serviceAccountKey.json**
   - Open the downloaded service account key file
   - Copy the entire JSON content

3. **Convert to Single Line**
   - Remove all line breaks
   - Example: `{"type":"service_account","project_id":"mak-ai-12345",...}`

4. **Add to .env File**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Paste the entire JSON as a single line (no line breaks)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"mak-ai-12345","private_key_id":"abc123",...}
   
   # Optional: Firebase Database URL (usually auto-detected)
   FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
   ```

   **Important:** 
   - The entire JSON must be on ONE line
   - No line breaks or extra spaces
   - Keep the quotes around the JSON

---

## Step 7: Verify Setup

### Verify Frontend Setup

1. **Check Environment Variables**
   ```bash
   cd Mak-AI
   # Make sure .env file exists and has values
   ```

2. **Start Frontend** (to test)
   ```bash
   npm start
   ```
   - If Firebase config is wrong, you'll see errors in the console

### Verify Backend Setup

1. **Check Service Account Key**
   ```bash
   cd Mak-AI-Backend
   # Make sure serviceAccountKey.json exists OR FIREBASE_SERVICE_ACCOUNT_KEY is in .env
   ```

2. **Install Dependencies** (if not done)
   ```bash
   npm install
   ```

3. **Start Backend Server**
   ```bash
   npm start
   ```

4. **Check for Errors**
   - If you see: `Server is running on port 5000` → ✅ Success!
   - If you see Firebase config errors → Check your service account key

### Test Authentication Flow

1. **Start Backend**
   ```bash
   cd Mak-AI-Backend
   npm start
   ```

2. **Start Frontend** (in another terminal)
   ```bash
   cd Mak-AI
   npm start
   ```

3. **Test Signup**
   - Open app on emulator/device
   - Try to sign up with a test email
   - Check Firebase Console > Authentication for new user
   - Check Firestore > users collection for user document

---

## Troubleshooting

### Frontend Issues

#### "Firebase: Error (auth/invalid-api-key)"
- **Solution:** 
  - Check `.env` file has correct `EXPO_PUBLIC_FIREBASE_API_KEY`
  - Make sure environment variable names start with `EXPO_PUBLIC_`
  - Restart Expo server after changing `.env`

#### "Firebase: Error (auth/network-request-failed)"
- **Solution:**
  - Check internet connection
  - Verify Firebase project is active
  - Check Firebase Console for any service issues

#### Environment Variables Not Loading
- **Solution:**
  - Make sure `.env` file is in `Mak-AI/` root directory
  - Restart Expo server completely
  - Check variable names start with `EXPO_PUBLIC_`

### Backend Issues

#### "Error loading Firebase service account"
- **Solution:**
  - Check `serviceAccountKey.json` exists in `Mak-AI-Backend/` directory
  - OR check `FIREBASE_SERVICE_ACCOUNT_KEY` in `.env` is valid JSON
  - Make sure JSON is on a single line (if using .env)

#### "Cannot find module '../../serviceAccountKey.json'"
- **Solution:**
  - Verify file is named exactly `serviceAccountKey.json`
  - Check it's in the `Mak-AI-Backend/` root directory
  - Check file permissions

#### "Invalid service account key"
- **Solution:**
  - Re-download service account key from Firebase Console
  - Make sure you didn't modify the JSON content
  - If using .env, ensure JSON is properly formatted on one line

#### Port Already in Use
- **Solution:**
  - Change `PORT` in `.env` to a different port (e.g., 5001)
  - Or stop the process using port 5000

### General Issues

#### CORS Errors
- **Solution:**
  - Backend CORS is already configured
  - If issues persist, check `src/app.js` CORS settings
  - For physical devices, use your computer's IP instead of `localhost`

#### Firestore Permission Denied
- **Solution:**
  - Check Firestore security rules in `firebase/firestore.rules`
  - Make sure rules are deployed
  - Temporarily use test mode for development

---

## Security Best Practices

### ✅ DO:
- ✅ Keep `.env` files out of version control (already in `.gitignore`)
- ✅ Never commit `serviceAccountKey.json` to git
- ✅ Use environment variables in production
- ✅ Rotate service account keys periodically
- ✅ Restrict Firebase API keys by domain/app (in Firebase Console)

### ❌ DON'T:
- ❌ Commit `.env` files to git
- ❌ Commit `serviceAccountKey.json` to git
- ❌ Share service account keys publicly
- ❌ Use production keys in development (if possible)

---

## Quick Reference

### Frontend Credentials Location
- **File:** `Mak-AI/.env`
- **Config File:** `Mak-AI/config/firebase.js`
- **Values Needed:** API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID

### Backend Credentials Location
- **File:** `Mak-AI-Backend/serviceAccountKey.json` OR `Mak-AI-Backend/.env`
- **Config File:** `Mak-AI-Backend/src/config/firebase.js`
- **Values Needed:** Service Account Key (JSON)

### Firebase Console Links
- **Main Console:** https://console.firebase.google.com/
- **Project Settings:** https://console.firebase.google.com/project/_/settings/general
- **Authentication:** https://console.firebase.google.com/project/_/authentication
- **Firestore:** https://console.firebase.google.com/project/_/firestore
- **Service Accounts:** https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk

---

## Next Steps

After completing this setup:

1. ✅ Test signup flow
2. ✅ Test login flow
3. ✅ Test password reset
4. ✅ Verify users appear in Firebase Console
5. ✅ Verify user documents in Firestore

If everything works, you're ready to continue development! 🎉

