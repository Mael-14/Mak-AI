import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import MathJaxProvider from './MathJaxProvider';

// OPTIMIZED: Render single question card with combined MathJax content
const QuestionCard = React.memo(({ question, index, questionType }) => {
    const [showSolution, setShowSolution] = useState(false);

    if (!question || typeof question !== 'object' || !question.question) {
        return (
            <View style={styles.questionCard}>
                <Text style={styles.errorText}>Invalid question data</Text>
            </View>
        );
    }

    // OPTIMIZATION: Combine all text into ONE MathJax render instead of multiple WebViews
    const combinedContent = useMemo(() => {
        let content = `**${index + 1}.** ${question.question}`;

        // Add options to the same content if they exist
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
            content += '\n\n';
            question.options.forEach((opt, optIdx) => {
                if (!opt) return;
                const label = opt.label || String.fromCharCode(65 + optIdx);
                const value = opt.value || opt;
                content += `**${label}.** ${value}\n\n`;
            });
        }

        return content;
    }, [question, index]);

    // Format solution content for MathJax rendering
    const solutionContent = useMemo(() => {
        if (!question.solution && !question.answer && !question.explanation) {
            return '**Solution:** Not available for this question.';
        }

        let content = '';

        // Add answer if available
        if (question.answer) {
            content += `**Answer:** ${question.answer}\n\n`;
        }

        // Add solution/explanation if available
        if (question.solution) {
            content += `**Solution:**\n${question.solution}`;
        } else if (question.explanation) {
            content += `**Explanation:**\n${question.explanation}`;
        }

        return content;
    }, [question.solution, question.answer, question.explanation]);

    const toggleSolution = () => {
        setShowSolution(!showSolution);
    };

    return (
        <View style={styles.questionCard}>
            <View style={styles.questionHeaderSimple}>
                <View style={styles.questionTextContainer}>
                    {/* SINGLE WebView for entire question including options */}
                    <MathJaxProvider html={combinedContent} fontSize="11px" />
                </View>
                <Text style={styles.marks}>[{question.marks || 1}]</Text>
            </View>

            {/* Solution Toggle Button */}
            <TouchableOpacity style={styles.solutionToggle} onPress={toggleSolution}>
                <Text style={styles.solutionToggleText}>
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                </Text>
                <Ionicons
                    name={showSolution ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#007AFF"
                />
            </TouchableOpacity>

            {/* Solution Display */}
            {showSolution && (
                <View style={styles.solutionContainer}>
                    <MathJaxProvider html={solutionContent} fontSize="11px" />
                </View>
            )}

            {/* Answer Space for Structural/Mixed - Hidden when solution is shown */}
            {(questionType === 'Structural (Paper 2)' || questionType === 'Mixed') && !showSolution && (
                <View style={styles.answerSpace}>
                    {Array(Math.max(1, Math.min(6, (question.marks || 1) > 2 ? 4 : (question.marks || 1) > 1 ? 3 : 2)))
                        .fill()
                        .map((_, lineIdx) => (
                            <View key={lineIdx} style={styles.answerLine} />
                        ))}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: scale(12),
        marginBottom: verticalScale(12),
    },
    questionHeaderSimple: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    questionTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    marks: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: '#666',
    },
    answerSpace: {
        marginTop: 12,
    },
    answerLine: {
        height: 18,
        borderBottomColor: '#CCC',
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    solutionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(12),
        marginTop: verticalScale(8),
        backgroundColor: '#F8F9FA',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    solutionToggleText: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        color: '#007AFF',
        marginRight: 6,
    },
    solutionContainer: {
        marginTop: verticalScale(12),
        padding: scale(12),
        backgroundColor: '#F0F8FF',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: moderateScale(12),
    },
});

export default QuestionCard;
