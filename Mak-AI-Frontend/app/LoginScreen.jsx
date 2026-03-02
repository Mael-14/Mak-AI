import { StyleSheet, Text, View, StatusBar, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
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
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { saveLoginData } from '../utils/loginStorage';
import { useGoogleSignIn } from '../services/googleAuth';
import { registerAndSendToken } from '../services/notificationService';

const LoginScreen = () => {
  const router = useRouter();
  const { updateUserData } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  //const { showModal } = useModal();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Sign-In
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleSignIn();

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
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || response.data?.name
          };
          await saveLoginData(idToken, userData);
          updateUserData(userData); // Update AuthContext

          // Step 5: Register push token — fires after auth token is stored
          registerAndSendToken().catch(() => { }); // Silent, non-blocking

          // Step 6: Success - show toast and navigate
          showSuccess('Login successful! Welcome back.');
          // Navigate to home screen - adjust route as needed
          router.replace('/(tabs)'); // Navigate to tabs
        } catch (apiError) {
          // Silently handle backend errors - user is already authenticated in Firebase
          // Store token anyway for offline capability
          try {
            const userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: userCredential.user.displayName
            };
            await saveLoginData(idToken, userData);
            updateUserData(userData); // Update AuthContext

            // Register push token after auth data is stored
            registerAndSendToken().catch(() => { });

            showSuccess('Login successful! Welcome back.');
            router.replace('/(tabs)');
          } catch (storageError) {
            // Handle storage errors silently
            showSuccess('Login successful! Welcome back.');
            router.replace('/(tabs)');
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

        // Show error toast
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);

      // Sign in with Google
      const userCredential = await googleSignIn();

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Store authentication data
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
        emailVerified: userCredential.user.emailVerified
      };

      // Save login data
      await saveLoginData(idToken, userData);
      updateUserData(userData);

      // Register push token after auth data is stored
      registerAndSendToken().catch(() => { });

      // Success
      showSuccess('Login successful! Welcome back.');
      router.replace('/(tabs)');

    } catch (error) {
      console.error('Google login error:', error);

      let errorMessage = 'Google login failed. Please try again.';

      if (error.message.includes('cancelled')) {
        errorMessage = 'Google sign-in was cancelled.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      showError('Please enter your email address first');
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      // Option 1: Use Firebase Auth SDK directly (recommended)
      await sendPasswordResetEmail(auth, formData.email);
      showSuccess('Password reset email sent! Please check your inbox.');

      // Option 2: Use backend API (uncomment if preferred)
      // await authAPI.forgotPassword(formData.email);
      // showSuccess('Password reset email sent!');
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

      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <StatusBar barStyle="dark-content" />

      <Image source={Layer1} style={styles.blod} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={{ fontSize: wp('3.5%'), color: '#666' }}>Enter your credentials to continue</Text>
        </View>

        {/* Email Input */}
        <View style={[
          styles.inputContainer,
          errors.email && touched.email && styles.inputError
        ]}>
          <View style={{ paddingRight: wp('5%') }}>
            {/* <Image source={Aicon} style={{ width: 12, height: 15 }} /> */}
            <Ionicons name="mail-outline" size={wp('5.5%')} color="#000000ff" />
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
            <Ionicons name="alert-circle" size={wp('3.5%')} color="#EF4444" />
            <Text style={styles.errorText}>{errors.email}</Text>
          </View>
        )}

        {/* Password Input */}
        <View style={[
          styles.inputContainer,
          errors.password && touched.password && styles.inputError
        ]}>
          <View style={{ paddingRight: wp('5%') }}>
            {/* <Image source={Licon} style={{ width: 12, height: 15 }} /> */}
            <Ionicons name="lock-closed-outline" size={wp('5.5%')} color="#000000ff" />
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
            style={{ paddingLeft: wp('2.5%') }}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={wp('5%')}
              color="#000000ff"
            />
          </TouchableOpacity>
        </View>
        {errors.password && touched.password && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={wp('3.5%')} color="#EF4444" />
            <Text style={styles.errorText}>{errors.password}</Text>
          </View>
        )}

        {/* Forgot Password */}
        <TouchableOpacity
          style={{ flexDirection: 'row-reverse', paddingBottom: hp('1.2%'), paddingTop: hp('0.6%') }}
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
          style={[
            styles.googleButton,
            (isLoading || googleLoading) && styles.googleButtonDisabled
          ]}
          onPress={handleGoogleLogin}
          disabled={isLoading || googleLoading}
        >
          {(isLoading || googleLoading) ? (
            <ActivityIndicator color="#373130ff" size="small" />
          ) : (
            <>
              <Image source={Gicon} style={{ width: wp('6.25%'), height: wp('6.25%'), marginRight: wp('2.5%') }} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
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
    marginHorizontal: wp('5%'),
    zIndex: 2
  },
  header: {
    paddingBottom: hp('3.5%')
  },
  title: {
    fontSize: wp('8%'),
    fontWeight: '700',
    color: '#000',
    marginBottom: hp('1%'),
    fontFamily: 'Georgia',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp('75%'),
    maxWidth: 400,
    height: hp('5%'),
    minHeight: 40,
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth: 0.3,
    borderColor: '#bebbbbff',
    marginBottom: hp('1%'),
    paddingHorizontal: wp('3.5%'),
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#000000ff',
    letterSpacing: 1,
    fontSize: wp('4%'),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    marginTop: hp('-0.5%'),
  },
  errorText: {
    fontSize: wp('3%'),
    color: '#EF4444',
    marginLeft: wp('1%'),
  },
  forgotPasswordText: {
    fontSize: wp('3.5%'),
    color: '#4a4aff',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#AAB6FF',
    borderRadius: wp('3%'),
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('6%'),
    width: wp('75%'),
    maxWidth: 400,
    height: hp('6%'),
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    height: hp('7%'),
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: wp('75%'),
    maxWidth: 400,
    marginTop: hp('2%')
  },
  googleButtonText: {
    color: '#373130ff',
    fontSize: wp('3.75%'),
    fontWeight: '600',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: hp('2%'),
  },
  footerText: {
    fontSize: wp('3.5%'),
    color: '#666',
  },
  signUpText: {
    fontSize: wp('3.5%'),
    color: '#4a4aff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
})