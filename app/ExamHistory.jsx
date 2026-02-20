import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import { getAllCustomExams, deleteCustomExam, getCustomExamById } from '../utils/examStorage';
import ExamHistoryCard from '../components/ExamHistoryCard';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Add this dependency

const SUBJECTS_DATA = {
  1: { title: 'Mathematics', colors: ['#ffb380', '#FF8C42'] },
  2: { title: 'Biology', colors: ['#90EE90', '#32CD32'] },
  3: { title: 'Chemistry', colors: ['#FFD700', '#FFA500'] },
  4: { title: 'Physics', colors: ['#87CEEB', '#00BFFF'] },
  5: { title: 'Computer Science', colors: ['#DDA0DD', '#BA55D3'] },
  6: { title: 'Math Stats', colors: ['#F0E68C', '#DAA520'] },
  7: { title: 'Geography', colors: ['#98D8C8', '#20B2AA'] },
  8: { title: 'Further Math', colors: ['#FFA07A', '#FF7F50'] },
};

// OPTIMIZATION: Store exam data in AsyncStorage instead of URL params
const TEMP_EXAM_KEY = '@temp_exam_data';

const ExamHistory = () => {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const focusExamId = localParams?.focusExamId;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const [headerOpacityAnim] = useState(new Animated.Value(0));
  const [headerTranslateYAnim] = useState(new Animated.Value(-30));
  const [contentOpacityAnim] = useState(new Animated.Value(0));
  const [contentTranslateYAnim] = useState(new Animated.Value(50));

  useFocusEffect(
    useCallback(() => {
      loadExams();
    }, [])
  );

  useEffect(() => {
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
      const allExams = await getAllCustomExams();
      setExams(allExams);
    } catch (error) {
      console.error('Error loading exams:', error);
      Alert.alert('Error', 'Failed to load exam history');
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

  // OPTIMIZATION: Store exam data temporarily instead of passing via URL
  const handleOpenExam = async (examId) => {
    try {
      const exam = await getCustomExamById(examId);
      if (!exam) {
        Alert.alert('Error', 'Exam not found');
        return;
      }

      // Validate exam data
      if (!exam.questions || !Array.isArray(exam.questions) || exam.questions.length === 0) {
        Alert.alert('Error', 'No questions found in this exam');
        return;
      }

      // Ensure required fields
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

      // OPTIMIZATION: Store in AsyncStorage instead of URL params
      // This prevents URL size limits and improves navigation performance
      await AsyncStorage.setItem(TEMP_EXAM_KEY, JSON.stringify(safeExam));

      // Navigate based on question type
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
            // Signal to load from AsyncStorage
            useStoredData: 'true',
          },
        });
      } else {
        // OPTIMIZED: Pass minimal params, let PaperExamSheet load from AsyncStorage
        router.push({
          pathname: '/PaperExamSheet',
          params: {
            examId: safeExam.id,
            // Signal to load from AsyncStorage instead of URL params
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={styles.loadingText}>Loading exam history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Custom Exams</Text>
              <Text style={styles.headerSubtitle}>{exams.length} exams</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/CustomExamSetup')}
              style={styles.addButton}
            >
              <Ionicons name="add" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

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
        {exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Custom Exams Yet</Text>
            <Text style={styles.emptyText}>
              Create your first custom exam to start building your study history
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/CustomExamSetup')}
            >
              <Text style={styles.createButtonText}>Create First Exam</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Saved', value: 'saved' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'In Progress', value: 'in-progress' },
                ].map(filterOption => (
                  <TouchableOpacity
                    key={filterOption.value}
                    onPress={() => setFilter(filterOption.value)}
                    style={[
                      styles.filterTab,
                      filter === filterOption.value && styles.filterTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        filter === filterOption.value && styles.filterTabTextActive,
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
    backgroundColor: '#F7F7F9',
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  filterContainer: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  filterTabActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  filterTabText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#555',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    paddingBottom: verticalScale(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(60),
  },
  emptyTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3F51B5',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },
});

export default ExamHistory;