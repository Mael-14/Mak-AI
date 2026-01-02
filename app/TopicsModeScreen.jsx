import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Dummy topics data (replace with real data as needed)
const topics = [
  { id: 1, name: 'Algebra', questionCount: 25 },
  { id: 2, name: 'Geometry', questionCount: 18 },
  { id: 3, name: 'Trigonometry', questionCount: 12 },
  { id: 4, name: 'Probability', questionCount: 20 },
  { id: 5, name: 'Statistics', questionCount: 15 },
];

const TopicsModeScreen = () => {
  const navigation = useNavigation();
  const [openDropdown, setOpenDropdown] = React.useState(null);
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
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.illustrationContainer}>
            <Image source={require('../assets/math.png')} style={styles.illustrationImage} />
          </View>
          <Text style={styles.headerTitle}>Mathemathics{'\n'}course</Text>
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
                  } else if (questionMode.name === 'Junes') {
                    navigation.navigate('JunesMode');
                  } else if (questionMode.name === 'Customs exam') {
                    navigation.navigate('CustomsExamScreen');
                    // Already on TopicsMode, do nothing or scroll to top
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

        {/* Card Section for Topics */}
        <View style={styles.coursesContainer}>
          {topics.map((topic) => (
            <View key={topic.id} style={[styles.courseCard, { backgroundColor: '#b8b8f0' }]}>
              <View style={styles.courseHeader}>
                <View style={styles.courseIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#171717ff" />
                </View>

                <View>
                  <Text style={styles.courseTitle}>{topic.name}</Text>
                  {/* <Text style={styles.courseSubtitle}>Topic</Text> */}
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
                  style={[styles.arrowButton, openDropdown === topic.id && { transform: [{ rotate: '90deg' }] }]}
                  onPress={() => handleToggleDropdown(topic.id)}
                >
                  <Ionicons name="chevron-forward" size={15} color="black" style={styles.navButtonText} />
                </TouchableOpacity>
              </View>
              {/* Dropdown for papers */}
              {openDropdown === topic.id && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{topic.name} Paper 1</Text>
                    <Ionicons name="download-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{topic.name} Paper 2</Text>
                    <Ionicons name="download-outline" size={20} color="#2d2d2d" style={styles.downloadIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownText}>{topic.name} Paper 3</Text>
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

});

export default TopicsModeScreen;
