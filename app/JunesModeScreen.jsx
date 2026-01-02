import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

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
  const [openDropdown, setOpenDropdown] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const handleToggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };
  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
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
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.illustrationContainer}>
            <Image source={require('../assets/math.png')} style={styles.illustrationImage} />
          </View>
          <Text style={styles.headerTitle}>Mathemathics{"\n"}course</Text>
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

        {/* Question Mode Tabs */}
        <View style={styles.QuestionModeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QuestionMode.map((questionMode) => (
              <TouchableOpacity
                key={questionMode.id}
                style={styles.questionModeTab}
                onPress={() => {
                  if (questionMode.name === 'All') {
                    navigation.navigate('Ss');
                  } else if (questionMode.name === 'Customs exam') {
                    navigation.navigate('CustomsExamScreen');
                    // Already on JunesMode, do nothing or scroll to top
                  } else if (questionMode.name === 'Topics') {
                    navigation.navigate('TopicsMode');
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
          {gceJunes.map((June) => (
            <View key={June.id} style={[styles.courseCard, { backgroundColor: '#2d2d2d' }] }>
              <View style={styles.courseHeader}>
                <View style={styles.courseIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#ccccccff" />
                </View>
                        <View style={{flexDirection: 'culomn'}}>
                            <Text style={[styles.courseTitle, styles.courseTitleDark]}>{June.title}</Text>
                            <Text style={styles.courseSubtitle}>GCE Passed June</Text>
                    </View>
                <TouchableOpacity style={styles.favoriteButton} onPress={() => handleToggleFavorite(June.id)}>
                  <Ionicons
                    name={favorites.includes(June.id) ? 'heart' : 'heart-outline'}
                    size={15}
                    color={favorites.includes(June.id) ? 'red' : '#2d2d2d'}
                    style={styles.heartIcon}
                  />
                </TouchableOpacity>
              </View>
              {/* <View>
                <Text style={styles.courseSubtitle}>GCE Passed June</Text>
                <Text style={[styles.courseTitle, styles.courseTitleDark]}>{June.title}</Text>
              </View> */}
              <View style={styles.courseFooter}>
                <View style={styles.studentsContainer}>
                  {/* Avatars */}
                  {June.students && June.students.slice(0, 3).map((student, index) => (
                    <Image
                      key={index}
                      source={{ uri: student }}
                      style={[
                        styles.studentAvatar,
                        index > 0 && { marginLeft: -8 },
                      ]}
                    />
                  ))}
                  {/* Comment button */}
                  <TouchableOpacity style={styles.commentButton}>
                    <Text style={styles.commentIcon}>💬</Text>
                    <Text style={styles.commentCount}>{June.commentCount}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.arrowButton, styles.arrowButtonDark, openDropdown === June.id && { transform: [{ rotate: '90deg' }] }]}
                  onPress={() => handleToggleDropdown(June.id)}
                >
                  <Ionicons name="chevron-forward" size={15} color="black" style={styles.navButtonText} />
                </TouchableOpacity>
              </View>
              {/* Dropdown for papers */}
              {openDropdown === June.id && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{June.title} Paper 1</Text>
                    <Ionicons name="download-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{June.title} Paper 2</Text>
                    <Ionicons name="download-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{June.title} Paper 3</Text>
                    <Ionicons name="download-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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


});
export default JunesModeScreen;
