import { StyleSheet, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Tabs, useRouter, useSegments } from 'expo-router'
import CustomNavBar from '../../components/CustonNavBar'
import { useNavigationState } from '@react-navigation/native';
import { isOnboardingCompleted } from '../../utils/onboardingStorage';
import { useAuth } from '../../context/AuthContext';
import SplashScreen from '../../components/SplashScreen';

const _layout = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, loading: authLoading, isInitialized } = useAuth();

    const currentRouteName = useNavigationState((state) => {
        const route = state.routes[state.index];
        return route.name;
    });

    useEffect(() => {
        // Show splash screen for 5 seconds, then check onboarding
        const splashTimer = setTimeout(() => {
            setShowSplash(false);
            checkOnboardingStatus();
        }, 5000); // 5 seconds

        return () => clearTimeout(splashTimer);
    }, []);

    const checkOnboardingStatus = async () => {
        setIsCheckingOnboarding(true);
        try {
            const completed = await isOnboardingCompleted();
            const currentRoute = segments[0] || '';

            // If onboarding not completed, redirect to onboarding screen
            if (!completed) {
                // Only redirect if not already on onboarding/auth screens
                if (currentRoute !== 'OnboardingScreen' &&
                    currentRoute !== 'LoginScreen' &&
                    currentRoute !== 'SignUpScreen' &&
                    currentRoute !== 'auth') {
                    router.replace('/OnboardingScreen');
                }
            } else {
                // If onboarding completed, check auth status
                if (isInitialized) {
                    if (!isAuthenticated) {
                        // Not authenticated - redirect to login if not already there
                        if (currentRoute !== 'LoginScreen' &&
                            currentRoute !== 'SignUpScreen' &&
                            currentRoute !== 'OnboardingScreen') {
                            router.replace('/LoginScreen');
                        }
                    } else {
                        // Authenticated - if on login/signup screens, redirect to home
                        if (currentRoute === 'LoginScreen' || currentRoute === 'SignUpScreen' || currentRoute === 'OnboardingScreen') {
                            router.replace('/(tabs)');
                        }
                    }
                }
                
                // If onboarding completed and on onboarding screen, redirect to login
                if (currentRoute === 'OnboardingScreen' && !isAuthenticated) {
                    router.replace('/LoginScreen');
                }
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // On error, redirect to onboarding to be safe
            const currentRoute = segments[0] || '';
            if (currentRoute !== 'OnboardingScreen' &&
                currentRoute !== 'LoginScreen' &&
                currentRoute !== 'SignUpScreen' &&
                currentRoute !== 'auth') {
                router.replace('/OnboardingScreen');
            }
        } finally {
            setIsCheckingOnboarding(false);
        }
    };
    
    // Re-check when auth state changes
    useEffect(() => {
        if (isInitialized && !authLoading) {
            checkOnboardingStatus();
        }
    }, [isAuthenticated, isInitialized, authLoading]);

    // Show splash screen for 5 seconds
    if (showSplash) {
        return <SplashScreen />;
    }

    // Show loading screen while checking auth or onboarding status
    if (authLoading || !isInitialized || isCheckingOnboarding) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7085FC" />
            </View>
        );
    }

    return (
        <Tabs
            tabBar={(props) => <CustomNavBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name='index' options={{ title: 'Home' }} />
            <Tabs.Screen name='Chat' options={{ title: 'Chat' }} />
            <Tabs.Screen name='Stats' options={{ title: 'Stats' }} />
            <Tabs.Screen name='profile' options={{ title: 'Profile' }} />
        </Tabs>
    )
}
export default _layout

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
})