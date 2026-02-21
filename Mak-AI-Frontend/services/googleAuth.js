import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

// Complete web browser authentication
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google using Firebase Auth
 * This function handles Google authentication for all platforms
 */
export const signInWithGoogle = async () => {
  try {
    // Configure Google OAuth request
    const [request, response, promptAsync] = Google.useAuthRequest({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Required for Firebase
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    // Prompt user to sign in
    const result = await promptAsync();
    
    if (result.type !== 'success') {
      throw new Error('Google sign-in was cancelled or failed');
    }

    // Get the ID token from Google
    const { id_token } = result.params;
    
    if (!id_token) {
      throw new Error('No ID token received from Google');
    }

    // Create Firebase credential from Google ID token
    const credential = GoogleAuthProvider.credential(id_token);
    
    // Sign in to Firebase with Google credential
    const userCredential = await signInWithCredential(auth, credential);
    
    return userCredential;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

/**
 * Simplified Google Sign-In that can be used directly in components
 * Note: This uses hooks, so it should be called from within a component
 */
export const useGoogleSignIn = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const signIn = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled');
      }

      const { id_token } = result.params;
      
      if (!id_token) {
        throw new Error('No ID token received');
      }

      const credential = GoogleAuthProvider.credential(id_token);
      const userCredential = await signInWithCredential(auth, credential);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  return { signIn, isLoading: request === null };
};
