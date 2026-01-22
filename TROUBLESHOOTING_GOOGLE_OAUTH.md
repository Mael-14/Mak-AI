# Troubleshooting Google OAuth Network Errors

## Common Issues and Solutions

### 1. "Cannot connect to server" Error

**Problem:** The frontend cannot reach the backend server.

**Solutions:**

#### Check if Backend is Running
```bash
cd Mak-AI-Backend
npm start
```

You should see:
```
Server is running on port 5000
Environment: development
```

#### Verify Backend URL
Check your frontend `.env` file:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.192:5000/api
```

**For different environments:**
- **Local development:** `http://localhost:5000/api` (only works for web)
- **Android Emulator:** `http://10.0.2.2:5000/api`
- **iOS Simulator:** `http://localhost:5000/api`
- **Physical device:** `http://YOUR_COMPUTER_IP:5000/api` (e.g., `http://192.168.1.192:5000/api`)

#### Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

#### Test Backend Connection

Open in browser or use curl:
```bash
curl http://192.168.1.192:5000/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### 2. CORS Errors

**Problem:** Browser/device blocking requests due to CORS.

**Solution:** The backend CORS is configured to allow all origins in development. If you still see CORS errors:

1. Check backend `.env`:
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:19006
```

2. Restart backend server after changing `.env`

### 3. "Google OAuth not configured" Error

**Problem:** Backend missing Google OAuth credentials.

**Solution:**

1. Add to backend `.env`:
```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://192.168.1.192:5000/api/auth/google/callback
BACKEND_URL=http://192.168.1.192:5000
FRONTEND_URL=http://localhost:19006
```

2. Restart backend server

### 4. Network Timeout

**Problem:** Request takes too long or times out.

**Solutions:**

1. Check firewall settings - ensure port 5000 is not blocked
2. Verify backend is accessible from your device/emulator
3. Check if backend is running on correct port

### 5. Deep Linking Not Working

**Problem:** After Google authentication, app doesn't receive callback.

**Solutions:**

1. Verify `app.json` has scheme:
```json
{
  "expo": {
    "scheme": "mak-ai"
  }
}
```

2. For Android, check `AndroidManifest.xml` has intent filter

3. Test deep link manually:
```bash
# Android
adb shell am start -W -a android.intent.action.VIEW -d "mak-ai://auth/google/callback?token=test"

# iOS Simulator
xcrun simctl openurl booted "mak-ai://auth/google/callback?token=test"
```

## Quick Diagnostic Steps

1. **Check Backend Status:**
   ```bash
   curl http://192.168.1.192:5000/health
   ```

2. **Check Google OAuth Endpoint:**
   ```bash
   curl http://192.168.1.192:5000/api/auth/google
   ```

3. **Check Backend Logs:**
   Look for errors in backend terminal when making request

4. **Check Frontend Console:**
   Look for network errors in Expo/Metro console

5. **Verify Environment Variables:**
   - Backend `.env` has all required variables
   - Frontend `.env` has correct `EXPO_PUBLIC_API_BASE_URL`

## Testing Checklist

- [ ] Backend server is running (`npm start` in Mak-AI-Backend)
- [ ] Backend responds to `/health` endpoint
- [ ] Backend responds to `/api/auth/google` endpoint
- [ ] Frontend `.env` has correct `EXPO_PUBLIC_API_BASE_URL`
- [ ] Backend `.env` has Google OAuth credentials
- [ ] Device/emulator can reach backend IP address
- [ ] Firewall allows connections on port 5000
- [ ] CORS is configured correctly
- [ ] Deep linking scheme is configured in `app.json`

## Still Having Issues?

1. **Check backend terminal** for error messages
2. **Check frontend console** for network errors
3. **Try using `localhost`** if on same machine (web only)
4. **Verify IP address** hasn't changed (if using WiFi)
5. **Restart both** frontend and backend servers

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Network Error" | Backend not running or unreachable | Start backend, check IP address |
| "ECONNREFUSED" | Connection refused | Backend not running or wrong port |
| "CORS error" | CORS blocking request | Check CORS configuration |
| "Google OAuth not configured" | Missing env variables | Add Google credentials to `.env` |
| "Timeout" | Request taking too long | Check network, firewall, backend performance |

