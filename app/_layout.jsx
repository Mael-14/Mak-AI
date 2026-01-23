import { View, Text } from 'react-native'

import { Stack } from 'expo-router'

const _layout = () => {


    return (

        <Stack screenOptions={{ headerShown: false }}>

            <Stack.Screen name="(tabs)" />
        </Stack>

    )
}

export default _layout