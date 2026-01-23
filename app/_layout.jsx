import { View, Text, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { AuthProvider } from '../context/AuthContext'

const _layout = () => {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
        </AuthProvider>
    )
}

export default _layout