import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Animated,
  Easing,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { examAPI } from '../services/api';
import { saveCustomExam } from '../utils/examStorage';

const { width } = Dimensions.get('window');

// Subject data mapping
const SUBJECTS_DATA = {
  1: {
    id: 1,
    title: 'Mathematics',
    image: require('../assets/Maths.png'),
    headerColor: '#ffb380',
    colors: ['#ffb380', '#FF8C42'],
  },
  2: {
    id: 2,
    title: 'Biology',
    image: require('../assets/Biology.png'),
    headerColor: '#90EE90',
    colors: ['#90EE90', '#32CD32'],
  },
  3: {
    id: 3,
    title: 'Chemistry',
    image: require('../assets/Chemistry.png'),
    headerColor: '#FFD700',
    colors: ['#FFD700', '#FFA500'],
  },
  4: {
    id: 4,
    title: 'Physics',
    image: require('../assets/Physics.png'),
    headerColor: '#87CEEB',
    colors: ['#87CEEB', '#00BFFF'],
  },
  5: {
    id: 5,
    title: 'Computer Science',
    image: require('../assets/Computer science.png'),
    headerColor: '#DDA0DD',
    colors: ['#DDA0DD', '#BA55D3'],
  },
  6: {
    id: 6,
    title: 'Math Stats',
    image: require('../assets/Math Statistic.png'),
    headerColor: '#F0E68C',
    colors: ['#F0E68C', '#DAA520'],
  },
  7: {
    id: 7,
    title: 'Geography',
    image: require('../assets/Geography.png'),
    headerColor: '#98D8C8',
    colors: ['#98D8C8', '#20B2AA'],
  },
  8: {
    id: 8,
    title: 'Further Math',
    image: require('../assets/FurtherMath.png'),
    headerColor: '#FFA07A',
    colors: ['#FFA07A', '#FF7F50'],
  },
};

const CustomExamSetup = () => {
  const router = useRouter();
  const { subjectId, level } = useLocalSearchParams();

  const subjectIdNum = subjectId ? parseInt(subjectId) : 1;
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];

  // State
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('Mixed');
  const [duration, setDuration] = useState('45');
  const [numQuestions, setNumQuestions] = useState('20');
  const [includeTopics, setIncludeTopics] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Animation Refs
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const difficulties = [
    { label: 'Easy', color: '#4CAF50', icon: 'speedometer-slow' },
    { label: 'Medium', color: '#FF9800', icon: 'speedometer-medium' },
    { label: 'Hard', color: '#F44336', icon: 'speedometer' },
  ];

  const questionTypes = [
    { label: 'MCQs (Paper 1)', value: 'MCQs (Paper 1)', icon: 'format-list-bulleted' },
    { label: 'Structural (Paper 2)', value: 'Structural (Paper 2)', icon: 'text-box-outline' },
    { label: 'Mixed', value: 'Mixed', icon: 'shuffle-variant' },
  ];

  const selectedLevel = level || 'Ordinary Level';

  useEffect(() => {
    let isMounted = true;

    const fetchTopics = async () => {
      try {
        setTopicsLoading(true);
        setTopicsError(null);

        const cachedResponse = await examAPI.getCachedTopicsBySubjectId(subjectIdNum, selectedLevel);
        if (cachedResponse?.success && Array.isArray(cachedResponse.data) && cachedResponse.data.length > 0) {
          if (!isMounted) return;
          setTopics(cachedResponse.data);
        }

        const response = await examAPI.getTopicsBySubjectId(subjectIdNum, selectedLevel);
        if (!isMounted) return;

        if (response?.success && Array.isArray(response.data)) {
          setTopics(response.data);
        } else {
          setTopicsError(response?.error || 'Failed to load topics for this subject.');
          if (!cachedResponse?.success) {
            setTopics([]);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching topics:', error);
        setTopicsError(error.message || 'Failed to load topics for this subject.');
        setTopics([]);
      } finally {
        if (isMounted) {
          setTopicsLoading(false);
        }
      }
    };

    fetchTopics();

    return () => {
      isMounted = false;
    };
  }, [subjectIdNum, selectedLevel]);

  const handleTopicToggle = (topic) => {
    setIncludeTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleRetryTopics = () => {
    setTopicsError(null);
    setTopicsLoading(true);
    examAPI.getTopicsBySubjectId(subjectIdNum, selectedLevel)
      .then((response) => {
        if (response?.success && Array.isArray(response.data)) {
          setTopics(response.data);
        } else {
          setTopicsError(response?.error || 'Failed to load topics for this subject.');
        }
      })
      .catch((error) => {
        console.error('Error retrying topics:', error);
        setTopicsError(error.message || 'Failed to load topics for this subject.');
      })
      .finally(() => setTopicsLoading(false));
  };

  const handleStartExam = async () => {
    if (includeTopics.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one topic to generate your exam.');
      return;
    }

    setIsGenerating(true);

    // Prepare the JSON payload for the AI Agent Webhook
    const examSummary = {
      subject: subject.title,
      subjectId: subject.id,
      level: level || 'Ordinary Level',
      difficulty,
      type: questionType,
      duration: parseInt(duration),
      limit: parseInt(numQuestions),
      topics: includeTopics,
      timestamp: new Date().toISOString(),
    };

    console.log('Generating Exam with Config:', JSON.stringify(examSummary, null, 2));

    try {
      // Call the n8n AI Agent Webhook to generate exam questions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 60 second timeout

      const response = await fetch(
        'https://n8n.srv1427812.hstgr.cloud/webhook/exam/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(examSummary),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook Error Response:', errorText);
        throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
      }

      // Get response as text first to debug
      const responseText = await response.text();
      console.log('Raw Response:', responseText);

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        throw new Error('Webhook returned empty response');
      }

      // Parse JSON with error handling
      let generatedExam;
      try {
        generatedExam = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Response Text:', responseText);
        throw new Error(`Invalid JSON response from webhook: ${parseError.message}`);
      }

      console.log('Exam Generated Successfully:', generatedExam);

      // Validate response structure
      if (!generatedExam.questions || !Array.isArray(generatedExam.questions)) {
        throw new Error('Invalid exam structure: missing questions array');
      }

      if (generatedExam.questions.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      setIsGenerating(false);

      // Save exam to history
      const examDataToSave = {
        subject: subject.title,
        subjectId: subject.id,
        level: level || 'Ordinary Level',
        difficulty,
        duration: parseInt(duration),
        questionType,
        numQuestions: parseInt(numQuestions),
        totalMarks: generatedExam.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        topics: includeTopics,
        questions: generatedExam.questions,
        status: 'saved',
      };

      try {
        const savedExam = await saveCustomExam(examDataToSave);
        console.log('Exam saved with ID:', savedExam.id);

        // Navigate to ExamHistory to show the new exam
        router.push({
          pathname: '/ExamHistory',
          params: {
            focusExamId: savedExam.id,
            returnTo: 'CustomExamSetup',
          },
        });
      } catch (storageError) {
        console.error('Error saving exam to history:', storageError);
        Alert.alert('Warning', 'Exam generated but failed to save to history. You can still view it now.', [
          { text: 'OK' }
        ]);

        // Still navigate to the exam even if save failed
        if (questionType === 'MCQs (Paper 1)') {
          router.push({
            pathname: '/ExamMode',
            params: {
              subjectCode: subject.title.toLowerCase().replace(' ', ''),
              level: level || 'Ordinary Level',
              examType: 'custom',
              difficulty,
              questionType,
              duration: duration.toString(),
              numQuestions: numQuestions.toString(),
              topics: includeTopics.join(','),
              examData: JSON.stringify(generatedExam.questions),
              examId: generatedExam.examId,
            },
          });
        } else {
          router.push({
            pathname: '/PaperExamSheet',
            params: {
              questions: JSON.stringify(generatedExam.questions),
              subject: subject.title,
              subjectId: subject.id.toString(),
              level: level || 'Ordinary Level',
              difficulty,
              duration: duration.toString(),
              questionType,
              examId: generatedExam.examId,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      setIsGenerating(false);
      console.error('Error generating exam:', error);

      // Provide detailed error message to user
      let errorMessage = 'Failed to generate exam. ';

      if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. The AI agent took too long to respond. Please try again.';
      } else if (error.message.includes('JSON Parse error')) {
        errorMessage += 'The server returned an invalid response. Please check that your n8n webhook is properly configured.';
      } else if (error.message.includes('Webhook failed')) {
        errorMessage += error.message;
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }

      Alert.alert(
        'Generation Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const SectionHeader = ({ title, icon }) => (
    <View style={styles.sectionHeaderRow}>
      <Ionicons name={icon} size={18} color="#555" style={{ marginRight: 8 }} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <View style={styles.headerGradient}>
          <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{subject.title} Custom Exam</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>

      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }]
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Difficulty Selection */}
        <View style={styles.card}>
          <SectionHeader title="Select Difficulty" icon="stats-chart" />
          <View style={styles.rowGrid}>
            {difficulties.map((diff) => {
              const isActive = difficulty === diff.label;
              return (
                <TouchableOpacity
                  key={diff.label}
                  activeOpacity={0.8}
                  style={[
                    styles.difficultyBtn,
                    isActive && { backgroundColor: diff.color + '20', borderColor: diff.color }
                  ]}
                  onPress={() => setDifficulty(diff.label)}
                >
                  <MaterialCommunityIcons
                    name={diff.icon}
                    size={24}
                    color={isActive ? diff.color : '#888'}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.optionLabel, isActive && { color: diff.color, fontWeight: '700' }]}>
                    {diff.label}
                  </Text>
                  {isActive && <View style={[styles.activeDot, { backgroundColor: diff.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Question Type */}
        <View style={styles.card}>
          <SectionHeader title="Question Type" icon="document-text" />
          <View style={styles.listColumn}>
            {questionTypes.map((type) => {
              const isActive = questionType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  activeOpacity={0.7}
                  style={[
                    styles.typeRow,
                    isActive && styles.typeRowActive
                  ]}
                  onPress={() => setQuestionType(type.value)}
                >
                  <View style={[styles.iconCircle, isActive && { backgroundColor: '#3F51B5' }]}>
                    <MaterialCommunityIcons name={type.icon} size={20} color={isActive ? '#FFF' : '#666'} />
                  </View>
                  <Text style={[styles.typeText, isActive && styles.typeTextActive]}>{type.label}</Text>

                  {isActive && (
                    <Ionicons name="checkmark-circle" size={22} color="#3F51B5" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Configurations Row */}
        <View style={styles.dualRow}>
          {/* Duration */}
          <View style={[styles.card, { flex: 1, marginRight: 8 }]}>
            <SectionHeader title="Duration" icon="time" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter minutes"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
              maxLength={3}
            />
            <Text style={styles.inputHint}>minutes</Text>
          </View>

          {/* Count */}
          <View style={[styles.card, { flex: 1, marginLeft: 8 }]}>
            <SectionHeader title="Questions" icon="list" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={numQuestions}
              onChangeText={setNumQuestions}
              maxLength={3}
            />
            <Text style={styles.inputHint}>questions</Text>
          </View>
        </View>

        {/* Topics */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="pricetags" size={18} color="#555" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Topics</Text>
            <Text style={styles.subtitle}>({includeTopics.length} selected)</Text>
          </View>

          <View style={styles.topicsGrid}>
            {topicsLoading ? (
              <View style={styles.topicsLoadingState}>
                <Text style={styles.topicsLoadingText}>Loading available topics...</Text>
              </View>
            ) : topicsError ? (
              <View style={styles.topicsErrorState}>
                <Text style={styles.topicsErrorText}>{topicsError}</Text>
                <TouchableOpacity style={styles.topicsRetryButton} onPress={handleRetryTopics}>
                  <Text style={styles.topicsRetryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : topics.length === 0 ? (
              <View style={styles.topicsLoadingState}>
                <Text style={styles.topicsLoadingText}>No topics available for this subject.</Text>
              </View>
            ) : (
              topics.map((topic) => {
                const topicName = typeof topic === 'string' ? topic : topic.name;
                const topicCount = typeof topic === 'string' ? null : topic.questionCount;
                const isSelected = includeTopics.includes(topicName);
                return (
                  <TouchableOpacity
                    key={topicName}
                    activeOpacity={0.7}
                    style={[styles.topicPill, isSelected && styles.topicPillActive]}
                    onPress={() => handleTopicToggle(topicName)}
                  >
                    <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>{topicName}</Text>
                    {typeof topicCount === 'number' && (
                      <Text style={[styles.topicCountText, isSelected && styles.topicCountTextActive]}>
                        {topicCount}
                      </Text>
                    )}
                    {isSelected && <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#2d2d2d', '#444']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryTitle}>Exam Overview</Text>
              <Text style={styles.summarySub}>
                {difficulty} • {duration} min • {numQuestions} Qs • {includeTopics.length} Topics
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleStartExam}
              style={[styles.startBtn, includeTopics.length === 0 && { opacity: 0.6 }]}
            >
              <Text style={styles.startBtnText}>Start Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#2d2d2d" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      <Modal
        visible={isGenerating}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../animations/scan document.json')}
                autoPlay
                loop={true}
                style={styles.lottieAnim}
              />
            </View>
            <Text style={styles.loadingText}>Setting up exams and generating questions...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
    shadowColor: '#062171',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  lottieAnim: {
    width: 240,
    height: 180,
    marginBottom: 12,
  },
  lottieContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 22,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  headerContainer: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#062171',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: verticalScale(12),
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#062171',
  },
  safeAreaHeader: {
    //
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(6),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(17),
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.3,
  },


  // Content
  scrollContent: {
    paddingTop: verticalScale(20),
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(40),
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: scale(16),
    marginBottom: verticalScale(14),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtitle: {
    fontSize: moderateScale(12),
    color: '#888',
    fontWeight: '500',
    marginLeft: 6,
  },

  // Complexity Grid
  rowGrid: {
    flexDirection: 'row',
    gap: scale(12),
  },
  difficultyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#555',
    marginTop: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },

  // Question Type List
  listColumn: {
    gap: verticalScale(12),
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  typeRowActive: {
    backgroundColor: '#EEF1FB',
    borderColor: '#062171',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#374151',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#062171',
    fontWeight: '700',
  },

  // Dual Row
  dualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(14),
    gap: scale(8),
  },
  inputField: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: moderateScale(15),
    fontWeight: '500',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: moderateScale(11),
    color: '#999',
    fontWeight: '500',
    textAlign: 'left',
  },

  // Topics Grid
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicsLoadingState: {
    width: '100%',
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicsLoadingText: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    fontWeight: '500',
  },
  topicsErrorState: {
    width: '100%',
    paddingVertical: verticalScale(12),
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
  },
  topicsErrorText: {
    fontSize: moderateScale(13),
    color: '#B42318',
    fontWeight: '500',
    lineHeight: 20,
  },
  topicsRetryButton: {
    backgroundColor: '#062171',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  topicsRetryButtonText: {
    color: '#FFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  topicPillActive: {
    backgroundColor: '#062171',
    borderColor: '#062171',
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  topicTextActive: {
    color: '#FFF',
  },
  topicCountText: {
    marginLeft: 8,
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  topicCountTextActive: {
    color: '#062171',
    backgroundColor: '#DCE4FF',
  },

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: verticalScale(12),
    shadowColor: '#062171',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  summaryGradient: {
    padding: scale(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#062171',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  summarySub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  startBtnText: {
    color: '#062171',
    fontWeight: '700',
    fontSize: moderateScale(13),
    letterSpacing: 0.3,
  },
});

export default CustomExamSetup;
