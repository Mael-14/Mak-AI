import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { ChevronRight, Icon } from 'lucide-react-native'

const SettingsItem = ({ title, IconComponent }) => {
    return (
        <TouchableOpacity style={styles.listItem}>
            <View style={styles.iconContainer}>
                <IconComponent size={24} color='#ffffff' />
            </View>

            <Text style={styles.title}>{title}</Text>
            <ChevronRight size={24} color='#ffffff' />
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
        borderBottomColor: '#252525',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A', // Dark background for the icon circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    title: {
        flex: 1, // Takes up the remaining space
        color: '#ffffff',
        fontSize: 16,
    },
})