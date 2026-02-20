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
        <ActivityIndicator size="large" color="#1e3a8a" />
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
    <View style={[styles.mainContainer, { backgroundColor: '#3349cb' }]}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity 
          style={styles.backCircle}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerSubject}>{examInfo.title}</Text>
          <Text style={styles.headerMeta}>Revision Mode • {examInfo.date}</Text>
        </View>
        
      </View>

      {/* Progress Bar */}
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

      {/* Main Container with two boxes */}
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
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
            <Ionicons name="bulb-outline" size={14} color="#ffffff" />
            <Text style={styles.hintPillText}>Hint</Text>
          </TouchableOpacity>
          </View>

          <View style={styles.questionSection}>
            <MathJaxProvider html={currentQuestion.question} />
          </View>
        </View>

        {/* Options Card */}
        <View style={styles.optionsCard}>
          <View style={styles.optionsSection}>
            {currentQuestion.options.map((option) => {
              const selected = selectedOptions[currentQuestionIndex];
              const isSelected = selected === option.label;
              let backgroundColor = '#F9FAFB';
              let borderColor = '#F3F4F6';
              let isAnswered = false;

              if (selected) {
                isAnswered = true;
                if (isSelected) {
                  if (selected === currentQuestion.correct) {
                    backgroundColor = '#DCFCE7';
                    borderColor = '#22C55E';
                  } else {
                    backgroundColor = '#FEE2E2';
                    borderColor = '#EF4444';
                  }
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
                  <View style={[styles.optionIndicator, isSelected && styles.optionIndicatorActive]}>
                    <Text style={[styles.optionLetter, isSelected && { color: '#FFF' }]}>
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
                      color={selected === currentQuestion.correct ? "#22C55E" : "#EF4444"}
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
            <Ionicons name="book-outline" size={16} color="#FFF" />
            <Text style={styles.viewExplanationBtnText}>View Explanation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      {/* Footer Navigation */}
      <View style={styles.footerNav}>
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
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1 
  },

  // Header Styles
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: verticalScale(15),
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: { 
    flex: 1, 
    marginLeft: scale(15),
    marginRight: scale(15),
  },
  headerSubject: { 
    color: '#FFF', 
    fontSize: moderateScale(18), 
    fontWeight: '800' 
  },
  headerMeta: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgb(229, 233, 253)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  hintPillText: { 
    color: '#131313', 
    fontSize: 12, 
    fontWeight: 'bold'
  },

  // Progress Bar
  progressContainer: { 
    paddingHorizontal: scale(25), 
    marginTop: 25 
  },
  progressBarBg: { 
    height: 10, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { 
    height: 10, 
    backgroundColor: '#4ade80', 
    borderRadius: 5 
  },
  progressCountText: { 
    color: '#FFF', 
    fontSize: 12, 
    marginTop: 8, 
    textAlign: 'right', 
    fontWeight: '600' 
  },

  // Main Scroll View
  mainScrollView: {
    flex: 1,
    marginHorizontal: scale(15),
    marginTop: verticalScale(20),
    marginBottom: verticalScale(110),
  },

  // Card Styles
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  optionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: scale(20),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  revisionBadge: {
    backgroundColor: '#F0F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  revisionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F51B5',
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  optionRowActive: { 
    borderWidth: 2,
  },
  optionIndicator: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E5E7EB', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  optionIndicatorActive: { 
    backgroundColor: '#3F51B5' 
  },
  optionLetter: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#6B7280' 
  },
  optionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  optionMathWrap: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginLeft: 40,
  },

  // Explanation Button
  viewExplanationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3F51B5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  viewExplanationBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: verticalScale(80),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#3F51B5',
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
    color: '#3F51B5',
    marginBottom: 8,
  },
  answerBox: {
    backgroundColor: '#DCFCE7',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  answerBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  correctAnswerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  answerLabel: {
    backgroundColor: '#22C55E',
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
  footerNav: {
    position: 'absolute',
    bottom: verticalScale(25),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(15),
    paddingBottom: verticalScale(10),
  },
  navBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10,
  },
  navBtnText: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
  revisionPill: { 
    backgroundColor: '#FFF', 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3F51B5',
  },
  revisionPillText: { 
    color: '#3F51B5', 
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  backButtonText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3F51B5',
    fontWeight: '600',
  },
});