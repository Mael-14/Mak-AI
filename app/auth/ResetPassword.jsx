import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig'
const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const handleResetPassword = async (email) => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", "A password reset link has been sent to your email.");
        } catch (error) {
            Alert.alert("Reset Failed", error.message);
        }
    }
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>Enter the email associated with your account...</Text>
                <TextInput style={styles.input}
                    placeholder="mcraigw@outlook.com" value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none" />
                <TouchableOpacity style={styles.button} onPress={() => handleResetPassword(email)}>
                    <Text style={styles.buttonText}>Send Instructions</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

export default ResetPassword
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#1a1a1a' },
    subtitle: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 32 },
    input: {
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    button: {
        backgroundColor: '#7085FC',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})