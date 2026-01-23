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
  ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { examAPI } from '../services/api';

import Katex from 'react-native-katex';
const { width: SCREEN_WIDTH } = Dimensions.get('window');




function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Exam({ route }) {
  const formatQuestion = (str) => {
    // If the string doesn't start with a LaTeX command like \frac or \sqrt,
    // we can wrap the whole thing in \text{} but keep the math symbols outside.
    // This is a quick fix for "Sentence style" questions.
    return `\\text{${str}}`.replace(/\$/g, '} $ {\\text');
  };

  const [quizData, setQuizData] = useState([])
  const [examInfo, setExamInfo] = useState({ mathType: 'Loading...', year: '', paper: '' });
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(60 * 10); // 10 minutes for example
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  const explanationHeight = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  useEffect(() => {
    const loadExamData = async () => {
      try {
        // You can get '0570' from route.params if passed from previous screen
        const subjectCode = route?.params?.subjectCode || '0570';
        const response = await examAPI.getQuestions(subjectCode);

        if (response.success) {
          // Store metadata for the header
          setExamInfo({
            mathType: response.examInfo.mathType || 'Mathematics',
            year: response.examInfo.year,
            paper: response.examInfo.paper,
            level: response.examInfo.level
          });

          // Format questions to match your UI's expected structure
          const formattedQuestions = response.data.map(q => ({
            id: q.id,
            question: q.text, // Database uses 'text'
            options: Object.entries(q.options).map(([label, value]) => ({
              label,
              value
            })),
            correct: q.answer, // Database uses 'answer'
            explanation: q.explanation,
            hasImage: q.hasImage
          }));

          const sortedQuestions = formattedQuestions.sort((a, b) => {
            const numA = parseInt(a.id.replace(/^\D+/g, ''));
            const numB = parseInt(b.id.replace(/^\D+/g, ''));
            return numA - numB;
          });
          setQuizData(sortedQuestions);
        }
      } catch (error) {
        console.error("Failed to fetch exam:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [route?.params?.subjectCode]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Preparing your exam...</Text>
      </View>
    );
  }
  if (quizData.length === 0) return <View style={styles.container}><Text>No questions found.</Text></View>;


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
            const isCorrect = userAnswer === q.answer;
            const userOption = q.options?.find(opt => opt.label === userAnswer);
            const correctOption = q.options?.find(opt => opt.label === q.answer);
            return (
              <View key={q.id || idx} style={styles.resultCard}>
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
        <Text style={styles.headerTitle}>{examInfo.mathType}</Text>
        <Text style={styles.headerDate}>June {examInfo.year}</Text>
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
            <View style={styles.katexContainer}>
              <Katex
                expression={`\\text{${currentQuestion.question}}`}
                style={styles.katexStyle} // Use a specific style for math
                inlineStyle={katexInlineStyle} // Optional: styling the internal HTML
              />
            </View>
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
                <View style={styles.optionMathContainer}>
                  <Katex
                    expression={option.value}
                    inlineStyle={KATEX_OPTION_CSS}
                    style={styles.optionKatex}
                  />
                </View>
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
  optionMathContainer: {
    flex: 1,
    // Fixed height for the WebView box
    justifyContent: 'center',
  },
  optionKatex: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modeContainer: {
    backgroundColor: '#fff',
    padding: 16,
  },
  katexContainer: {
    minHeight: 80, // Crucial: WebView needs a height to show up
    width: '100%',
    marginVertical: 10,
  },
  katexStyle: {
    flex: 1,
    backgroundColor: 'transparent', // Matches your card background
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
    marginBottom: 80,
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
const katexInlineStyle = `
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        background-color: transparent;
        margin: 0;
        padding: 5px;
      }
      /* This targets the words in your question */
      .katex .mtext {
        font-family: sans-serif !important;
        font-size: 0.9em !important;
        color: #333 !important;
      }
      /* This targets the actual math formulas */
      .katex .mathnormal, .katex .mord {
        font-size: 1.7em !important;
        color: black; /* Makes formulas stand out in blue */
      }
    </style>
  </head>
`;

const KATEX_OPTION_CSS = `
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        background-color: transparent;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: flex-start; /* Keeps it aligned with the A, B, C labels */
        overflow: hidden;
      }
      .katex {
        font-size: 2.8em !important; /* Large enough to read, small enough to fit */
        color: #374151;
      }
      /* Fix for mixed text in options */
      .katex .mtext {
        font-family: sans-serif !important;
      }
    </style>
  </head>
`;