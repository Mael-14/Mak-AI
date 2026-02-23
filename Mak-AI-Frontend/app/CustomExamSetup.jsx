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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
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

  const durations = ['15', '30', '45', '60', '90'];
  const questionCounts = ['5', '10', '15', '20', '25', '30'];

  // Subject-specific topics
  const getTopicsBySubject = () => {
    const topicMap = {
      1: ['Algebra', 'Geometry', 'Calculus', 'Trigonometry', 'Statistics', 'Probability', 'Vectors', 'Matrices', 'Functions', 'Logarithms', 'Sequences'], // Mathematics
      2: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Physiology', 'Biochemistry', 'Anatomy', 'Microbiology', 'Botany', 'Zoology'], // Biology
      3: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Thermodynamics', 'Equilibrium', 'Redox', 'Kinetics', 'Electrochemistry', 'Periodicity'], // Chemistry
      4: ['Mechanics', 'Thermodynamics', 'Waves', 'Electricity', 'Magnetism', 'Optics', 'Modern Physics', 'Nuclear Physics', 'Relativity'], // Physics
      5: ['Programming', 'Data Structures', 'Algorithms', 'Databases', 'Networks', 'Web Development', 'Security', 'Cloud Computing', 'AI/ML'], // Computer Science
      6: ['Statistics', 'Probability', 'Distributions', 'Hypothesis Testing', 'Regression', 'Correlation', 'Sampling', 'Inference'], // Math Stats
      7: ['Physical Geography', 'Human Geography', 'Climatology', 'Geomorphology', 'Biogeography', 'Urban Geography', 'Development', 'Resources'], // Geography
      8: ['Complex Numbers', 'Matrices', 'Differential Equations', 'Numerical Methods', 'Optimization', 'Linear Programming', 'Calculus', 'Sequences'], // Further Math
    };

    return topicMap[subjectIdNum] || [];
  };

  const topics = getTopicsBySubject();

  const handleTopicToggle = (topic) => {
    setIncludeTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
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
        'https://boyz.app.n8n.cloud/webhook-test/exam/generate',
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
        <LinearGradient
          colors={subject.colors || ['#ccc', '#aaa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeAreaHeader}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{subject.title} Custom Exam</Text>
              <View style={{ width: 40 }} />

              {/* Large Floating Icon/Badge
            <View style={styles.floatingIcon}>
               <Image source={subject.image} style={styles.floatingImage} resizeMode="contain" />
            </View> */}
            </View>


          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }]
        }}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {durations.map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[styles.chip, duration === dur && styles.chipActive]}
                  onPress={() => setDuration(dur)}
                >
                  <Text style={[styles.chipText, duration === dur && styles.chipTextActive]}>{dur}m</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Count */}
          <View style={[styles.card, { flex: 1, marginLeft: 8 }]}>
            <SectionHeader title="Questions" icon="list" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {questionCounts.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.chip, numQuestions === count && styles.chipActive]}
                  onPress={() => setNumQuestions(count)}
                >
                  <Text style={[styles.chipText, numQuestions === count && styles.chipTextActive]}>{count}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            {topics.map((topic) => {
              const isSelected = includeTopics.includes(topic);
              return (
                <TouchableOpacity
                  key={topic}
                  activeOpacity={0.7}
                  style={[styles.topicPill, isSelected && styles.topicPillActive]}
                  onPress={() => handleTopicToggle(topic)}
                >
                  <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>{topic}</Text>
                  {isSelected && <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              );
            })}
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
      </Animated.ScrollView>

      <Modal
        visible={isGenerating}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.lottieContainer}>
              <LottieView
                source={require('../animations/ai_animation_flow_1.json')}
                autoPlay
                loop
                resizeMode="contain"
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  lottieAnim: {
    width: width * 0.6,
    height: width * 0.6,
  },
  lottieContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 300,
  },
  loadingText: {
    marginTop: 20,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#3F51B5',
    textAlign: 'center',
    lineHeight: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  headerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'visible',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: verticalScale(40),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  safeAreaHeader: {
    //
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  floatingIcon: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  floatingImage: {
    width: 50,
    height: 50,
  },

  // Content
  scrollContent: {
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    gap: scale(10),
  },
  difficultyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    backgroundColor: '#F9F9F9',
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
    gap: verticalScale(10),
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  typeRowActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3F51B5',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#444',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#3F51B5',
    fontWeight: '700',
  },

  // Dual Row
  dualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(0),
  },
  chipScroll: {
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  chipActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  chipTextActive: {
    color: '#FFF',
  },

  // Topics Grid
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  topicPillActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  topicTextActive: {
    color: '#FFF',
  },

  // Summary Card
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: verticalScale(10),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  summaryGradient: {
    padding: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryDetails: {
    flex: 1,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySub: {
    color: '#BBB',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  startBtnText: {
    color: '#2d2d2d',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
});

export default CustomExamSetup;
