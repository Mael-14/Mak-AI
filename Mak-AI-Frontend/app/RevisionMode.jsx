import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { examAPI } from '../services/api';
import { scale, verticalScale, moderateScale } from '../utils/scaling';
import MathJaxProvider from '../components/MathJaxProvider';
import QuestionMeasurer from '../components/QuestionMeasurer';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Revision() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { subjectCode, examTitle, topic, paper, subjectName, level, year } = params;

  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examInfo, setExamInfo] = useState({
    title: examTitle || subjectName || 'Mathematics',
    date: paper || '',
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const [selectedOptions, setSelectedOptions] = useState({});
  const [heightsCache, setHeightsCache] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);

  // Simple approach: Fetch questions using subjectCode + level
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);

        // Simple validation
        if (!subjectCode || !level) {
          Alert.alert('Error', 'Subject code and level are required');
          router.back();
          return;
        }

        console.log('Fetching questions for subjectCode:', subjectCode, 'level:', level);

        // Local-first per-topic when topic is selected; otherwise local-first subject cache.
        const response = topic
          ? await examAPI.getQuestionsForTopic(subjectCode, level, topic)
          : await examAPI.getQuestions(subjectCode, level);

        if (response.success) {
          const questions = response.data;

          // Format questions to match UI structure
          const formattedQuestions = questions.map(q => ({
            id: q.id,
            question: q.text,
            options: Object.entries(q.options || {}).map(([label, value]) => ({
              label,
              value
            })),
            correct: q.answer,
            hint: `This question is about ${q.topic || 'this topic'}. Think carefully about the concepts involved.`,
            explanation: q.explanation || 'No explanation available.',
            hasImage: q.hasImage,
            topic: q.topic
          }));

          // Sort by question ID
          const sortedQuestions = formattedQuestions.sort((a, b) => {
            const numA = parseInt(a.id.replace(/^\D+/g, '')) || 0;
            const numB = parseInt(b.id.replace(/^\D+/g, '')) || 0;
            return numA - numB;
          });

          setQuizData(sortedQuestions);
          setIsPreparing(true);

          // Update exam info
          setExamInfo({
            title: response.examInfo?.mathType || subjectName || 'Mathematics',
            date: year && paper
              ? `${paper} - ${year}`
              : response.examInfo?.paper && response.examInfo?.year
                ? `${response.examInfo.paper} - ${response.examInfo.year}`
                : paper || '',
          });
        } else {
          Alert.alert('Error', response.error || 'Failed to load questions');
          router.back();
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to load questions. Please try again.';
        Alert.alert(
          'Error',
          errorMessage,
          [
            { text: 'Retry', onPress: () => loadQuestions() },
            { text: 'Go Back', onPress: () => router.back(), style: 'cancel' }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [subjectCode, level, topic]);

  if (loading || isPreparing) {
    return (
      <View style={styles.loadingContainer}>
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.loadingModalOverlay}>
            <View style={styles.loadingModalCard}>
              <LottieView
                source={require('../animations/Loading animation blue.json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={styles.loadingTitle}>Preparing Revision Mode</Text>
              <Text style={styles.loadingText}>
                {isPreparing ? 'Optimizing layouts for you...' : 'Loading questions...'}
              </Text>
            </View>
          </View>
        </Modal>
        {isPreparing && (
          <QuestionMeasurer 
            quizData={quizData} 
            onMeasured={(data) => {
              setHeightsCache(data);
              setIsPreparing(false);
            }} 
          />
        )}
      </View>
    );
  }

  if (quizData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No questions available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const totalQuestions = quizData.length;

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowExplanationModal(false);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanationModal(false);
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

  const answeredCount = Object.keys(selectedOptions).length;
  const correctCount = quizData.reduce((count, question, index) => {
    return selectedOptions[index] === question.correct ? count + 1 : count;
  }, 0);

  const handleReviewAgain = () => {
    setShowCompletionModal(false);
    setCurrentQuestionIndex(0);
    setShowExplanationModal(false);
  };

  const handleDone = () => {
    setShowCompletionModal(false);
    router.back();
  };

  const cardAnimationStyle = {
    transform: [{ translateX: position.x }],
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={[styles.mainContainer, styles.backgroundContainer]}>

        {/* ── Dark header band ── */}
        <View style={styles.headerBand}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={15} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerSubject} numberOfLines={1}>{examInfo.title}</Text>
            <Text style={styles.headerMeta}>Revision Mode  ·  {examInfo.date}</Text>
          </View>
          <View style={styles.headerCounter}>
            <Text style={styles.headerCounterText}>{currentQuestionIndex + 1}/{totalQuestions}</Text>
          </View>
        </View>

        {/* ── Progress bar (part of header band) ── */}
        <View style={styles.progressBandContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }]} />
          </View>
        </View>

        {/* ── Main scroll content ── */}
        <ScrollView
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.revisionBadge}>
                <Ionicons name="sparkles-outline" size={12} color="#FFFFFF" />
                <Text style={styles.revisionBadgeText}>Ask Mak</Text>
              </View>
              <TouchableOpacity style={styles.hintPill} onPress={setShowHint}>
                <Ionicons name="bulb-outline" size={14} color="#D97706" />
                <Text style={styles.hintPillText}>Hint</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.questionSection}>
              <MathJaxProvider 
                html={currentQuestion.question} 
                preCalculatedHeight={heightsCache ? heightsCache[`q_${currentQuestionIndex}`] : null}
              />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            {currentQuestion.options.map((option) => {
              const selected = selectedOptions[currentQuestionIndex];
              const isSelected = selected === option.label;
              let backgroundColor = '#FFFFFF';
              let borderColor = '#e8edf2';
              if (selected && isSelected) {
                backgroundColor = selected === currentQuestion.correct ? '#ECFDF5' : '#FEF2F2';
                borderColor   = selected === currentQuestion.correct ? '#10B981'  : '#EF4444';
              }
              let indicatorBgColor   = '#f0f4f8';
              let indicatorTextColor = '#64748b';
              if (selected && isSelected) {
                indicatorBgColor   = selected === currentQuestion.correct ? '#10B981' : '#EF4444';
                indicatorTextColor = '#FFF';
              }
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => handleSelectOption(option.label)}
                  style={[styles.optionRow, isSelected && styles.optionRowActive, { backgroundColor, borderColor }]}
                >
                  <View style={[styles.optionIndicator, { backgroundColor: indicatorBgColor }]}>
                    <Text style={[styles.optionLetter, { color: indicatorTextColor }]}>{option.label}</Text>
                  </View>
                  <View style={styles.optionMathWrap} pointerEvents="none">
                    <MathJaxProvider 
                      html={option.value} 
                      preCalculatedHeight={heightsCache ? heightsCache[`o_${currentQuestionIndex}_${option.label}`] : null}
                    />
                  </View>
                  {isSelected && (
                    <Ionicons
                      name={selected === currentQuestion.correct ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={selected === currentQuestion.correct ? '#10B981' : '#EF4444'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation button */}
          <TouchableOpacity style={styles.viewExplanationBtn} onPress={() => setShowExplanationModal(true)}>
            <Ionicons name="document-text-outline" size={16} color="#000E38" />
            <Text style={styles.viewExplanationBtnText}>View Explanation</Text>
            <Ionicons name="chevron-up" size={14} color="#000E38" />
          </TouchableOpacity>
        </ScrollView>

        {/* ── Bottom navigation bar ── */}
        <View style={styles.floatingNavContainer}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[styles.navBtn, currentQuestionIndex === 0 && styles.btnDisabled]}
            disabled={currentQuestionIndex === 0}
          >
            <Ionicons name="chevron-back" size={16} color="#475569" />
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.revisionPill}
            onPress={() => {
              if (currentQuestionIndex === totalQuestions - 1) {
                setShowCompletionModal(true);
              }
            }}
          >
            <Ionicons
              name={currentQuestionIndex === totalQuestions - 1 ? 'checkmark-done' : 'checkmark'}
              size={16}
              color="#fff"
            />
            <Text style={styles.revisionPillText}>
              {currentQuestionIndex === totalQuestions - 1 ? 'Complete' : 'Done'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.navBtn, currentQuestionIndex === totalQuestions - 1 && styles.btnDisabled]}
            disabled={currentQuestionIndex === totalQuestions - 1}
          >
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* ── Explanation modal (1/3 screen) ── */}
        <Modal
          visible={showExplanationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowExplanationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Drag handle */}
              <View style={styles.modalDragArea}>
                <View style={styles.modalDragHandle} />
              </View>

              {/* Modal header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Ionicons name="document-text-outline" size={18} color="#000E38" />
                  <Text style={styles.modalTitle}>Explanation</Text>
                </View>
                <TouchableOpacity onPress={() => setShowExplanationModal(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <Text style={styles.explanationLabel}>Question Explanation</Text>
                  <MathJaxProvider 
                    html={currentQuestion.explanation} 
                    preCalculatedHeight={heightsCache ? heightsCache[`e_${currentQuestionIndex}`] : null}
                  />

                  {selectedOptions[currentQuestionIndex] && (
                    <View style={styles.answerBox}>
                      <View style={styles.answerBoxHeader}>
                        <Ionicons name="checkmark-circle" size={15} color="#047857" />
                        <Text style={styles.answerBoxTitle}>Correct Answer</Text>
                      </View>
                      <View style={styles.correctAnswerContent}>
                        <View style={styles.answerLabel}>
                          <Text style={styles.answerLabelText}>
                            {currentQuestion.options.find(opt => opt.label === currentQuestion.correct)?.label}
                          </Text>
                        </View>
                        <View style={styles.answerValueWrap}>
                          <MathJaxProvider 
                            html={currentQuestion.options.find(opt => opt.label === currentQuestion.correct)?.value} 
                            preCalculatedHeight={heightsCache ? heightsCache[`o_${currentQuestionIndex}_${currentQuestion.correct}`] : null}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Completion modal */}
        <Modal
          visible={showCompletionModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              <View style={styles.completionIconWrap}>
                <Ionicons name="trophy" size={28} color="#fff" />
              </View>

              <Text style={styles.completionTitle}>Session Completed</Text>
              <Text style={styles.completionSubtitle}>
                You reached the end of this revision set.
              </Text>

              <View style={styles.completionStatsRow}>
                <View style={styles.completionStatBox}>
                  <Text style={styles.completionStatValue}>{answeredCount}/{totalQuestions}</Text>
                  <Text style={styles.completionStatLabel}>Answered</Text>
                </View>
                <View style={styles.completionStatDivider} />
                <View style={styles.completionStatBox}>
                  <Text style={styles.completionStatValue}>{correctCount}</Text>
                  <Text style={styles.completionStatLabel}>Correct</Text>
                </View>
              </View>

              <View style={styles.completionButtonRow}>
                <TouchableOpacity style={styles.secondaryCompletionButton} onPress={handleReviewAgain}>
                  <Text style={styles.secondaryCompletionButtonText}>Review Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryCompletionButton} onPress={handleDone}>
                  <Text style={styles.primaryCompletionButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  backgroundContainer: { flex: 1, backgroundColor: '#f0f2f8' },

  // ── Header band ────────────────────────────────────────────────────────────
  headerBand: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1FB',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(14),
    gap: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#D8DCF0',
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,14,56,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: { flex: 1 },
  headerSubject: {
    color: '#000E38',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  headerMeta: {
    color: 'rgba(0,14,56,0.5)',
    fontSize: moderateScale(11),
    marginTop: 2,
  },
  headerCounter: {
    backgroundColor: 'rgba(0,14,56,0.07)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 10,
  },
  headerCounterText: {
    color: '#000E38',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },

  // ── Progress bar ───────────────────────────────────────────────────────────
  progressBandContainer: {
    backgroundColor: '#EEF1FB',
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(14),
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(5, 19, 62, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#062171',
    borderRadius: 2,
  },

  // ── Main scroll ────────────────────────────────────────────────────────────
  mainScrollView: {
    flex: 1,
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(80),
  },

  // ── Question card ──────────────────────────────────────────────────────────
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: scale(18),
    marginBottom: verticalScale(12),
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    //borderLeftWidth: 4,
    //borderLeftColor: '#062171',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  revisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#062171',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  revisionBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  hintPillText: { color: '#D97706', fontSize: 11, fontWeight: '600' },
  questionSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },

  // ── Options ────────────────────────────────────────────────────────────────
  optionsSection: { marginBottom: scale(16) },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e8edf2',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionRowActive: { borderWidth: 1.5 },
  optionIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  optionMathWrap: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 40,
  },

  // ── Explanation button ─────────────────────────────────────────────────────
  viewExplanationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF1FB',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 14,
    marginBottom: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8DCF0',
  },
  viewExplanationBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000E38',
    flex: 1,
    textAlign: 'center',
  },

  // ── Bottom nav bar ─────────────────────────────────────────────────────────
  floatingNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    paddingBottom: verticalScale(22),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e8edf2',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  revisionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#062171',
    paddingHorizontal: scale(22),
    paddingVertical: verticalScale(10),
    borderRadius: 14,
    shadowColor: '#000E38',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  revisionPillText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.4 },

  // ── Explanation modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: SCREEN_HEIGHT * (2 / 3),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalDragArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#1e293b',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: { flex: 1 },
  modalBody: { padding: scale(18) },
  explanationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  answerBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  answerBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  answerBoxTitle: { fontSize: 12, fontWeight: '700', color: '#047857' },
  correctAnswerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  answerLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerLabelText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  answerValueWrap: { flex: 1, minHeight: 30 },

  // Completion modal
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  completionCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: scale(22),
    alignItems: 'center',
    shadowColor: '#000E38',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  completionIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#062171',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  completionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: moderateScale(13),
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionStatsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#EEF1FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8DCF0',
    marginBottom: 18,
  },
  completionStatBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  completionStatDivider: {
    width: 1,
    backgroundColor: '#D8DCF0',
  },
  completionStatValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#062171',
  },
  completionStatLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748b',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  completionButtonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryCompletionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCompletionButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#334155',
  },
  primaryCompletionButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#062171',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCompletionButtonText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Loading ────────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  loadingModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: '#D8DCF0',
    shadowColor: '#000E38',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  loadingAnimation: {
    width: scale(160),
    height: scale(120),
    marginBottom: verticalScale(6),
  },
  loadingTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#062171',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  backButtonText: { marginTop: 16, fontSize: 15, color: '#000E38', fontWeight: '600' },
});