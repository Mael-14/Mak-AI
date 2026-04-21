import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

const SplashScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo Image */}
                <Image
                    source={require('../assets/mak1.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                
                {/* Loading Animation */}
                <View style={styles.loadingContainer}>
                    <LottieView
                        source={require('../animations/Loading animation blue.json')}
                        autoPlay
                        loop
                        style={styles.loader}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 40,
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loader: {
        width: 96,
        height: 96,
    },
});

