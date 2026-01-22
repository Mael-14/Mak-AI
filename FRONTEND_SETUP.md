# Frontend Setup Guide

This guide will help you set up the frontend with Firebase Authentication and backend API integration.

## Prerequisites

- Node.js and npm installed
- Firebase project created
- Backend server running (see `Mak-AI-Backend/README.md`)

## Installation Steps

### 1. Install Dependencies

```bash
cd Mak-AI
npm install
```

This will install:
- `firebase` - Firebase SDK for authentication
- `axios` - HTTP client for API calls
- `@react-native-async-storage/async-storage` - Local storage for tokens

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. If you haven't added a web app, click "Add app" and select Web (</>)
6. Copy the Firebase configuration values

### 3. Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Firebase credentials:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
   ```

   **Note:** For production, update `EXPO_PUBLIC_API_BASE_URL` with your backend URL.

### 4. Update Firebase Config File

If you prefer to hardcode Firebase config (not recommended for production), edit `config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... etc
};
```

### 5. Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

### 6. Update Backend URL

Edit `services/api.js` and update the `API_BASE_URL`:

```javascript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://YOUR_BACKEND_URL/api';
```

**For local development:**
- Android Emulator: `http://10.0.2.2:5000/api`
- iOS Simulator: `http://localhost:5000/api`
- Physical device: `http://YOUR_COMPUTER_IP:5000/api`

**For production:**
- `https://your-backend-domain.com/api`

### 7. Start the App

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for web

## How It Works

### Sign Up Flow

1. User fills signup form (name, email, password)
2. Frontend validates input
3. Creates user in Firebase Authentication
4. Updates Firebase Auth profile with display name
5. Gets ID token from Firebase
6. Sends user data to backend API (`/api/auth/signup`)
7. Backend creates Firestore document
8. Token and user data stored in AsyncStorage
9. User redirected to login screen

### Login Flow

1. User fills login form (email, password)
2. Frontend validates input
3. Signs in with Firebase Authentication
4. Gets ID token from Firebase
5. Sends token to backend API (`/api/auth/login`) for verification
6. Backend verifies token and returns user profile
7. Token and user data stored in AsyncStorage
8. User redirected to home screen

### Password Reset Flow

1. User clicks "Forgot password?"
2. If email is entered, validates email
3. Sends password reset email via Firebase Auth
4. User receives email with reset link

## File Structure

```
Mak-AI/
├── config/
│   └── firebase.js          # Firebase configuration
├── services/
│   └── api.js                # Backend API service
├── app/
│   ├── LoginScreen.jsx       # Login screen with Firebase Auth
│   └── SignUpScreen.jsx     # Signup screen with Firebase Auth
└── .env                      # Environment variables (not committed)
```

## Testing

### Test Signup

1. Open the app
2. Navigate to Sign Up screen
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: Test1234 (must have uppercase, lowercase, number)
4. Check "I agree to terms"
5. Click SignUp
6. Check Firebase Console > Authentication for new user
7. Check Firestore > users collection for user document

### Test Login

1. Use the credentials from signup
2. Navigate to Login screen
3. Enter email and password
4. Click Login
5. Should redirect to home screen
6. Check AsyncStorage for stored token

### Test Password Reset

1. On Login screen, click "Forgot password?"
2. Enter email address
3. Check email inbox for reset link

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"

- Check that Firebase config values in `.env` are correct
- Make sure environment variables are prefixed with `EXPO_PUBLIC_`
- Restart Expo server after changing `.env`

### "Network Error" or "Connection Refused"

- Check that backend server is running
- Verify `EXPO_PUBLIC_API_BASE_URL` is correct
- For physical devices, use your computer's IP address instead of `localhost`
- Check firewall settings

### "User already exists"

- User is already registered in Firebase
- Try logging in instead
- Or delete user from Firebase Console > Authentication

### Token not stored

- Check AsyncStorage permissions
- Verify `@react-native-async-storage/async-storage` is installed
- Check console for errors

## Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Firebase API keys are safe** - They're public and restricted by domain/app ID
3. **Tokens are stored securely** - AsyncStorage is encrypted on device
4. **Always verify tokens on backend** - Don't trust client-side tokens alone

## Next Steps

- Implement token refresh mechanism
- Add logout functionality
- Create protected routes that require authentication
- Add user profile screen
- Implement Google OAuth (if needed)

