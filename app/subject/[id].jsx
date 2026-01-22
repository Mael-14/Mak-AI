import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Subject data mapping - matches the subjects from home screen
const SUBJECTS_DATA = {
  1: {
    id: 1,
    title: 'Mathematics',
    image: require('../../assets/Maths.png'),
    headerColor: '#ffb380',
  },
  2: {
    id: 2,
    title: 'Biology',
    image: require('../../assets/Biology.png'),
    headerColor: '#90EE90',
  },
  3: {
    id: 3,
    title: 'Chemistry',
    image: require('../../assets/Chemistry.png'),
    headerColor: '#FFD700',
  },
  4: {
    id: 4,
    title: 'Physics',
    image: require('../../assets/Physics.png'),
    headerColor: '#87CEEB',
  },
  5: {
    id: 5,
    title: 'Computer Science',
    image: require('../../assets/Computer science.png'),
    headerColor: '#DDA0DD',
  },
  6: {
    id: 6,
    title: 'Math Stats',
    image: require('../../assets/Math Statistic.png'),
    headerColor: '#F0E68C',
  },
  7: {
    id: 7,
    title: 'Geography',
    image: require('../../assets/Geography.png'),
    headerColor: '#98D8C8',
  },
  8: {
    id: 8,
    title: 'Further Math',
    image: require('../../assets/FurtherMath.png'),
    headerColor: '#FFA07A',
  },
};

const SubjectScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Get subject data based on ID
  const subjectId = parseInt(id);
  const subject = SUBJECTS_DATA[subjectId];

  // If subject not found, show error or default
  if (!subject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subject not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const QuestionMode = [
    { id: 1, name: 'All', icon: (<Ionicons name="grid-outline" size={15} color="black" />), color: '#fff' },
    { id: 2, name: 'Junes', icon: '📚', color: '#fff' },
    { id: 3, name: 'Topics', icon: '📐', color: '#fff' },
    { id: 4, name: 'Customs exam', icon: (<Ionicons name="sparkles-outline" size={18} color="#a35dafff" />), color: '#fff' },
  ];

  const courses = [
    {
      id: 1,
      title: 'GCE Advance Level Passed June Questions',
      subtitle: 'Past Papers ,Answers Analysis for All Subjects',
      students: [
        'https://i.pravatar.cc/150?img=1',
        'https://i.pravatar.cc/150?img=2',
        'https://i.pravatar.cc/150?img=3',
      ],
      additionalCount: 3,
      backgroundColor: '#2d2d2d',
      icon: (<Ionicons name="document-text-outline" size={24} color="#e4e6e9ff" />),
    },
    {
      id: 2,
      title: 'GCE Advance Level Questions per Topics',
      subtitle: 'Past quetions , Sorted per Topics ',
      students: [
        'https://i.pravatar.cc/150?img=4',
        'https://i.pravatar.cc/150?img=5',
        'https://i.pravatar.cc/150?img=6',
      ],
      additionalCount: 12,
      backgroundColor: '#b8b8f0',
      icon: (<Ionicons name="document-text-outline" size={24} color="#2C3E50" />),
    },
    {
      id: 3,
      title: 'GCE Advance Level AI Generated Custom Questions',
      subtitle: 'An AI Shuffles And Generate Questions on Demand ',
      students: [
        'https://i.pravatar.cc/150?img=4',
        'https://i.pravatar.cc/150?img=5',
        'https://i.pravatar.cc/150?img=6',
      ],
      additionalCount: 12,
      backgroundColor: '#b7b7c3ff',
      icon: (<Ionicons name="document-text-outline" size={24} color="#2C3E50" />),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={[styles.headerSection, { backgroundColor: subject.headerColor }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          {/* Subject Image */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={subject.image} 
              style={styles.illustrationImage} 
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle}>{subject.title}{'\n'}course</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <View style={styles.dotIcon} />
              <Text style={styles.statText}>10 Junes</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeLight]}>
              <Text style={styles.statIcon}>👤</Text>
              <Text style={styles.statText}>40 Topics</Text>
            </View>
          </View>
        </View>

        {/* question mode Tabs */}
        <View style={styles.QuestionModeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QuestionMode.map((questionMode) => (
              <TouchableOpacity
                key={questionMode.id}
                style={styles.questionModeTab}
                onPress={() => {
                  if (questionMode.name === 'Junes') {
                    router.push({
                      pathname: '/JunesModeScreen',
                      params: { subjectId: subjectId, subjectName: subject.title }
                    });
                  } else if (questionMode.name === 'Topics') {
                    router.push({
                      pathname: '/TopicsModeScreen',
                      params: { subjectId: subjectId, subjectName: subject.title }
                    });
                  } else if (questionMode.name === 'Customs exam') {
                    router.push({
                      pathname: '/CustomsExamScreen',
                      params: { subjectId: subjectId, subjectName: subject.title }
                    });
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

        {/* topic Cards */}
        <View style={styles.coursesContainer}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: course.backgroundColor },
              ]}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseIconContainer}>
                  <Text style={styles.courseIcon}>{course.icon}</Text>
                </View>
                
                <TouchableOpacity style={styles.bookmarkButton}>
                  <Text style={styles.bookmarkIcon}>🔖</Text>
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.courseTitle,
                  course.backgroundColor === '#2d2d2d' && styles.courseTitleDark,
                ]}
              >
                {course.title}
              </Text>

              <Text style={styles.courseSubtitle}>{course.subtitle}</Text>
              
              <View style={styles.courseFooter}>
                <View style={styles.studentsContainer}>
                  {course.students.slice(0, 3).map((student, index) => (
                    <Image
                      key={index}
                      source={{ uri: student }}
                      style={[
                        styles.studentAvatar,
                        index > 0 && { marginLeft: -8 },
                      ]}
                    />
                  ))}
                  <Text
                    style={[
                      styles.additionalCount,
                      course.backgroundColor === '#2d2d2d' &&
                        styles.additionalCountDark,
                    ]}
                  >
                    +{course.additionalCount}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.arrowButton,
                    course.backgroundColor === '#2d2d2d' &&
                      styles.arrowButtonDark,
                  ]}
                >
                  <Text
                    style={[
                      styles.arrowIcon,
                      course.backgroundColor === '#2d2d2d' &&
                        styles.arrowIconDark,
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={15} color="black" style={styles.navButtonText} />
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
    right: 20,
    top: 50,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2d2d2d',
    marginBottom: 20,
    lineHeight: 42,
  },
  statsContainer: {
    flexDirection: 'row',
    top: 15,
    gap: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  statBadgeLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    color: '#ffffffff',
    fontSize: 12,
    fontWeight: '600',
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
  coursesContainer: {
    padding: 20,
    gap: 16,
  },
  courseCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 180,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIcon: {
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
  courseTitleDark: {
    color: '#fff',
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  additionalCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
    marginLeft: 8,
  },
  additionalCountDark: {
    color: '#fff',
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDark: {
    backgroundColor: '#fff',
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  arrowIconDark: {
    color: '#2d2d2d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default SubjectScreen;

