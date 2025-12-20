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
import { useModal } from '../context/ModalContext';
import { BlurView } from '@react-native-community/blur';
import Aicon from '../assets/avatar.png'
import Licon from '../assets/lock.png'

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });

  const { showModal } = useModal();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateName = (name) => {
    if (!name) return 'Name is required';
    //if (name.length < 3) return 'Name must be at least 3 characters';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    //if (password.length < 6) return 'Password must be at least 6 characters';
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
      const error = field === 'name' 
        ? validateName(value) 
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
    const error = field === 'name' 
      ? validateName(value) 
      : validatePassword(value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle form submission to verify the inputs
  const handleLogin = () => {
    // Validate all fields
    const nameError = validateName(formData.name);
    const passwordError = validatePassword(formData.password);

    setErrors({
      name: nameError,
      password: passwordError
    });

    setTouched({
      name: true,
      password: true
    });

    // If no errors, proceed with login
    if (!nameError && !passwordError) {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        console.log('Login data:', formData);
        Alert.alert('Success', 'Login successful!');
        setIsLoading(false);
        // TODO: Navigate to home screen after successful login
        // navigation.navigate('Home');
      }, 1500);
    }
  };

  // Handle Google login
  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    Alert.alert('Google Login', 'Google authentication will be initiated here');
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    Alert.alert('Forgot Password', 'Password reset flow will be initiated');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <StatusBar barStyle="dark-content" />

      <Image source={Layer1} style={styles.blod} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text>Enter your credentials to continue</Text>
        </View>

        {/* Name Input */}
        <View style={[
          styles.inputContainer,
          errors.name && touched.name && styles.inputError
        ]}>
          <View style={{ paddingRight: 20 }}>
            {/* <Image source={Aicon} style={{ width: 12, height: 15 }} /> */}
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
            onPress={() => navigation.navigate('Signup')}
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