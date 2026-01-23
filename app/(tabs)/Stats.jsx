import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import React from 'react'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import ThemedView from '../../components/ThemedView'
import LottieView from 'lottie-react-native'
import { BarChart } from 'react-native-gifted-charts'
import { ScrollView } from 'react-native'
import { Use } from 'react-native-svg'
import { COLORS } from '../../constant/color'

const Stats = () => {
    const scheme = useColorScheme()
    const theme = COLORS[scheme] ?? COLORS.light
    const data = [
        { value: 80, label: 'Mon', frontColor: '#F3E8FF' },
        { value: 50, label: 'Tue', frontColor: '#F3E8FF' },
        { value: 60, label: 'Wed', frontColor: '#F3E8FF' },
        { value: 40, label: 'Thu', frontColor: '#F3E8FF' },
        {
            value: 100,
            label: 'Fri',
            frontColor: '#C084FC', // Highlighted color
            focused: true,         // To show tooltip on load
        },
        { value: 45, label: 'Sat', frontColor: '#F3E8FF' },
        { value: 70, label: 'Sun', frontColor: '#F3E8FF' },
    ];
    return (
        <ScrollView contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.container}>
                <View style={[styles.Streakcontainer, { backgroundColor: theme.card }]}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>YOUR SERIE</Text>
                    </View>
                    <View style={styles.mainContent}>

                        <View style={styles.streakRow}>
                            <View style={styles.textContainer}>
                                <Text style={styles.streakNumber}>122</Text>
                                <Text style={styles.streakLabel}>Days in a row !</Text>
                            </View>

                            <View style={styles.animationContainer}>
                                <LottieView
                                    autoPlay
                                    loop
                                    style={{ width: 150, height: 150 }}
                                    // Replace with your local lottie file path
                                    source={require('../../animations/fire-animation.json')}
                                />

                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.boltIconContainer}>
                                {/* Simple Bolt Placeholder */}
                                <Text style={{ fontSize: 24 }}>💡</Text>
                            </View>
                            <Text style={styles.infoText}>
                                Focus more on Trigonometry!
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.Chartcontainer, { backgroundColor: theme.card }]}>
                    <BarChart
                        data={data}
                        barWidth={35}
                        spacing={15}
                        roundedTop
                        roundedBottom
                        hideRules
                        hideYAxisText
                        yAxisThickness={0}
                        xAxisThickness={0}
                        noOfSections={3}
                        maxValue={120}
                        // Custom Tooltip
                        renderTooltip={(item) => (
                            <View style={{ marginBottom: 5, alignItems: 'center' }}>
                                <View style={{ backgroundColor: 'black', padding: 5, borderRadius: 8 }}>
                                    <Text style={{ color: 'white', fontSize: 10 }}>4 hours</Text>
                                </View>
                                {/* Small triangle arrow */}
                                <View style={{
                                    width: 0, height: 0,
                                    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5,
                                    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'black'
                                }} />
                            </View>
                        )}
                        leftShiftForTooltip={12} // Adjust tooltip position
                    />
                </View>
                <View style={[styles.Subjectperformance, { backgroundColor: theme.card }]}>
                    <View style={[styles.subject]}>
                        <View ><Text style={{ fontSize: 14 }}>😔</Text></View>
                        <View style={styles.subjectinfo}>
                            <Text style={styles.subjecttext}>Weak Subject:</Text>
                            <Text style={styles.Subjectname}>Mathematics</Text>
                        </View>
                    </View>
                    <View style={[styles.subject]}>
                        <View ><Text style={{ fontSize: 14 }}>💪</Text></View>
                        <View style={styles.subjectinfo}>
                            <Text style={styles.subjecttext}>Strong Subject:</Text>
                            <Text style={styles.Subjectname}>Science</Text>
                        </View>
                    </View>
                </View>

            </ThemedView>
        </ScrollView>

    )
}

export default Stats

const styles = StyleSheet.create({
    scrollContent: {
        flex: 1,
        marginTop: 20,
    },
    container: {
        flex: 1,
    },
    Streakcontainer: {
        backgroundColor: '#FFEBEE',
        padding: 20,
        marginBottom: 20,
        marginTop: 20,
        marginHorizontal: 8,
        borderRadius: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    headerBadge: {
        backgroundColor: '#FDE68A', // Light yellow
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 10,
    },
    headerBadgeText: {
        color: '#B45309', // Darker gold/brown
        fontWeight: '800',
        fontSize: 12,
    },
    mainContent: {
        marginTop: 40,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    textContainer: {
        flex: 1,
        paddingLeft: 20,
    },
    streakNumber: {
        fontSize: 55,
        fontWeight: 'bold',
        color: '#FF8A65', // Coral/Orange color
    },
    streakLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8A65',
        marginTop: -10,
    },
    animationContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 11,
        marginTop: 12,
    },
    boltIconContainer: {
        marginRight: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 26,
    },
    Chartcontainer: {
        borderRadius: 28,
        padding: 20,
        marginHorizontal: 8,

        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,


    },
    Subjectperformance: {
        marginHorizontal: 8,
        marginBottom: 20,
        borderRadius: 28,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,

    },
    subject: {
        flexDirection: 'row',
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 11,
    },
    subjectinfo: {
        marginLeft: 12,
    },
    subjecttext: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    Subjectname: {
        fontSize: 16,

        color: '#666',
    },
    scrollPadding: {
        padding: 20,
    },
    scrollContent: {
        flex: 1,
    }

})