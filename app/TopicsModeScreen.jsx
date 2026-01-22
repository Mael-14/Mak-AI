import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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

const TopicsModeScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { subjectId, subjectName, level } = useLocalSearchParams();
  
  // Get subject data based on ID
  const subjectIdNum = subjectId ? parseInt(subjectId) : 1; // Default to Mathematics if no ID
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];
  const selectedLevel = level || 'Ordinary Level'; // Default to Ordinary Level
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null); // null means all papers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availablePapers, setAvailablePapers] = useState([]);
  
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
          <Text style={styles.headerTitle}>{subject.title}{'\n'}course</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <View style={styles.dotIcon} />
              <Text style={styles.statText}>{topics.length} Topics</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeLight]}>
              <Text style={styles.statIcon}>📚</Text>
              <Text style={styles.statText}>{selectedPaper || 'All Papers'}</Text>
            </View>
          </View>
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

        {/* Card Section for Topics */}
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
                        onPress={() => {
                          // Navigate to questions for this topic and paper
                          console.log('Selected topic:', topic.name, 'Paper:', paper);
                          // TODO: Navigate to questions screen filtered by topic and paper
                        }}
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
    top: 20,
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  coursesContainer: {
    padding: 20,
    gap: 16,
  },
  courseCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    minHeight: 70,
    // Match JunesModeScreen.jsx style
    // backgroundColor is set inline per card
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    //marginBottom: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#2d2d2d',
    marginLeft: 8,
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
