import { View, Text, useColorScheme } from 'react-native'
import React from 'react'
import { COLORS } from '../constant/color'

const ThemedView = ({ style, ...props }) => {
    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.dark
    return (
        <View style={[{ backgroundColor: theme.background }, style]}
            {...props} />

    )
}

export default ThemedView