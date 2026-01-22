import { StyleSheet, Text, View, StatusBar, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Layer1 from '../assets/layerBlur1.png'
import { AntDesign, Ionicons } from "@expo/vector-icons"
import Gicon from '../assets/google_icon.png'
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Aicon from '../assets/avatar.png'
import Licon from '../assets/lock.png'
import Eicon from '../assets/email.png'
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile, signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Complete web browser authentication
WebBrowser.maybeCompleteAuthSession();

const SignUpScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Validation functions
  const validateName = (name) => {
    if (!name) return 'Name is required';
    if (name.length < 3) return 'Name must be at least 3 characters';
    if (name.length > 50) return 'Name must be less than 50 characters';
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain a lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain an uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain a number';
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
      let error = '';
      if (field === 'name') error = validateName(value);
      else if (field === 'email') error = validateEmail(value);
      else if (field === 'password') error = validatePassword(value);

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
    let error = '';
    if (field === 'name') error = validateName(value);
    else if (field === 'email') error = validateEmail(value);
    else if (field === 'password') error = validatePassword(value);

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle form submission
  const handleSignUp = async () => {
    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError
    });

    setTouched({
      name: true,
      email: true,
      password: true
    });

    // Check if terms are agreed
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and policies to continue');
      return;
    }

    // If no errors, proceed with signup
    if (!nameError && !emailError && !passwordError) {
      setIsLoading(true);

      try {
        // Step 1: Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Step 2: Update Firebase Auth profile with display name
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });

        // Step 3: Get ID token
        const idToken = await userCredential.user.getIdToken();

        // Step 4: Create user document in Firestore via backend API
        // Note: User is already created in Firebase Auth, now we create Firestore document
        try {
          const response = await authAPI.signup({
            idToken: idToken,
            name: formData.name,
            email: formData.email
          });

          // Step 5: Store token and user data for future use
          await AsyncStorage.setItem('authToken', idToken);
          await AsyncStorage.setItem('userData', JSON.stringify({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: formData.name
          }));

          // Step 6: Success - show alert and navigate
          Alert.alert(
            'Success',
            'Account created successfully!',
            [
              {
                text: 'OK',
                onPress: () => router.push('/LoginScreen')
              }
            ]
          );
        } catch (apiError) {
          // Fallback: If backend fails, create Firestore document directly from frontend
          try {
            // Create user document directly in Firestore as fallback
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: formData.email,
              name: formData.name,
              displayName: formData.name,
              emailVerified: userCredential.user.emailVerified || false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            // Store token and user data
            await AsyncStorage.setItem('authToken', idToken);
            await AsyncStorage.setItem('userData', JSON.stringify({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: formData.name
            }));

            // Success with fallback
        Alert.alert(
          'Success',
          'Account created successfully!',
          [
            {
              text: 'OK',
                  onPress: () => router.push('/LoginScreen')
                }
              ]
            );
          } catch (firestoreError) {
            // If both backend and Firestore direct creation fail, still store auth token
            await AsyncStorage.setItem('authToken', idToken);
            await AsyncStorage.setItem('userData', JSON.stringify({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: formData.name
            }));

            const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Account created but could not save profile. Please try logging in.';
            setTimeout(() => {
              Alert.alert('Partial Success', errorMessage, [
                {
                  text: 'OK',
                  onPress: () => router.push('/LoginScreen')
            }
              ]);
            }, 0);
          }
        }
      } catch (error) {
        // Handle errors gracefully without triggering verbose call stack
        let errorMessage = 'Signup failed. Please try again.';
        
        // Handle Firebase Auth errors
        if (error?.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please login instead.';
        } else if (error?.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (error?.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error?.code === 'auth/network-request-failed') {
          errorMessage = 'Network error. Please check your internet connection.';
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

  // Handle Google signup via backend OAuth
  const handleGoogleSignUp = async () => {
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

        Alert.alert(
          'Success',
          'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/index')
            }
          ]
        );
      } else {
        throw new Error('Google sign-up was cancelled');
      }
    } catch (error) {
      let errorMessage = 'Google sign-up failed. Please try again.';
      
      // Network/connection errors
      if (error?.message?.includes('Cannot connect to server')) {
        errorMessage = error.message;
      } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend is running.';
      } else if (error?.response?.status === 500) {
        errorMessage = error?.response?.data?.message || 'Backend server error. Please check server configuration.';
      } else if (error?.message?.includes('cancelled')) {
        errorMessage = 'Google sign-up was cancelled.';
      } else if (error?.code === 'auth/invalid-custom-token') {
        errorMessage = 'Invalid authentication token. Please try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Google signup error:', error);
      
      setTimeout(() => {
        Alert.alert('Error', errorMessage);
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle terms agreement
  const toggleTermsAgreement = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.objectContainer}>
        <Image source={Layer1} style={styles.blod} />
      </View>


      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text>SignUp to get Started with Mak AI</Text>
          </View>

          {/* Name Input */}
          <View style={[
            styles.inputContainer,
            errors.name && touched.name && styles.inputError
          ]}>
            <View style={{ paddingRight: 20 }}>
              <Ionicons name="person-outline" size={22} color="#000000ff" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              onBlur={() => handleBlur('name')}
              placeholderTextColor="#a1a1a1ff"
              autoCapitalize="words"
            />
          </View>
          {errors.name && touched.name && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errors.name}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={[
            styles.inputContainer,
            errors.email && touched.email && styles.inputError
          ]}>
            <View style={{ paddingRight: 20 }}>
              {/* <Image source={Eicon} style={{ width: 12, height: 16 }} /> */}
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

          {/* Password Requirements Info */}
          {formData.password && !errors.password && touched.password && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.successText}>Password meets all requirements</Text>
            </View>
          )}

          {/* Terms and Conditions Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={toggleTermsAgreement}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>terms and policies</Text>
            </Text>
          </TouchableOpacity>

          {/* SignUp Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>SignUp</Text>
            )}
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
          >
            <Image source={Gicon} style={{ width: 25, height: 25, marginRight: 10 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Image source={Layer1} style={styles.blod} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity>
          <Text
            style={styles.signUpText}
            onPress={() => router.push('Login')}
          >
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default SignUpScreen

const styles = StyleSheet.create({
  blod: {
    position: 'absolute',
    width: wp('100%'),        // 45% of screen width
    height: hp('50%'),       // 50% of screen height
    top: hp('-11%'),         // -15% of screen height
    left: wp('-20%'),        // -10% of screen width
    zIndex: -1,
    opacity: 0.6
  },
  container: {
    position: 'absolute',
    top: hp('19%'),
    left: wp('8%'),
    right: wp('8%'),
    justifyContent: 'center',
    marginHorizontal: 20,
    zIndex: 2,
  },
  header: {
    paddingBottom: 30,
    //zIndex: 2
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
  //   enterBtn: {
  //     flex: 1,
  //     color: '#000',
  //   },
  input: {
    flex: 1,
    color: '#000',
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -4,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#bebbbbff',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4a4aff',
    borderColor: '#4a4aff',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flexD: 1,
  },
  termsLink: {
    color: '#4a4aff',
    fontWeight: '600',
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
    //paddingBottom: 20,
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