import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import LottieView from 'lottie-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';
import { COLORS } from '../../constant/color';
import { examAPI } from '../../services/api';
const Stats = () => {
    const scheme = useColorScheme();
    const theme = COLORS[scheme] ?? COLORS.light;

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);

    useFocusEffect(
        useCallback(() => {
            fetchStatsSummary();
        }, [])
    );

    const fetchStatsSummary = async () => {
        try {
            setLoading(true);
            const response = await examAPI.getStatsSummary();
            if (response.success) {
                const data = response.data;
                setStats(data);

                // Format the dailyBreakdown for the BarChart
                const formattedChart = formatChartData(data.dailyBreakdown);
                setChartData(formattedChart);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to turn { "2026-02-07": 120 } into the BarChart array
    const formatChartData = (dailyBreakdown) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            const dateKey = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];

            // Convert minutes to a "value" (e.g., 0 to 100 for height)
            const minutes = dailyBreakdown[dateKey] || 0;
            const hours = (minutes / 60).toFixed(1);

            return {
                value: parseFloat(hours) * 10, // Scale hours for bar height
                label: dayName,
                frontColor: daysAgo === 0 ? '#C084FC' : '#C084FC40', // Highlight today
                origHours: hours // Keep for tooltip
            };
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color="#C084FC" />
            </View>
        );
    }

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
                            <Text style={styles.streakNumber}>{stats?.streak || 0}</Text>
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
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Activity (Hrs)</Text>
                    <View style={styles.chartWrapper}>
                        <BarChart
                            data={chartData}
                            barWidth={scale(30)}
                            spacing={scale(15)}
                            roundedTop roundedBottom
                            hideRules hideYAxisText
                            yAxisThickness={0} xAxisThickness={0}
                            xAxisLabelTextStyle={{ color: theme.text, fontSize: moderateScale(10) }}
                            maxValue={40} // Assuming 4 hours is a "full" bar
                            renderTooltip={(item) => (
                                <View style={styles.tooltipContainer}>
                                    <View style={styles.tooltipBox}>
                                        <Text style={styles.tooltipText}>{item.origHours} hrs</Text>
                                    </View>
                                    <View style={styles.tooltipArrow} />
                                </View>
                            )}
                        />
                    </View>
                </View>

                {/* 3. Performance Insights */}
                <View style={styles.performanceRow}>
                    <PerformanceBox
                        icon="😔"
                        label="Weakest"
                        subject={stats?.weakSubject || "None yet"}
                        theme={theme}
                    />
                    <PerformanceBox
                        icon="💪"
                        label="Strongest"
                        subject={stats?.strongSubject || "None yet"}
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