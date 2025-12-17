import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { COLORS } from '../constant/color'
import { Icon, MoveLeft, Activity, Star, UserPlus, Contact } from 'lucide-react-native'
import SettingsItem from '../components/SettingsItem'
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'



const profile = () => {
    const theme = COLORS

    const settingOptions = [
        { id: '1', title: 'My Stats', icon: 'Activity' },
        { id: '2', title: 'Favorites', icon: 'Star' },
        { id: '3', title: 'Invite a friend', icon: 'UserPlus' },
        { id: '4', title: 'Contact us', icon: 'Contact' },

    ]
    const iconMap = {
        'Activity': Activity,
        'Star': Star,
        'UserPlus': UserPlus,
        'Contact': Contact,
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity >
                    <MoveLeft size={24} color='#ffffff' />
                </TouchableOpacity>

                <ThemedText style={styles.headerTitle}>Profile</ThemedText>
            </View>
            <View style={styles.profileCard}>

                <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF02Jj8T2t7PdkytAw42HDuuSz7yXguKn8Lg&s' }} // Replace with actual image source
                    style={styles.profileImage}
                />
                <ThemedText style={styles.nameText}>Kam Nathanael</ThemedText>
                <Text style={styles.emailText}>Kamnathanael@gmail.com</Text>
            </View>
            <ThemedText style={styles.sectionHeader}>Setting</ThemedText>
            {settingOptions.map((item) => (
                <SettingsItem
                    key={item.id}
                    title={item.title}
                    IconComponent={iconMap[item.icon]}
                />
            ))}

        </ThemedView>


    )
}

export default profile
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Solid black background
    },

    // A. Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, // For notch/status bar spacing
        paddingBottom: 20,
    },
    headerTitle: {

        fontSize: 18,
        fontWeight: 'bold',
    },
    profileCard: {
        backgroundColor: '#1C1C1C', // Dark gray card background
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 30,
        // Add subtle shadow for depth on iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // Half of width/height for a circle
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#D2FF5E', // Subtle border
    },
    nameText: {

        fontSize: 20,
        fontWeight: '600',
        marginTop: 5,
    },
    emailText: {
        color: '#A9A9A9',
        fontSize: 14,
        marginBottom: 15,
    },
    sectionHeader: {

        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 20,
        marginTop: 15,
        marginBottom: 10,
    },
})