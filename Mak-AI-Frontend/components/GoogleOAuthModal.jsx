import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  FlatList,
  Image
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { signInWithCustomToken } from 'firebase/auth';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';
import { saveLoginData } from '../utils/loginStorage';

const GoogleOAuthModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  onError, 
  title = "Sign in with Google",
  mode = "login" // "login" or "signup"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState(null);
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [showAccountsList, setShowAccountsList] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const webViewRef = useRef(null);

  // Configure Google Sign-In when modal opens
  useEffect(() => {
    if (visible) {
      configureGoogleSignIn();
      fetchGoogleAccounts();
    }
  }, [visible]);

  // Configure Google Sign-In - Fallback for Expo managed workflow
  const configureGoogleSignIn = async () => {
    // Google Sign-in configuration is handled via WebView in Expo managed workflow
    console.log('Using WebView fallback for Google Sign-in in Expo managed workflow');
  };

  // Fetch Google accounts from device - Fallback for Expo managed workflow
  const fetchGoogleAccounts = async () => {
    try {
      setFetchingAccounts(true);
      
      // In Expo managed workflow, we use WebView for Google authentication
      // Skip account fetching and go directly to WebView
      setTimeout(() => {
        initializeGoogleAuth();
      }, 500);
    } catch (error) {
      console.error('Error initializing Google auth:', error);
      initializeGoogleAuth();
    } finally {
      setFetchingAccounts(false);
    }
  };

  const initializeGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getGoogleAuthUrl();
      const url = response?.data?.authUrl || response?.authUrl;
      
      if (!url) {
        throw new Error('Failed to get Google OAuth URL from backend');
      }
      
      setAuthUrl(url);
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      let errorMessage = 'Failed to initialize Google authentication.';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.message || 'Backend server error.';
      }
      
      onError(errorMessage);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL changes in WebView
  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    
    // Check if this is our callback URL
    if (url.includes('/auth/google/callback')) {
      try {
        setIsLoading(true);
        
        // Parse the callback URL
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token');
        const uid = parsedUrl.searchParams.get('uid');
        const error = parsedUrl.searchParams.get('error');

        if (error) {
          throw new Error('Google authentication failed');
        }

        if (!token) {
          throw new Error('No authentication token received');
        }

        // Sign in to Firebase with custom token from backend
        const userCredential = await signInWithCustomToken(auth, token);
        
        // Get Firebase ID token
        const firebaseIdToken = await userCredential.user.getIdToken();
        
        // Store authentication data
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
          emailVerified: userCredential.user.emailVerified
        };
        
        await saveLoginData(firebaseIdToken, userData);
        
        // Success callback
        onSuccess(userData);
        onClose();
        
      } catch (error) {
        console.error('Google auth callback error:', error);
        let errorMessage = 'Google authentication failed. Please try again.';
        
        if (error.code === 'auth/invalid-custom-token') {
          errorMessage = 'Invalid authentication token. Please try again.';
        } else if (error.message?.includes('cancelled')) {
          errorMessage = 'Google authentication was cancelled.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        onError(errorMessage);
        onClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle account selection - Fallback for Expo managed workflow
  const handleAccountSelect = async (account = null) => {
    // In Expo managed workflow, redirect to WebView authentication
    handleUseWebView();
  };

  // Handle fallback to WebView
  const handleUseWebView = () => {
    setShowAccountsList(false);
    setGoogleAccounts([]);
    initializeGoogleAuth();
  };

  const handleClose = () => {
    setAuthUrl(null);
    setWebViewLoading(true);
    setIsLoading(false);
    setShowAccountsList(false);
    setGoogleAccounts([]);
    setFetchingAccounts(false);
    onClose();
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    onError('Failed to load Google authentication page. Please check your internet connection.');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Ionicons name="close" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Loading State */}
        {(isLoading || webViewLoading || fetchingAccounts) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>
              {fetchingAccounts 
                ? 'Finding your Google accounts...' 
                : isLoading 
                ? 'Signing you in...' 
                : 'Loading Google Sign-In...'
              }
            </Text>
          </View>
        )}

        {/* Google Accounts List */}
        {showAccountsList && !isLoading && !fetchingAccounts && (
          <View style={styles.accountsContainer}>
            <Text style={styles.accountsTitle}>Choose an account</Text>
            
            {googleAccounts.length > 0 ? (
              <FlatList
                data={googleAccounts}
                keyExtractor={(item) => item.id || item.email}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.accountItem}
                    onPress={() => handleAccountSelect(item)}
                  >
                    {item.photo ? (
                      <Image 
                        source={{ uri: item.photo }} 
                        style={styles.accountPhoto}
                      />
                    ) : (
                      <View style={[styles.accountPhoto, styles.defaultAvatar]}>
                        <Ionicons name="person" size={wp('6%')} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{item.name}</Text>
                      <Text style={styles.accountEmail}>{item.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={wp('5%')} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
                style={styles.accountsList}
              />
            ) : null}
            
            {/* Add Account Option */}
            <TouchableOpacity 
              style={styles.addAccountItem}
              onPress={() => handleAccountSelect()}
            >
              <View style={styles.addAccountIcon}>
                <Ionicons name="person-add" size={wp('6%')} color="#4285F4" />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.addAccountText}>Use another account</Text>
                <Text style={styles.addAccountSubtext}>Add or sign in to a different Google account</Text>
              </View>
              <Ionicons name="chevron-forward" size={wp('5%')} color="#9CA3AF" />
            </TouchableOpacity>

            {/* WebView Fallback */}
            <TouchableOpacity 
              style={styles.webViewFallback}
              onPress={handleUseWebView}
            >
              <Ionicons name="globe-outline" size={wp('5%')} color="#6B7280" />
              <Text style={styles.webViewFallbackText}>Use web browser instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView */}
        {authUrl && (
          <WebView
            ref={webViewRef}
            source={{ uri: authUrl }}
            style={[styles.webView, (isLoading || webViewLoading) && styles.hidden]}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={handleWebViewError}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          />
        )}

        {/* Error State */}
        {!authUrl && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={wp('12%')} color="#EF4444" />
            <Text style={styles.errorTitle}>Authentication Unavailable</Text>
            <Text style={styles.errorText}>
              Unable to load Google authentication. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initializeGoogleAuth}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={wp('4%')} color="#10B981" />
          <Text style={styles.securityText}>
            Secure authentication powered by Google
          </Text>
        </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('8%'),
  },
  container: {
    width: '100%',
    maxWidth: wp('90%'),
    height: hp('80%'),
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: wp('2%'),
  },
  title: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  placeholder: {
    width: wp('10%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#6B7280',
    textAlign: 'center',
  },
  webView: {
    flex: 1,
    marginHorizontal: wp('4%'),
  },
  hidden: {
    opacity: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  errorTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  errorText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('3%'),
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('6%'),
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityText: {
    marginLeft: wp('2%'),
    fontSize: wp('3%'),
    color: '#6B7280',
  },
  // Account selection styles
  accountsContainer: {
    flex: 1,
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('2%'),
  },
  accountsTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('3%'),
    textAlign: 'center',
  },
  accountsList: {
    maxHeight: hp('40%'),
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F9FAFB',
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountPhoto: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('4%'),
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('0.5%'),
  },
  accountEmail: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
  },
  addAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    backgroundColor: '#F0F9FF',
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  addAccountIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
  },
  addAccountText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: hp('0.5%'),
  },
  addAccountSubtext: {
    fontSize: wp('3.2%'),
    color: '#3B82F6',
  },
  webViewFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('2%'),
    marginTop: hp('2%'),
  },
  webViewFallbackText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    marginLeft: wp('2%'),
  },
  defaultAvatar: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoogleOAuthModal;