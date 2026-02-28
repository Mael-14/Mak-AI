import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examAPI } from '../services/api';
import { scale, verticalScale, moderateScale } from '../utils/scaling';
import MathJaxProvider from '../components/MathJaxProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [showPassword, setShowPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.ValueXY()).current;
  const [selectedOptions, setSelectedOptions] = useState({});

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

        // Simple approach: Use subjectCode + level to fetch questions
        const response = await examAPI.getQuestions(subjectCode, level);

        if (response.success) {
          // Filter by topic if provided
          let questions = response.data;
          if (topic) {
            questions = questions.filter(q => q.topic === topic);
          }

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d2d2d" />
        <Text style={styles.loadingText}>Loading questions...</Text>
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

  const cardAnimationStyle = {
    transform: [{ translateX: position.x }],
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={[styles.mainContainer, styles.backgroundContainer]}>
        {/* Main ScrollView with all content */}
        <ScrollView 
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
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
              <Text style={styles.headerSubject}>{examInfo.title}</Text>
              <Text style={styles.headerMeta}>Revision Mode • {examInfo.date}</Text>
            </View>
          </View>

          {/* Progress Bar */}
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
                <Text style={styles.revisionBadgeText}>🤖 Ask Mak</Text>
              </View>

              <TouchableOpacity 
                style={styles.hintPill}
                onPress={setShowHint}
              >
                <Ionicons name="bulb-outline" size={14} color="#D97706" />
                <Text style={styles.hintPillText}>Hint</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.questionSection}>
              <MathJaxProvider html={currentQuestion.question} />
            </View>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            {currentQuestion.options.map((option) => {
                const selected = selectedOptions[currentQuestionIndex];
                const isSelected = selected === option.label;
                let backgroundColor = '#FFFFFF';
                let borderColor = '#e0e0e0';
                let isAnswered = false;

                if (selected) {
                  isAnswered = true;
                  if (isSelected) {
                    if (selected === currentQuestion.correct) {
                      backgroundColor = '#ECFDF5';
                      borderColor = '#10B981';
                    } else {
                      backgroundColor = '#FEF2F2';
                      borderColor = '#EF4444';
                    }
                  }
                }

                // Determine indicator background and text color
                let indicatorBgColor = '#f0f0f0';
                let indicatorTextColor = '#666666';
                
                if (selected && isSelected) {
                  if (selected === currentQuestion.correct) {
                    indicatorBgColor = '#10B981'; // Green for correct
                    indicatorTextColor = '#FFF';
                  } else {
                    indicatorBgColor = '#EF4444'; // Red for incorrect
                    indicatorTextColor = '#FFF';
                  }
                }

                return (
                  <TouchableOpacity
                    key={option.label}
                    onPress={() => handleSelectOption(option.label)}
                    style={[
                      styles.optionRow,
                      isSelected && styles.optionRowActive,
                      { backgroundColor, borderColor }
                    ]}
                  >
                    <View style={[
                      styles.optionIndicator, 
                      { backgroundColor: indicatorBgColor }
                    ]}>
                      <Text style={[
                        styles.optionLetter, 
                        { color: indicatorTextColor }
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    <View style={styles.optionMathWrap} pointerEvents="none">
                      <MathJaxProvider html={option.value} />
                    </View>
                    {isSelected && (
                      <Ionicons 
                        name={selected === currentQuestion.correct ? "checkmark-circle" : "close-circle"} 
                        size={20} 
                        color={selected === currentQuestion.correct ? "#10B981" : "#EF4444"}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>

          <TouchableOpacity 
            style={styles.viewExplanationBtn} 
            onPress={() => setShowExplanationModal(true)}
          >
            <Ionicons name="book-outline" size={16} color="#2d2d2d" />
            <Text style={styles.viewExplanationBtnText}>View Explanation</Text>
          </TouchableOpacity>
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
            onPress={() => {
              if (currentQuestionIndex === totalQuestions - 1) {
                Alert.alert(
                  'Completed!',
                  `You have completed all ${totalQuestions} questions!`,
                  [
                    { text: 'Review Again', onPress: () => setCurrentQuestionIndex(0) },
                    { text: 'Done', onPress: () => router.back() }
                  ]
                );
              }
            }}
          >
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
          </TouchableOpacity>
        </View>

      {/* Explanation Modal */}
      <Modal
        visible={showExplanationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExplanationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Explanation</Text>
              <TouchableOpacity 
                onPress={() => setShowExplanationModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.modalBody}>
                <Text style={styles.explanationLabel}>Question Explanation</Text>
                <MathJaxProvider html={currentQuestion.explanation} />
                
                {selectedOptions[currentQuestionIndex] && (
                  <View style={styles.answerBox}>
                    <Text style={styles.answerBoxTitle}>Correct Answer</Text>
                    <View style={styles.correctAnswerContent}>
                      <View style={styles.answerLabel}>
                        <Text style={styles.answerLabelText}>
                          {currentQuestion.options.find(opt => opt.label === currentQuestion.correct)?.label}.
                        </Text>
                      </View>
                      <View style={styles.answerValueWrap}>
                        <MathJaxProvider html={currentQuestion.options.find(opt => opt.label === currentQuestion.correct)?.value} />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1 
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    fontWeight: '800'
  },
  headerMeta: { 
    color: '#64748b', 
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  hintPillText: { 
    color: '#D97706', 
    fontSize: 12, 
    fontWeight: 'bold'
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
    fontWeight: '700'
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
    marginBottom: verticalScale(80), // Add margin to prevent content from hiding behind floating nav
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
  optionsCard: {},
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
    borderWidth: 2,
  },
  optionIndicator: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  optionLetter: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#666666' 
  },
  optionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2d2d2d',
    flex: 1,
  },
  optionMathWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 40,
  },

  // Explanation Button
  viewExplanationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  viewExplanationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: verticalScale(80),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    paddingTop: verticalScale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: '#FFF',
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalBody: {
    padding: scale(20),
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: 8,
  },
  answerBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  answerBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 8,
  },
  correctAnswerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  answerLabel: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  answerLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  answerValueWrap: {
    flex: 1,
    minHeight: 30,
  },

  // Footer
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
    paddingBottom: verticalScale(25), // Extra padding for safe area
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
    fontSize: 14 
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
    opacity: 0.5 
  },

  // Loading
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
  backButtonText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2d2d2d',
    fontWeight: '600',
  },
});