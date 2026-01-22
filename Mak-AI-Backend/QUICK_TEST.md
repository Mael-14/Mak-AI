# Quick Backend Test Guide

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
npm start
```

You should see:
```
Server is running on port 5000
Environment: development
```

### 2. Run Health Check Tests

In a new terminal:

```bash
npm test
```

**Expected Output:**
```
========================================
  Backend Health Check Tests
========================================
Testing backend at: http://localhost:5000

✓ PASS - Basic Health Check
✓ PASS - API Health Check
✓ PASS - Detailed Health Check
✓ PASS - Firebase Connection
✓ PASS - Google OAuth Configuration
✓ PASS - Environment Variables
✓ PASS - 404 Handler

========================================
  Test Summary
========================================
Passed: 7
Warnings: 0
Failed: 0
Total: 7
```

## 🔍 Manual Testing

### Test in Browser

Open these URLs in your browser:

1. **Basic Health:** http://localhost:5000/health
2. **API Health:** http://localhost:5000/api/health
3. **Detailed Health:** http://localhost:5000/api/health/detailed
4. **Firebase Test:** http://localhost:5000/api/health/firebase
5. **Google OAuth Test:** http://localhost:5000/api/health/google-oauth
6. **Environment Test:** http://localhost:5000/api/health/environment

### Test with PowerShell (Windows)

```powershell
# Run the test script
.\scripts\test-backend.ps1

# Test remote backend
.\scripts\test-backend.ps1 -BaseUrl "http://192.168.1.192:5000"
```

### Test with curl

```bash
# Basic health check
curl http://localhost:5000/health

# Detailed health check
curl http://localhost:5000/api/health/detailed | json_pp
```

## ✅ What Gets Tested

1. **Server Status** - Is the Express server running?
2. **API Routes** - Are routes accessible?
3. **Firebase Connection** - Can we connect to Firebase?
4. **Google OAuth** - Is Google OAuth configured? (optional)
5. **Environment** - Are required env variables set?
6. **Error Handling** - Does 404 work correctly?

## 🐛 Troubleshooting

### "ECONNREFUSED" Error
- **Problem:** Backend is not running
- **Solution:** Start backend with `npm start`

### "Firebase connection failed"
- **Problem:** Firebase not configured
- **Solution:** 
  1. Check `serviceAccountKey.json` exists
  2. Verify Firebase credentials
  3. Check `.env` file

### "Google OAuth not configured"
- **Problem:** Google OAuth credentials missing
- **Solution:** This is a warning, not an error. Add credentials to `.env` if needed.

### Tests Pass but Backend Still Not Working
- Check backend logs for errors
- Verify port 5000 is not blocked by firewall
- Ensure no other service is using port 5000

## 📊 Understanding Test Results

### All Green ✓
Everything is working perfectly!

### Yellow ⚠ Warnings
Some optional features are not configured (like Google OAuth). This is OK.

### Red ✗ Failures
Critical services are not working. Check the error messages for details.

## 🎯 Next Steps

After tests pass:
1. ✅ Backend is running correctly
2. ✅ Firebase is connected
3. ✅ API routes are working
4. ✅ Ready to connect frontend

You can now test the frontend connection!

