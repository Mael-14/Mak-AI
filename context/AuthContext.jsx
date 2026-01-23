import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

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
        // Check AsyncStorage for stored user data
        const storedUserData = await AsyncStorage.getItem('userData');
        const storedToken = await AsyncStorage.getItem('authToken');

        if (storedUserData && storedToken) {
          try {
            const parsedUserData = JSON.parse(storedUserData);
            setUserData(parsedUserData);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            // Clear invalid data
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('authToken');
          }
        }

        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in
            try {
              // Get fresh token
              const idToken = await firebaseUser.getIdToken();
              
              // Update stored token
              await AsyncStorage.setItem('authToken', idToken);
              
              // Update user data
              const updatedUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                emailVerified: firebaseUser.emailVerified
              };
              
              await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
              
              setUser(firebaseUser);
              setUserData(updatedUserData);
            } catch (error) {
              console.error('Error updating auth state:', error);
              // If token refresh fails, sign out
              await handleLogout();
            }
          } else {
            // User is signed out
            setUser(null);
            setUserData(null);
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
          }
          
          setLoading(false);
          if (!isInitialized) {
            setIsInitialized(true);
          }
        });

        return () => unsubscribe();
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
      
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // Clear state
      setUser(null);
      setUserData(null);
      
      // Navigate to login screen
      router.replace('/LoginScreen');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if logout fails, clear local data
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
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
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
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
        await AsyncStorage.setItem('authToken', idToken);
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
    isAuthenticated: !!user,
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

