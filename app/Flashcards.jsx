import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../constant/color';
import ThemedView from '../components/ThemedView';

const { width } = Dimensions.get('window');

// Mock Data - Representing a "Trigonometry" set based on your Stats hint
const FLASHCARD_DATA = [
    {
        id: 1,
        question: "What is the formula for the Pythagorean Theorem?",
        answer: "a² + b² = c²",
        category: "MATHEMATICS",
        difficulty: "Easy"
    },
    {
        id: 2,
        question: "In a right triangle, what is Sine (sin) equal to?",
        answer: "Opposite / Hypotenuse",
        category: "TRIGONOMETRY",
        difficulty: "Medium"
    },
    {
        id: 3,
        question: "What is the value of Pi (π) to two decimal places?",
        answer: "3.14",
        category: "GEOMETRY",
        difficulty: "Easy"
    },
    {
        id: 4,
        question: "What is the derivative of sin(x)?",
        answer: "cos(x)",
        category: "CALCULUS",
        difficulty: "Hard"
    }
];

const Flashcards = () => {
    const scheme = useColorScheme();
    const theme = COLORS[scheme] ?? COLORS.light;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const currentCard = FLASHCARD_DATA[currentIndex];
    const totalCards = FLASHCARD_DATA.length;

    const handleNext = () => {
        if (currentIndex < totalCards - 1) {
            setIsFlipped(false);
            // Small delay to allow flip animation to reset if you add one later
            setTimeout(() => setCurrentIndex(currentIndex + 1), 100);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(currentIndex - 1), 100);
        }
    }

    const handleFlip = () => setIsFlipped(!isFlipped);

    return (
        <ThemedView style={styles.container}>
            {/* Progress Header */}
            <View style={styles.header}>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${((currentIndex + 1) / totalCards) * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: theme.text }]}>
                        {currentIndex + 1} / {totalCards}
                    </Text>
                </View>
            </View>

            {/* Flashcard Badge (Subject Tag) */}
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{currentCard.category}</Text>
            </View>

            {/* Main Flashcard */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleFlip}
                style={[styles.cardContainer, { backgroundColor: theme.card }]}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.cardSideLabel}>
                        {isFlipped ? 'ANSWER' : 'QUESTION'}
                    </Text>

                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {isFlipped ? currentCard.answer : currentCard.question}
                    </Text>

                    <Text style={styles.tapHint}>Tap to reveal answer</Text>
                </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    onPress={handlePrevious}
                    style={[styles.actionButton, { borderColor: '#E5E7EB', backgroundColor: theme.card }]}
                >
                    <Text style={{ fontSize: 20 }}>🧠</Text>
                    <Text style={[styles.actionText, { color: theme.text }]}>Review Later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.actionButton, { borderColor: '#C084FC', backgroundColor: '#F3E8FF' }]}
                >
                    <Text style={{ fontSize: 20 }}>✅</Text>
                    <Text style={[styles.actionText, { color: '#C084FC' }]}>Mastered</Text>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
};

export default Flashcards;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        height: 10,
        flex: 1,
        borderRadius: 10,
        marginRight: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#C084FC', // Friday's Highlight Color
        borderRadius: 10,
    },
    progressText: {
        fontWeight: '800',
        fontSize: 14,
        minWidth: 40,
    },
    categoryBadge: {
        backgroundColor: '#FDE68A',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 20,
        marginTop: 10,
    },
    categoryBadgeText: {
        color: '#B45309',
        fontWeight: '800',
        fontSize: 10,
        letterSpacing: 1,
    },
    cardContainer: {
        height: width * 1.1,
        borderRadius: 35,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Shadow logic
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    cardContent: {
        alignItems: 'center',
    },
    cardSideLabel: {
        color: '#C084FC',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 20,
        letterSpacing: 2,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 38,
    },
    tapHint: {
        marginTop: 40,
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    actionButton: {
        flex: 0.47,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 24,
        borderWidth: 1.5,
    },
    actionText: {
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 15,
    },
});