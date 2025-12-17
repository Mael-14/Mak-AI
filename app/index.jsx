import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'

const Home = () => {
    return (
        <ThemedView style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                    <ThemedText style={styles.title}>Home</ThemedText>
                </View>
                <View style={styles.flashCard}>
                    <Text style={styles.cardDescription}>Flashcards</Text>
                    <TouchableOpacity style={styles.startButton}>
                        <Text style={styles.startButtonText}>Start Learning</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ThemedView>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 35,
        marginBottom: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
    },
    flashCard: {
        backgroundColor: '#D2FF5E',
        borderRadius: 25,
        padding: 20,
        marginBottom: 20,
        marginHorizontal: 15
    },
    cardDescription: {
        color: '#000000',
        fontSize: 14,
        opacity: 0.8,
        marginTop: 5,
        marginBottom: 20,
        fontWeight: 'bold',
        fontSize: 20,
    },
    startButton: {
        backgroundColor: '#000000',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50,
        alignSelf: 'flex-start',
        marginTop: 15,
    },
    startButtonText: {
        color: '#D2FF5E',
        fontWeight: 'bold',
        fontSize: 16,
    },
})