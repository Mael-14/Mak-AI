import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Dimensions,
    useColorScheme,
    Platform,
    StatusBar
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import SubjectCard from '../components/SubjectCard';
import LevelSelectionAlert from '../components/LevelSelectionAlert';
import { COLORS } from '../constant/color';
import { moderateScale, verticalScale } from '../utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

export default function ExploreSubjects() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = COLORS[scheme] ?? COLORS.light;

    const [showLevelAlert, setShowLevelAlert] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const SUBJECTS = [
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
    ];

    const handleSubjectPress = (item) => {
        setSelectedSubject(item);
        setShowLevelAlert(true);
    };

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
        setSelectedSubject(null);
    };

    const renderHeader = () => (
        <View style={styles.headerArea}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.titleText, { color: theme.text }]}>Explore Subjects</Text>
            <View style={{ width: 40 }} />{/* Spacer */}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

            <FlatList
                data={SUBJECTS}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        {renderHeader()}{/* Header */}
                        <View style={styles.bannerContainer}>
                            <LinearGradient colors={['#7085FC', '#A6B2FF']} style={styles.bannerGradient}>
                                <View style={styles.bannerContent}>
                                    <Text style={styles.bannerTitle}>Choose a Subject</Text>
                                    <Text style={styles.bannerSubtitle}>
                                        Select your subject to explore past papers and study per topic.
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Available Subjects</Text>
                        </View>
                    </View>
                }
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listPadding}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.subjectCardWrapper}
                        onPress={() => handleSubjectPress(item)}
                        activeOpacity={0.8}
                    >
                        <SubjectCard
                            title={item.title}
                            image={item.image}
                        />
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
            />

            <LevelSelectionAlert
                visible={showLevelAlert}
                onClose={() => {
                    setShowLevelAlert(false);
                    setSelectedSubject(null);
                }}
                onSelectLevel={handleLevelSelect}
                subjectTitle={selectedSubject?.title}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(10),
        marginBottom: verticalScale(10),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        fontSize: moderateScale(20),
        fontWeight: '800',
    },
    listHeader: {
        marginBottom: verticalScale(10),
    },
    bannerContainer: {
        borderRadius: scale(20),
        overflow: 'hidden',
        marginBottom: scale(20),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bannerGradient: {
        padding: scale(20),
        minHeight: scale(100),
        flexDirection: 'row',
        alignItems: 'center',
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: scale(24),
        fontWeight: 'bold',
        color: '#FFF',
    },
    bannerSubtitle: {
        fontSize: moderateScale(13),
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: verticalScale(4),
        lineHeight: moderateScale(18),
    },
    sectionHeader: {
        marginBottom: scale(15),
    },
    sectionTitle: {
        fontSize: scale(18),
        fontWeight: '700',
    },
    listPadding: {
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(40),
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    subjectCardWrapper: {
        flex: 0.48,
        marginBottom: scale(16),
    },
});
