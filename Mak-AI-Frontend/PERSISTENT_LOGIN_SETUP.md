# Persistent Login Setup - Complete Guide

## Overview

Your app now has persistent login functionality that works just like the persistent onboarding feature. Users will automatically stay logged in when they close and reopen the app, unless they explicitly log out.

## What Was Implemented

### 1. New Utility File: `utils/loginStorage.js`
This module provides all functions needed for persistent login management:

- **`saveLoginData(token, userData)`** - Save credentials after login/signup
- **`getLoginData()`** - Retrieve stored credentials on app startup  
- **`clearLoginData()`** - Clear all stored data on logout
- **`isPersistentLoginEnabled()`** - Check if persistent login is active
- **`getStoredUserData()`** - Get only the cached user data
- **`getStoredAuthToken()`** - Get only the cached auth token
- **`updateStoredUserData(userData)`** - Update user data without resetting token

### 2. Updated AuthContext (`context/AuthContext.jsx`)
Enhanced to:
- Use the new `loginStorage` utility functions
- Pre-load cached user data while Firebase syncs
- Properly refresh and save tokens on authentication state changes
- Clear all data on logout using the utility

### 3. Updated Login Screens
Both **LoginScreen.jsx** and **SignUpScreen.jsx** now use `saveLoginData()` instead of direct AsyncStorage calls:
- Email/password login
- Email/password signup
- Google OAuth login
- Google OAuth signup

All variants use the same centralized persistent storage mechanism.

## How It Works

```
App Launch
    ↓
AuthContext initializes
    ↓
loginStorage.getLoginData() retrieves cached credentials
    ↓
Show cached user data immediately (better UX)
    ↓
Firebase.onAuthStateChanged() syncs with backend
    ↓
If user still authenticated → Update and save fresh token
If user logged out → Clear all cached data
    ↓
App shows appropriate screen (tabs if logged in, LoginScreen if not)
```

## Usage in Your Components

### Accessing the Current User

```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, userData, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <ActivityIndicator />;
  }
  
  if (isAuthenticated) {
    return <Text>Welcome, {userData.name}!</Text>;
  }
  
  return <Text>Please log in</Text>;
};
```

### Logging Out

```javascript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout(); // Automatically clears persistent data
};
```

### Manually Managing Persistent Data

```javascript
import { 
  saveLoginData, 
  getLoginData, 
  clearLoginData,
  getStoredUserData 
} from '../utils/loginStorage';

// Save custom data
await saveLoginData(token, { uid: '123', email: 'user@example.com' });

// Retrieve data
const { token, userData } = await getLoginData();

// Check if user is marked as persistent
const userData = await getStoredUserData();

// Clear on custom logout
await clearLoginData();
```

## Key Features

✅ **Automatic On Login** - Credentials saved automatically after authentication
✅ **Automatic On App Restart** - Cached user data loaded immediately
✅ **Firebase Sync** - Always syncs with Firebase on startup
✅ **Token Refresh** - Invalid tokens are automatically cleared
✅ **Clean Logout** - All data removed when user signs out
✅ **Offline Support** - Cached data available even without internet
✅ **Error Handling** - Gracefully handles storage errors

## File Changes Summary

### New Files
- `utils/loginStorage.js` - Persistent login utility

### Modified Files
- `context/AuthContext.jsx` - Refactored to use loginStorage
- `app/LoginScreen.jsx` - Uses saveLoginData()
- `app/SignUpScreen.jsx` - Uses saveLoginData()

### No Changes Needed
- Navigation/routing logic automatically respects auth state
- The existing onboarding check still works independently
- All other screens work as before

## Data That Gets Persisted

The system stores:
```javascript
{
  token: "Firebase ID token...",
  userData: {
    uid: "user-id",
    email: "user@example.com",
    name: "User Name",
    emailVerified: true/false
  },
  persistLoginEnabled: "true"
}
```

## Security Notes

- Credentials are stored in AsyncStorage (encrypted on iOS, secure on Android)
- Tokens are refreshed on app startup to prevent stale sessions
- Invalid tokens are automatically cleared
- For production, consider using Secure Storage alternatives for more sensitive data

## Testing the Implementation

1. **Test 1 - Initial Login**
   - Login with email/password
   - Close the app
   - Reopen - should automatically show home screen

2. **Test 2 - Google OAuth**
   - Login with Google
   - Close the app
   - Reopen - should automatically show home screen

3. **Test 3 - Logout**
   - Log in
   - Go to profile and logout
   - App should redirect to LoginScreen
   - Reopen app - should stay on LoginScreen

4. **Test 4 - Token Expiry**
   - Log in
   - Wait for Firebase token to expire
   - Use app - should auto-refresh or redirect to login

## Troubleshooting

**Issue**: User not staying logged in after app restart
- Check that `useAuth()` is properly used in your root layout
- Verify AuthProvider wraps your app
- Check device AsyncStorage permissions

**Issue**: Can't login after logout
- Make sure `clearLoginData()` is being called on logout
- Check that old token isn't being reused

**Issue**: Persistent login not working for Google OAuth
- Ensure the backend is returning custom tokens correctly
- Verify token is being saved with `saveLoginData()`

## Next Steps

1. Test all login flows (email, Google, signup)
2. Test logout and re-login
3. Test persistence by closing and reopening the app
4. Deploy and monitor for any authentication issues

---

For more details, see `utils/loginStorage.js` for the complete implementation.
