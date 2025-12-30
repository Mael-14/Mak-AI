import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    explanation: 'The sum of all angles in any triangle is always 180°. This is a fundamental theorem in geometry.',
  },
];

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Exam() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(60 * 10); // 10 minutes for example
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const explanationHeight = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;

  const currentQuestion = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      explanationHeight.setValue(0);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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

  const getScore = () => {
    let score = 0;
    quizData.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct) score += 1;
    });
    return score;
  };

  if (showCongrats) {
    return (
      <Modal isVisible={true} animationIn="zoomIn" animationOut="zoomOut" backdropOpacity={0.7}>
        <View style={styles.congratsModal}>
          <View style={styles.congratsTrophyWrapper}>
            <Image source={require('../assets/trophy.png')} style={styles.congratsTrophy} />
            <LottieView
              source={require('../animations/Success.json')}
              autoPlay
              loop={false}
              style={styles.congratsLottie}
            />
          </View>
          <Text style={styles.congratsTitle}>Congratulations!</Text>
          <Text style={styles.congratsMessage}>You have completed the exam.</Text>
          <TouchableOpacity
            style={styles.congratsButton}
            onPress={() => {
              setShowCongrats(false);
              setShowResults(true);
            }}
          >
            <Text style={styles.congratsButtonText}>View Results</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (showResults) {
    // Calculate stats
    let passed = 0, failed = 0, notDone = 0;
    quizData.forEach((q, idx) => {
      const userAnswer = selectedOptions[idx];
      if (!userAnswer) {
        notDone += 1;
      } else if (userAnswer === q.correct) {
        passed += 1;
      } else {
        failed += 1;
      }
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffffff' }}>
        <ScrollView style={styles.resultsContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.resultsHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.resultsTitle}>Exam Results</Text>
              <Text style={styles.resultsScore}>
                Score: {passed} / {quizData.length}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={[styles.statsBox, { color: 'green' }]}>Passed: {passed}</Text>
              <Text style={[styles.statsBox, { color: 'red' }]}>Failed: {failed}</Text>
              <Text style={[styles.statsBox, { color: '#666' }]}>Not Done: {notDone}</Text>
            </View>
          </View>
          {quizData.map((q, idx) => {
            const userAnswer = selectedOptions[idx];
            const isCorrect = userAnswer === q.correct;
            const userOption = q.options.find(opt => opt.label === userAnswer);
            const correctOption = q.options.find(opt => opt.label === q.correct);
            return (
              <View key={q.id} style={styles.resultCard}>
                <Text style={styles.resultQuestion}>
                  {idx + 1}. {q.question}
                </Text>
                <Text style={[
                  styles.resultAnswer,
                  isCorrect ? styles.correct : styles.incorrect
                ]}>
                  Your answer: {userOption ? `${userOption.label}. ${userOption.value}` : 'No answer'}
                </Text>
                {!isCorrect && (
                  <Text style={styles.correctAnswer}>
                    Correct answer: {correctOption.label}. {correctOption.value}
                  </Text>
                )}
                <Text style={styles.resultExplanation}>
                  Explanation: {q.explanation}
                </Text>
              </View>
            );
          })}
          <View style={styles.resultsButtonsContainer}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                // Replace with your navigation logic to go home
                // navigation.navigate('Home');
              }}
            >
              <Ionicons name="home" size={22} color="#fff" />
              <Text style={styles.resultsButtonText}>Home</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={styles.nextPaperButton}
              onPress={() => {
                // Replace with your navigation logic to go to next paper
                // navigation.navigate('NextPaper');
              }}
            >
              <Ionicons name="document-text-outline" size={22} color="#fff" />
              <Text style={styles.resultsButtonText}>Next Paper</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setSelectedOptions({});
                setTimer(60 * 10);
              }}
            >
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.resultsButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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

      {/* Mode and Timer */}
      <View style={styles.modeContainer}>
        <View style={styles.modeRow}>
          <Text style={styles.modeText}>
            Mode : <Text style={styles.modeValue}>Exam</Text>
          </Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color="#1e3a8a" />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
        </View>
      </View>

      {/* Question Card */}
      <Animated.View
        style={[styles.cardContainer, { transform: [{ translateX: position.x }] }]}
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
            </View>
            {/* Question */}
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.optionButton,
                  selectedOptions[currentQuestionIndex] === option.label && { borderColor: '#1e3a8a', borderWidth: 1 }
                ]}
                onPress={() => handleSelectOption(option.label)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionValue}>{option.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
            onPress={() => setShowCongrats(true)}
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600'
  },
  modeValue: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    color: '#1e3a8a',
    fontWeight: 'bold',
    marginLeft: 4,
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
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  resultsLogoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyLottieWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  resultsLogo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  lottieOnTrophy: {
    width: 200,
    height: 200,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  resultsHeader: {
    //alignItems: 'center',
    marginBottom: 24,
   // marginTop: 16,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 8,
  },
  resultsScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: '#f3f6fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  resultQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1e3a8a',
  },
  resultAnswer: {
    fontSize: 14,
    marginBottom: 4,
  },
  correct: {
    color: 'green',
    fontWeight: 'bold',
  },
  incorrect: {
    color: 'red',
    fontWeight: 'bold',
  },
  correctAnswer: {
    fontSize: 14,
    marginBottom: 4,
    color: 'green',
  },
  resultExplanation: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 24,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    gap: 12,
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  nextPaperButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  resultsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  congratsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    padding: 32,
  },
  congratsTrophyWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  congratsTrophy: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  congratsLottie: {
    width: 160,
    height: 160,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 8,
  },
  congratsMessage: {
    fontSize: 16,
    color: '#333',
    marginVertical: 12,
    textAlign: 'center',
  },
  congratsButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 16,
  },
  congratsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  statsBox: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
});