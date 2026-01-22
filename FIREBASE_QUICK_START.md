# Firebase Setup Quick Start

A condensed version of the Firebase setup guide for quick reference.

## 🚀 Quick Setup (5 Minutes)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name → Continue → Create project

### 2. Enable Services
- **Authentication:** Enable Email/Password
- **Firestore:** Create database (test mode)

### 3. Get Frontend Config
1. Project Settings → General → Your apps
2. Add Web app (or click existing)
3. Copy config values

### 4. Get Backend Key
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `serviceAccountKey.json`

### 5. Configure Frontend
```bash
cd Mak-AI
copy env.example .env
# Edit .env with Firebase config values
```

### 6. Configure Backend
```bash
cd Mak-AI-Backend
# Place serviceAccountKey.json here
copy env.example .env
# Edit .env (optional, only if not using serviceAccountKey.json)
```

## 📋 Frontend .env Template

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## 📋 Backend Setup

**Option 1:** Place `serviceAccountKey.json` in `Mak-AI-Backend/`

**Option 2:** Add to `.env`:
```env
PORT=5000
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## ✅ Verify

1. Start backend: `cd Mak-AI-Backend && npm start`
2. Start frontend: `cd Mak-AI && npm start`
3. Try signup in app

## 🆘 Common Issues

- **Invalid API key:** Check `.env` values, restart Expo
- **Service account error:** Check `serviceAccountKey.json` location
- **CORS error:** Use IP address instead of localhost for physical devices

For detailed guide, see `FIREBASE_SETUP_GUIDE.md`

