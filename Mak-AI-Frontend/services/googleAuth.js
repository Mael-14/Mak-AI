import React from 'react';
import { GoogleAuthProvider, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import { authAPI } from './api';

// Complete web browser authentication
WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In using web browser and backend API
 * 
 * This implementation:
 * - Gets Google OAuth URL from backend API
 * - Opens Google OAuth in the device's default web browser
 * - Uses backend to handle OAuth code exchange
 * - Returns Firebase custom token for authentication
 * 
 * @returns {Object} userCredential from Firebase
 */
export const signInWithGoogleBrowser = async () => {
  try {
    // Get Google OAuth URL from backend
    const authUrlResponse = await authAPI.getGoogleAuthUrl();
    const authUrl = authUrlResponse?.data?.authUrl || authUrlResponse?.authUrl;
    
    if (!authUrl) {
      throw new Error('Failed to get Google OAuth URL from backend');
    }

    // Define callback URL that backend expects
    const callbackUrl = authUrl.includes('localhost') 
      ? authUrl.replace('/auth/google', '/auth/google/callback')
      : authUrl.replace('/auth/google', '/auth/google/callback');

    // Open web browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);
    
    if (result.type !== 'success') {
      throw new Error('Google sign-in was cancelled or failed');
    }

    // Parse the callback URL for token
    if (result.url && result.url.includes('token=')) {
      const url = new URL(result.url);
      const token = url.searchParams.get('token');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error('Google authentication failed');
      }

      if (!token) {
        throw new Error('No authentication token received');
      }

      // Sign in to Firebase with custom token from backend
      const userCredential = await signInWithCustomToken(auth, token);
      return userCredential;
    } else {
      throw new Error('Invalid callback URL received');
    }
    
  } catch (error) {
    console.error('Google authentication error:', error);
    throw error;
  }
};

/**
 * Hook for Google Sign-In using web browser
 * 
 * This implementation:
 * - Uses WebBrowser.openAuthSessionAsync for authentication
 * - Works with the existing backend API
 * - No complex dependencies required
 * 
 * @returns {Object} Hook interface matching previous implementation
 */
export const useGoogleSignIn = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const signIn = async () => {
    try {
      setIsLoading(true);
      return await signInWithGoogleBrowser();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    signIn, 
    isLoading,
    request: true, // Always ready - no async initialization needed
    response: null,
    promptAsync: signIn 
  };
};
