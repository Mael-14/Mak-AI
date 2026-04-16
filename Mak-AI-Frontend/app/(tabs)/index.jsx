
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, PixelRatio, useColorScheme, Platform, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import ThemedView from '../../components/ThemedView'
import { LinearGradient } from 'expo-linear-gradient'
import ThemedText from '../../components/ThemedText'
import SubjectCard from '../../components/SubjectCard'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constant/color'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import LevelSelectionAlert from '../../components/LevelSelectionAlert';
import { moderateScale, verticalScale } from '../../utils/scaling'
import { auth } from '../../config/firebase';


const { width: SCREEN_WIDTH } = Dimensions.get('window')

const scale = (size) => (SCREEN_WIDTH / 375) * size

const Home = () => {
    const router = useRouter()
    const [showLevelAlert, setShowLevelAlert] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState(null)
    const [energy, setEnergy] = useState(5)
    const [userName, setUserName] = useState('Learner');

    useEffect(() => {
        const user = auth.currentUser;
        if (user && user.displayName) {
            setUserName(user.displayName);
        } else if (user && user.email) {
            // Fallback: If no name is set, show the first part of their email
            const nameFromEmail = user.email.split('@')[0];
            setUserName(nameFromEmail);
        }
    }, []);
    const goToCards = () => {
        router.push('/Flashcards')
    }

    const handleSubjectPress = (item) => {
        setSelectedSubject(item)
        setShowLevelAlert(true)
    }

    const handleLevelSelect = (level) => {
        if (selectedSubject) {
            router.push({
                pathname: '/subject/[id]',
                params: {
                    id: selectedSubject.id.toString(),
                    level: level
                }
            });
        }
        setSelectedSubject(null)
    }
    const SUBJECT = [
        {
            id: 1,
            title: 'Mathematics',
            image: require('../../assets/Maths.png'),
        },
        {
            id: 2,
            title: 'Biology',
            image: require('../../assets/Biology.png'),
        },
        {
            id: 3,
            title: 'Chemistry',
            image: require('../../assets/Chemistry.png'),
        },
        {
            id: 4,
            title: 'Physics',
            image: require('../../assets/Physics.png'),
        },
        {
            id: 5,
            title: 'Computer Science',
            image: require('../../assets/Computer science.png'),
        },
        {
            id: 6,
            title: 'Math Stats',
            image: require('../../assets/Math Statistic.png'),
        },
        {
            id: 7,
            title: 'Geography',
            image: require('../../assets/Geography.png'),
        },
        {
            id: 8,
            title: 'Further Math',
            image: require('../../assets/FurtherMath.png'),
        },
    ]

    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerContainer}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.hiText}>Hi!</Text>
                    <Text numberOfLines={1} style={styles.userNameText}>
                        {userName} 👋
                    </Text>
                    <Text style={styles.subText}>Ready to learn?</Text>
                </View>

                {/* Energy / Thunder Counter */}
                <TouchableOpacity
                    style={styles.energyBadge}

                    activeOpacity={0.7}
                >
                    <Image
                        source={require('../../assets/thunder.png')}
                        style={[styles.energyIcon, { width: moderateScale(30), height: moderateScale(23) }]}
                    />
                    <Text style={styles.energyText}>{energy}</Text>
                    <View style={styles.plusContainer}>
                        <Ionicons name="add" size={12} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 2. Scaled Banner */}
                <View style={{ marginBottom: scale(5) }}>
                    <View style={styles.bannerContainer}>
                        <LinearGradient colors={['#7085FC', '#A6B2FF']} style={styles.bannerGradient}>
                            <View style={styles.bannerContent}>
                                <Text style={styles.bannerTitle}>Flashcards</Text>
                                <Text style={styles.bannerSubtitle}>
                                    Study the most frequent definitions
                                </Text>
                                <TouchableOpacity style={styles.startButton} onPress={() => router.push('/Flashcards')}>
                                    <Text style={styles.startButtonText}>Start Now</Text>
                                </TouchableOpacity>
                            </View>
                            <Image
                                source={require('../../assets/Card.png')}
                                style={styles.cardImage}
                                resizeMode='contain'
                            />
                        </LinearGradient>

                    </View>
                </View>

                {/* Your Plan Section */}
                <View style={styles.planSection}>
                    <Text style={styles.sectionTitleHeader}>Your plan</Text>

                    <View style={styles.gridContainer}>
                        {/* Large Card - Left (Explore) */}
                        <TouchableOpacity
                            style={styles.largeCard}
                            onPress={() => router.push('/ExploreSubjects')}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#FFB74D', '#FFCC80']} // Amber (Matches Start Now button)
                                style={styles.cardGradient}
                            >
                                <View style={styles.iconCircle}>
                                    <Ionicons name="library" size={moderateScale(24)} color="#FFF" />
                                </View>
                                <Text style={styles.largeCardTitle}>Explore GCE & Mock Papers</Text>
                                <Text style={styles.largeCardSubtitle}>120+ Resources</Text>
                                <View style={styles.cardArrow}>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Right Column - Stacked Cards */}
                        <View style={styles.rightColumn}>
                            {/* Top Card - Doc Analysis */}
                            <TouchableOpacity
                                style={styles.smallCard}
                                onPress={() => router.push({ pathname: '/(tabs)/Chat', params: { action: 'upload' } })}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#7085FC', '#A6B2FF']} // Soft Blue/Purple (Matches Flashcards)
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.iconCircleSmall}>
                                        <Ionicons name="document-text" size={moderateScale(20)} color="#FFF" />
                                    </View>
                                    <Text style={styles.smallCardText}>Doc Analysis</Text>
                                    <View style={styles.cardArrowSmall}>
                                        <Ionicons name="arrow-forward" size={12} color="#FFF" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Bottom Card - Exam Gen */}
                            <TouchableOpacity
                                style={styles.smallCard}
                                onPress={() => router.push('/CustomsExamScreen')}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#7085FC', '#A6B2FF']} // Soft Blue/Purple (Matches Flashcards)
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.iconCircleSmall}>
                                        <Ionicons name="create" size={moderateScale(20)} color="#FFF" />
                                    </View>
                                    <Text style={styles.smallCardText}>Exam Gen</Text>
                                    <View style={styles.cardArrowSmall}>
                                        <Ionicons name="arrow-forward" size={12} color="#FFF" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Daily Tips Section (Replacing "On Going") */}
                <View style={styles.tipsSection}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleHeader}>Daily Tips</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllTips}>Read all</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.tipsCard} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#F3F4F6', '#E5E7EB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.tipsGradient}
                        >
                            <View style={styles.tipsContent}>
                                <Text style={styles.tipLabel}>STUDY TIP</Text>
                                <Text style={styles.tipTitle}>Improve focus with Active Recall</Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </ScrollView>


            <LevelSelectionAlert
                visible={showLevelAlert}
                onClose={() => {
                    setShowLevelAlert(false)
                    setSelectedSubject(null)
                }}
                onSelectLevel={handleLevelSelect}
                subjectTitle={selectedSubject?.title}
            />
        </SafeAreaView>
    )
}

export default Home
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(30), marginHorizontal: scale(16), paddingTop: scale(10) },
    titleText: { fontSize: scale(30), fontWeight: 'bold' },
    searchButton: { width: scale(48), height: scale(48), justifyContent: 'center', alignItems: 'center' },
    bannerContainer: {
        borderRadius: scale(24), // Scaled corners
        overflow: 'hidden',
        marginHorizontal: scale(2),
        marginBottom: scale(20)
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: moderateScale(15),
        paddingVertical: moderateScale(15),
    },
    hiText: {
        fontSize: moderateScale(20),
        color: '#1F2937', // Soft grey for the greeting
        fontWeight: '500',
    },
    userNameText: {
        fontSize: moderateScale(28), // Big and bold
        fontWeight: '800',
        color: '#1F2937',
        marginTop: verticalScale(-4), // Pulls the name closer to the "Hi"
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: moderateScale(14),
        color: '#9CA3AF',
    },
    energyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: verticalScale(6),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(20),
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: verticalScale(5), // Aligns it nicely with the text stack
        // Shadow for premium feel
        marginRight: scale(4),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Professional Shadow
        ...Platform.select({
            ios: {
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    energyText: {
        fontSize: moderateScale(16),
        fontWeight: '700',

        marginRight: 4,
        color: '#374151',
    },
    plusContainer: {
        backgroundColor: '#6366F1', // Your theme purple/blue
        borderRadius: 10,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerGradient: { padding: scale(24), height: scale(170), flexDirection: 'row' },
    bannerContent: { flex: 1, justifyContent: 'center' },
    bannerTitle: { fontSize: scale(30), fontWeight: 'bold' },
    bannerSubtitle: {
        fontSize: moderateScale(14),
        color: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
        fontWeight: '300',
        marginTop: verticalScale(2), // Small gap under the title
        marginBottom: verticalScale(8), // Gap before the button
        lineHeight: moderateScale(18), // Better readability
        maxWidth: '60%', // Prevents text from running into the image
    },
    startButton: { backgroundColor: '#FFB74D', paddingVertical: scale(10), paddingHorizontal: scale(15), borderRadius: scale(15), alignSelf: 'flex-start', marginVertical: scale(10) },
    startButtonText: { color: '#FFF', fontWeight: 'bold' },
    cardImage: { width: scale(150), height: scale(150), position: 'absolute', right: scale(10), bottom: scale(10) },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(15), marginHorizontal: scale(16) },
    sectionTitle: { fontSize: scale(20), fontWeight: '700' },
    seeAllText: { color: '#7986CB', fontWeight: '600' },
    listPadding: { paddingHorizontal: scale(20), paddingTop: scale(20), paddingBottom: scale(40) },
    columnWrapper: { justifyContent: 'space-between' },
    scrollContent: {
        paddingHorizontal: scale(16),
        paddingBottom: scale(40),
    },
    planSection: {
        marginTop: scale(10),
    },
    sectionTitleHeader: {
        fontSize: scale(22),
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: scale(15),
    },
    gridContainer: {
        flexDirection: 'row',
        gap: scale(12),
        height: scale(200),
    },
    largeCard: {
        flex: 1.2,
        borderRadius: scale(20),
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    rightColumn: {
        flex: 1,
        gap: scale(12),
    },
    smallCard: {
        flex: 1,
        borderRadius: scale(20),
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardGradient: {
        flex: 1,
        padding: scale(15),
        justifyContent: 'center',
    },
    badgeLabel: {
        position: 'absolute',
        top: scale(10),
        left: scale(10),
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: scale(8),
        paddingVertical: scale(2),
        borderRadius: scale(10),
    },
    badgeLabelText: {
        color: '#FFF',
        fontSize: scale(10),
        fontWeight: '600',
    },
    largeCardTitle: {
        fontSize: scale(18),
        fontWeight: '700',
        color: '#FFF',
        marginTop: scale(15),
    },
    largeCardSubtitle: {
        fontSize: scale(12),
        color: 'rgba(255,255,255,0.8)',
        marginTop: scale(5),
    },
    cardIconBottom: {
        position: 'absolute',
        bottom: scale(-5),
        right: scale(-5),
    },
    smallCardIcon: {
        marginBottom: scale(5),
    },
    smallCardText: {
        fontSize: scale(14),
        fontWeight: '700',
        color: '#FFF',
    },
    iconCircle: {
        width: scale(45),
        height: scale(45),
        borderRadius: scale(22.5),
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scale(10),
    },
    iconCircleSmall: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(18),
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: scale(5),
    },
    cardArrow: {
        position: 'absolute',
        top: scale(20),
        right: scale(20),
        width: scale(28),
        height: scale(28),
        borderRadius: scale(14),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardArrowSmall: {
        position: 'absolute',
        top: scale(15),
        right: scale(15),
        width: scale(22),
        height: scale(22),
        borderRadius: scale(11),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipsSection: {
        marginTop: scale(25),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scale(12),
    },
    seeAllTips: {
        fontSize: scale(14),
        color: '#7085FC',
        fontWeight: '600',
    },
    tipsCard: {
        borderRadius: scale(24),
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    tipsGradient: {
        flexDirection: 'row',
        padding: scale(20),
        alignItems: 'center',
    },
    tipsContent: {
        flex: 1,
    },
    tipLabel: {
        fontSize: scale(10),
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: scale(6),
    },
    tipTitle: {
        fontSize: scale(16),
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: scale(12),
    },
    tipProgressContainer: {
        height: scale(6),
        backgroundColor: '#E5E7EB',
        borderRadius: scale(3),
        width: '80%',
        marginBottom: scale(6),
    },
    tipProgressBar: {
        height: '100%',
        backgroundColor: '#7085FC',
        borderRadius: scale(3),
    },
    tipMetric: {
        fontSize: scale(11),
        color: '#6B7280',
        fontWeight: '500',
    },
    tipIllustrationContainer: {
        width: scale(80),
        height: scale(80),
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipIllustration: {
        width: '100%',
        height: '100%',
    },
})