import { StyleSheet, Text, View, StatusBar, Image, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
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
import { useToast } from '../context/ToastContext';
import { saveLoginData } from '../utils/loginStorage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useGoogleSignIn } from '../services/googleAuth';

const SignUpScreen = () => {
  const { showSuccess, showError, showWarning } = useToast();
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

  // Initialize Google Sign-In
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleSignIn();

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
      showWarning('Please agree to the terms and policies to continue');
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
          const userData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: formData.name
          };
          await saveLoginData(idToken, userData);

          // Step 7: Success - show toast and navigate
          showSuccess('Account created successfully! Please sign in to continue.');
          setTimeout(() => {
            router.push('/LoginScreen');
          }, 1000);
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
            const userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: formData.name
            };
            await saveLoginData(idToken, userData);

            // Success with fallback
            showSuccess('Account created successfully! Please sign in to continue.');
            setTimeout(() => {
              router.push('/LoginScreen');
            }, 1000);
          } catch (firestoreError) {
            // If both backend and Firestore direct creation fail, still store auth token
            const userData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              name: formData.name
            };
            await saveLoginData(idToken, userData);

            const errorMessage = apiError?.response?.data?.message || apiError?.message || 'Account created but could not save profile. Please try logging in.';
            showWarning(errorMessage);
            setTimeout(() => {
              router.push('/LoginScreen');
            }, 2000);
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

        // Show error toast
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Google signup
  const handleGoogleSignUp = async () => {
    try {
      if (!agreedToTerms) {
        showError('Please agree to the Terms and Conditions to continue.');
        return;
      }

      setIsLoading(true);

      // Sign in with Google
      const userCredential = await googleSignIn();

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Create user profile in Firestore
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          emailVerified: userCredential.user.emailVerified,
          createdAt: serverTimestamp(),
          loginMethod: 'google'
        });
      } catch (firestoreError) {
        console.log('Firestore error (continuing anyway):', firestoreError);
      }

      // Store authentication data
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
        emailVerified: userCredential.user.emailVerified
      };

      // Save login data
      await saveLoginData(idToken, userData);

      // Success
      showSuccess('Account created successfully! Welcome to Mak AI.');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);

    } catch (error) {
      console.error('Google signup error:', error);

      let errorMessage = 'Google sign-up failed. Please try again.';

      if (error.message.includes('cancelled')) {
        errorMessage = 'Google sign-up was cancelled.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Please try signing in instead.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(errorMessage);
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
            <Text style={{ fontSize: wp('3.5%'), color: '#666' }}>SignUp to get Started with Mak AI</Text>
          </View>

          {/* Name Input */}
          <View style={[
            styles.inputContainer,
            errors.name && touched.name && styles.inputError
          ]}>
            <View style={{ paddingRight: wp('5%') }}>
              <Ionicons name="person-outline" size={wp('5.5%')} color="#000000ff" />
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
              <Ionicons name="alert-circle" size={wp('3.5%')} color="#EF4444" />
              <Text style={styles.errorText}>{errors.name}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={[
            styles.inputContainer,
            errors.email && touched.email && styles.inputError
          ]}>
            <View style={{ paddingRight: wp('5%') }}>
              {/* <Image source={Eicon} style={{ width: 12, height: 16 }} /> */}
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

          {/* Password Requirements Info */}
          {formData.password && !errors.password && touched.password && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={wp('3.5%')} color="#10B981" />
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
                <Ionicons name="checkmark" size={wp('4%')} color="#fff" />
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
            style={[
              styles.googleButton,
              (isLoading || googleLoading) && styles.googleButtonDisabled
            ]}
            onPress={handleGoogleSignUp}
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
      </ScrollView>

      <Image source={Layer1} style={styles.blod} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity>
          <Text
            style={styles.signUpText}
            onPress={() => router.push('/LoginScreen')}
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
    width: wp('100%'),
    height: hp('50%'),
    top: hp('-11%'),
    left: wp('-20%'),
    zIndex: -1,
    opacity: 0.6
  },
  objectContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  container: {
    position: 'absolute',
    top: hp('19%'),
    left: wp('8%'),
    right: wp('8%'),
    justifyContent: 'center',
    marginHorizontal: wp('5%'),
    zIndex: 2,
  },
  header: {
    paddingBottom: hp('3.5%'),
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
    color: '#000',
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    marginTop: hp('-0.5%'),
  },
  successText: {
    fontSize: wp('3%'),
    color: '#10B981',
    marginLeft: wp('1%'),
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('1%'),
  },
  checkbox: {
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('1%'),
    borderWidth: 2,
    borderColor: '#bebbbbff',
    marginRight: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4a4aff',
    borderColor: '#4a4aff',
  },
  termsText: {
    fontSize: wp('3.5%'),
    color: '#666',
    flex: 1,
  },
  termsLink: {
    color: '#4a4aff',
    fontWeight: '600',
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