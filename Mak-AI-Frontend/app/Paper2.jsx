import React from 'react';
import { StyleSheet, SafeAreaView, FlatList, View, Text } from 'react-native';
import QuestionCard from '../components/QuestionCard'; // Adjust path as needed

const StructuralMockScreen = () => {
    // 1. Format the data to match your component's 'question' prop expectations
    const mockQuestions = [
        {
            question: "Evaluate $9 + 12 \\div 4 - 2 \\times 5$",
            marks: 4,
            answer: "2",
            solution: "Step 1: $12 \\div 4 = 3$ \nStep 2: $2 \\times 5 = 10$ \nStep 3: $9 + 3 - 10 = 2$",
        },
        {
            question: "a) Express 125 as a product of its primes \n\nb) Hence, find the cube root of 125 \n\nc) Find the L.C.M of 18 and 24",
            marks: 5,
            answer: "a) $5^3$, b) 5, c) 72",
            solution: "a) $125 = 5 \\times 5 \\times 5 = 5^3$ \nb) $\\sqrt[3]{125} = 5$ \nc) Multiples of 18: {18, 36, 54, 72} \nMultiples of 24: {24, 48, 72} \nL.C.M = 72",
        },
        {
            question: "Given two statements $p$ and $q$. Draw a truth table for $\\sim p \\wedge \\sim q$, using T for True and F for False.",
            marks: 5,
            solution: "Explanation: The table is True only when both $p$ and $q$ are False. \n\n | $p$ | $q$ | $\\sim p$ | $\\sim q$ | $\\sim p \\wedge \\sim q$ | \n |---|---|---|---|---| \n | T | T | F | F | F | \n | T | F | F | T | F | \n | F | T | T | F | F | \n | F | F | T | T | T |",
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Section B: Structural</Text>
                <Text style={styles.headerSubtitle}>Show all workings clearly</Text>
            </View>

            <FlatList
                data={mockQuestions}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listPadding}
                renderItem={({ item, index }) => (
                    <QuestionCard
                        question={item}
                        index={index}
                        questionType="Structural (Paper 2)"
                    />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1C1C1E',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginTop: 4,
    },
    listPadding: {
        paddingBottom: 40,
    },
    // Ensure these match your existing styles for QuestionCard
    questionCard: {
        backgroundColor: '#FFF',
        margin: 10,
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    answerLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#CED4DA',
        height: 30,
        marginVertical: 5,
    },
});

export default StructuralMockScreen;
