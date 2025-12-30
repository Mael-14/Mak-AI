import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Add this import

// Sample papers data
const papersData = [
  { id: 1, title: 'Mathematics Paper 1', questions: 50, answers: 45 },
  { id: 2, title: 'Mathematics Paper 2', questions: 45, answers: 40 },
  { id: 3, title: 'Mathematics Paper 3', questions: 40, answers: 35 },
];

const MathematicsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Questions');

  const handleDownload = (paperTitle) => {
    Alert.alert('Download', `Downloading ${paperTitle}...`);
    // TODO: Implement actual download functionality
  };

  const handlePaperPress = (paper) => {
    Alert.alert(paper.title, 'Opening paper...');
    // TODO: Navigate to question screen
    // navigation.navigate('QuestionCard', { paperId: paper.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/math.jpeg')}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.imageOverlay} />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Subject Title */}
          <Text style={styles.subjectTitle}>Mathematics</Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Questions' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('Questions')}
            >
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.tabIndicator,
                    activeTab === 'Questions' && styles.tabIndicatorActive,
                  ]}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Questions' && styles.activeTabText,
                  ]}
                >
                  Questions
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'Answers' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('Answers')}
            >
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.tabIndicator,
                    activeTab === 'Answers' && styles.tabIndicatorActive,
                  ]}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Answers' && styles.activeTabText,
                  ]}
                >
                  Answers
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Papers List */}
          <View style={styles.papersContainer}>
            {papersData.map((paper) => (
              <TouchableOpacity
                key={paper.id}
                style={styles.paperCard}
                onPress={() => handlePaperPress(paper)}
              >
                <View style={styles.paperIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#2C3E50" />
                </View>

                <Text style={styles.paperTitle}>{paper.title}</Text>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(paper.title)}
                >
                  <Ionicons name="download-outline" size={22} color="#2C3E50" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MathematicsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8D5E8',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 500,
    position: 'relative',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#C8D5E8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -25,
    paddingTop: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 2,
  },
  subjectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7A8B9C',
    marginRight: 8,
  },
  tabIndicatorActive: {
    backgroundColor: '#2C3E50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7A8B9C',
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: '700',
  },
  papersContainer: {
    gap: 16,
  },
  paperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paperIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paperTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  downloadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});