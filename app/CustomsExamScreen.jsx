import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TestSetupAlert from '../components/TestAlert';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

// Dummy data for passed custom exams/sessions
const customExamHistory = [
  {
    id: 1,
    title: 'Custom Exam - 2025-12-01',
    subtitle: 'Difficulty: Hard | Mixed questionModes | MCQs | 60 min',
    students: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
    ],
    additionalCount: 3,
    backgroundColor: '#b7b7c3ff',
    icon: '📝',
  },
  {
    id: 2,
    title: 'Custom Exam - 2025-11-15',
    subtitle: 'Difficulty: Medium | Math | Structural | 45 min',
    students: [
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
    ],
    additionalCount: 12,
    backgroundColor: '#b7b7c3ff',
    icon: '📝',
  },
];

const CustomsExamScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { subjectId, subjectName } = useLocalSearchParams();
  
  // Get subject data based on ID
  const subjectIdNum = subjectId ? parseInt(subjectId) : 1; // Default to Mathematics if no ID
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];
  
  const [showAlert, setShowAlert] = useState(false);
  const [showTestSetup, setShowTestSetup] = useState(false);

  // QuestionMode tabs as in Ss.jsx
  const QuestionMode = [
    { id: 1, name: 'All', icon: (<Ionicons name="grid-outline" size={15} color="black" />), color: '#fff' },
    { id: 2, name: 'Junes', icon: '📚', color: '#fff' },
    { id: 3, name: 'Topics', icon: '📐', color: '#fff' },
    { id: 4, name: 'Customs exam', icon: (<Ionicons name="sparkles-outline" size={18} color="#a35dafff" />), color: '#fff' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: subject.headerColor }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.illustrationContainer}>
            <Image source={subject.image} style={styles.illustrationImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>{subject.title}{"\n"}course</Text>
          {/* Custom Exam Button */}
          <TouchableOpacity style={styles.customExamButton} onPress={() => setShowTestSetup(true)}>
            <Ionicons name="sparkles-outline" size={18} color="#a35dafff" />

            <Text style={styles.customExamButtonText}>Start Custom Exam</Text>
          </TouchableOpacity>

          <TestSetupAlert
        visible={showTestSetup}
        onClose={() => setShowTestSetup(false)}
        onStart={(config) => {
          setShowTestSetup(false);

          // Send config to test screen
          navigation.navigate('TestScreen', config);
        }}
      />
        </View>

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
                          pathname: '/SelectedCourseScreen',
                          params: { userId: 42 }
                       })
                    // navigation.navigate('Ss');
                  } else if (questionMode.name === 'Junes') {
                    router.push({
                          pathname: '/JunesModeScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title }
                       })
                  } else if (questionMode.name === 'Topics') {
                    router.push({
                          pathname: '/TopicsModeScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title }
                       })
                  } else if (questionMode.name === 'Customs exam') {
                    // Already on CustomsExamScreen, do nothing or scroll to top
                  } else {
                    // Handle other modes if needed
                  }
                }}
              >
                <Text style={styles.questionModeIcon}>{questionMode.icon}</Text>
                <Text style={styles.questionModeName}>{questionMode.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Card Section for Custom Exam History */}
        <View style={styles.coursesContainer}>
          {customExamHistory.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={[styles.courseCard, { backgroundColor: exam.backgroundColor }]}
            >
              <View style={styles.courseHeader}>
                <View style={{flexDirection:'column'}}>
                    <Text style={styles.courseTitle}>{exam.title}</Text>
                    <Text style={styles.courseSubtitle}>{exam.subtitle}</Text>
                </View>
                
                <TouchableOpacity style={styles.retryButton}>
                  <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              
              
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Alert Modal */}
        {/* <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Custom Exam Settings</Text>
              {/* Difficulty Selection */}
              {/* <Text style={styles.modalLabel}>Select Difficulty:</Text>
              <View style={styles.modalRow}>
                <TouchableOpacity style={styles.modalOption}><Text>Easy</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>Medium</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>Hard</Text></TouchableOpacity>
              </View>
              {/* questionMode Selection */}
              {/* <Text style={styles.modalLabel}>Choose questionMode:</Text>
              <View style={styles.modalRow}>
                <TouchableOpacity style={styles.modalOption}><Text>Math</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>Physics</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>Mixed Up</Text></TouchableOpacity>
              </View>
              {/* Test Duration */}
              {/* <Text style={styles.modalLabel}>Set Test Duration (minutes):</Text>
              <View style={styles.modalRow}>
                <TouchableOpacity style={styles.modalOption}><Text>30</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>45</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>60</Text></TouchableOpacity>
              </View> 
              {/* Question Type */}
              {/* <Text style={styles.modalLabel}>Question Type:</Text>
              <View style={styles.modalRow}> 
                <TouchableOpacity style={styles.modalOption}><Text>MCQs (Paper 1)</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalOption}><Text>Structural (Paper 2)</Text></TouchableOpacity>
              </View> */}
              {/* <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>   */}
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
  headerSection: {
    backgroundColor: '#ffb380',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    paddingTop: 10,
    position: 'relative',
    minHeight: 280,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 28,
    color: '#2d2d2d',
    fontWeight: '300',
  },
  illustrationContainer: {
    position: 'absolute',
    right: 0,
    top: 50,
    left: 180,
    width: 50,
    height: 50,
  },
  illustrationImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 20,
    lineHeight: 42,
  },
  customExamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  customExamButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  coursesContainer: {
    padding: 20,
    gap: 8,
  },
  courseCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    //minHeight: 180,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //marginBottom: 12,
  },
  courseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIcon: {
    fontSize: 20,
  },
  retryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryIcon: {
    fontSize: 16,
  },
  courseSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    marginBottom: 4,
    letterSpacing: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 5,
    lineHeight: 24,
  },
 

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalOption: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalCloseButton: {
    backgroundColor: '#2d2d2d',
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  QuestionModeContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionModeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 10,
    gap: 8,
  },
  questionModeIcon: {
    fontSize: 18,
  },
  questionModeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2d2d2d',
  },
});

export default CustomsExamScreen;
