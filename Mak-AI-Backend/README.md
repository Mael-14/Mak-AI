# Mak AI Backend

Backend API for Mak AI application built with Express.js, Firebase Admin SDK, and Google OAuth integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

Mak AI Backend is a RESTful API server that provides authentication and user management services for the Mak AI application. It integrates with Firebase Authentication for user authentication and Firestore for data persistence, supporting both email/password and Google OAuth authentication methods.

## ✨ Features

- **User Authentication**
  - Email/Password signup and login
  - Google OAuth integration
  - Password reset functionality
  - JWT token verification middleware

- **User Management**
  - User profile creation and management
  - Profile updates
  - User data persistence in Firestore

- **Health Monitoring**
  - Basic health check endpoints
  - Detailed service status checks
  - Firebase connection testing
  - Google OAuth configuration verification

- **Security**
  - Firebase ID token verification
  - Protected routes with authentication middleware
  - Firestore security rules
  - CORS configuration

## 🛠 Tech Stack

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **OAuth**: Google Auth Library
- **Validation**: Express Validator
- **Development**: Nodemon

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Firebase Project** with:
  - Authentication enabled (Email/Password provider)
  - Firestore Database enabled
  - Service account key generated

## 🚀 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd Mak-AI/Mak-AI-Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one
   - Enable **Authentication** → **Sign-in method** → **Email/Password**
   - Enable **Firestore Database**
   - Go to **Project Settings** → **Service Accounts**
   - Click **"Generate new private key"**
   - Save the JSON file as `serviceAccountKey.json` in the backend root directory

4. **Configure environment variables**:
   ```bash
   cp env.example .env
   ```
   Edit `.env` and update the values (see [Configuration](#configuration) section)

5. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Configuration
# Option 1: Use serviceAccountKey.json file (development)
# Place serviceAccountKey.json in the root directory

# Option 2: Use environment variable (production)
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
# FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# CORS Configuration
FRONTEND_URL=http://localhost:19006

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
BACKEND_URL=http://localhost:5000
```

### Firebase Setup

1. **Service Account Key**:
   - **Development**: Place `serviceAccountKey.json` in the root directory
   - **Production**: Set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the JSON content

2. **Firestore Rules**: Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

## 📡 API Endpoints

### Authentication Endpoints

#### `POST /api/auth/signup`
Register a new user.

**Request Body**:
```json
{
  "idToken": "firebase-id-token",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User document created successfully in Firestore",
  "data": {
    "uid": "user-uid",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "statusCode": 201
}
```

#### `POST /api/auth/login`
Login user (verify token or email).

**Request Body** (Option 1 - Recommended):
```json
{
  "idToken": "firebase-id-token"
}
```

**Request Body** (Option 2):
```json
{
  "email": "john@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "uid": "user-uid",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": true
  },
  "statusCode": 200
}
```

#### `POST /api/auth/forgot-password`
Send password reset email.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "message": "Password reset link generated",
    "resetLink": "https://..." // Only in development
  },
  "statusCode": 200
}
```

#### `GET /api/auth/me`
Get current user profile (requires authentication).

**Headers**:
```
Authorization: Bearer <idToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "uid": "user-uid",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "statusCode": 200
}
```

#### `PUT /api/auth/profile`
Update user profile (requires authentication).

**Headers**:
```
Authorization: Bearer <idToken>
```

**Request Body**:
```json
{
  "name": "Jane Doe"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "uid": "user-uid",
    "email": "john@example.com",
    "name": "Jane Doe",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "statusCode": 200
}
```

#### `GET /api/auth/google`
Get Google OAuth authorization URL.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Google OAuth URL generated",
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  },
  "statusCode": 200
}
```

#### `GET /api/auth/google/callback`
Handle Google OAuth callback.

**Query Parameters**:
- `code`: Authorization code from Google

**Response**: Redirects to frontend with token

### Health Check Endpoints

#### `GET /health`
Basic health check.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /api/health`
API health check with uptime.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Backend API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

#### `GET /api/health/detailed`
Detailed health check with all service statuses.

**Response** (200 OK):
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "services": {
    "server": { "status": "healthy", "message": "Express server is running" },
    "firebase": { "status": "healthy", "message": "Firebase Admin SDK is connected" },
    "googleOAuth": { "status": "healthy", "message": "Google OAuth is configured correctly" },
    "environment": { "status": "healthy", "message": "Required environment variables are set" }
  }
}
```

#### `GET /api/health/firebase`
Test Firebase connection.

#### `GET /api/health/google-oauth`
Test Google OAuth configuration.

#### `GET /api/health/environment`
Check environment variables status.

## 🔐 Authentication

### Authentication Flow

1. **Signup Flow**:
   ```
   Frontend → Firebase Auth (createUserWithEmailAndPassword)
   → Get ID Token → Backend /api/auth/signup → Create Firestore Document
   ```

2. **Login Flow**:
   ```
   Frontend → Firebase Auth (signInWithEmailAndPassword)
   → Get ID Token → Backend /api/auth/login → Verify Token → Return User Data
   ```

3. **Google OAuth Flow**:
   ```
   Frontend → Backend /api/auth/google → Get Auth URL
   → Redirect to Google → Google Callback → Backend /api/auth/google/callback
   → Create/Get Firebase User → Return Custom Token → Frontend Signs In
   ```

### Protected Routes

Protected routes require an `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```

The middleware will:
- Verify the token
- Attach user info to `req.user`
- Return 401 if token is invalid or expired

## 📁 Project Structure

```
Mak-AI-Backend/
├── src/
│   ├── config/
│   │   └── firebase.js              # Firebase Admin SDK configuration
│   ├── controllers/
│   │   └── authController.js        # Authentication controllers
│   ├── middleware/
│   │   ├── auth.js                  # Authentication middleware
│   │   └── errorHandler.js          # Error handling middleware
│   ├── models/
│   │   └── User.model.js            # User Firestore model
│   ├── routes/
│   │   ├── auth.js                  # Authentication routes
│   │   └── health.js                # Health check routes
│   ├── services/
│   │   ├── firebase/
│   │   │   └── authService.js       # Firebase Auth service
│   │   └── google/
│   │       └── googleAuthService.js # Google OAuth service
│   ├── utils/
│   │   └── responseFormatter.js     # Response formatting utility
│   └── app.js                       # Express app configuration
├── firebase/
│   ├── firestore.rules              # Firestore security rules
│   └── firestore.indexes.json       # Firestore indexes
├── tests/
│   ├── health.test.js               # Health check tests
│   └── README.md                    # Testing documentation
├── server.js                        # Server entry point
├── package.json                     # Dependencies and scripts
├── env.example                      # Environment variables template
└── README.md                        # This file
```

## 🧪 Testing

### Automated Tests

Run health check tests:
```bash
npm test
```

Test a remote backend:
```bash
TEST_BASE_URL=http://192.168.1.192:5000 npm test
```

### Manual Testing

Test endpoints using `curl`:

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

### Testing Scripts

**PowerShell (Windows)**:
```powershell
.\scripts\test-backend.ps1
.\scripts\test-backend.ps1 -BaseUrl "http://192.168.1.192:5000"
```

**Bash (Linux/Mac)**:
```bash
chmod +x scripts/test-backend.sh
./scripts/test-backend.sh
TEST_BASE_URL=http://192.168.1.192:5000 ./scripts/test-backend.sh
```

For more testing information, see `tests/README.md`.

## 🚢 Deployment

### Environment Setup

1. Set environment variables in your hosting platform
2. Set `NODE_ENV=production`
3. Use `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable instead of file
4. Update `FRONTEND_URL` and `BACKEND_URL` with production URLs
5. Update `GOOGLE_REDIRECT_URI` with production callback URL

### Recommended Platforms

- **Heroku**: Use Heroku config vars for environment variables
- **Vercel**: Use Vercel environment variables
- **AWS**: Use AWS Systems Manager Parameter Store or Secrets Manager
- **Google Cloud**: Use Google Cloud Secret Manager

### Firestore Rules Deployment

Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## 🔒 Security

### Best Practices

1. **Never commit sensitive files**:
   - `serviceAccountKey.json`
   - `.env`
   - Add them to `.gitignore`

2. **Use environment variables in production**:
   - Store Firebase service account key as environment variable
   - Never expose credentials in code or logs

3. **Firestore Security Rules**:
   - Users can only access their own data
   - Rules are enforced at the database level

4. **Token Verification**:
   - Always verify Firebase ID tokens on the backend
   - Never trust client-side authentication alone

5. **CORS Configuration**:
   - Restrict CORS origins in production
   - Use `FRONTEND_URL` environment variable

6. **Error Handling**:
   - Don't expose sensitive error details to clients
   - Log errors server-side for debugging

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Failed**
- Verify `serviceAccountKey.json` exists and is valid
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- Ensure Firebase project has Firestore enabled

**Google OAuth Not Working**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check redirect URI matches Google Cloud Console configuration
- Ensure Google+ API is enabled

**CORS Errors**
- Update `FRONTEND_URL` in `.env`
- Check CORS configuration in `src/app.js`
- Verify frontend URL matches exactly

**Token Verification Failed**
- Ensure token is not expired
- Check token format: `Bearer <token>`
- Verify Firebase project configuration

**Port Already in Use**
- Change `PORT` in `.env`
- Kill process using the port: `lsof -ti:5000 | xargs kill` (Mac/Linux)

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Health Checks

Use health check endpoints to diagnose issues:
```bash
curl http://localhost:5000/api/health/detailed
```

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review `tests/README.md` for testing help
- Check `QUICK_TEST.md` for quick setup guide

---

**Made with ❤️ for Mak AI**
