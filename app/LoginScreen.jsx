import { StyleSheet, Text, View, StatusBar, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Layer1 from '../assets/layerBlur1.png'
import { AntDesign, Ionicons } from "@expo/vector-icons"
import Gicon from '../assets/google_icon.png'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete web browser authentication
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  //const { showModal } = useModal();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    return '';
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate on change if field was touched
    if (touched[field]) {
      const error = field === 'email'
        ? validateEmail(value)
        : validatePassword(value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  // Handle blur (when user leaves field)
  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    const value = formData[field];
    const error = field === 'email'
      ? validateEmail(value)
      : validatePassword(value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle form submission to verify the inputs
  const handleLogin = async () => {
    // Validate all fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError
    });

    setTouched({
      email: true,
      password: true
    });

    // If no errors, proceed with login
    if (!emailError && !passwordError) {
      setIsLoading(true);

      try {
        // Step 1: Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Step 2: Get ID token
        const idToken = await userCredential.user.getIdToken();

        // Step 3: Verify token with backend and get user profile
        try {
          const response = await authAPI.login(idToken);

          // Step 4: Store token and user data for future use
          await AsyncStorage.setItem('authToken', idToken);
          await AsyncStorage.setItem('userData', JSON.stringify({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || response.data?.name
          }));

          // Step 5: Success - show alert and navigate
          Alert.alert('Success', 'Login successful!');
          // Navigate to home screen - adjust route as needed
          router.push('/index'); // or your home route
        } catch (apiError) {
          // Silently handle backend errors - user is already authenticated in Firebase
          // Store token anyway for offline capability
          try {
            await AsyncStorage.setItem('authToken', idToken);
            await AsyncStorage.setItem('userData', JSON.stringify({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.displayName
            }));

            Alert.alert('Success', 'Login successful!');
            router.push('/index');
          } catch (storageError) {
            // Handle storage errors silently
            Alert.alert('Success', 'Login successful!');
            router.push('/index');
          }
        }
      } catch (error) {
        // Handle errors gracefully without triggering verbose call stack
        let errorMessage = 'Login failed. Please try again.';

        // Handle Firebase Auth errors
        if (error?.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email. Please sign up first.';
        } else if (error?.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (error?.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error?.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error?.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error?.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Use setTimeout to prevent error propagation that triggers call stack
        setTimeout(() => {
          Alert.alert('Error', errorMessage);
        }, 0);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Google login via backend OAuth
  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      // Step 1: Get Google OAuth URL from backend
      let response;
      try {
        response = await authAPI.getGoogleAuthUrl();
      } catch (apiError) {
        // Handle network errors specifically
        if (apiError.code === 'ECONNREFUSED' || apiError.message?.includes('Network Error')) {
          throw new Error('Cannot connect to server. Please ensure the backend is running on port 5000.');
        }
        if (apiError.response?.status === 500) {
          const errorMsg = apiError.response?.data?.message || 'Backend error. Check server logs.';
          throw new Error(errorMsg);
        }
        throw apiError;
      }

      const authUrl = response?.data?.authUrl || response?.authUrl;

      if (!authUrl) {
        throw new Error('Failed to get Google OAuth URL from backend');
      }

      // Step 2: Open Google OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('/auth/google/callback')
      );

      if (result.type === 'success') {
        // Parse the callback URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const uid = url.searchParams.get('uid');
        const error = url.searchParams.get('error');

        if (error) {
          throw new Error('Google authentication failed');
        }

        if (!token) {
          throw new Error('No token received from backend');
        }

        // Step 3: Sign in to Firebase with custom token from backend
        const userCredential = await signInWithCustomToken(auth, token);

        // Step 4: Get Firebase ID token
        const firebaseIdToken = await userCredential.user.getIdToken();

        // Step 5: Store authentication data
        await AsyncStorage.setItem('authToken', firebaseIdToken);
        await AsyncStorage.setItem('userData', JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0]
        }));

        Alert.alert('Success', 'Login successful!');
        router.push('/index');
      } else {
        throw new Error('Google sign-in was cancelled');
      }
    } catch (error) {
      let errorMessage = 'Google sign-in failed. Please try again.';

      // Network/connection errors
      if (error?.message?.includes('Cannot connect to server')) {
        errorMessage = error.message;
      } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend is running.';
      } else if (error?.response?.status === 500) {
        errorMessage = error?.response?.data?.message || 'Backend server error. Please check server configuration.';
      } else if (error?.message?.includes('cancelled')) {
        errorMessage = 'Google sign-in was cancelled.';
      } else if (error?.code === 'auth/invalid-custom-token') {
        errorMessage = 'Invalid authentication token. Please try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.error('Google login error:', error);

      setTimeout(() => {
        Alert.alert('Error', errorMessage);
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      // Option 1: Use Firebase Auth SDK directly (recommended)
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert(
        'Email Sent',
        'Password reset email has been sent. Please check your inbox.',
        [{ text: 'OK' }]
      );

      // Option 2: Use backend API (uncomment if preferred)
      // await authAPI.forgotPassword(formData.email);
      // Alert.alert('Success', 'Password reset email sent!');
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to send password reset email.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <StatusBar barStyle="dark-content" />

      <Image source={Layer1} style={styles.blod} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text>Enter your credentials to continue</Text>
        </View>

        {/* Email Input */}
        <View style={[
          styles.inputContainer,
          errors.email && touched.email && styles.inputError
        ]}>
          <View style={{ paddingRight: 20 }}>
            {/* <Image source={Aicon} style={{ width: 12, height: 15 }} /> */}
            <Ionicons name="mail-outline" size={22} color="#000000ff" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            onBlur={() => handleBlur('email')}
            placeholderTextColor="#a1a1a1ff"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {errors.email && touched.email && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{errors.email}</Text>
          </View>
        )}

        {/* Password Input */}
        <View style={[
          styles.inputContainer,
          errors.password && touched.password && styles.inputError
        ]}>
          <View style={{ paddingRight: 20 }}>
            {/* <Image source={Licon} style={{ width: 12, height: 15 }} /> */}
            <Ionicons name="lock-closed-outline" size={22} color="#000000ff" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            onBlur={() => handleBlur('password')}
            secureTextEntry={!showPassword}
            placeholderTextColor="#a1a1a1ff"
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ paddingLeft: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#000000ff"
            />
          </TouchableOpacity>
        </View>
        {errors.password && touched.password && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{errors.password}</Text>
          </View>
        )}

        {/* Forgot Password */}
        <TouchableOpacity
          style={{ flexDirection: 'row-reverse', paddingBottom: 10, paddingTop: 5 }}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            isLoading && styles.loginButtonDisabled
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Google Button */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <Image source={Gicon} style={{ width: 25, height: 25, marginRight: 10 }} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <Image source={Layer1} style={styles.blod} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity>
          <Text
            style={[styles.signUpText]}
            onPress={() => router.push('/SignUpScreen')}
          >
            SignUp
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  blod: {
    position: 'absolute',
    width: wp('100%'),
    height: hp('50%'),
    top: hp('-8%'),
    left: wp('-20%'),
    zIndex: -1,
    opacity: 0.6
  },
  container: {
    position: 'absolute',
    top: hp('25%'),
    left: wp('8%'),
    right: wp('8%'),
    justifyContent: 'center',
    marginHorizontal: 20,
    zIndex: 2
  },
  header: {
    paddingBottom: 30
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.3,
    borderColor: '#bebbbbff',
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#000000ff',
    letterSpacing: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4a4aff',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#AAB6FF',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 24,
    width: 300,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: 300,
    marginTop: 16
  },
  googleButtonText: {
    color: '#373130ff',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signUpText: {
    fontSize: 14,
    color: '#4a4aff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
})