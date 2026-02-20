import { View, Text, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

const _layout = () => {
    return (
        <ToastProvider>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                </Stack>
            </AuthProvider>
        </ToastProvider>
    )
}

export default _layout