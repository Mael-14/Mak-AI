
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

const CAROUSEL_CARD_WIDTH = SCREEN_WIDTH * 0.88
const CAROUSEL_GAP = scale(20)
const CAROUSEL_SNAP_INTERVAL = CAROUSEL_CARD_WIDTH + CAROUSEL_GAP
const SIDE_INSET = (SCREEN_WIDTH - CAROUSEL_CARD_WIDTH) / 2

const CAROUSEL_DATA = [
    {
        id: '1',
        title: 'Daily challenge',
        subtitle: 'Do your plan before 09:00 AM',
        color: ['#8bb7faff', '#131673ff'], // Purple/Lavender
        //image: require('../../assets/redesign/daily_challenge.png'),
        type: 'challenge'
    },
    {
        id: '2',
        title: 'Flashcards',
        subtitle: 'Boost your memory with AI',
        color: ['#60A5FA', '#3B82F6'], // Blue
        image: require('../../assets/redesign/flashcards.png'),
        type: 'feature'
    },
    {
        id: '3',
        title: 'AI Tutor',
        subtitle: 'Get help with any subject',
        color: ['#FBBF24', '#F59E0B'], // Orange/Gold
        image: require('../../assets/redesign/community.png'),
        type: 'tutor'
    }
];


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
    const SUBJECTS = [
        { id: 1, title: 'Mathematics', image: require('../../assets/Maths.png') },
        { id: 2, title: 'Biology', image: require('../../assets/Biology.png') },
        { id: 3, title: 'Chemistry', image: require('../../assets/Chemistry.png') },
        { id: 4, title: 'Physics', image: require('../../assets/Physics.png') },
    ];

    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light

    const renderCarouselItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.carouselCard, { width: CAROUSEL_CARD_WIDTH, marginHorizontal: CAROUSEL_GAP / 2 }]}
            onPress={() => item.id === '2' ? router.push('/Flashcards') : null}
        >
            <LinearGradient colors={item.color} style={styles.carouselGradient}>
                <View style={styles.carouselContent}>
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                    <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>

                    {item.type === 'challenge' && (
                        <View style={styles.participantsContainer}>
                            <View style={styles.avatarMini}><Text style={styles.avatarEmoji}>👩‍💻</Text></View>
                            <View style={[styles.avatarMini, { marginLeft: -10 }]}><Text style={styles.avatarEmoji}>👨‍🎓</Text></View>
                            <View style={[styles.avatarMini, { marginLeft: -10 }]}><Text style={styles.avatarEmoji}>🧑‍🏫</Text></View>
                            <View style={[styles.avatarCount, { marginLeft: -10 }]}>
                                <Text style={styles.avatarCountText}>+4</Text>
                            </View>
                        </View>
                    )}
                </View>
                <Image source={item.image} style={styles.carouselImage} resizeMode="contain" />
            </LinearGradient>
        </TouchableOpacity>
    );


    const [tokens, setTokens] = useState(100) // Default token count
    const [activeIndex, setActiveIndex] = useState(0)

    const dynamicWeekDays = React.useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const currentDayIndex = today.getDay(); // 0-6 (Sun-Sat)

        return days.map((day, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() - currentDayIndex + index);
            return {
                day: day,
                date: date.getDate().toString(),
                fullDate: date,
                active: index === currentDayIndex
            };
        });
    }, []);

    const handleScroll = (event) => {
        const scrollOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollOffset / CAROUSEL_SNAP_INTERVAL);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const getCurrentDate = () => {
        const options = { month: 'short', day: 'numeric', weekday: 'short' };
        return new Date().toLocaleDateString('en-US', options);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.headerContainer}>
                <View style={styles.profileSection}>
                    <TouchableOpacity style={styles.avatarWrapper}>
                        <Image source={require('../../assets/mak.jpg')} style={styles.avatarImage} />
                    </TouchableOpacity>
                    <View style={{ marginLeft: scale(12) }}>
                        <Text style={styles.hiText}>Hello, {userName}</Text>
                        <Text style={styles.todayText}>{getCurrentDate()}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.tokenBadge}>
                    <View >
                        <Ionicons name="sparkles" size={14} color="#f6f647ff" />
                    </View>
                    <Text style={styles.tokenText}> {tokens}</Text>
                    <View style={styles.plusCircleSmall}>
                        <Ionicons name="add" size={10} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </View>

            <FlatList
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        {/* Carousel Section */}
                        <FlatList
                            data={CAROUSEL_DATA}
                            renderItem={renderCarouselItem}
                            horizontal
                            snapToAlignment="center"
                            snapToInterval={CAROUSEL_SNAP_INTERVAL}
                            decelerationRate="fast"
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={[styles.carouselList, { paddingHorizontal: SIDE_INSET - (CAROUSEL_GAP / 2) }]}
                            keyExtractor={(item) => item.id}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        />

                        {/* Carousel Indicators */}
                        <View style={styles.indicatorContainer}>
                            {CAROUSEL_DATA.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        activeIndex === index ? styles.activeDotIndicator : styles.inactiveDot
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Personal Time Table Header */}
                        <View style={styles.calendarHeader}>
                            <Text style={styles.sectionTitleNew}>Time Table</Text>
                            <TouchableOpacity style={styles.setAction}>
                                <Text style={styles.setText}>Set</Text>
                                <Ionicons name="chevron-forward" size={14} color="#6366F1" />
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Strip */}
                        <View style={styles.calendarContainer}>
                            <FlatList
                                data={dynamicWeekDays}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <View style={[styles.dateCard, item.active && styles.activeDateCard]}>
                                        <Text style={[styles.dateDay, item.active && styles.activeDateText]}>{item.day}</Text>
                                        <Text style={[styles.dateNumber, item.active && styles.activeDateText]}>{item.date}</Text>
                                        {item.active && <View style={styles.activeDot} />}
                                    </View>
                                )}
                            />
                        </View>

                        {/* Your Plan Section */}
                        <View style={styles.sectionHeaderNew}>
                            <Text style={styles.sectionTitleNew}>Your plan</Text>
                        </View>

                        {/* Bento Grid Section */}
                        <View style={styles.bentoContainer}>
                            {/* Green Section - Library */}
                            <TouchableOpacity
                                style={styles.bentoBox}
                                onPress={() => router.push('/(tabs)/subject')}
                            >
                                <LinearGradient
                                    colors={['#4ADE80', '#166534']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.bentoHeader}>
                                    <View style={styles.bentoBadgeGreen}><Text style={styles.bentoBadgeTextGreen}>Library</Text></View>
                                </View>
                                <Text style={styles.bentoTitle}>Explore various GCE and Mock papers</Text>
                                <Text style={styles.bentoSubtitle}>Access your past resources</Text>
                                <View style={styles.bentoImagePlaceholder}>
                                    <Ionicons name="library" size={40} color="#FFF" style={{ opacity: 0.5 }} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.bentoRightColumn}>
                                {/* Side-by-side Tools Row */}
                                <View style={styles.bentoSmallRow}>
                                    {/* Doc Analysis */}
                                    <TouchableOpacity
                                        style={[styles.bentoBoxExtraSmall, { marginRight: scale(5) }]}
                                        onPress={() => router.push('/(tabs)/Chat')}
                                    >
                                        <LinearGradient
                                            colors={['#5e81b9ff', '#2b4a7cff']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Ionicons name="document-text" size={40} color="#FFF" style={{ marginBottom: scale(5) }} />
                                        <Text style={styles.bentoTitleExtraSmall}>Doc Analysis</Text>
                                    </TouchableOpacity>

                                    {/* Generated Exam */}
                                    <TouchableOpacity
                                        style={styles.bentoBoxExtraSmall}
                                        onPress={() => router.push('/CustomExamSetup')}
                                    >
                                        <LinearGradient
                                            colors={['#5e81b9ff', '#2b4a7cff']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <Ionicons name="create" size={40} color="#FFF" style={{ marginBottom: scale(5) }} />
                                        <Text style={styles.bentoTitleExtraSmall}>Exam Gen</Text>
                                    </TouchableOpacity>
                                </View>



                                {/* Blue Section - Community */}
                                <TouchableOpacity
                                    style={[styles.bentoBoxSmall, styles.bentoBlue]}
                                    onPress={() => router.push('/(tabs)/Chat')}
                                >
                                    <View style={styles.bentoHeader}>
                                        <View style={styles.bentoBadgeBlue}><Text style={styles.bentoBadgeTextBlue}>Social</Text></View>
                                    </View>
                                    <Text style={styles.bentoTitleSmall}>AI Community</Text>
                                    <View style={styles.socialIcons}>
                                        <Ionicons name="logo-instagram" size={18} color="#FFF" />
                                        <Ionicons name="logo-youtube" size={18} color="#FFF" style={{ marginHorizontal: 10 }} />
                                        <Ionicons name="logo-twitter" size={18} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.sectionHeaderNew}>
                            <Text style={styles.sectionTitleNew}>Recent Subjects</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/subject')}>
                                <Text style={styles.seeAllText}>See all</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                data={SUBJECTS}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listPaddingNew}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.subjectCardWrapper} onPress={() => handleSubjectPress(item)}>
                        <SubjectCard title={item.title} image={item.image} />
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
    container: { flex: 1 },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: scale(15),
    },
    profileSection: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        borderWidth: 2,
        borderColor: '#EEE',
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%' },
    hiText: { fontSize: scale(18), fontWeight: '700', color: '#1F2937' },
    todayText: { fontSize: scale(14), color: '#9CA3AF', marginTop: 2 },
    tokenBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tokenText: {
        fontSize: scale(14),
        fontWeight: '700',
        color: '#1F2937',
        marginRight: scale(6),
    },
    plusCircleSmall: {
        width: scale(16),
        height: scale(16),
        borderRadius: scale(8),
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselList: { paddingVertical: scale(10) },
    carouselCard: {
        height: scale(180),
        borderRadius: scale(28),
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    carouselGradient: { flex: 1, flexDirection: 'row', padding: scale(24) },
    carouselContent: { flex: 1, justifyContent: 'center' },
    carouselTitle: { fontSize: scale(28), fontWeight: '800', color: '#FFF' },
    carouselSubtitle: { fontSize: scale(14), color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },
    carouselImage: { width: scale(120), height: scale(120), position: 'absolute', right: scale(10), bottom: scale(10) },

    participantsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: scale(15) },
    avatarMini: { width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: '#EEE', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: scale(14) },
    avatarCount: { width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: '#5B21B6', borderWidth: 2, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    avatarCountText: { fontSize: scale(10), fontWeight: '700', color: '#FFF' },

    calendarContainer: { paddingVertical: scale(5), paddingLeft: scale(20) },
    dateCard: {
        width: scale(55),
        height: scale(80),
        borderRadius: scale(28),
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(10),
    },
    activeDateCard: { backgroundColor: '#111', borderColor: '#111' },
    dateDay: { fontSize: scale(12), color: '#9CA3AF', marginBottom: 4 },
    dateNumber: { fontSize: scale(16), fontWeight: '700', color: '#1F2937' },
    activeDateText: { color: '#FFF' },
    activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginTop: 4 },

    sectionHeaderNew: { paddingHorizontal: scale(20), marginVertical: scale(15), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitleNew: { fontSize: scale(24), fontWeight: '800', color: '#111' },
    seeAllText: { color: '#6366F1', fontWeight: '600' },

    bentoContainer: { flexDirection: 'row', paddingHorizontal: scale(20), height: scale(240) },
    bentoBox: { flex: 1.1, borderRadius: scale(15), padding: scale(20), justifyContent: 'space-between', overflow: 'hidden' },
    bentoHeader: { flexDirection: 'row', justifyContent: 'flex-start' },
    bentoBadge: { backgroundColor: '#FFD166', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
    bentoBadgeText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
    bentoTitle: { fontSize: scale(22), fontWeight: '800', color: '#FFF', marginTop: scale(10) },
    bentoSubtitle: { fontSize: scale(14), color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    bentoImagePlaceholder: { alignSelf: 'flex-end', marginTop: 10 },

    bentoRightColumn: { flex: 1, marginLeft: scale(5) },
    bentoBoxSmall: { flex: 1, borderRadius: scale(28), padding: scale(15), marginBottom: scale(5), overflow: 'hidden' },
    bentoSmallRow: { flexDirection: 'row', flex: 1, marginBottom: scale(5) },
    bentoBoxExtraSmall: {
        flex: 1,
        borderRadius: scale(18),
        padding: scale(10),
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    bentoTitleSmall: { fontSize: scale(18), fontWeight: '800', color: '#FFF', marginTop: 8 },
    bentoTitleExtraSmall: {
        fontSize: scale(9),
        fontWeight: '800',
        color: '#FFF',
        position: 'absolute',
        bottom: scale(8),
        //textAlign: 'center'
    },

    bentoOrange: { backgroundColor: '#FB923C' },
    bentoPink: { backgroundColor: '#F472B6' },
    bentoBlue: { backgroundColor: '#60A5FA' },

    bentoBadgeLight: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
    bentoBadgeTextPink: { fontSize: 10, fontWeight: '700', color: '#FFF' },
    bentoBadgeBlue: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
    bentoBadgeTextBlue: { fontSize: 10, fontWeight: '700', color: '#FFF' },

    toolsIcons: { flexDirection: 'row', marginTop: 10 },
    socialIcons: { flexDirection: 'row', marginTop: 10 },

    listPaddingNew: { paddingBottom: scale(40) },
    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: scale(20) },
    subjectCardWrapper: { marginBottom: scale(15) },

    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: scale(10),
        marginBottom: scale(5)
    },
    dot: {
        height: scale(6),
        borderRadius: scale(3),
        marginHorizontal: scale(4),
    },
    activeDotIndicator: {
        width: scale(20),
        backgroundColor: '#6366F1',
    },
    inactiveDot: {
        width: scale(6),
        backgroundColor: '#E5E7EB',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        marginTop: scale(5),
        marginBottom: scale(5)
    },
    setAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingVertical: scale(4),
        paddingHorizontal: scale(10),
        borderRadius: scale(12)
    },
    setText: {
        fontSize: scale(14),
        fontWeight: '600',
        color: '#6366F1',
        marginRight: scale(4)
    },
    bentoBadgeGreen: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12
    },
    bentoBadgeTextGreen: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF'
    },
})
