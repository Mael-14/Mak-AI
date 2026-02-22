
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, PixelRatio, useColorScheme, Platform } from 'react-native'
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
            <FlatList
                data={SUBJECT}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                ListHeaderComponent={
                    /* 2. Scaled Banner */
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
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Subject</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>See all</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listPadding}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.subjectCardWrapper} onPress={() => handleSubjectPress(item)}>

                        <SubjectCard
                            title={item.title}
                            image={item.image}
                        />

                    </TouchableOpacity>
                )}
            />

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
})
