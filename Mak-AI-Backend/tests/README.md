# Backend Health Check Tests

This directory contains tests to verify that the backend is running properly.

## Quick Test

Run the health check tests:

```bash
npm test
```

Or directly:

```bash
node tests/health.test.js
```

## Test Custom Backend URL

To test a backend running on a different URL:

```bash
TEST_BASE_URL=http://192.168.1.192:5000 node tests/health.test.js
```

## What Gets Tested

1. **Basic Health Check** (`/health`)
   - Verifies server is running

2. **API Health Check** (`/api/health`)
   - Verifies API routes are accessible

3. **Detailed Health Check** (`/api/health/detailed`)
   - Tests all services (Firebase, Google OAuth, Environment)
   - Returns comprehensive status

4. **Firebase Connection** (`/api/health/firebase`)
   - Verifies Firebase Admin SDK is connected
   - Tests ability to query Firebase Auth

5. **Google OAuth Configuration** (`/api/health/google-oauth`)
   - Checks if Google OAuth is configured
   - Tests URL generation (optional - won't fail if not configured)

6. **Environment Variables** (`/api/health/environment`)
   - Verifies required environment variables are set
   - Lists missing optional variables

7. **404 Handler**
   - Tests that 404 errors are handled correctly

## Manual Testing

You can also test endpoints manually:

### Using curl:

```bash
# Basic health check
curl http://localhost:5000/health

# Detailed health check
curl http://localhost:5000/api/health/detailed

# Firebase test
curl http://localhost:5000/api/health/firebase

# Google OAuth test
curl http://localhost:5000/api/health/google-oauth

# Environment test
curl http://localhost:5000/api/health/environment
```

### Using browser:

Open these URLs in your browser:
- http://localhost:5000/health
- http://localhost:5000/api/health/detailed
- http://localhost:5000/api/health/firebase
- http://localhost:5000/api/health/google-oauth
- http://localhost:5000/api/health/environment

## Expected Results

### All Tests Passing:
```
✓ PASS - Basic Health Check
✓ PASS - API Health Check
✓ PASS - Detailed Health Check
✓ PASS - Firebase Connection
✓ PASS - Google OAuth Configuration
✓ PASS - Environment Variables
✓ PASS - 404 Handler

Passed: 7
Warnings: 0
Failed: 0
```

### With Warnings (Google OAuth not configured):
```
✓ PASS - Basic Health Check
✓ PASS - API Health Check
✓ PASS - Detailed Health Check
✓ PASS - Firebase Connection
⚠ WARN - Google OAuth Configuration (Not configured - this is optional)
✓ PASS - Environment Variables
✓ PASS - 404 Handler

Passed: 6
Warnings: 1
Failed: 0
```

## Troubleshooting

### "ECONNREFUSED" Error
- Backend server is not running
- Start server: `npm start`

### "Firebase connection failed"
- Check `serviceAccountKey.json` exists
- Verify Firebase credentials are correct
- Check Firebase project is active

### "Google OAuth not configured"
- This is a warning, not an error
- Add Google OAuth credentials to `.env` if needed
- See `BACKEND_GOOGLE_OAUTH_SETUP.md` for setup instructions

### "Missing required environment variables"
- Check `.env` file exists
- Verify `PORT` is set (or defaults to 5000)
- See `env.example` for required variables

## Integration with CI/CD

The test script exits with code 0 on success and 1 on failure, making it suitable for CI/CD pipelines:

```bash
npm test && echo "All tests passed!"
```

