import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verticalScale, moderateScale, scale } from '../utils/scaling';

// Subject data mapping
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

const CustomExamSetup = () => {
  const router = useRouter();
  const { subjectId, level } = useLocalSearchParams();

  const subjectIdNum = subjectId ? parseInt(subjectId) : 1;
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];

  // State for exam configuration
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('Mixed');
  const [duration, setDuration] = useState('45');
  const [numQuestions, setNumQuestions] = useState('20');
  const [includeTopics, setIncludeTopics] = useState([]);

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionTypes = ['MCQs (Paper 1)', 'Structural (Paper 2)', 'Mixed'];
  const durations = ['15', '30', '45', '60', '90'];
  const questionCounts = ['10', '15', '20', '25', '30'];

  // Sample topics for the subject
  const topics = [
    'Algebra',
    'Geometry',
    'Calculus',
    'Trigonometry',
    'Statistics',
    'Probability',
  ];

  const handleTopicToggle = (topic) => {
    setIncludeTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleStartExam = () => {
    if (includeTopics.length === 0) {
      Alert.alert('Select Topics', 'Please select at least one topic for the custom exam.');
      return;
    }

    // Navigate to exam with configuration
    router.push({
      pathname: '/ExamMode',
      params: {
        subjectCode: subject.title.toLowerCase().replace(' ', ''),
        level: level || 'Ordinary Level',
        examType: 'custom',
        difficulty,
        questionType,
        duration: parseInt(duration),
        numQuestions: parseInt(numQuestions),
        topics: includeTopics.join(','),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: subject.headerColor }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#2d2d2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom {subject.title} Exam</Text>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Difficulty Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty Level</Text>
            <View style={styles.optionsGrid}>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.optionButton,
                    difficulty === diff && styles.optionButtonActive,
                  ]}
                  onPress={() => setDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      difficulty === diff && styles.optionButtonTextActive,
                    ]}
                  >
                    {diff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question Type</Text>
            <View style={styles.optionsColumn}>
              {questionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionRow,
                    questionType === type && styles.optionRowActive,
                  ]}
                  onPress={() => setQuestionType(type)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      questionType === type && styles.checkboxActive,
                    ]}
                  >
                    {questionType === type && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.optionRowText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration (minutes)</Text>
            <View style={styles.optionsGrid}>
              {durations.map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.optionButton,
                    duration === dur && styles.optionButtonActive,
                  ]}
                  onPress={() => setDuration(dur)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      duration === dur && styles.optionButtonTextActive,
                    ]}
                  >
                    {dur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number of Questions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Questions</Text>
            <View style={styles.optionsGrid}>
              {questionCounts.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.optionButton,
                    numQuestions === count && styles.optionButtonActive,
                  ]}
                  onPress={() => setNumQuestions(count)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      numQuestions === count && styles.optionButtonTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Topics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Topics</Text>
            <View style={styles.topicsContainer}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic}
                  style={[
                    styles.topicChip,
                    includeTopics.includes(topic) && styles.topicChipActive,
                  ]}
                  onPress={() => handleTopicToggle(topic)}
                >
                  <Text
                    style={[
                      styles.topicChipText,
                      includeTopics.includes(topic) && styles.topicChipTextActive,
                    ]}
                  >
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Exam Summary</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subject:</Text>
                <Text style={styles.summaryValue}>{subject.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Difficulty:</Text>
                <Text style={styles.summaryValue}>{difficulty}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type:</Text>
                <Text style={styles.summaryValue}>{questionType}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{duration} min</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Questions:</Text>
                <Text style={styles.summaryValue}>{numQuestions}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Topics:</Text>
                <Text style={styles.summaryValue}>{includeTopics.length}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.startButton} onPress={handleStartExam}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Start Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(16),
    gap: moderateScale(12),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2d2d2d',
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(20),
    gap: verticalScale(24),
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: verticalScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  optionButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#2d2d2d',
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  optionsColumn: {
    gap: verticalScale(10),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  optionRowActive: {
    backgroundColor: '#f0f0ff',
    borderColor: '#3F51B5',
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  checkboxActive: {
    backgroundColor: '#3F51B5',
    borderColor: '#3F51B5',
  },
  optionRowText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#2d2d2d',
    flex: 1,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  topicChip: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: '#3F51B5',
    backgroundColor: '#f5f5f5',
  },
  topicChipActive: {
    backgroundColor: '#3F51B5',
  },
  topicChipText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#3F51B5',
  },
  topicChipTextActive: {
    color: '#fff',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: verticalScale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryContent: {
    gap: verticalScale(10),
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#666',
  },
  summaryValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#3F51B5',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: verticalScale(24),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#2d2d2d',
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  startButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#fff',
  },
});

export default CustomExamSetup;
