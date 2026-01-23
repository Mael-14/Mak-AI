import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examAPI } from '../services/api';
import ModeSelectionModal from '../components/ModeSelectionModal';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Dummy data for 10 passed GCE Junes (replace with real data as needed)
const gceJunes = [
  {
    id: 1,
    title: 'GCE June 2025',
    students: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
    ],
    commentCount: 12,
  },
  {
    id: 2,
    title: 'GCE June 2024',
    students: [
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=6',
    ],
    commentCount: 8,
  },
  {
    id: 3,
    title: 'GCE June 2023',
    students: [
      'https://i.pravatar.cc/150?img=7',
      'https://i.pravatar.cc/150?img=8',
      'https://i.pravatar.cc/150?img=9',
    ],
    commentCount: 5,
  },
  { id: 4, title: 'GCE June 2022', students: [], commentCount: 3 },
  { id: 5, title: 'GCE June 2021', students: [], commentCount: 2 },
  { id: 6, title: 'GCE June 2020', students: [], commentCount: 1 },
  { id: 7, title: 'GCE June 2019', students: [], commentCount: 0 },
  { id: 8, title: 'GCE June 2018', students: [], commentCount: 0 },
  { id: 9, title: 'GCE June 2017', students: [], commentCount: 0 },
  { id: 10, title: 'GCE June 2016', students: [], commentCount: 0 },
];

const JunesModeScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { subjectId, subjectName, level } = useLocalSearchParams();
  
  // Get subject data based on ID
  const subjectIdNum = subjectId ? parseInt(subjectId) : 1; // Default to Mathematics if no ID
  const subject = SUBJECTS_DATA[subjectIdNum] || SUBJECTS_DATA[1];
  const selectedLevel = level || 'Ordinary Level'; // Default to Ordinary Level
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  
  // Fetch years when component mounts
  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await examAPI.getYearsBySubjectId(subjectIdNum, selectedLevel);
        if (response.success && response.data) {
          setYears(response.data);
        } else {
          setError(response.error || 'Failed to fetch years');
        }
      } catch (err) {
        console.error('Error fetching years:', err);
        setError(err.message || 'Failed to load years');
      } finally {
        setLoading(false);
      }
    };
    
    if (subjectIdNum && selectedLevel) {
      fetchYears();
    }
  }, [subjectIdNum, selectedLevel]);
  const handleToggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };
  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const handlePaperSelect = (paper) => {
    setSelectedPaper(paper);
    setShowModeModal(true);
  };

  const handleModeSelect = (mode) => {
    if (!selectedPaper) return;
    
    const examTitle = `GCE June ${selectedPaper.year} - ${selectedPaper.paper}`;
    
    if (mode === 'revision') {
      router.push({
        pathname: '/RevisionMode',
        params: {
          subjectCode: selectedPaper.subjectCode,
          examTitle: examTitle,
          subjectName: subject.title,
          level: selectedLevel,
          paper: selectedPaper.paper,
          year: selectedPaper.year
        }
      });
    } else if (mode === 'exam') {
      router.push({
        pathname: '/ExamMode',
        params: {
          examId: selectedPaper.id,
          examTitle: examTitle,
          subjectCode: selectedPaper.subjectCode,
          level: selectedLevel
        }
      });
    }
  };
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
            <Image 
              source={subject.image} 
              style={styles.illustrationImage} 
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle}>{subject.title}{"\n"}course</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <View style={styles.dotIcon} />
              <Text style={styles.statText}>{years.length} Years</Text>
            </View>
            <View style={[styles.statBadge, styles.statBadgeLight]}>
              <Text style={styles.statIcon}>📚</Text>
              <Text style={styles.statText}>{selectedLevel}</Text>
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
                          pathname: '/subject/[id]',
                          params: { id: subjectIdNum.toString(), level: selectedLevel }
                       })
                  } else if (questionMode.name === 'Customs exam') {
                    router.push({
                          pathname: '/CustomsExamScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title, level: selectedLevel }
                       })
                  } else if (questionMode.name === 'Topics') {
                    router.push({
                          pathname: '/TopicsModeScreen',
                          params: { subjectId: subjectIdNum, subjectName: subject.title }
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

        {/* Card Section for GCE Junes */}
        <View style={styles.coursesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d2d2d" />
              <Text style={styles.loadingText}>Loading years...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  examAPI.getYearsBySubjectId(subjectIdNum, selectedLevel)
                    .then(response => {
                      if (response.success && response.data) {
                        setYears(response.data);
                      }
                    })
                    .catch(err => setError(err.message))
                    .finally(() => setLoading(false));
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : years.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No years available for this subject</Text>
            </View>
          ) : (
            years.map((yearData) => (
              <View key={yearData.year} style={[styles.courseCard, { backgroundColor: '#2d2d2d' }]}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconContainer}>
                    <Ionicons name="document-text-outline" size={24} color="#ccccccff" />
                  </View>

                  <View style={{flexDirection: 'column'}}>
                    <Text style={[styles.courseTitle, styles.courseTitleDark]}>GCE June {yearData.year}</Text>
                    <Text style={styles.courseSubtitle}>{yearData.papers.length} Paper{yearData.papers.length !== 1 ? 's' : ''} Available</Text>
                  </View>

                  <TouchableOpacity style={styles.favoriteButton} onPress={() => handleToggleFavorite(yearData.year)}>
                    <Ionicons
                      name={favorites.includes(yearData.year) ? 'heart' : 'heart-outline'}
                      size={15}
                      color={favorites.includes(yearData.year) ? 'red' : '#2d2d2d'}
                      style={styles.heartIcon}
                    />
                  </TouchableOpacity>

                </View>
                <View style={styles.courseFooter}>
                  <View style={styles.studentsContainer}>
                    <TouchableOpacity style={styles.commentButton}>
                      <Text style={styles.commentIcon}>📄</Text>
                      <Text style={styles.commentCount}>{yearData.papers.length}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.arrowButtonDark, openDropdown === yearData.year && { transform: [{ rotate: '90deg' }] }]}
                    onPress={() => handleToggleDropdown(yearData.year)}
                  >
                    <Ionicons name="chevron-forward" size={15} color="black" style={styles.navButtonText} />
                  </TouchableOpacity>
                </View>
                {/* Dropdown for papers */}
                {openDropdown === yearData.year && (
                  <View style={styles.dropdownContainer}>
                    {yearData.papers.map((paper) => (
                      <TouchableOpacity 
                        key={paper.id} 
                        style={styles.dropdownItem}
                        onPress={() => handlePaperSelect({
                          ...paper,
                          year: yearData.year
                        })}
                      >
                        <Text style={styles.dropdownText}>GCE June {yearData.year} - {paper.paper}</Text>
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

      <ModeSelectionModal
        visible={showModeModal}
        onClose={() => {
          setShowModeModal(false);
          setSelectedPaper(null);
        }}
        onSelectMode={handleModeSelect}
        examTitle={selectedPaper ? `GCE June ${selectedPaper.year} - ${selectedPaper.paper}` : ''}
      />
    </SafeAreaView>
  );
  };
  // Styles for QuestionMode tabs (copied from Ss.jsx)

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
    color: '#fff',
    fontSize: 12,
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
  favoriteButton: {
    width: 25,
    height: 25,
    borderRadius: 18,
    backgroundColor: 'rgba(134, 134, 134, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 15,
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
  arrowButton: {
    width: 30,
    height: 30,
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
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 124, 124, 0.52)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  commentIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  commentCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c4c3c3ff',
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
export default JunesModeScreen;
