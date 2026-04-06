import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  FlatList,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal as RNModal,
} from 'react-native';
import DayStreak from '../components/DayStreak';
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
/* Helper to generate combined HTML for a question review card */
const generateQuestionReviewHTML = (q, idx, userAnswer) => {
  const isCorrect = userAnswer === q.correct;
  const userOption = q.options?.find(opt => opt.label === userAnswer);
  const correctOption = q.options?.find(opt => opt.label === q.correct);

  const statusColor = isCorrect ? '#059669' : (userAnswer ? '#DC2626' : '#64748B');
  const statusBg = isCorrect ? '#ECFDF5' : (userAnswer ? '#FEF2F2' : '#F1F5F9');
  const statusText = isCorrect ? 'Correct' : (userAnswer ? 'Incorrect' : 'Skipped');

  const answerRowClass = isCorrect ? 'correct-row' : (userAnswer ? 'incorrect-row' : 'skipped-row');

  return `
    <div class="card-content">
      <div class="card-header">
        <div class="status-badge" style="background-color: ${statusBg}; color: ${statusColor};">
          ${statusText}
        </div>
        <div class="question-number">Q${idx + 1}</div>
      </div>

      <div class="question-section">
        ${q.question}
      </div>

      <div class="details-section">
        <div class="answer-row ${answerRowClass}">
          <div class="label">Your Answer:</div>
          <div class="value">${userOption ? `<strong>${userOption.label}.</strong> ${userOption.value}` : 'No answer'}</div>
        </div>

        ${!isCorrect ? `
          <div class="answer-row correct-row" style="margin-top: 8px;">
            <div class="label">Correct Answer:</div>
            <div class="value">${correctOption ? `<strong>${correctOption.label}.</strong> ${correctOption.value}` : 'Unknown'}</div>
          </div>
        ` : ''}

        <div class="explanation-box">
          <div class="explanation-label">Explanation:</div>
          <div class="explanation-content">${q.explanation}</div>
        </div>
      </div>
    </div>

    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, sans-serif;
      }
      .card-content {
        background-color: #FFFFFF;
        padding: 0;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .status-badge {
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .question-number {
        font-size: 14px;
        font-weight: 700;
        color: #94A3B8;
      }
      .question-section {
        font-size: 16px;
        line-height: 1.5;
        color: #1E293B;
        margin-bottom: 20px;
      }
      .details-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .answer-row {
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #E2E8F0;
      }
      .label {
        font-size: 12px;
        font-weight: 700;
        color: #475569;
        margin-bottom: 4px;
      }
      .value {
        font-size: 15px;
        color: #1E293B;
      }
      .correct-row {
        background-color: #ECFDF5;
        border-color: #10B981;
      }
      .incorrect-row {
        background-color: #FEF2F2;
        border-color: #EF4444;
      }
      .skipped-row {
        background-color: #F1F5F9;
        border-color: #E2E8F0;
      }
      .explanation-box {
        margin-top: 12px;
        padding: 16px;
        background-color: #F8FAFC;
        border-radius: 12px;
        border: 1px dashed #E2E8F0;
      }
      .explanation-label {
        font-size: 13px;
        font-weight: 800;
        color: #1E293B;
        margin-bottom: 8px;
      }
      .explanation-content {
        font-size: 14px;
        line-height: 1.6;
        color: #334155;
      }
      /* KaTeX tweak */
      .katex { font-size: 1.1em !important; }
    </style>
  `;
};

const ReviewCard = React.memo(({ question, index, userAnswer }) => {
  const combinedHtml = generateQuestionReviewHTML(question, index, userAnswer);
  return (
    <View style={styles.questionCard}>
      <MathJaxProvider html={combinedHtml} />
    </View>
  );
});

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
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [newStreak, setNewStreak] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const afterStreakRef = useRef(null);  // callback to run after modal closes
  const prevStreakRef = useRef(0);      // streak before this session
  const hasSyncedRef = useRef(false);   // tracks if stats were synced this session

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
    if (timer <= 0 || !timerRunning) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, timerRunning]);

  const handleStartExam = () => {
    setShowDisclaimer(false);
    setTimerRunning(true);
    startTime.current = Date.now();

    // Capture streak in background silently
    (async () => {
      try {
        const res = await examAPI.getStatsSummary();
        if (res?.success) prevStreakRef.current = res.data?.streak || 0;
      } catch (err) {
        // Silently fail if they are offline or unauthorized
      }
    })();
  };

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

  const finishSession = (onContinue) => {
    // 1. Go to results right away — no waiting
    onContinue();
  };

  // 2. React useEffect ensures this logic fires COMPLETELY decoupled and
  // ONLY after the results screen has been fully painted on the screen!
  useEffect(() => {
    if (showResults && !hasSyncedRef.current) {
      hasSyncedRef.current = true; // Prevents duplicate syncing

      (async () => {
        console.log("🟢 Results are fully rendered. Starting stats sync...");
        await syncResultsToBackend();

        console.log("🟢 Fetching streak status...");
        try {
          const res = await examAPI.getStatsSummary();
          const latest = res?.data?.streak || 0;

          console.log(`📊 Streak Status: Previous = ${prevStreakRef.current}, New = ${latest}`);

          if (res?.success && latest > prevStreakRef.current) {
            console.log("🔥 Streak increased! Showing modal.");
            setNewStreak(latest);
            setShowStreakModal(true); // float on top of results
          } else {
            console.log("ℹ️ No streak increase this session.");
          }
        } catch (err) {
          console.error("❌ Error fetching streak status:", err);
        }
      })();
    }
  }, [showResults]);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Preparing your exam...</Text>
      </View>
    );
  }
  if (quizData.length === 0) return <View style={styles.container}><Text>No questions found.</Text></View>;

  // Disclaimer / Instructions Screen
  if (showDisclaimer) {
    const durationMins = Math.floor(timer / 60);
    return (
      <SafeAreaView style={styles.disclaimerContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.disclaimerScroll}>
          {/* Header */}
          <View style={styles.disclaimerHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.disclaimerBackBtn}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.disclaimerHeaderTitle}>Exam Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Exam Info Card */}
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerIconRow}>
              <View style={styles.disclaimerIconCircle}>
                <Ionicons name="document-text" size={32} color="#2563EB" />
              </View>
            </View>
            <Text style={styles.disclaimerExamTitle}>{examInfo.mathType}</Text>
            <Text style={styles.disclaimerExamSubtitle}>
              {examInfo.year ? `June ${examInfo.year}` : 'Custom Exam'}{examInfo.paper ? ` • ${examInfo.paper}` : ''}
            </Text>

            <View style={styles.disclaimerDivider} />

            {/* Key Details Grid */}
            <View style={styles.disclaimerGrid}>
              <View style={styles.disclaimerGridItem}>
                <Ionicons name="help-circle-outline" size={22} color="#2563EB" />
                <Text style={styles.disclaimerGridValue}>{quizData.length}</Text>
                <Text style={styles.disclaimerGridLabel}>Questions</Text>
              </View>
              <View style={styles.disclaimerGridItem}>
                <Ionicons name="time-outline" size={22} color="#D97706" />
                <Text style={styles.disclaimerGridValue}>{durationMins} min</Text>
                <Text style={styles.disclaimerGridLabel}>Duration</Text>
              </View>
              <View style={styles.disclaimerGridItem}>
                <Ionicons name="school-outline" size={22} color="#059669" />
                <Text style={styles.disclaimerGridValue}>{level || 'O/L'}</Text>
                <Text style={styles.disclaimerGridLabel}>Level</Text>
              </View>
            </View>
          </View>

          {/* Instructions Card */}
          <View style={styles.disclaimerInstructionsCard}>
            <View style={styles.disclaimerInstructionsHeader}>
              <Ionicons name="information-circle" size={22} color="#2563EB" />
              <Text style={styles.disclaimerInstructionsTitleText}>Instructions</Text>
            </View>

            <View style={styles.disclaimerRule}>
              <Text style={styles.disclaimerRuleNumber}>1</Text>
              <Text style={styles.disclaimerRuleText}>Read each question carefully before selecting your answer. Once you move to the next question, you can still go back.</Text>
            </View>
            <View style={styles.disclaimerRule}>
              <Text style={styles.disclaimerRuleNumber}>2</Text>
              <Text style={styles.disclaimerRuleText}>Each question has only one correct answer. Select the option you believe is correct.</Text>
            </View>
            <View style={styles.disclaimerRule}>
              <Text style={styles.disclaimerRuleNumber}>3</Text>
              <Text style={styles.disclaimerRuleText}>The timer will start as soon as you press "Start Exam". Manage your time wisely — aim for about {Math.max(1, Math.floor(durationMins / quizData.length))} minute(s) per question.</Text>
            </View>
            <View style={styles.disclaimerRule}>
              <Text style={styles.disclaimerRuleNumber}>4</Text>
              <Text style={styles.disclaimerRuleText}>You can finish early by pressing the "Done" button at any time. Your results will be saved automatically.</Text>
            </View>
            <View style={styles.disclaimerRule}>
              <Text style={styles.disclaimerRuleNumber}>5</Text>
              <Text style={styles.disclaimerRuleText}>Unanswered questions will be marked as "Not Done" in your final results. Try to attempt every question.</Text>
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.disclaimerTipsCard}>
            <View style={styles.disclaimerInstructionsHeader}>
              <Ionicons name="bulb-outline" size={22} color="#D97706" />
              <Text style={[styles.disclaimerInstructionsTitleText, { color: '#D97706' }]}>Tips</Text>
            </View>
            <Text style={styles.disclaimerTipText}>• Eliminate obviously wrong answers first to improve your chances.</Text>
            <Text style={styles.disclaimerTipText}>• Don't spend too long on a single question — skip and return later.</Text>
            <Text style={styles.disclaimerTipText}>• Stay calm and focused throughout the exam. Good luck!</Text>
          </View>

          {/* Start Button */}
          <TouchableOpacity style={styles.disclaimerStartBtn} onPress={handleStartExam} activeOpacity={0.8}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.disclaimerStartBtnText}>Start Exam</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimerFooterNote}>By starting, you agree to complete the exam under fair conditions.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }


  const currentQuestion = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;
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
      finishSession(() => {
        setShowCongrats(true);
        setShowResults(true);
      });
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
    finishSession(() => {
      setShowCongrats(false);
      setShowResults(true);
    });
  };

  // Only renders when streak actually increased after this session
  // Floats on top of whatever screen is currently showing
  const StreakModal = () => (
    <RNModal
      visible={showStreakModal}
      transparent={false}
      animationType="fade"
      onRequestClose={() => setShowStreakModal(false)}
    >
      <View style={styles.streakOverlay}>
        <View style={styles.streakCard}>
          <Text style={styles.streakCardTitle}>🔥 Streak Updated!</Text>
          <DayStreak streak={newStreak} />
          <TouchableOpacity
            style={styles.streakContinueBtn}
            onPress={() => setShowStreakModal(false)}
          >
            <Text style={styles.streakContinueBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );

  if (showCongrats) {
    return (
      <React.Fragment>
        <StreakModal />
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
      </React.Fragment>
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

    const scorePercentage = Math.round((passed / quizData.length) * 100);

    const renderHeader = () => (
      <View>
        {/* Header */}
        <View style={styles.headerWrapper}>
          <TouchableOpacity
            style={styles.backCircle}
            onPress={() => router.back()}
          >
            <Ionicons name="home-outline" size={24} color="#2d2d2d" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerSubject}>Exam Completed</Text>
            <Text style={styles.headerMeta}>{examInfo.mathType}</Text>
          </View>
        </View>

        {/* Score Summary Card */}
        <View style={styles.resultsSummaryCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentageText}>{scorePercentage}%</Text>
            <Text style={styles.scoreLabelText}>Overall Score</Text>
          </View>

          <View style={styles.resultsDivider} />

          <View style={styles.disclaimerGrid}>
            <View style={styles.disclaimerGridItem}>
              <Ionicons name="checkmark-circle" size={22} color="#059669" />
              <Text style={styles.disclaimerGridValue}>{passed}</Text>
              <Text style={styles.disclaimerGridLabel}>Correct</Text>
            </View>
            <View style={styles.disclaimerGridItem}>
              <Ionicons name="close-circle" size={22} color="#DC2626" />
              <Text style={styles.disclaimerGridValue}>{failed}</Text>
              <Text style={styles.disclaimerGridLabel}>Incorrect</Text>
            </View>
            <View style={styles.disclaimerGridItem}>
              <Ionicons name="help-circle" size={22} color="#64748B" />
              <Text style={styles.disclaimerGridValue}>{notDone}</Text>
              <Text style={styles.disclaimerGridLabel}>Skipped</Text>
            </View>
          </View>
        </View>

        <Text style={styles.reviewSectionTitle}>Question Review</Text>
      </View>
    );

    const renderFooter = () => (
      <View style={styles.resultsActionsContainer}>
        <TouchableOpacity
          style={styles.resultsHomeBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="home" size={20} color="#2563EB" />
          <Text style={styles.resultsHomeBtnText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resultsRetryBtn}
          onPress={() => {
            hasSyncedRef.current = false; // Reset the sync flag for the new attempt
            setShowResults(false);
            setCurrentQuestionIndex(0);
            setSelectedOptions({});
            setTimer(60 * 90);
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.resultsRetryBtnText}>Retry Exam</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <React.Fragment>
        <StreakModal />
        <SafeAreaView style={styles.mainContainer}>
          <View style={[styles.mainContainer, styles.backgroundContainer]}>
            <FlatList
              data={quizData}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item, index }) => (
                <ReviewCard
                  question={item}
                  index={index}
                  userAnswer={selectedOptions[index]}
                />
              )}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              contentContainerStyle={{
                paddingHorizontal: scale(15),
                paddingTop: verticalScale(20),
                paddingBottom: verticalScale(40),
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              windowSize={5}
            />
          </View>
        </SafeAreaView>
      </React.Fragment>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={[styles.mainContainer, styles.backgroundContainer]}>
        {/* Main ScrollView with all content */}
        <ScrollView
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerWrapper}>
            <TouchableOpacity
              style={styles.backCircle}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#2d2d2d" />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerSubject}>{examInfo.mathType}</Text>
              <Text style={styles.headerMeta}>
                Exam Mode • {examInfo.year ? `June ${examInfo.year}` : 'Custom Exam'}{examInfo.paper ? ` • ${examInfo.paper}` : ''}
              </Text>
            </View>
            <View style={styles.timerPill}>
              <Ionicons name="time-outline" size={14} color="#D97706" />
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </View>
          </View>

          {/* Progress Bar (Dotted Style) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressCountText}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              {Array.from({ length: totalQuestions }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentQuestionIndex ? styles.progressDotActive : styles.progressDotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.revisionBadge}>
                <Text style={styles.revisionBadgeText}>🎓 Mak AI</Text>
              </View>
            </View>

            <View style={styles.questionSection}>
              <MathJaxProvider html={currentQuestion.question} />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions[currentQuestionIndex] === option.label;
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => handleSelectOption(option.label)}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowActive
                  ]}
                >
                  <View style={[
                    styles.optionIndicator,
                    isSelected && styles.optionIndicatorActive
                  ]}>
                    <Text style={[
                      styles.optionLetter,
                      isSelected && { color: '#FFF' }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  <View style={styles.optionMathWrap} pointerEvents="none">
                    <MathJaxProvider html={option.value} />
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3F51B5" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Navigation Section */}
        <View style={styles.floatingNavContainer}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.navBtn, currentQuestionIndex === 0 && styles.btnDisabled]}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.revisionPill}
            onPress={handleFinishEarly}
          >
            <Text style={styles.revisionPillText}>Done</Text>
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  // Header Styles
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(5),
    paddingBottom: verticalScale(15),
    justifyContent: 'space-between',
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: scale(15),
    marginRight: scale(15),
  },
  headerSubject: {
    color: '#1e293b',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  headerMeta: {
    color: '#64748b',
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  timerText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 5,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressCountText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
  },
  progressDotInactive: {
    backgroundColor: '#e2e8f0',
  },

  // Main Scroll View
  mainScrollView: {
    flex: 1,
    marginHorizontal: scale(15),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(80),
  },

  // Card Styles
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  revisionBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  revisionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  questionSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },

  // Options
  optionsSection: {
    marginBottom: scale(20),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  optionRowActive: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndicatorActive: {
    backgroundColor: '#3b82f6',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  optionMathWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 10,
  },

  // Footer / Floating Nav
  floatingNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    paddingBottom: verticalScale(25),
    backgroundColor: 'transparent',
  },
  navBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navBtnText: {
    color: '#2d2d2d',
    fontWeight: '700',
    fontSize: 14,
  },
  revisionPill: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(28),
    paddingVertical: verticalScale(10),
    borderRadius: 20,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  revisionPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Results Screen Styles
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  resultsHeader: {
    marginBottom: 24,
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
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resultsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Congrats Modal Styles
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
  streakOverlay: {
    backgroundColor: 'white',
  },
  // Disclaimer Styles
  disclaimerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  disclaimerScroll: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
  },
  disclaimerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerHeaderTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1E293B',
  },
  disclaimerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: scale(24),
    marginBottom: verticalScale(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  disclaimerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerExamTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  disclaimerExamSubtitle: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
  },
  disclaimerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: verticalScale(18),
  },
  disclaimerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  disclaimerGridItem: {
    alignItems: 'center',
    gap: 4,
  },
  disclaimerGridValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  disclaimerGridLabel: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    fontWeight: '600',
  },
  disclaimerInstructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: scale(20),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  disclaimerInstructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: verticalScale(14),
  },
  disclaimerInstructionsTitleText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#2563EB',
  },
  disclaimerRule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
    gap: 12,
  },
  disclaimerRuleNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    overflow: 'hidden',
  },
  disclaimerRuleText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: '#475569',
    lineHeight: 20,
  },
  disclaimerTipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    padding: scale(20),
    marginBottom: verticalScale(24),
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  disclaimerTipText: {
    fontSize: moderateScale(13),
    color: '#92400E',
    lineHeight: 22,
    marginBottom: 4,
  },
  disclaimerStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingVertical: verticalScale(16),
    borderRadius: 16,
    marginBottom: verticalScale(12),
  },
  disclaimerStartBtnText: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disclaimerFooterNote: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  // Result screen updates
  resultsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: scale(24),
    marginBottom: verticalScale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#E0EEFF',
    marginBottom: 16,
  },
  scorePercentageText: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#2563EB',
  },
  scoreLabelText: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
  },
  resultsDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  reviewSectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  resultStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  resultDetailsSection: {
    marginTop: 16,
    width: '100%',
    gap: 12,
  },
  resultAnswerRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  correctAnswerRow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  incorrectAnswerRow: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  skippedAnswerRow: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  resultLineLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  resultValueWrap: {
    minHeight: 24,
  },
  resultExplanationBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  explanationLabelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  resultsActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 40,
  },
  resultsHomeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsHomeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  resultsRetryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  resultsRetryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
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
