import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import { getAllCustomExams, deleteCustomExam, getCustomExamById } from '../utils/examStorage';
import ExamHistoryCard from '../components/ExamHistoryCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { examAPI } from '../services/api';

// Subject data mapping - matches the subjects from home screen
const SUBJECTS_DATA = {
  1: {
    id: 1,
    title: 'Mathematics',
    image: require('../assets/Maths.png'),
    headerColor: '#ffb380',
  },
  2: {
    id: 2,
    title: 'Biology',
    image: require('../assets/Biology.png'),
    headerColor: '#90EE90',
  },
  3: {
    id: 3,
    title: 'Chemistry',
    image: require('../assets/Chemistry.png'),
    headerColor: '#FFD700',
  },
  4: {
    id: 4,
    title: 'Physics',
    image: require('../assets/Physics.png'),
    headerColor: '#87CEEB',
  },
  5: {
    id: 5,
    title: 'Computer Science',
    image: require('../assets/Computer science.png'),
    headerColor: '#DDA0DD',
  },
  6: {
    id: 6,
    title: 'Math Stats',
    image: require('../assets/Math Statistic.png'),
    headerColor: '#F0E68C',
  },
  7: {
    id: 7,
    title: 'Geography',
    image: require('../assets/Geography.png'),
    headerColor: '#98D8C8',
  },
  8: {
    id: 8,
    title: 'Further Math',
    image: require('../assets/FurtherMath.png'),
    headerColor: '#FFA07A',
  },
};

// Gradient colors for each subject
const GRADIENT_COLORS = {
  1: ['#ffc7a2', '#ff8335'],
  2: ['#acfdac', '#1fb41f'],
  3: ['#9ea0ce', '#40416f'],
  4: ['#9adcf6', '#3184a0'],
  5: ['#f0abf0', '#a137bc'],
  6: ['#F0E68C', '#DAA520'],
  7: ['#adf0f0', '#1e827d'],
  8: ['#dcdcdc', '#424242'],
};

const TEMP_EXAM_KEY = '@temp_exam_data';

const CustomsExamScreen = () => {
  const router = useRouter();
  const { subjectId, subjectName, level } = useLocalSearchParams();
  const { userData, isAuthenticated } = useAuth();

  const subjectIdNum = subjectId ? parseInt(subjectId) : 1;
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];
  const selectedLevel = level || 'Ordinary Level';
  const gradientColors = GRADIENT_COLORS[subjectIdNum] || GRADIENT_COLORS[1];

  // State
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // Animation refs
  const [headerOpacityAnim] = useState(new Animated.Value(0));
  const [headerTranslateYAnim] = useState(new Animated.Value(-30));
  const [contentOpacityAnim] = useState(new Animated.Value(0));
  const [contentTranslateYAnim] = useState(new Animated.Value(50));

  // Load exams when screen is focused or user authentication state changes
  useFocusEffect(
    useCallback(() => {
      loadExams();
    }, [subjectIdNum, userData?.uid, isAuthenticated])
  );

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(headerOpacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateYAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateYAnim, {
          toValue: 0,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated and has userData
      if (!isAuthenticated || !userData?.uid) {
        console.log('User not authenticated, falling back to local storage');
        // Fallback to local storage if user is not authenticated
        const allExams = await getAllCustomExams();
        const subjectExams = allExams.filter(exam => exam.subjectId === subjectIdNum);
        setExams(subjectExams);
        return;
      }

      try {
        // Fetch user-specific custom exams from database by subject
        const response = await examAPI.getUserCustomExamsBySubject(userData.uid, subjectIdNum);

        if (response.success) {
          setExams(response.data || []);
        } else {
          console.error('Failed to fetch custom exams:', response.error);
          // Fallback to local storage on API failure
          const allExams = await getAllCustomExams();
          const subjectExams = allExams.filter(exam => exam.subjectId === subjectIdNum);
          setExams(subjectExams);
        }
      } catch (apiError) {
        console.error('API error loading custom exams:', apiError);
        // Fallback to local storage on API error
        const allExams = await getAllCustomExams();
        const subjectExams = allExams.filter(exam => exam.subjectId === subjectIdNum);
        setExams(subjectExams);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('Error', 'Failed to load exam history');
      setExams([]); // Set empty array on complete failure
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadExams();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // For now, we'll only handle local storage deletion
              // Database deletion would require a new API endpoint
              await deleteCustomExam(examId);
              setExams(exams.filter(e => e.id !== examId));
              Alert.alert('Success', 'Exam deleted from history');
            } catch (error) {
              console.error('Error deleting exam:', error);
              Alert.alert('Error', 'Failed to delete exam');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleOpenExam = async (examId) => {
    try {
      // First try to find the exam in the current exams state (which may be from database or local storage)
      let exam = exams.find(e => e.id === examId);

      // If not found in state, try local storage as fallback
      if (!exam) {
        exam = await getCustomExamById(examId);
      }

      if (!exam) {
        Alert.alert('Error', 'Exam not found');
        return;
      }

      if (!exam.questions || !Array.isArray(exam.questions) || exam.questions.length === 0) {
        Alert.alert('Error', 'No questions found in this exam');
        return;
      }

      const safeExam = {
        subject: exam.subject || 'Unknown Subject',
        subjectId: exam.subjectId || 1,
        level: exam.level || 'Ordinary Level',
        difficulty: exam.difficulty || 'Medium',
        duration: exam.duration || 45,
        questionType: exam.questionType || 'Mixed',
        numQuestions: exam.numQuestions || exam.questions.length,
        topics: Array.isArray(exam.topics) ? exam.topics : [],
        questions: exam.questions,
        id: exam.id,
        createdAt: exam.createdAt || new Date().toISOString(),
      };

      await AsyncStorage.setItem(TEMP_EXAM_KEY, JSON.stringify(safeExam));

      if (safeExam.questionType === 'MCQs (Paper 1)') {
        router.push({
          pathname: '/ExamMode',
          params: {
            subjectCode: safeExam.subject.toLowerCase().replace(' ', ''),
            level: safeExam.level,
            examType: 'custom',
            difficulty: safeExam.difficulty,
            questionType: safeExam.questionType,
            duration: safeExam.duration.toString(),
            numQuestions: safeExam.numQuestions.toString(),
            topics: safeExam.topics.join(','),
            examId: safeExam.id,
            useStoredData: 'true',
          },
        });
      } else {
        router.push({
          pathname: '/PaperExamSheet',
          params: {
            examId: safeExam.id,
            useStoredData: 'true',
          },
        });
      }
    } catch (error) {
      console.error('Error opening exam:', error);
      Alert.alert('Error', 'Failed to open exam: ' + (error.message || 'Unknown error'));
    }
  };

  const getFilteredExams = () => {
    let filtered = exams;
    if (filter !== 'all') {
      filtered = filtered.filter(exam => exam.status === filter);
    }
    return filtered;
  };

  const filteredExams = getFilteredExams();

  // QuestionMode tabs
  const QuestionMode = [
    { id: 1, name: 'All', icon: (<Ionicons name="grid-outline" size={15} color="black" />), color: '#fff' },
    { id: 2, name: 'Junes', icon: '📚', color: '#fff' },
    { id: 3, name: 'Topics', icon: '📐', color: '#fff' },
    { id: 4, name: 'Customs exam', icon: (<Ionicons name="sparkles-outline" size={18} color="#a35dafff" />), color: '#fff' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: headerOpacityAnim,
            transform: [{ translateY: headerTranslateYAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.illustrationContainer}>
              <Image source={subject.image} style={styles.illustrationImage} resizeMode="contain" />
            </View>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{subject.title}</Text>
              <Text style={styles.headerSubtitle}>{exams.length} custom exams</Text>
            </View>

            <TouchableOpacity
              style={styles.customExamButton}
              onPress={() => router.push({
                pathname: '/CustomExamSetup',
                params: {
                  subjectId: subjectIdNum.toString(),
                  subjectName: subject.title,
                  level: selectedLevel,
                },
              })}
            >
              <Ionicons name="sparkles-outline" size={18} color="#a35dafff" />
              <Text style={styles.customExamButtonText}>New Exam</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Question Mode Tabs */}
      <View style={styles.QuestionModeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {QuestionMode.map((questionMode) => (
            <TouchableOpacity
              key={questionMode.id}
              style={styles.questionModeTab}
              onPress={() => {
                if (questionMode.name === 'All') {
                  router.push({
                    pathname: '/subject/[id]',
                    params: { id: subjectIdNum.toString(), level: selectedLevel },
                  });
                } else if (questionMode.name === 'Junes') {
                  router.push({
                    pathname: '/JunesModeScreen',
                    params: { subjectId: subjectIdNum.toString(), subjectName: subject.title },
                  });
                } else if (questionMode.name === 'Topics') {
                  router.push({
                    pathname: '/TopicsModeScreen',
                    params: { subjectId: subjectIdNum.toString(), subjectName: subject.title },
                  });
                }
              }}
            >
              <Text style={styles.questionModeIcon}>{questionMode.icon}</Text>
              <Text style={styles.questionModeName}>{questionMode.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: contentOpacityAnim,
            transform: [{ translateY: contentTranslateYAnim }],
          },
        ]}
      >
        {loading && exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#3F51B5" />
            <Text style={styles.loadingText}>Loading exam history...</Text>
          </View>
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Custom Exams Yet</Text>
            <Text style={styles.emptyText}>
              Create your first custom exam to start building your study history
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push({
                pathname: '/CustomExamSetup',
                params: {
                  subjectId: subjectIdNum.toString(),
                  subjectName: subject.title,
                  level: selectedLevel,
                },
              })}
            >
              <Text style={styles.createButtonText}>Create First Exam</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Filter Section */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Saved', value: 'saved' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'In Progress', value: 'in-progress' },
                ].map(filterOption => (
                  <TouchableOpacity
                    key={filterOption.value}
                    style={[
                      styles.filterButton,
                      filter === filterOption.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilter(filterOption.value)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === filterOption.value && styles.filterTextActive,
                      ]}
                    >
                      {filterOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Exams List */}
            <FlatList
              data={filteredExams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ExamHistoryCard
                  exam={item}
                  onPress={() => handleOpenExam(item.id)}
                  onDelete={() => handleDeleteExam(item.id)}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyTitle}>No Exams Found</Text>
                  <Text style={styles.emptyText}>Try adjusting your filters</Text>
                </View>
              }
            />
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  headerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'visible',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerGradient: {
    paddingBottom: verticalScale(40),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSection: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  headerTextContainer: {
    marginBottom: verticalScale(20),
    marginTop: verticalScale(12),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  backIcon: {
    fontSize: 28,
    color: '#2d2d2d',
    fontWeight: '300',
  },
  illustrationContainer: {
    position: 'absolute',
    right: scale(20),
    top: verticalScale(30),
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: 'rgba(45, 45, 45, 0.7)',
    fontWeight: '500',
  },
  customExamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  customExamButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: scale(8),
    fontSize: moderateScale(12),
  },
  contentContainer: {
    flex: 1,
  },
  QuestionModeContainer: {
    backgroundColor: '#fff',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(12),
    marginTop: verticalScale(-20),
    marginHorizontal: scale(20),
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    //marginBottom: verticalScale(2),
  },
  questionModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(5),
    borderRadius: 12,
    marginRight: scale(10),
    gap: scale(8),
  },
  questionModeIcon: {
    fontSize: moderateScale(18),
  },
  questionModeName: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#2d2d2d',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: verticalScale(2),
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2d2d2d',
    borderColor: '#2d2d2d',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    paddingBottom: verticalScale(20),
  },
  emptyContainer: {
    flex: 1,
    top: verticalScale(-80),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    minHeight: verticalScale(400),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#333',
    marginTop: verticalScale(12),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: '#999',
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  createButton: {
    marginTop: verticalScale(24),
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    backgroundColor: '#191a1bff',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
});
export default CustomsExamScreen;
