import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, PixelRatio, useColorScheme } from 'react-native'
import React from 'react'
import ThemedView from '../components/ThemedView'
import { LinearGradient } from 'expo-linear-gradient'
import ThemedText from '../components/ThemedText'
import SubjectCard from '../components/SubjectCard'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constant/color'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router';


const { width: SCREEN_WIDTH } = Dimensions.get('window')

const scale = (size) => (SCREEN_WIDTH / 375) * size

const Home = () => {
    const router = useRouter()
    const goToCards = () => {
        router.push('/Flashcards')
    }
    const SUBJECT = [
        {
            id: 1,
            title: 'Mathematics',
            image: require('../assets/Maths.png'),
        },
        {
            id: 2,
            title: 'Biology',
            image: require('../assets/Biology.png'),
        },
        {
            id: 3,
            title: 'Chemistry',
            image: require('../assets/Chemistry.png'),
        },
        {
            id: 4,
            title: 'Physics',
            image: require('../assets/Physics.png'),
        },
        {
            id: 5,
            title: 'Computer Science',
            image: require('../assets/Computer science.png'),
        },
        {
            id: 6,
            title: 'Math Stats',
            image: require('../assets/Math Statistic.png'),
        },
        {
            id: 7,
            title: 'Geography',
            image: require('../assets/Geography.png'),
        },
        {
            id: 8,
            title: 'Further Math',
            image: require('../assets/FurtherMath.png'),
        },
    ]

    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <ThemedText style={styles.titleText}>Find your Course</ThemedText>
                    </View>
                    <TouchableOpacity style={styles.searchButton}>
                        <Ionicons name="search" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.bannerContainer}>
                    <LinearGradient colors={['#7085FC', '#A6B2FF']} style={styles.bannerGradient}>
                        <View style={styles.bannerContent}>
                            <ThemedText style={styles.bannerTitle}>Flashcards</ThemedText>
                            <TouchableOpacity style={styles.startButton} onPress={goToCards}>
                                <Text style={styles.startButtonText}>Start Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Image
                            source={require('../assets/Card.png')}
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
                <FlatList
                    data={SUBJECT}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listPadding}
                    columnWrapperStyle={styles.columnWrapper}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={0.7}
                            onPress={() => {
                                // Navigate to subject screen with the subject ID
                                router.push({
                                    pathname: '/subject/[id]',
                                    params: { id: item.id.toString() }
                                });
                            }}
                        >
                            <SubjectCard
                                title={item.title}
                                image={item.image}
                            />
                        </TouchableOpacity>
                    )}
                />
            </ThemedView>
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
        marginHorizontal: scale(9),
        marginBottom: scale(20)
    },
    bannerGradient: { padding: scale(24), height: scale(170), flexDirection: 'row' },
    bannerContent: { flex: 1, justifyContent: 'center' },
    bannerTitle: { fontSize: scale(30), fontWeight: 'bold' },
    startButton: { backgroundColor: '#FFB74D', paddingVertical: scale(10), paddingHorizontal: scale(15), borderRadius: scale(15), alignSelf: 'flex-start', marginVertical: scale(10) },
    startButtonText: { color: '#FFF', fontWeight: 'bold' },
    cardImage: { width: scale(150), height: scale(150), position: 'absolute', right: scale(10), bottom: scale(10) },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(15), marginHorizontal: scale(16) },
    sectionTitle: { fontSize: scale(20), fontWeight: '700' },
    seeAllText: { color: '#7986CB', fontWeight: '600' },
    listPadding: { paddingHorizontal: scale(20), paddingTop: scale(20), paddingBottom: scale(40) },
    columnWrapper: { justifyContent: 'space-between' },
})
