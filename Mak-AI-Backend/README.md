# Mak AI Backend

Backend API for Mak AI application using Express.js and Firebase.

## Features

- User authentication (Signup, Login)
- Firebase Authentication integration
- Firestore database for user data storage
- Password reset functionality
- User profile management
- JWT token verification middleware

## Prerequisites

- Node.js (v14 or higher)
- Firebase project with Authentication and Firestore enabled
- Firebase service account key

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Generate a service account key:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the JSON file as `serviceAccountKey.json` in the root directory
     - OR set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the JSON content

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update the values as needed

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
  - Body: `{ name, email, password }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }` or `{ idToken }` (recommended)
  
- `POST /api/auth/forgot-password` - Send password reset email
  - Body: `{ email }`
  
- `GET /api/auth/me` - Get current user profile (requires auth token)
  - Header: `Authorization: Bearer <idToken>`
  
- `PUT /api/auth/profile` - Update user profile (requires auth token)
  - Header: `Authorization: Bearer <idToken>`
  - Body: `{ name, ...other fields }`

### Health Check

- `GET /health` - Basic health check (server status)
- `GET /api/health` - API health check
- `GET /api/health/detailed` - Detailed health check (all services)
- `GET /api/health/firebase` - Test Firebase connection
- `GET /api/health/google-oauth` - Test Google OAuth configuration
- `GET /api/health/environment` - Check environment variables

## Testing

### Quick Health Check

Run automated health check tests:

```bash
npm test
```

Or test a remote backend:

```bash
TEST_BASE_URL=http://192.168.1.192:5000 npm test
```

### Manual Testing

Test endpoints using curl:

```bash
# Basic health check
curl http://localhost:5000/health

# Detailed health check
curl http://localhost:5000/api/health/detailed

# Firebase connection test
curl http://localhost:5000/api/health/firebase

# Google OAuth test
curl http://localhost:5000/api/health/google-oauth
```

### PowerShell Script (Windows)

```powershell
.\scripts\test-backend.ps1
# Or with custom URL
.\scripts\test-backend.ps1 -BaseUrl "http://192.168.1.192:5000"
```

### Bash Script (Linux/Mac)

```bash
chmod +x scripts/test-backend.sh
./scripts/test-backend.sh
# Or with custom URL
TEST_BASE_URL=http://192.168.1.192:5000 ./scripts/test-backend.sh
```

See `tests/README.md` for more testing information.

## Frontend Integration

The frontend should use Firebase Auth SDK for authentication:

1. **Signup Flow:**
   - User fills signup form (name, email, password)
   - Frontend calls Firebase Auth `createUserWithEmailAndPassword()`
   - On success, send user data to backend `/api/auth/signup` to create Firestore document
   - Or backend can create Firestore doc automatically

2. **Login Flow:**
   - User fills login form (email, password)
   - Frontend calls Firebase Auth `signInWithEmailAndPassword()`
   - Get the ID token using `user.getIdToken()`
   - Send token to backend `/api/auth/login` for verification
   - Store token for authenticated requests

3. **Authenticated Requests:**
   - Include token in Authorization header: `Authorization: Bearer <idToken>`

## Project Structure

```
Mak-AI-Backend/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK configuration
│   ├── controllers/
│   │   └── authController.js    # Authentication controllers
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── models/
│   │   └── User.model.js        # User Firestore model
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── services/
│   │   └── firebase/
│   │       └── authService.js   # Firebase Auth service
│   ├── utils/
│   │   └── responseFormatter.js # Response formatting utility
│   └── app.js                   # Express app configuration
├── firebase/
│   ├── firestore.rules          # Firestore security rules
│   └── firestore.indexes.json   # Firestore indexes
├── server.js                    # Server entry point
└── package.json
```

## Security Notes

- Never commit `serviceAccountKey.json` or `.env` files
- Use environment variables in production
- Firestore rules ensure users can only access their own data
- Always verify ID tokens on the backend for protected routes

## License

ISC

