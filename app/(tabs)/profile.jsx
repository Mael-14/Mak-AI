import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native'
import React from 'react'
import { COLORS } from '../../constant/color'
import { Icon, MoveLeft, Activity, Star, UserPlus, Contact } from 'lucide-react-native'
import SettingsItem from '../../components/SettingsItem'
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'



const profile = () => {
    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light

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
        <ThemedView style={[styles.container, { backgroundcolor: 'green' }]}>
            <View style={styles.header}>
                <TouchableOpacity >
                    <MoveLeft size={24} color={theme.icon} />
                </TouchableOpacity>

                <ThemedText style={styles.headerTitle}>Profile</ThemedText>
            </View>
            <ThemedView style={[styles.profileCard, { color: theme.card }]}>

                <Image
                    source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQF02Jj8T2t7PdkytAw42HDuuSz7yXguKn8Lg&s' }} // Replace with actual image source
                    style={styles.profileImage}
                />
                <ThemedText style={styles.nameText}>Kam Nathanael</ThemedText>
                <Text style={styles.emailText}>Kamnathanael@gmail.com</Text>
            </ThemedView>
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
    },
    // 1. Refined Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 23,
        fontWeight: '700',
        marginLeft: 15, // Aligns title better with the back button
        letterSpacing: -0.5,
    },
    // 2. Elevated Profile Card
    profileCard: {
        marginHorizontal: 20,
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 28, // Matches your Stats screen radius
        alignItems: 'center',
        marginBottom: 25,
        // Softer, more professional shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(150, 150, 150, 0.1)', // Subtle border for definition
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#C084FC', // Using your "Mastered" purple color for brand consistency
    },
    nameText: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    emailText: {
        color: '#8E8E93', // Standard iOS Tertiary color
        fontSize: 15,
        marginTop: 4,
        fontWeight: '500',
    },
    // 3. Structured Section Header
    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#C084FC', // Brand accent color
        marginLeft: 24,
        marginTop: 10,
        marginBottom: 15,
        textTransform: 'uppercase', // Professional labeling style
        letterSpacing: 1.5,
    },
});