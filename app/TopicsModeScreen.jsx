import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examAPI } from '../services/api';
import { getSubjectCode } from '../utils/subjectMapping';
import ModeSelectionModal from '../components/ModeSelectionModal';
import { LinearGradient } from 'expo-linear-gradient';
import { verticalScale, moderateScale, scale } from '../utils/scaling';

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

const TopicsModeScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { subjectId, subjectName, level } = useLocalSearchParams();
  
  // Get subject data based on ID
  const subjectIdNum = subjectId ? parseInt(subjectId) : 1; // Default to Mathematics if no ID
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];
  const selectedLevel = level || 'Ordinary Level'; // Default to Ordinary Level
  const gradientColors = GRADIENT_COLORS[subjectIdNum] || GRADIENT_COLORS[1];
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null); // null means all papers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedTopicPaper, setSelectedTopicPaper] = useState(null);

  // Animation refs
  const [headerOpacityAnim] = useState(new Animated.Value(0));
  const [headerTranslateYAnim] = useState(new Animated.Value(-30));
  const [contentOpacityAnim] = useState(new Animated.Value(0));
  const [contentTranslateYAnim] = useState(new Animated.Value(50));

  // Animation on mount
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
  
  // Fetch topics when component mounts or when paper selection changes
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await examAPI.getTopicsBySubjectId(
          subjectIdNum, 
          selectedLevel, 
          selectedPaper || undefined
        );
        if (response.success && response.data) {
          setTopics(response.data);
          // Extract unique papers from topics
          const papers = new Set();
          response.data.forEach(topic => {
            topic.papers.forEach(paper => papers.add(paper));
          });
          setAvailablePapers(Array.from(papers).sort());
        } else {
          setError(response.error || 'Failed to fetch topics');
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError(err.message || 'Failed to load topics');
      } finally {
        setLoading(false);
      }
    };
    
    if (subjectIdNum && selectedLevel) {
      fetchTopics();
    }
  }, [subjectIdNum, selectedLevel, selectedPaper]);
  // QuestionMode tabs as in JunesModeScreen.jsx
  const QuestionMode = [
    { id: 1, name: 'All', icon: (<Ionicons name="grid-outline" size={15} color="black" />), color: '#fff' },
    { id: 2, name: 'Junes', icon: '📚', color: '#fff' },
    { id: 3, name: 'Topics', icon: '📐', color: '#fff' },
    { id: 4, name: 'Customs exam', icon: (<Ionicons name="sparkles-outline" size={18} color="#a35dafff" />), color: '#fff' },
  ];

  const handleToggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleTopicPaperSelect = (topic, paper) => {
    setSelectedTopicPaper({ topic, paper });
    setShowModeModal(true);
  };

  const handleModeSelect = async (mode) => {
    if (!selectedTopicPaper) return;
    
    try {
      // Get subject code from subjectId
      const subjectCode = getSubjectCode(subjectIdNum, selectedLevel);
      
      if (!subjectCode) {
        Alert.alert('Error', 'Could not determine subject code');
        return;
      }

      const examTitle = `${selectedTopicPaper.topic.name} - ${selectedTopicPaper.paper}`;
      
      if (mode === 'revision') {
        router.push({
          pathname: '/RevisionMode',
          params: {
            subjectCode: subjectCode,
            examTitle: examTitle,
            topic: selectedTopicPaper.topic.name,
            paper: selectedTopicPaper.paper,
            subjectName: subject.title,
            level: selectedLevel
          }
        });
      } else if (mode === 'exam') {
        router.push({
          pathname: '/ExamMode',
          params: {
            subjectCode: subjectCode,
            examTitle: examTitle,
            level: selectedLevel,
            topic: selectedTopicPaper.topic.name
          }
        });
      }
    } catch (error) {
      console.error('Error navigating:', error);
      Alert.alert('Error', 'Failed to navigate. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Animated Header Section */}
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
                <Text style={styles.headerSubtitle}>{topics.length} Topics Available</Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statBadge}>
                  <View style={styles.dotIcon} />
                  <Text style={styles.statText}>{topics.length} Topics</Text>
                </View>
                <View style={[styles.statBadge, styles.statBadgeLight]}>
                  <Text style={styles.statIcon}>📚</Text>
                  <Text style={styles.statText}>{selectedLevel}</Text>
                </View>
              </View>
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
                          params: { id: subjectIdNum.toString(), level: selectedLevel }
                       })
                  } else if (questionMode.name === 'Junes') {
                    router.push({
                          pathname: '/JunesModeScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title, level: selectedLevel }
                       })
                  } else if (questionMode.name === 'Customs exam') {
                    router.push({
                          pathname: '/CustomsExamScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title, level: selectedLevel }
                       })
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

        {/* Paper Filter */}
        {availablePapers.length > 0 && (
          <View style={styles.paperFilterContainer}>
            <Text style={styles.paperFilterLabel}>Filter by Paper:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paperFilterScroll}>
              <TouchableOpacity
                style={[styles.paperFilterButton, !selectedPaper && styles.paperFilterButtonActive]}
                onPress={() => setSelectedPaper(null)}
              >
                <Text style={[styles.paperFilterText, !selectedPaper && styles.paperFilterTextActive]}>
                  All Papers
                </Text>
              </TouchableOpacity>
              {availablePapers.map((paper) => (
                <TouchableOpacity
                  key={paper}
                  style={[styles.paperFilterButton, selectedPaper === paper && styles.paperFilterButtonActive]}
                  onPress={() => setSelectedPaper(paper)}
                >
                  <Text style={[styles.paperFilterText, selectedPaper === paper && styles.paperFilterTextActive]}>
                    {paper}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Animated Content Section for Topics */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacityAnim,
              transform: [{ translateY: contentTranslateYAnim }],
            },
          ]}
        >
          <View style={styles.coursesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d2d2d" />
              <Text style={styles.loadingText}>Loading topics...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  examAPI.getTopicsBySubjectId(subjectIdNum, selectedLevel, selectedPaper || undefined)
                    .then(response => {
                      if (response.success && response.data) {
                        setTopics(response.data);
                      }
                    })
                    .catch(err => setError(err.message))
                    .finally(() => setLoading(false));
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : topics.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No topics available for this subject</Text>
            </View>
          ) : (
            topics.map((topic, index) => (
              <View key={`${topic.name}-${index}`} style={[styles.courseCard, { backgroundColor: '#b8b8f0' }]}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconContainer}>
                    <Ionicons name="document-text-outline" size={24} color="#171717ff" />
                  </View>

                  <View >
                    <Text style={styles.courseTitle}>{topic.name}</Text>
                    {topic.papers && topic.papers.length > 0 && (
                      <Text style={styles.courseSubtitle}>
                        Available in {topic.papers.length} paper{topic.papers.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity style={styles.bookmarkButton}>
                    <Text style={styles.bookmarkIcon}>🔖</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.courseFooter}>
                  <View style={styles.studentsContainer}>
                    <Text style={styles.additionalCount}>Questions: {topic.questionCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.arrowButton, openDropdown === topic.name && { transform: [{ rotate: '90deg' }] }]}
                    onPress={() => handleToggleDropdown(topic.name)}
                  >
                    <Ionicons name="chevron-forward" size={15} color="black" style={styles.navButtonText} />
                  </TouchableOpacity>
                </View>
                {/* Dropdown for papers */}
                {openDropdown === topic.name && topic.papers && topic.papers.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    {topic.papers.map((paper) => (
                      <TouchableOpacity 
                        key={paper}
                        style={styles.dropdownItem}
                        onPress={() => handleTopicPaperSelect(topic, paper)}
                      >
                        <Text style={styles.dropdownText}>{topic.name} - {paper}</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
          </View>
        </Animated.View>
      </ScrollView>

      <ModeSelectionModal
        visible={showModeModal}
        onClose={() => {
          setShowModeModal(false);
          setSelectedTopicPaper(null);
        }}
        onSelectMode={handleModeSelect}
        examTitle={selectedTopicPaper ? `${selectedTopicPaper.topic.name} - ${selectedTopicPaper.paper}` : ''}
      />
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
  contentContainer: {
    flex: 1,
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
  statsContainer: {
    flexDirection: 'row',
    // marginTop: verticalScale(15),
    // marginBottom: verticalScale(10),
    gap: scale(10),
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: scale(6),
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
    fontSize: moderateScale(14),
  },
  statText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  coursesContainer: {
    padding: scale(20),
    gap: scale(16),
  },
  courseCard: {
    borderRadius: 16,
    padding: scale(12),
    marginBottom: verticalScale(10),
    minHeight: 70,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  courseIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseIcon: {
    fontSize: 20,
  },
  bookmarkButton: {
    width: 20,
    height: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 134, 134, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkIcon: {
    fontSize: 10,
  },
  courseSubtitle: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#888',
    marginBottom: verticalScale(4),
    letterSpacing: 1,
  },
  courseTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#2d2d2d',
    lineHeight: 24,
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
  additionalCount: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2d2d2d',
    marginLeft: scale(8),
  },
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d2d2d',
  },
  dropdownContainer: {
    backgroundColor: '#ffffffff',
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  downloadIcon: {
    marginLeft: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#2d2d2d',
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
    marginBottom: verticalScale(16),
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
  paperFilterContainer: {
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
  },
  paperFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  paperFilterScroll: {
    flexDirection: 'row',
  },
  paperFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paperFilterButtonActive: {
    backgroundColor: '#2d2d2d',
    borderColor: '#2d2d2d',
  },
  paperFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  paperFilterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TopicsModeScreen;
