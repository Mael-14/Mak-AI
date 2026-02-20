import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';
import { examAPI } from '../../services/api';
const Profile = () => {
    const user = auth.currentUser;
    const userName = user?.displayName || 'Learner';
    const firstLetter = userName.charAt(0).toUpperCase();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await examAPI.getStatsSummary();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);
    const ProfileItem = ({ icon, title, color, onPress, isLast }) => (
        <TouchableOpacity
            style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={moderateScale(20)} color={color} />
            </View>
            <Text style={styles.itemTitle}>{title}</Text>
            <Ionicons name="chevron-forward" size={moderateScale(18)} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. Identity Section */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatar, styles.fallbackAvatar]}>
                            <Text style={styles.fallbackLetter}>{firstLetter}</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton}>
                            <Ionicons name="camera" size={moderateScale(14)} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.displayName || 'Learner'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* 2. Stats Row */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Ionicons name="flash" size={20} color="#FFD700" />
                        <Text style={styles.statNumber}>5</Text>
                        <Text style={styles.statLabel}>Energy</Text>
                    </View>
                    <View style={[styles.statBox, styles.statBorder]}>
                        <Ionicons name="flame" size={20} color="#FF4500" />
                        <Text style={styles.statNumber}>{stats?.streak || 0}</Text>
                        <Text style={styles.statLabel}>Streaks</Text>
                    </View>
                </View>

                {/* 3. Settings List */}
                <View style={styles.menuWrapper}>
                    <ProfileItem icon="person-outline" title="Account Settings" color="#6366F1" />
                    <ProfileItem icon="notifications-outline" title="Notifications" color="#F59E0B" />
                    <ProfileItem
                        icon="heart-outline"
                        title="My Favorites"
                        color="#EC4899" // A nice vibrant pink/rose

                    />
                    <ProfileItem
                        icon="log-out-outline"
                        title="Logout"
                        color="#EF4444"
                        isLast={true}
                        onPress={() => auth.signOut()}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: verticalScale(30),
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: verticalScale(15),
    },
    avatar: {
        width: scale(100),
        height: scale(100),
        borderRadius: scale(50),
        backgroundColor: '#E5E7EB',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366F1',
        padding: scale(8),
        borderRadius: scale(20),
        borderWidth: 3,
        borderColor: '#F9FAFB',
    },
    userName: {
        fontSize: moderateScale(22),
        fontWeight: '800',
        color: '#1F2937',
    },
    userEmail: {
        fontSize: moderateScale(14),
        color: '#6B7280',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: scale(24),
        borderRadius: moderateScale(20),
        paddingVertical: verticalScale(20),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statBorder: {
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
    },
    statNumber: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 5,
    },
    statLabel: {
        fontSize: moderateScale(12),
        color: '#9CA3AF',
    },
    menuWrapper: {
        backgroundColor: '#FFF',
        marginTop: verticalScale(25),
        marginHorizontal: scale(24),
        borderRadius: moderateScale(20),
        paddingHorizontal: scale(16),
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconContainer: {
        padding: scale(10),
        borderRadius: moderateScale(12),
        marginRight: scale(15),
    },
    itemTitle: {
        flex: 1,
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#374151',
    },
    fallbackAvatar: {
        backgroundColor: '#6366F1', // Your theme purple
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    fallbackLetter: {
        fontSize: moderateScale(40),
        fontWeight: '800',
        color: '#FFF',
    },
});

export default Profile;
