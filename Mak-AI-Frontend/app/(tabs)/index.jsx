
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, PixelRatio, useColorScheme, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import ThemedView from '../../components/ThemedView'
import { LinearGradient } from 'expo-linear-gradient'
import ThemedText from '../../components/ThemedText'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constant/color'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';
import { moderateScale, verticalScale, scale as scaleUtil } from '../../utils/scaling'
import { auth } from '../../config/firebase';


const { width: SCREEN_WIDTH } = Dimensions.get('window')

const scale = (size) => (SCREEN_WIDTH / 375) * size

const CAROUSEL_CARD_WIDTH = SCREEN_WIDTH * 0.88
const CAROUSEL_GAP = scale(20)
const CAROUSEL_SNAP_INTERVAL = CAROUSEL_CARD_WIDTH + CAROUSEL_GAP
const SIDE_INSET = (SCREEN_WIDTH - CAROUSEL_CARD_WIDTH) / 2

const CAROUSEL_DATA = [
    {
        id: '2',
        title: 'Flashcards',
        subtitle: 'Boost your memory with AI',
        color: ['#60A5FA', '#3B82F6'], // Blue
        gradientColors: ['#97bcf8', '#0c68fd'],
        image: require('../../assets/redesign/flashcards.png'),
        type: 'feature'
    },
    {
        id: '1',
        title: 'Daily challenge',
        subtitle: 'Do your plan before 09:00 AM',
        color: ['#8bb7faff', '#131673ff'], // Purple/Lavender
        image: require('../../assets/redesign/daily_challenge.png'),
        type: 'challenge'
    }
];


const Home = () => {
    const router = useRouter()
    const [energy, setEnergy] = useState(5)
    const [userName, setUserName] = useState('Learner');
    const [activeIndex, setActiveIndex] = useState(0)

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

    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light

    const renderCarouselItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.carouselCard, { width: CAROUSEL_CARD_WIDTH, marginHorizontal: CAROUSEL_GAP / 2 }]}
            onPress={() => item.id === '2' ? router.push('/Flashcards') : null}
        >
            <LinearGradient colors={item.gradientColors || item.color} style={styles.carouselGradient}>
                <View style={styles.carouselContent}>
                    <Text style={styles.carouselTitle}>{item.title}</Text>
                    <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>

                    {/* {item.type === 'challenge' && (
                        <View style={styles.participantsContainer}>
                            <View style={styles.avatarMini}><Text style={styles.avatarEmoji}>👩‍💻</Text></View>
                            <View style={[styles.avatarMini, { marginLeft: -10 }]}><Text style={styles.avatarEmoji}>👨‍🎓</Text></View>
                            <View style={[styles.avatarMini, { marginLeft: -10 }]}><Text style={styles.avatarEmoji}>🧑‍🏫</Text></View>
                            <View style={[styles.avatarCount, { marginLeft: -10 }]}>
                                <Text style={styles.avatarCountText}>+4</Text>
                            </View>
                        </View>
                    )} */}
                </View>
                <Image source={item.image} style={styles.carouselImage} resizeMode="contain" />
            </LinearGradient>
        </TouchableOpacity>
    );


    const [tokens, setTokens] = useState(100) // Default token count

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
                        <Image source={require('../../assets/thunder.png')} style={styles.tokenIcon} resizeMode="contain" />
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

                        {/* Your Plan Section */}
                        <View style={styles.sectionHeaderNew}>
                            <Text style={styles.sectionTitleNew}>Your plan</Text>
                        </View>

                        {/* Bento Grid Section */}
                        <View style={styles.bentoContainer}>
                            {/* Green Section - Library */}
                            <TouchableOpacity
                                style={styles.bentoBox}
                                onPress={() => router.push('/subject')}
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
                                <Text style={styles.bentoTitle}>Explore various GCE past papers</Text>
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



                                {/* Blue Section - Mock Exam */}
                                <TouchableOpacity
                                    style={[styles.bentoBoxSmall, styles.bentoBlue]}
                                    onPress={() => router.push('/(tabs)/Chat')}
                                >
                                    <LinearGradient
                                        colors={['#588cf6', '#3a7afa']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    <View style={styles.bentoHeader}>
                                        <View style={styles.bentoBadgeBlue}><Text style={styles.bentoBadgeTextBlue}>regional</Text></View>
                                    </View>
                                    <Text style={styles.bentoTitleSmall}>Mock exam past papers</Text>
                                    {/* <Ionicons name="layers-outline" size={14} color="#fff" /> */}
                                    <View style={styles.bentoImagePlaceholder}>
                                    <Ionicons name="layers-outline" size={40} color="#FFF" style={{ opacity: 0.5 }} />
                                </View>
                                    
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.sectionHeaderNew}>
                            <Text style={styles.sectionTitleNew}>Learning Focus</Text>
                        </View>

                        <View style={styles.focusCard}>
                            <View style={styles.focusCardTopRow}>
                                <View style={styles.focusBadge}>
                                    <Ionicons name="sparkles" size={12} color="#4F46E5" />
                                    <Text style={styles.focusBadgeText}>Stay consistent</Text>
                                </View>
                            </View>
                            <Text style={styles.focusTitle}>Study with a clean, calm workflow.</Text>
                            <Text style={styles.focusSubtitle}>
                                Keep your next step simple: open a subject, revise with flashcards, and move forward with confidence.
                            </Text>
                        </View>
                    </View>
                }
                data={[]}
                contentContainerStyle={styles.listPaddingNew}
                renderItem={null}
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
    tokenIcon: {
        width: scale(20),
        height: scale(20),
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
    bentoImagePlaceholder: { alignSelf: 'flex-end', marginTop: 5 },

    bentoRightColumn: { flex: 1, marginLeft: scale(5) },
    bentoBoxSmall: { flex: 1, borderRadius: scale(20), padding: scale(15), marginBottom: scale(5), overflow: 'hidden' },
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

    focusCard: {
        marginHorizontal: scale(20),
        marginTop: scale(4),
        marginBottom: scale(24),
        borderRadius: scale(22),
        backgroundColor: '#FFFFFF',
        padding: scale(18),
        borderWidth: 1,
        borderColor: '#EEF0F4',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 18,
        elevation: 3,
    },
    focusCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: scale(12),
    },
    focusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        backgroundColor: '#F5F7FF',
        paddingHorizontal: scale(10),
        paddingVertical: scale(6),
        borderRadius: scale(999),
    },
    focusBadgeText: {
        fontSize: scale(12),
        fontWeight: '700',
        color: '#374151',
    },
    focusTitle: {
        fontSize: scale(18),
        lineHeight: scale(24),
        fontWeight: '700',
        color: '#111827',
        marginBottom: scale(8),
    },
    focusSubtitle: {
        fontSize: scale(14),
        lineHeight: scale(21),
        color: '#6B7280',
    },
})
