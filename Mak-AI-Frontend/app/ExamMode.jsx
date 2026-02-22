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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Katex from 'react-native-katex';
import { scale, verticalScale, moderateScale } from '../utils/scaling';
import MathJaxProvider from '../components/MathJaxProvider';
import { auth } from '../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');




function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function Exam({ route }) {
  const startTime = useRef(Date.now());
  const router = useRouter();
  const params = useLocalSearchParams();
  const formatQuestion = (str) => {
    // If the string doesn't start with a LaTeX command like \frac or \sqrt,
    // we can wrap the whole thing in \text{} but keep the math symbols outside.
    // This is a quick fix for "Sentence style" questions.
    return `\\text{${str}}`.replace(/\$/g, '} $ {\\text');
  };
  const { subjectCode, level, topic, examTitle, paper, examData, examId } = params;
  const [quizData, setQuizData] = useState([])
  const [examInfo, setExamInfo] = useState({ mathType: 'Loading...', year: '', paper: '', subjectCode: '' });
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(60 * 90); // 90 minutes for example
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  const explanationHeight = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    const loadExamData = async () => {
      try {
        setLoading(true);

        // Check if examData is passed from CustomExamSetup (AI-generated questions)
        if (examData && examId) {
          console.log('Loading AI-generated exam questions...');
          
          try {
            const parsedQuestions = JSON.parse(examData);
            
            // Format AI-generated questions to match the expected structure
            const formattedQuestions = parsedQuestions.map((q, index) => ({
              id: `Q${index + 1}`,
              question: q.question,
              options: q.options ? q.options.map(opt => {
                // Extract label and value from format like "A. Option text"
                const match = opt.match(/^([A-D])\.\s*(.*)$/);
                return {
                  label: match ? match[1] : String.fromCharCode(65 + index % 4),
                  value: match ? match[2] : opt,
                };
              }) : [],
              correct: q.correctAnswer,
              explanation: q.explanation || '',
              topic: q.topic || 'General',
              marks: q.marks || 1,
            }));

            setQuizData(formattedQuestions);
            
            // Set exam info from the generated exam metadata
            setExamInfo({
              mathType: examTitle || 'Custom Exam',
              year: new Date().getFullYear().toString(),
              paper: examId || 'AI Generated',
            });
            
            // Set timer based on exam duration if available
            if (params.duration) {
              setTimer(parseInt(params.duration) * 60);
            }
            
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Failed to parse exam data:', parseError);
          }
        }

        // 3. Validation: Ensure we have the minimum data to fetch
        if (!subjectCode) {
          console.error("No subjectCode provided");
          setLoading(false);
          return;
        }

        // Fetch questions based on subject and level (existing API behavior)
        const response = await examAPI.getQuestions(subjectCode, level || null);

        if (response.success) {
          let questions = response.data;

          // 4. THE FILTER: This will now work because 'topic' comes from useLocalSearchParams
          if (topic) {
            console.log("Filtering Exam Mode for topic:", topic);
            questions = questions.filter(q =>
              q.topic?.toString().toLowerCase().trim() === topic.toLowerCase().trim()
            );
          }

          // 5. Update Header Info
          setExamInfo({
            mathType: examTitle || response.examInfo?.mathType || 'Mathematics',
            year: response.examInfo?.year || '',
            paper: paper || response.examInfo?.paper || '',
          });

          // Formatting logic (Keep your existing map function)
          const formattedQuestions = questions.map(q => ({
            id: q.id,
            question: q.text,
            options: Object.entries(q.options || {}).map(([label, value]) => ({
              label,
              value
            })),
            correct: q.answer,
            explanation: q.explanation,
            topic: q.topic
          }));

          // Sort and set
          const sortedQuestions = formattedQuestions.sort((a, b) => {
            const numA = parseInt(a.id.replace(/^\D+/g, '')) || 0;
            const numB = parseInt(b.id.replace(/^\D+/g, '')) || 0;
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
  }, [subjectCode, topic, level, examData, examId]);

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
  const syncResultsToBackend = async () => {
    const endTime = Date.now();
    const durationInMinutes = Math.round((endTime - startTime.current) / 60000);

    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correct) correctCount += 1;
    });

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const finalSubjectCode = subjectCode || "9999";
      // We use a controller to set a longer timeout for Render's cold start
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Wait 60s for Render

      const response = await fetch('https://mak-ai-carb.onrender.com/api/exams/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          subject: finalSubjectCode,
          correct: correctCount,
          total: quizData.length,
          durationInMinutes: durationInMinutes || 1,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      console.log("✅ Stats synced successfully!");
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error("❌ Sync timed out: Render is taking too long to wake up.");
      } else {
        console.error("❌ Failed to sync stats:", error.message);
      }
    }
  };
  const sanitizeMath = (str) => {
    if (!str) return '';
    // This regex removes:
    // 1. $...$ (Single dollar signs)
    // 2. $$...$$ (Double dollar signs)
    // 3. \(...\) (Escaped parentheses)
    // 4. \[...\] (Escaped brackets)
    return str
      .replace(/\$\$?|\\\(|\\\)|\\\[|\\\]/g, '')
      .trim();
  };
  const renderMixedContent = (text) => {
    if (!text) return null;

    // This regex splits the text by $...$ delimiters
    const parts = text.split(/(\$.*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        // It's Math! Render with KaTeX
        const mathExpression = part.slice(1, -1); // Remove the $ signs
        return (
          <View key={index} style={styles.inlineMath}>
            <Katex
              expression={mathExpression}
              inlineStyle={KATEX_INLINE_CSS}
              style={styles.miniKatex}
            />
          </View>
        );
      }

      // It's normal text! Render with native Text component
      return (
        <Text key={index} style={styles.nativeText}>
          {part}
        </Text>
      );
    });
  };

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
    if (currentQuestionIndex === totalQuestions - 1) {
      syncResultsToBackend(); // Save stats!
      setShowCongrats(true);
      setShowResults(true);
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
  const handleFinishEarly = () => {
    // We don't need to manually mark them as 'not done' 
    // because your getScore() and Results logic already checks 
    // if an index exists in selectedOptions.
    syncResultsToBackend(); // Save stats!
    setShowCongrats(false);
    setShowResults(true);
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
            const correctOption = q.options?.find(opt => opt.label === q.correct);
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
                    Correct answer: {correctOption
                      ? `${correctOption.label}. ${correctOption.value}`
                      : 'Unknown (Check Database)'}
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
                setTimer(60 * 90);
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
    <View style={[styles.mainContainer, { backgroundColor: '#3F51B5' }]}>
      {/* 1. Integrated Header (Subject, Year, Paper) */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={handlePrevious} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerSubject}>{examInfo.mathType}</Text>
          <Text style={styles.headerMeta}>June {examInfo.year} • Paper 1</Text>
        </View>
        <View style={styles.timerPill}>
          <Ionicons name="time-outline" size={14} color="#FFF" />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>
      </View>

      {/* 2. Modern Progress Bar (Flashcard Style) */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressCountText}>
          {currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>

      {/* 3. Central Content Card */}
      <Animated.View style={[styles.centralCard, { transform: [{ translateX: position.x }] }]}>
        <View style={styles.cardHeader}>
          <View style={styles.makBadge}>
            <Text style={styles.makBadgeText}>🎓Mak AI</Text>
          </View>
        </View>

        <View style={styles.questionSection}>
          {/* {renderMixedContent(currentQuestion.question)}*/}
          <MathJaxProvider
            html={currentQuestion.question} // e.g., "Solve $x^2 + y = 5$"
          />
          {/* <MathText
            value={currentQuestion.question}
            direction="ltr"
            style={styles.mathText}
          // This ensures it handles any math error without crashing the screen
          />
          renderError={(error) => <Text style={{ color: 'red' }}>{error.message}</Text>}
*/}



        </View>

        <View style={styles.optionsSection}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptions[currentQuestionIndex] === option.label;
            return (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleSelectOption(option.label)}
                style={[styles.optionRow, isSelected && styles.optionRowActive]}
              >
                <View style={[styles.optionIndicator, isSelected && styles.optionIndicatorActive]}>
                  <Text style={[styles.optionLetter, isSelected && { color: '#FFF' }]}>
                    {option.label}
                  </Text>
                </View>
                <View style={styles.optionMathWrap} pointerEvents="none">
                  <Katex
                    expression={sanitizeMath(option.value)}
                    inlineStyle={KATEX_OPTION_CSS}
                    style={styles.optionKatex}
                  />
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3F51B5" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* 4. Professional Navigation Footer */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={[styles.navBtn, currentQuestionIndex === 0 && styles.btnDisabled]}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtnPill} onPress={handleFinishEarly}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>
            {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
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
  optionMathWrap: {
    flex: 1,
    height: 45,           // Force a height so the WebView is visible
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginLeft: 40,
  },

  optionKatex: {
    height: 45,           // Match the container height
    width: '100%',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
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
  doneHeaderButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444', // Red outline
    backgroundColor: 'transparent', // No background makes it look smaller
  },
  doneHeaderText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12, // Small font
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
  doneHeaderButton: {
    backgroundColor: '#ef4444', // Red color for 'End' action
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  doneHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsBox: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  //new styules
  mainContainer: { flex: 1 },

  // Header Styles
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  headerTitleGroup: { flex: 1, marginLeft: scale(15) },
  headerSubject: { color: '#FFF', fontSize: moderateScale(18), fontWeight: '800' },
  headerMeta: { color: 'rgba(255,255,255,0.7)', fontSize: moderateScale(12) },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  timerText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  // Progress Bar
  progressContainer: { paddingHorizontal: scale(25), marginTop: 25 },
  progressBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5 },
  progressFill: { height: 10, backgroundColor: '#4ade80', borderRadius: 5 },
  progressCountText: { color: '#FFF', fontSize: 12, marginTop: 8, textAlign: 'right', fontWeight: '600' },

  // Card Styles
  centralCard: {
    flex: 1,
    backgroundColor: '#FFF',
    marginHorizontal: scale(20),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(110),
    borderRadius: 30,
    padding: scale(20),
    // Premium Shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  questionSection: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Centers the whole paragraph
    alignItems: 'center',
    padding: 10,
  },
  nativeText: {
    fontFamily: 'sans-serif',
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 26,
  },
  inlineMath: {
    height: 80, // Small height for inline math
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  miniKatex: {
    width: 60, // You may need to calculate this or keep it flexible
    height: 30,
    backgroundColor: 'transparent',
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  optionRowActive: { borderColor: '#3F51B5', backgroundColor: '#F0F2FF', borderWidth: 1.5 },
  optionIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionIndicatorActive: { backgroundColor: '#3F51B5' },
  optionLetter: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },

  // Footer
  footerNav: {
    position: 'absolute',
    bottom: verticalScale(25),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(35),
  },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  navBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  doneBtnPill: { backgroundColor: '#FFF', paddingHorizontal: 25, paddingVertical: 10, borderRadius: 20 },
  doneBtnText: { color: '#3F51B5', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 }
});
const KATEX_INLINE_CSS = `
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
      }
      .katex { font-size: 3.5em !important; }
      
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
        height: 100vh; /* Takes full height of the container */
        background-color: transparent;
        /*justify-content: flex-start;   Keeps it aligned with the A, B, C labels */
        overflow: hidden;
      }
      .katex {
        font-size: 3.0em !important; /* Large enough to read, small enough to fit */
        color: #374151;
      }
      /* Fix for mixed text in options */
      .katex .mtext {
        font-family: sans-serif !important;
      }
    </style>
  </head>
`;