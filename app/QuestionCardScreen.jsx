import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../context/ModalContext';
import { LinearGradient } from 'expo-linear-gradient';
//import { BlurView } from '@react-native-community/blur';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Sample questions data
const questionsData = [
  {
    id: 1,
    subject: 'Mathematics',
    date: 'June 2020',
    question: "What is the smallest prime number?",
    hint: "It's the only even prime number",
    answers: [
      { id: 'A', text: '1' },
      { id: 'B', text: '2' },
      { id: 'C', text: '3' },
      { id: 'D', text: '4' },
    ],
    correctAnswer: 'B',
    explanation: 'The smallest prime number is 2. It is the only even prime number because all other even numbers are divisible by 2.'
  },
  {
    id: 2,
    subject: 'Mathematics',
    date: 'June 2020',
    question: "What is the value of π (pi) approximately?",
    hint: "It's approximately 3.14...",
    answers: [
      { id: 'A', text: '2.14' },
      { id: 'B', text: '3.14' },
      { id: 'C', text: '4.14' },
      { id: 'D', text: '5.14' },
    ],
    correctAnswer: 'B',
    explanation: 'Pi (π) is approximately 3.14159. It represents the ratio of a circle\'s circumference to its diameter.'
  },
  {
    id: 3,
    subject: 'Mathematics',
    date: 'June 2020',
    question: "What is 12 × 12?",
    hint: "Think of dozens",
    answers: [
      { id: 'A', text: '124' },
      { id: 'B', text: '134' },
      { id: 'C', text: '144' },
      { id: 'D', text: '154' },
    ],
    correctAnswer: 'C',
    explanation: '12 × 12 = 144. This is also known as a gross or a dozen dozens.'
  },
];

const QuestionCardScreen = ({ navigation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;

  const currentQuestion = questionsData[currentQuestionIndex];
  const totalQuestions = questionsData.length;

  const { showModal } = useModal();

  // Pan Responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const swipeLeft = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      Animated.timing(position, {
        toValue: { x: -SCREEN_WIDTH, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowHint(false);
        position.setValue({ x: 0, y: 0 });
      });
    } else {
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  };

  const swipeRight = () => {
    if (currentQuestionIndex > 0) {
      Animated.timing(position, {
        toValue: { x: SCREEN_WIDTH, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setShowHint(false);
        position.setValue({ x: 0, y: 0 });
      });
    } else {
      Animated.spring(position, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  };

  const handleNext = () => {
    swipeLeft();
  };

  const handlePrevious = () => {
    swipeRight();
  };

  const handleAnswerSelect = (answerId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    });
  };

  const handleHintToggle = () => {
    if (showHint) {
      setShowHint(false);
    } else {
      showModal('Hint', currentQuestion.hint);
    }
  };

  const handleExplanation = () => {
    showModal('Explanation', currentQuestion.explanation);
  };

  const cardAnimationStyle = {
    transform: [{ translateX: position.x }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
    
          {/* Header */}
      <View style={styles.header}>
        <View >
          <Text style={styles.subjectText}>{currentQuestion.subject}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{currentQuestion.date}</Text>
        </View>
      </View>

      {/* Question Card with Swipe Gesture */}
      <Animated.View
        style={[styles.cardWrapper, cardAnimationStyle]}
        {...panResponder.panHandlers}
      >
        {/* Question Card */}
        <View  style={styles.questionCard}>
          <LinearGradient
            colors={['#ffffff00', '#ffffffff']}
            style={styles.gradient}

          />
          {/* Card Header with Ask Mak, Timer, and Hint */}
            

                <View style={styles.cardHeader}>
                    <TouchableOpacity style={styles.askMakButton}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#000" />
                        <Text style={styles.askMakText}>Ask Mak</Text>
                    </TouchableOpacity>
            
                    <View style={styles.questionTitleContainer}>
                        <Text style={styles.questionTitle}>Question {currentQuestionIndex + 1}</Text>
                    </View>

                    <TouchableOpacity style={styles.hintButton} onPress={handleHintToggle}>
                        <Ionicons name="bulb-outline" size={16} color="#000" />
                        <Text style={styles.hintText}>Hint</Text>
                    </TouchableOpacity>
                </View>

                {/* Question Text */}
                <View style={styles.questionTextContainer}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

            
        </View>

        {/* Answer Options */}
        <ScrollView> 
        <View style={styles.answersWrapper}>
                <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer) => {
                const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
                return (
                <TouchableOpacity
                    key={answer.id}
                    style={[styles.answerOption, isSelected && styles.answerOptionSelected]}
                    onPress={() => handleAnswerSelect(answer.id)}
                >
                    <Text style={styles.answerLabel}>{answer.id}</Text>
                    <Text style={styles.answerText}>{answer.text}</Text>
                    <View style={[styles.answerRadio, isSelected && styles.answerRadioSelected]}>
                    {isSelected && <View style={styles.answerRadioInner} />}
                    </View>
                </TouchableOpacity>
                );
            })}
            </View>
            {/* Explanation Button */}
        <TouchableOpacity 
          style={styles.explanationButton}
          onPress={handleExplanation}
        >
          <Text style={styles.explanationText}>Explanation</Text>
          <Ionicons name="chevron-forward" size={20} color="#000" />
        </TouchableOpacity>

        </View>
        </ScrollView>
        

        
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
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled,
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default QuestionCardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0d0d4dff',
  },
  headerLeft: {
    //backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffffff',
  },
  headerRight: {},
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffffff',
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  answersWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  questionCard: {
    backgroundColor: '#6969ffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gradient: {
    borderRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // borderBottomWidth: 1,
    // borderColor: '#ffffffff',
    // borderStyle: 'dotted',
    marginBottom: 20,
  },
  askMakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    //backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  askMakText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000ff',
    marginLeft: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000ff',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffefb7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginLeft: 6,
  },
  questionTitleContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000ff',
  },
  questionTextContainer: {
    paddingTop: 10,
  },
  questionText: {
    fontSize: 16,
    color: '#000000ff',
    lineHeight: 24,
  },
  answersContainer: {
    width: '100%',
    marginBottom: 20,
  },
  answerOption: {
    flexDirection: 'row',
    alignItems: 'center',
   // backgroundColor: '#ffffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#d4d4d4ff',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 5,
  },
  answerOptionSelected: {
    borderWidth: 1,
    borderColor: '#50f666ff',
    
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff',
    marginRight: 16,
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  answerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerRadioSelected: {
    backgroundColor: '#ffffffff',
  },
  answerRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#50f666ff',
  },
  explanationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    //backgroundColor: '#E8E8E8',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#D0D0D0',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
});