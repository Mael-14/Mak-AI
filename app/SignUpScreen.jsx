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

const SignUpScreen = ({ navigation }) => {
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
  const handleSignUp = () => {
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

      // Simulate API call
      setTimeout(() => {
        console.log('SignUp data:', formData);
        Alert.alert(
          'Success', 
          'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        setIsLoading(false);
        // TODO: Navigate to verification screen or login after successful signup
        // navigation.navigate('EmailVerification');
      }, 1500);
    }
  };

  // Handle Google signup
  const handleGoogleSignUp = () => {
    console.log('Google signup clicked');
    Alert.alert('Google Sign Up', 'Google authentication will be initiated here');
    // TODO: Implement Google OAuth
  };

  // Toggle terms agreement
  const toggleTermsAgreement = () => {
    setAgreedToTerms(!agreedToTerms);
  };

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
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
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
            onPress={() => navigation.navigate('Login')}
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