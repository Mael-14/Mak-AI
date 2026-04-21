import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examAPI } from '../services/api';
import { getSubjectCode } from '../utils/subjectMapping';
import ModeSelectionModal from '../components/ModeSelectionModal';
import { LinearGradient } from 'expo-linear-gradient';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import LottieView from 'lottie-react-native';

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

// ─── Inverted Corner ─────────────────────────────────────────────────────────
const InvertedCorner = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <Path
      d={`M 0 0 L 0 ${size} L ${size} ${size} A ${size} ${size} 0 0 1 0 0 Z`}
      fill={color}
    />
  </Svg>
);

// ─── Folder Topic Card ────────────────────────────────────────────────────────
const TOPIC_CARD_COLOR = '#b8b8f0';
const CORNER_SIZE = 26;

const FolderTopicCard = ({ topic, isOpen, onToggle, onPaperSelect }) => (
  <View style={styles.folderCardWrapper}>
    {/* Back layer — peeks below to simulate stacked folder */}
    <View style={styles.folderCardBack} />

    {/* Tab row */}
    <View style={styles.folderTabRow}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.88}
        style={[styles.folderTab, { backgroundColor: TOPIC_CARD_COLOR }]}
      >
        <View style={styles.folderIconContainer}>
          <Ionicons name="folder-open-outline" size={22} color="#2d2d2d" />
        </View>
        <Text style={styles.folderTabTitle} numberOfLines={1}>{topic.name}</Text>
      </TouchableOpacity>

      <InvertedCorner color={TOPIC_CARD_COLOR} size={CORNER_SIZE} />

      <View style={styles.folderTabSpacer}>
        <TouchableOpacity style={styles.folderBookmarkButton}>
          <Ionicons name="bookmark-outline" size={14} color="#000" />
        </TouchableOpacity>
      </View>
    </View>

    {/* Background strip behind the tab area */}
    <View style={styles.folderTabBack} />

    {/* Card body */}
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onToggle}
      style={[styles.folderBody, { backgroundColor: TOPIC_CARD_COLOR }]}
    >
      <Text style={styles.folderSubtitle} numberOfLines={1}>
        {topic.papers && topic.papers.length > 0
          ? `Available in ${topic.papers.length} paper${topic.papers.length !== 1 ? 's' : ''}`
          : 'Topic Questions'}
      </Text>
      <Text style={styles.folderTitle} numberOfLines={2}>{topic.name}</Text>

      <View style={styles.folderFooter}>
        <View style={styles.questionCountBadge}>
          <Ionicons name="help-circle-outline" size={13} color="rgba(45,45,45,0.6)" />
          <Text style={styles.questionCountText}>{topic.questionCount} Questions</Text>
        </View>
        <View style={[styles.folderArrow, isOpen && { transform: [{ rotate: '90deg' }] }]}>
          <Ionicons name="chevron-forward" size={16} color="#2d2d2d" />
        </View>
      </View>
    </TouchableOpacity>

    {/* Dropdown */}
    {isOpen && topic.papers && topic.papers.length > 0 && (
      <View style={styles.folderDropdown}>
        {topic.papers.map((paper) => (
          <TouchableOpacity
            key={paper}
            style={styles.folderDropdownItem}
            onPress={() => onPaperSelect(topic, paper)}
          >
            <Text style={styles.folderDropdownText}>{topic.name} - {paper}</Text>
            <Ionicons name="chevron-forward-outline" size={20} color="#2d2d2d" />
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

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
  const [searchQuery, setSearchQuery] = useState('');

  const extractAvailablePapers = (topicList = []) => {
    const papers = new Set();
    topicList.forEach(topic => {
      (topic.papers || []).forEach(paper => papers.add(paper));
    });
    return Array.from(papers).sort();
  };

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
  
  const loadTopics = useCallback(async () => {
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
        setAvailablePapers(extractAvailablePapers(response.data));
      } else {
        setError(response.error || 'Failed to fetch topics');
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError(err.message || 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, [subjectIdNum, selectedLevel, selectedPaper]);

  // Fetch topics when component mounts or when paper selection changes
  useEffect(() => {
    if (subjectIdNum && selectedLevel) {
      loadTopics();
    }
  }, [subjectIdNum, selectedLevel, selectedPaper, loadTopics]);
  // QuestionMode tabs as in JunesModeScreen.jsx
  const QuestionMode = [
    { id: 1, name: 'All', icon: <Ionicons name="grid-outline" size={15} color="black" />, color: '#fff' },
    { id: 2, name: 'Junes', icon: <Ionicons name="calendar-outline" size={15} color="black" />, color: '#fff' },
    { id: 3, name: 'Topics', icon: <Ionicons name="folder-outline" size={15} color="black" />, color: '#fff' },
    { id: 4, name: 'Customs exam', icon: <Ionicons name="sparkles-outline" size={15} color="#a35daf" />, color: '#fff' },
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
                <Ionicons name="chevron-back" size={24} color="#2d2d2d" />
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
                  <Ionicons name="layers-outline" size={14} color="#fff" />
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
                {questionMode.icon}
                <Text style={styles.questionModeName}>{questionMode.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          )}
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
              <LottieView
                source={require('../animations/Loading (Buffering).json')}
                autoPlay
                loop
                style={styles.loadingAnimation}
              />
              <Text style={styles.loadingText}>Loading topics...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  loadTopics();
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
            topics
              .filter(topic =>
                topic.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((topic, index) => (
              <FolderTopicCard
                key={`${topic.name}-${index}`}
                topic={topic}
                isOpen={openDropdown === topic.name}
                onToggle={() => handleToggleDropdown(topic.name)}
                onPaperSelect={handleTopicPaperSelect}
              />
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
    marginBottom: verticalScale(4),
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
  loadingAnimation: {
    width: scale(84),
    height: scale(84),
  },
  loadingText: {
    marginTop: 6,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: scale(20),
    marginTop: verticalScale(4),
    marginBottom: verticalScale(4),
    borderRadius: 14,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#2d2d2d',
    padding: 0,
  },

  // ── Folder Topic Card ────────────────────────────────────────────────────────
  folderCardWrapper: {
    marginBottom: 22,
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  folderCardBack: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 28,
    backgroundColor: '#9898cc',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  folderTabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
    maxWidth: '60%',
  },
  folderTabSpacer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 6,
    paddingRight: 6,
    borderTopRightRadius: 20,
  },
  folderTabBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#a8a8d8',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    zIndex: -1,
  },
  folderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderTabTitle: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#2d2d2d',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  folderBookmarkButton: {
    width: 30,
    height: 30,
    top: -6,
    borderRadius: 15,
    backgroundColor: '#d0d2d5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderBody: {
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 18,
    marginTop: -1,
  },
  folderSubtitle: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
    color: 'rgba(45,45,45,0.5)',
  },
  folderTitle: {
    fontSize: moderateScale(17),
    fontWeight: 'bold',
    color: '#2d2d2d',
    lineHeight: 23,
    marginBottom: 16,
  },
  folderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  questionCountText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(45,45,45,0.65)',
  },
  folderArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  folderDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    marginHorizontal: 4,
    marginBottom: 4,
    padding: 8,
  },
  folderDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  folderDropdownText: {
    fontSize: moderateScale(14),
    color: '#2d2d2d',
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
  },
});

export default TopicsModeScreen;
