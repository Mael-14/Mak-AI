import { View, Text, useColorScheme } from 'react-native'
import React from 'react'
import { COLORS } from '../constant/color'

const ThemedText = ({ style, ...props }) => {
    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.dark
    return (
        <View>
            <Text style={[style, { color: theme.text }]}
                {...props} />
        </View>
    )
}

export default ThemedText