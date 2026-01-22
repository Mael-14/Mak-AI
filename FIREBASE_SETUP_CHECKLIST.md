# Firebase Setup Checklist

Use this checklist to track your Firebase setup progress.

## Phase 1: Firebase Project Setup

- [ ] Created Firebase account
- [ ] Created new Firebase project
- [ ] Named project (e.g., "mak-ai")
- [ ] Project created successfully

## Phase 2: Enable Firebase Services

- [ ] Enabled Authentication
- [ ] Enabled Email/Password provider
- [ ] Created Firestore Database
- [ ] Selected database location
- [ ] Database created successfully

## Phase 3: Frontend Credentials

- [ ] Opened Project Settings
- [ ] Added Web app (or found existing)
- [ ] Copied API Key
- [ ] Copied Auth Domain
- [ ] Copied Project ID
- [ ] Copied Storage Bucket
- [ ] Copied Messaging Sender ID
- [ ] Copied App ID

## Phase 4: Backend Credentials

- [ ] Opened Service Accounts tab
- [ ] Generated new private key
- [ ] Downloaded JSON file
- [ ] Renamed file to `serviceAccountKey.json`
- [ ] Saved file location noted

## Phase 5: Frontend Configuration

- [ ] Navigated to `Mak-AI/` directory
- [ ] Copied `env.example` to `.env`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_API_KEY`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Filled in `EXPO_PUBLIC_FIREBASE_APP_ID`
- [ ] Set `EXPO_PUBLIC_API_BASE_URL`
- [ ] Verified `.env` file saved

## Phase 6: Backend Configuration

**Choose one method:**

### Method A: Using serviceAccountKey.json
- [ ] Placed `serviceAccountKey.json` in `Mak-AI-Backend/` directory
- [ ] Verified file location
- [ ] Created `.env` file (optional)
- [ ] Set `PORT=5000` in `.env` (optional)

### Method B: Using Environment Variable
- [ ] Copied `env.example` to `.env` in backend
- [ ] Opened `serviceAccountKey.json`
- [ ] Converted JSON to single line
- [ ] Added `FIREBASE_SERVICE_ACCOUNT_KEY` to `.env`
- [ ] Set `PORT=5000` in `.env`
- [ ] Set `NODE_ENV=development` in `.env`

## Phase 7: Installation & Testing

- [ ] Installed frontend dependencies (`npm install` in `Mak-AI/`)
- [ ] Installed backend dependencies (`npm install` in `Mak-AI-Backend/`)
- [ ] Started backend server (`npm start` in backend)
- [ ] Verified backend starts without errors
- [ ] Started frontend (`npm start` in frontend)
- [ ] Verified frontend starts without errors

## Phase 8: Verification Tests

- [ ] Tested signup flow
- [ ] Verified user appears in Firebase Console > Authentication
- [ ] Verified user document in Firestore > users collection
- [ ] Tested login flow
- [ ] Verified token is stored in AsyncStorage
- [ ] Tested password reset
- [ ] Verified email received (check spam folder)

## Phase 9: Security Check

- [ ] Verified `.env` files are in `.gitignore`
- [ ] Verified `serviceAccountKey.json` is in `.gitignore`
- [ ] Checked that sensitive files are not committed to git
- [ ] Noted Firebase API key restrictions (if needed)

## ✅ Setup Complete!

If all items are checked, your Firebase setup is complete!

---

## Troubleshooting Notes

**If backend won't start:**
- [ ] Check `serviceAccountKey.json` exists and is valid
- [ ] Check `.env` file has correct values
- [ ] Check port 5000 is not in use

**If frontend won't connect:**
- [ ] Check `.env` file has all required values
- [ ] Verify values start with `EXPO_PUBLIC_`
- [ ] Restart Expo server after changing `.env`

**If authentication fails:**
- [ ] Check Email/Password is enabled in Firebase Console
- [ ] Verify Firestore database is created
- [ ] Check network connection

---

## Quick Reference

- **Full Guide:** `FIREBASE_SETUP_GUIDE.md`
- **Quick Start:** `FIREBASE_QUICK_START.md`
- **Firebase Console:** https://console.firebase.google.com/

