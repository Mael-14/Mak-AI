import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { ChevronRight, Icon } from 'lucide-react-native'
import ThemedText from './ThemedText'
import { useColorScheme } from 'react-native'
import { COLORS } from '../constant/color'

const SettingsItem = ({ title, IconComponent }) => {
    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light
    return (
        <TouchableOpacity style={[styles.listItem, { backgroundColor: theme.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                <IconComponent size={24} color={theme.icon} />
            </View>
            <View style={styles.content}>
                <ThemedText style={styles.title}>{title}</ThemedText>
                <ChevronRight size={24} color={theme.icon} />
            </View>
        </TouchableOpacity>
    )
}

export default SettingsItem
const styles = StyleSheet.create({
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
        marginBottom: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 50,
        // Dark background for the icon circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    title: {
        // Takes up the remaining space
        fontWeight: 400,
        fontSize: 16,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    }
})