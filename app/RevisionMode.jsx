import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const quizData = [
  {
    id: 1,
    question: 'What is the smallest prime number?',
    options: [
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
      { label: 'C', value: '3' },
      { label: 'D', value: '4' },
    ],
    correct: 'B',
    hint: 'A prime number is only divisible by 1 and itself. Think about the smallest number that fits this definition.',
    explanation: 'The smallest prime number is 2. It is the only even prime number because all other even numbers are divisible by 2.',
  },
  {
    id: 2,
    question: 'What is 5 × 6?',
    options: [
      { label: 'A', value: '25' },
      { label: 'B', value: '30' },
      { label: 'C', value: '35' },
      { label: 'D', value: '40' },
    ],
    correct: 'B',
    hint: 'Multiply 5 by 6. You can think of it as adding 5 six times.',
    explanation: '5 × 6 = 30. This is a basic multiplication fact.',
  },
  {
    id: 3,
    question: 'What is the sum of angles in a triangle?',
    options: [
      { label: 'A', value: '90°' },
      { label: 'B', value: '180°' },
      { label: 'C', value: '270°' },
      { label: 'D', value: '360°' },
    ],
    correct: 'B',
    hint: 'This is a fundamental property of all triangles, regardless of their type.',
    explanation: 'The sum of all angles in any triangle is always 180°. This is a fundamental theorem in geometry.',
  },
];

export default function Revision() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExplanationVisible, setIsExplanationVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const explanationHeight = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const [selectedOptions, setSelectedOptions] = useState({});

  const currentQuestion = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;

  const toggleExplanation = () => {
    const toValue = isExplanationVisible ? 0 : 1;
    setIsExplanationVisible(!isExplanationVisible);

    Animated.spring(explanationHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsExplanationVisible(false);
      explanationHeight.setValue(0);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsExplanationVisible(false);
      explanationHeight.setValue(0);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handleSelectOption = (label) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestionIndex]: label,
    }));
  };

  const setShowHint = () => {
    Alert.alert('Hint', currentQuestion.hint, [{ text: 'OK' }]);
  };

  const maxHeight = explanationHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  const cardAnimationStyle = {
    transform: [{ translateX: position.x }],
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="black" style={styles.navButtonText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mathematics</Text>
        <Text style={styles.headerDate}>June 2020</Text>
      </View>

      {/* Mode */}
      <View style={styles.modeContainer}>
        <Text style={styles.modeText}>
          Mode : <Text style={styles.modeValue}>Revision</Text>
        </Text>
      </View>

      {/* Question Card */}
      <Animated.View
        style={[styles.cardContainer, cardAnimationStyle]}
      >
        <View style={styles.card}>
          {/* Question Header */}
          <View style={styles.questionHeader}>
            <View style={styles.questionHeaderleft}>
              <View style={styles.askMalak}>
                <Text style={styles.icon}>🎓</Text>
                <Text style={styles.askMalakText}>Ask Mak</Text>
              </View>
              <Text style={styles.questionNumber}>Question {currentQuestion.id}</Text>
              <TouchableOpacity style={styles.hintButton} onPress={setShowHint}>
                <Text style={styles.icon}>💡</Text>
                <Text style={styles.hintText}>Hint</Text>
              </TouchableOpacity>
            </View>
            {/* Question */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const selected = selectedOptions[currentQuestionIndex];
              let borderColor = '#000000ff';
              let borderWidth = 0.2;
              let isDisabled = false;
              if (selected) {
                if (selected === option.label) {
                  if (selected === currentQuestion.correct) {
                    borderColor = 'limegreen';
                    isDisabled = true; // Correct answer: disable all
                  } else {
                    borderColor = 'red';
                    isDisabled = false; // Wrong answer: allow retry
                  }
                  borderWidth = 2;
                }
                // If selected is correct, disable all options
                if (selected === currentQuestion.correct) {
                  isDisabled = true;
                }
              }
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionButton,
                    { borderColor, borderWidth }
                  ]}
                  onPress={() => handleSelectOption(option.label)}
                  disabled={isDisabled}
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionValue}>{option.value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation Button */}
          <TouchableOpacity style={styles.explanationButton} onPress={toggleExplanation}>
            <Ionicons
              name={isExplanationVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#000000ff"
            />
            <Text style={styles.explanationButtonText}>Explanation</Text>
          </TouchableOpacity>

          {/* Explanation Dropdown */}
          <Animated.View style={[styles.explanationContainer, { maxHeight }]}>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color="black" style={styles.navButtonText} />
        </TouchableOpacity>
        {currentQuestionIndex === quizData.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => Alert.alert('Done', 'You have completed the exam!', [{ text: 'OK' }])}
          >
            <Ionicons name="checkmark-done" size={28} color="white" style={styles.navButtonText} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === quizData.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentQuestionIndex === quizData.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color="black" style={styles.navButtonText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    //backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  headerDate: {
    color: '#fff',
    fontSize: 14,
  },
  modeContainer: {
    backgroundColor: '#fff',
    padding: 16,
  },
  modeText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600'
  },
  modeValue: {
    fontSize: 14,
    color: '#a3a2a2ff',
    
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  questionHeader: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
    width: '100%',
    backgroundColor: '#EBF4FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    
  },
    questionHeaderleft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    // backgroundColor: '#7e8995ff',
  },
  explanationContainer: {
    margin: 16,
  },
  askMalak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  askMalakText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  questionText: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 16,
    
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 0.2,
    borderColor: '#000000ff',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
    width: 24,
  },
  optionValue: {
    fontSize: 12,
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: '#000',
    alignSelf: 'flex-start',
  },
  explanationButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  explanationContainer: {
    overflow: 'hidden',
    marginTop: 12,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#d9dadcff',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});