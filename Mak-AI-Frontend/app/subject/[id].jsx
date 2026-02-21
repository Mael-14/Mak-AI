import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { verticalScale, moderateScale, scale } from '../../utils/scaling';

// ─── Data ────────────────────────────────────────────────────────────────────

const SUBJECTS_DATA = {
  1: { id: 1, title: 'Mathematics',     image: require('../../assets/Maths.png'),           headerColor: '#ffb380' },
  2: { id: 2, title: 'Biology',         image: require('../../assets/Biology.png'),          headerColor: '#90EE90' },
  3: { id: 3, title: 'Chemistry',       image: require('../../assets/Chemistry.png'),        headerColor: '#FFD700' },
  4: { id: 4, title: 'Physics',         image: require('../../assets/Physics.png'),          headerColor: '#87CEEB' },
  5: { id: 5, title: 'Computer Science',image: require('../../assets/Computer science.png'), headerColor: '#DDA0DD' },
  6: { id: 6, title: 'Math Stats',      image: require('../../assets/Math Statistic.png'),   headerColor: '#F0E68C' },
  7: { id: 7, title: 'Geography',       image: require('../../assets/Geography.png'),        headerColor: '#98D8C8' },
  8: { id: 8, title: 'Further Math',    image: require('../../assets/FurtherMath.png'),      headerColor: '#FFA07A' },
};

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

// ─── Inverted Corner ──────────────────────────────────────────────────────────
//
// Creates the concave "shoulder" between the tab's right edge and the card body.
// The filled quarter-circle arc is the same colour as the card, sitting on top
// of the page background — so it looks like a smooth cut-out.
//
//  ┌──────┐
//  │ tab  ╰──────────────── card top edge
//  └──────────────────────────────────── card body
//
const InvertedCorner = ({ color, size = 26 }) => (
  <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    {/*
      Trace the filled triangle + arc:
        M 0 0        top-left
        L 0 {size}   bottom-left
        L {size} {size} bottom-right
        A arc back to top-left (quarter circle, sweeping counter-clockwise)
        Z
    */}
    <Path
      d={`M 0 0 L 0 ${size} L ${size} ${size} A ${size} ${size} 0 0 1 0 0 Z`}
      fill={color}
    />
  </Svg>
);

// ─── Folder Course Card ───────────────────────────────────────────────────────

const FolderCourseCard = ({ course, onPress }) => {
  const isDark = course.backgroundColor === '#2d2d2d';
  const textColor      = isDark ? '#ffffff' : '#2d2d2d';
  const subtitleColor  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.42)';
  const iconBg         = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const bookmarkBg     = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.06)';
  const CORNER_SIZE    = 26;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.courseCardWrapper}
    >
      
      {/* ── Gray back layer — peeks below the card to simulate a stacked folder ── */}
      <View style={styles.courseCardBack} />

      {/* ── Tab row ───────────────────────────────────────────────────────── */}
      <View style={styles.courseTabRow}>

        {/* Folder tab: rounded top corners, holds the icon */}
        <View style={[styles.courseTab, { backgroundColor: course.backgroundColor }]}>
          <View style={[styles.courseIconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name="document-text-outline" size={24} color="#ccccccff" />
            {/* <Text style={styles.courseTabIcon}>{course.icon}</Text> */}
          </View>
          <Text style={[styles.courseTabTitle ,{ color: textColor }]}>{course.header}</Text>
        </View>

        {/* Concave shoulder — masks the gap between tab & body */}
        <InvertedCorner color={course.backgroundColor} size={CORNER_SIZE} />

        {/* Spacer + floating bookmark on the right */}
        <View style={styles.courseTabSpacer}>
          <TouchableOpacity style={[styles.bookmarkButton, { backgroundColor: '#d0d2d5' }]}>
            <Ionicons name="bookmark-outline" size={14} color= '#000000' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.courseTaBack} />

      {/* ── Card body ─────────────────────────────────────────────────────── */}
      {/*   No top-left radius: the tab already covers that corner            */}
      <View style={[styles.courseBody, { backgroundColor: course.backgroundColor }]}>
        <Text style={[styles.courseSubtitle, { color: subtitleColor }]} numberOfLines={1}>
          {course.subtitle}
        </Text>

        <Text style={[styles.courseTitle, { color: textColor }]} numberOfLines={2}>
          {course.title}
        </Text>

        {/* Footer: avatars + arrow */}
        <View style={styles.courseFooter}>
          <View style={styles.studentsContainer}>
            {course.students.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={[
                  styles.studentAvatar,
                  index > 0 && { marginLeft: -10 },
                  { borderColor: course.backgroundColor },
                ]}
              />
            ))}
            <Text style={[styles.additionalCount, { color: textColor }]}>
              +{course.additionalCount}
            </Text>
          </View>

          <TouchableOpacity style={styles.arrowButton} onPress={onPress}>
            <Ionicons name="chevron-forward" size={16} color="#2d2d2d" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const SubjectScreen = () => {
  const router = useRouter();
  const { id, level } = useLocalSearchParams();

  const subjectId       = parseInt(id);
  const subject         = SUBJECTS_DATA[subjectId];
  const selectedLevel   = level || 'Ordinary Level';
  const gradientColors  = GRADIENT_COLORS[subjectId] || GRADIENT_COLORS[1];

  const [headerOpacityAnim]     = useState(new Animated.Value(0));
  const [headerTranslateYAnim]  = useState(new Animated.Value(-30));
  const [contentOpacityAnim]    = useState(new Animated.Value(0));
  const [contentTranslateYAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacityAnim,    { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerTranslateYAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(100, [
        Animated.timing(contentOpacityAnim,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(contentTranslateYAnim, { toValue: 0, friction: 7, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!subject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subject not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const QuestionMode = [
    { id: 1, name: 'All',          icon: <Ionicons name="grid-outline"     size={14} color="black" />, route: null },
    { id: 2, name: 'Junes',        icon: '📅',                                                          route: '/JunesModeScreen' },
    { id: 3, name: 'Topics',       icon: '📂',                                                          route: '/TopicsModeScreen' },
    { id: 4, name: 'Customs exam', icon: <Ionicons name="sparkles-outline" size={14} color="#a35daf" />, route: '/CustomsExamScreen' },
  ];

  const courses = [
    {
      id: 1,
      header: 'June Papers',
      title: 'GCE Advance Level Passed June Questions',
      subtitle: 'Past Papers & Answers Analysis for All Subjects',
      students: ['https://i.pravatar.cc/150?img=1','https://i.pravatar.cc/150?img=2','https://i.pravatar.cc/150?img=3'],
      additionalCount: 3,
      backgroundColor: '#2d2d2d',
      icon: '📄',
      route: '/JunesModeScreen',
    },
    {
      id: 2,
      header: 'Topics papers',
      title: 'GCE Advance Level Questions per Topics',
      subtitle: 'Past Questions Sorted per Topic',
      students: ['https://i.pravatar.cc/150?img=4','https://i.pravatar.cc/150?img=5','https://i.pravatar.cc/150?img=6'],
      additionalCount: 12,
      backgroundColor: '#b8b8f0',
      icon: '📚',
      route: '/TopicsModeScreen',
    },
    {
      id: 3,
      header: 'Customs Exam',
      title: 'GCE Advance Level AI Generated Custom Questions',
      subtitle: 'AI Shuffles & Generates Questions on Demand',
      students: ['https://i.pravatar.cc/150?img=7','https://i.pravatar.cc/150?img=8','https://i.pravatar.cc/150?img=9'],
      additionalCount: 12,
      backgroundColor: '#c5c5d8',
      icon: '🤖',
      route: '/CustomsExamScreen',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={[
          styles.headerContainer,
          { opacity: headerOpacityAnim, transform: [{ translateY: headerTranslateYAnim }] },
        ]}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <View style={styles.headerSection}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backIcon}>‹</Text>
              </TouchableOpacity>
              <View style={styles.illustrationContainer}>
                <Image source={subject.image} style={styles.illustrationImage} resizeMode="contain" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{subject.title}</Text>
                <Text style={styles.headerSubtitle}>Complete Course Material</Text>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statBadge}><View style={styles.dotIcon} /><Text style={styles.statText}>10 Junes</Text></View>
                <View style={[styles.statBadge, styles.statBadgeLight]}><Text style={styles.statIcon}>📅</Text><Text style={styles.statText}>{selectedLevel}</Text></View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Mode Tabs ── */}
        <View style={styles.QuestionModeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QuestionMode.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={styles.questionModeTab}
                onPress={() => mode.route && router.push({ pathname: mode.route, params: { subjectId, subjectName: subject.title, level: selectedLevel } })}
              >
                <Text style={styles.questionModeIcon}>{mode.icon}</Text>
                <Text style={styles.questionModeName}>{mode.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Course Cards ── */}
        <Animated.View style={[
          styles.contentContainer,
          { opacity: contentOpacityAnim, transform: [{ translateY: contentTranslateYAnim }] },
        ]}>
          <View style={styles.coursesContainer}>
            {courses.map((course) => (
              <FolderCourseCard
                key={course.id}
                course={course}
                onPress={() => router.push({ pathname: course.route, params: { subjectId, subjectName: subject.title, level: selectedLevel } })}
              />
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { 
    flex: 1, 
    backgroundColor: '#f0f0f5' 
  },
  scrollView: { 
    flex: 1 
  },

  // Header
  headerContainer: {
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    overflow: 'hidden', 
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
    paddingTop: verticalScale(10) , 
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  headerTextContainer:  { 
    marginBottom: verticalScale(20), 
    marginTop: verticalScale(12) 
  },
  backButton: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  backIcon:             { 
    fontSize: 28, 
    color: '#2d2d2d', 
    fontWeight: '300' 
  },
  illustrationContainer:{ 
    position: 'absolute', 
    right: scale(20), 
    top: verticalScale(30), 
    width: 190, 
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage:    { 
    width: '100%', 
    height: '100%',
    resizeMode: 'contain',
  },
  headerTitle:          { 
    fontSize: moderateScale(28), 
    fontWeight: 'bold', 
    color: '#2d2d2d',
    marginBottom: verticalScale(4),
  },
  headerSubtitle:       { fontSize: moderateScale(12), color: 'rgba(45,45,45,0.7)' },
  statsContainer:       { flexDirection: 'row', gap: scale(10) },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2d2d2d',
    paddingHorizontal: scale(16), paddingVertical: verticalScale(10), borderRadius: 20, gap: scale(6),
  },
  statBadgeLight: { backgroundColor: 'rgba(255,255,255,0.4)' },
  dotIcon:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  statIcon: { fontSize: moderateScale(14) },
  statText: { color: '#fff', fontSize: moderateScale(12), fontWeight: '600' },

  // Mode tabs
  QuestionModeContainer: {
    backgroundColor: '#fff',
    paddingVertical: verticalScale(16), paddingHorizontal: scale(12),
    marginTop: verticalScale(-20), marginHorizontal: scale(20),
    borderRadius: 16, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    marginBottom: verticalScale(16),
  },
  questionModeTab: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5',
    paddingHorizontal: scale(16), paddingVertical: verticalScale(6),
    borderRadius: 12, marginRight: scale(10), gap: scale(8),
  },
  questionModeIcon: { fontSize: moderateScale(16) },
  questionModeName: { fontSize: moderateScale(11), fontWeight: '600', color: '#2d2d2d' },

  contentContainer: { flex: 1 },
  coursesContainer: { paddingHorizontal: scale(20), paddingBottom: scale(20) },

  // ── Folder Card ──────────────────────────────────────────────────────────────

  courseCardWrapper: {
    marginBottom: 22,
    // Extra bottom padding so the gray back layer can peek out
    paddingBottom: 8,
  },

  // Gray card rendered first — sits behind the main card
  // Slightly inset on the sides and pushed down so it peeks at the bottom
  courseCardBack: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 28,
    backgroundColor: '#d4d4de',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  // Tab row: [tab pill] [inverted-corner SVG] [spacer + bookmark]
  courseTabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // pin everything to the shared bottom baseline
  },
  courseTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    // No bottom radius — body picks up seamlessly
  },
  // InvertedCorner SVG: zero extra margin, flushes straight onto the tab
  courseTabSpacer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 6,
    paddingRight: 6,
    //backgroundColor: '#d2d2d5',
    borderTopRightRadius: 20,
  },
  courseTaBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    zIndex: -1,
  },
  courseTabTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#2d2d2d',
  },

  // Card body — top-right corner only (tab covers top-left)
  courseBody: {
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 18,
    marginTop: -1, // collapse the 1-pixel gap between row and body
  },

  // Icon inside the tab
  courseIconContainer: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  courseTabIcon: { fontSize: 18 },

  // Bookmark
  bookmarkButton: {
    width: 30,
    height: 30,
    top: -6,
    borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },

  // Body text
  courseSubtitle: {
    fontSize: moderateScale(10), fontWeight: '700',
    letterSpacing: 0.4, marginBottom: 4,
  },
  courseTitle: {
    fontSize: moderateScale(17), fontWeight: 'bold',
    lineHeight: 23, marginBottom: 16,
  },

  // Footer
  courseFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentsContainer: { flexDirection: 'row', alignItems: 'center' },
  studentAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2 },
  additionalCount: { fontSize: moderateScale(12), fontWeight: '600', marginLeft: 8 },
  arrowButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },

  // Error
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText:      { fontSize: 16, color: '#666', marginBottom: 12 },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
});

export default SubjectScreen;