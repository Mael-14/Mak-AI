import { View, Text, StyleSheet, useColorScheme, ScrollView, Platform } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import LottieView from 'lottie-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';
import { COLORS } from '../../constant/color';

const Stats = () => {
    const scheme = useColorScheme();
    const theme = COLORS[scheme] ?? COLORS.light;

    const data = [
        { value: 80, label: 'Mon', frontColor: '#C084FC' + '40' },
        { value: 50, label: 'Tue', frontColor: '#C084FC' + '40' },
        { value: 60, label: 'Wed', frontColor: '#C084FC' + '40' },
        { value: 40, label: 'Thu', frontColor: '#C084FC' + '40' },
        {
            value: 100,
            label: 'Fri',
            frontColor: '#C084FC',
            focused: true,
        },
        { value: 45, label: 'Sat', frontColor: '#C084FC' + '40' },
        { value: 70, label: 'Sun', frontColor: '#C084FC' + '40' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Streak Hero Section */}
                <View style={[styles.streakCard, { backgroundColor: theme.card }]}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>CURRENT STREAK</Text>
                    </View>

                    <View style={styles.streakRow}>
                        <View style={styles.textContainer}>
                            <Text style={styles.streakNumber}>122</Text>
                            <Text style={styles.streakLabel}>Days in a row!</Text>
                        </View>

                        <View style={styles.animationContainer}>
                            <LottieView
                                autoPlay
                                loop
                                style={{ width: scale(120), height: scale(120) }}
                                source={require('../../animations/fire-animation.json')}
                            />
                        </View>
                    </View>

                    <View style={[styles.infoCard,]}>
                        <Text style={{ fontSize: moderateScale(20), marginRight: scale(10) }}>💡</Text>
                        <Text style={[styles.infoText, { color: theme.text }]}>
                            Study tip: Focus more on <Text style={{ fontWeight: 'bold' }}>Trigonometry</Text> to boost your score!
                        </Text>
                    </View>
                </View>

                {/* 2. Activity Chart Section */}
                <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                    <ThemedText style={styles.sectionTitle}>Weekly Activity</ThemedText>
                    <View style={styles.chartWrapper}>
                        <BarChart
                            data={data}
                            barWidth={scale(30)}
                            spacing={scale(15)}
                            roundedTop
                            roundedBottom
                            hideRules
                            hideYAxisText
                            yAxisThickness={0}
                            xAxisThickness={0}
                            xAxisLabelTextStyle={{ color: theme.text, fontSize: moderateScale(10) }}
                            noOfSections={3}
                            maxValue={120}
                            renderTooltip={(item) => (
                                <View style={styles.tooltipContainer}>
                                    <View style={styles.tooltipBox}>
                                        <Text style={styles.tooltipText}>4 hrs</Text>
                                    </View>
                                    <View style={styles.tooltipArrow} />
                                </View>
                            )}
                            leftShiftForTooltip={scale(10)}
                        />
                    </View>
                </View>

                {/* 3. Performance Insights */}
                <View style={styles.performanceRow}>
                    <PerformanceBox
                        icon="😔"
                        label="Weakest"
                        subject="Math"
                        theme={theme}
                    />
                    <PerformanceBox
                        icon="💪"
                        label="Strongest"
                        subject="Science"
                        theme={theme}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper Component for the bottom boxes
const PerformanceBox = ({ icon, label, subject, theme }) => (
    <View style={[styles.subjectBox, { backgroundColor: theme.card, }]}>
        <Text style={{ fontSize: moderateScale(20) }}>{icon}</Text>
        <View style={styles.subjectInfo}>
            <Text style={[styles.subjectLabel, { color: theme.tabIconDefault }]}>{label}</Text>
            <Text numberOfLines={1} style={[styles.subjectName, { color: theme.text }]}>{subject}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: verticalScale(30) },

    // Streak Card
    streakCard: {
        marginHorizontal: scale(20),
        marginTop: verticalScale(10),
        padding: scale(20),
        borderRadius: moderateScale(24),
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 4 }
        }),
    },
    headerBadge: {
        backgroundColor: '#FEF3C7',
        alignSelf: 'flex-start',
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(4),
        borderRadius: moderateScale(8),
    },
    headerBadgeText: { color: '#B45309', fontWeight: '800', fontSize: moderateScale(10) },
    streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: verticalScale(15) },
    textContainer: { flex: 1 },
    streakNumber: { fontSize: moderateScale(48), fontWeight: '900', color: '#F97316' },
    streakLabel: { fontSize: moderateScale(16), fontWeight: '600', color: '#FB923C', marginTop: verticalScale(-5) },
    animationContainer: { width: scale(100), height: scale(100), justifyContent: 'center', alignItems: 'center' },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#F3F4F6',
        borderWidth: 2,
        borderRadius: 20,
        padding: 11,
        marginTop: 12,

    },
    infoText: { flex: 1, fontSize: moderateScale(13), lineHeight: moderateScale(18) },

    // Chart Card
    chartCard: {
        marginHorizontal: scale(20),
        marginTop: verticalScale(20),
        padding: scale(20),
        borderRadius: moderateScale(24),
        elevation: 2,
    },
    sectionTitle: { fontSize: moderateScale(18), fontWeight: '700', marginBottom: verticalScale(20) },
    chartWrapper: { alignItems: 'center', marginLeft: scale(-20) }, // Centers the chart within the card

    // Performance Boxes
    performanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: scale(20),
        marginTop: verticalScale(20),
    },
    subjectBox: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(15),
        borderColor: '#F3F4F6',
        borderWidth: 2,
        borderRadius: moderateScale(20),


    },
    subjectInfo: { marginLeft: scale(10), flex: 1 },
    subjectLabel: { fontSize: moderateScale(11), fontWeight: '600', textTransform: 'uppercase' },
    subjectName: { fontSize: moderateScale(15), fontWeight: '700' },

    // Tooltip
    tooltipContainer: { marginBottom: 5, alignItems: 'center' },
    tooltipBox: { backgroundColor: '#1F2937', padding: scale(6), borderRadius: 8 },
    tooltipText: { color: 'white', fontSize: moderateScale(10), fontWeight: 'bold' },
    tooltipArrow: {
        width: 0, height: 0,
        borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5,
        borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1F2937'
    }
});

export default Stats;