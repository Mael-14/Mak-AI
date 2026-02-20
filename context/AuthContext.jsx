import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { 
  saveLoginData, 
  clearLoginData, 
  getLoginData, 
  updateStoredUserData 
} from '../utils/loginStorage';
import { restoreUserSession, getTemporaryAuthState } from '../utils/sessionManager';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Check for persisted auth state on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check AsyncStorage for stored login data using the new utility
        const { token, userData } = await getLoginData();
        console.log('Stored login data:', { hasToken: !!token, userData });

        // Get temporary auth state for immediate UI response
        const tempAuthState = await getTemporaryAuthState();
        if (tempAuthState.isAuthenticated && tempAuthState.userData) {
          setUserData(tempAuthState.userData);
          console.log('Set temporary auth state for immediate UI');
        }

        // Try to restore user session
        if (userData && token) {
          console.log('Attempting to restore user session...');
          const sessionResult = await restoreUserSession();
          
          if (sessionResult.success) {
            console.log('Session restored successfully');
            setUserData(sessionResult.userData);
            // Firebase onAuthStateChanged should handle the rest
          } else {
            console.log('Session restoration failed, clearing stored data');
            setUserData(null);
          }
        } else if (userData && !token) {
          console.log('Found userData but no token - clearing stale data');
          await clearLoginData();
          setUserData(null);
        }

        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log('Firebase auth state changed:', !!firebaseUser);
          
          if (firebaseUser) {
            // User is signed in
            try {
              // Get fresh token
              const idToken = await firebaseUser.getIdToken();
              
              // Update user data
              const updatedUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                emailVerified: firebaseUser.emailVerified
              };
              
              // Save to persistent storage
              await saveLoginData(idToken, updatedUserData);
              
              setUser(firebaseUser);
              setUserData(updatedUserData);
              console.log('User authenticated and data saved');
            } catch (error) {
              console.error('Error updating auth state:', error);
              // If token refresh fails, sign out
              await handleLogout();
            }
          } else {
            // User is signed out - check if we have stored data to attempt restoration
            const { token: storedToken, userData: storedUserData } = await getLoginData();
            
            if (storedToken && storedUserData) {
              console.log('Firebase user signed out but we have stored data - user may have been logged out server-side');
              // Clear the stored data since Firebase session is no longer valid
              await clearLoginData();
            }
            
            setUser(null);
            setUserData(null);
            console.log('User signed out and data cleared');
          }
          
          setLoading(false);
          if (!isInitialized) {
            setIsInitialized(true);
          }
        });

        // Set a timeout to initialize if Firebase takes too long
        const timeoutId = setTimeout(() => {
          if (loading && !isInitialized) {
            console.log('Auth initialization timeout - proceeding with stored data');
            setLoading(false);
            setIsInitialized(true);
          }
        }, 3000); // 3 second timeout

        return () => {
          unsubscribe();
          clearTimeout(timeoutId);
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear all stored login data using the utility
      await clearLoginData();
      
      // Clear state
      setUser(null);
      setUserData(null);
      
      // Navigate to login screen
      router.replace('/LoginScreen');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear local data
      try {
        await clearLoginData();
        setUser(null);
        setUserData(null);
        router.replace('/LoginScreen');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
      }
    }
  };

  // Update user data (after login/signup)
  const updateUserData = async (newUserData) => {
    try {
      await updateStoredUserData(newUserData);
      setUserData(newUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // Refresh auth token
  const refreshToken = async () => {
    try {
      if (user) {
        const idToken = await user.getIdToken(true); // Force refresh
        await saveLoginData(idToken, userData);
        return idToken;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await handleLogout();
      return null;
    }
  };

  const value = {
    user,
    userData,
    loading,
    isInitialized,
    isAuthenticated: !!user || (!!userData && !isInitialized), // Consider stored data as authenticated while initializing
    logout: handleLogout,
    updateUserData,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

