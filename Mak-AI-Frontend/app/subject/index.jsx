import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import LevelSelectionAlert from '../../components/LevelSelectionAlert';
import { SUBJECTS } from '../../constant/subjects';
import { scale } from '../../utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = scale(16);
const CARD_GAP = scale(16);
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

const SUBJECT_COLORS = {
  1: '#4F46E5',
  2: '#16A34A',
  3: '#F59E0B',
  4: '#0284C7',
  5: '#7C3AED',
  6: '#DB2777',
  7: '#0EA5A4',
  8: '#EA580C',
};

const hexToRgba = (hex, alpha) => {
  const safeHex = hex.replace('#', '');
  const r = parseInt(safeHex.substring(0, 2), 16);
  const g = parseInt(safeHex.substring(2, 4), 16);
  const b = parseInt(safeHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SubjectCard = ({ item, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const accent = SUBJECT_COLORS[item.id] || '#9CA3AF';

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.iconHalo, { backgroundColor: hexToRgba(accent, 0.14) }]}>
          <Image source={item.image} style={styles.subjectIcon} resizeMode="contain" />
        </View>
        <Text style={styles.subjectTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const AllSubjects = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLevelAlert, setShowLevelAlert] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return SUBJECTS;
    }
    return SUBJECTS.filter((item) => item.title.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleSubjectPress = (item) => {
    setSelectedSubject(item);
    setShowLevelAlert(true);
  };

  const handleLevelSelect = (level) => {
    if (selectedSubject) {
      router.push({
        pathname: `/subject/[id]`,
        params: {
          id: selectedSubject.id.toString(),
          level: level,
        },
      });
    }
    setShowLevelAlert(false);
    setSelectedSubject(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>All Subjects</Text>
          <Text style={styles.headerSubtitle}>Choose a subject to continue</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#8A8A8E" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search subjects"
          placeholderTextColor="#8A8A8E"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredSubjects}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SubjectCard item={item} onPress={() => handleSubjectPress(item)} />
        )}
      />

      <LevelSelectionAlert
        visible={showLevelAlert}
        onClose={() => {
          setShowLevelAlert(false);
          setSelectedSubject(null);
        }}
        onSelectLevel={handleLevelSelect}
        subjectTitle={selectedSubject?.title}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: scale(10),
    paddingBottom: scale(8),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTextBlock: {
    justifyContent: 'center',
    paddingTop: scale(1),
  },
  headerTitle: {
    fontSize: scale(22),
    fontWeight: '600',
    color: '#111',
  },
  headerSubtitle: {
    marginTop: scale(3),
    fontSize: scale(13),
    fontWeight: '400',
    color: '#8A8A8E',
  },
  searchContainer: {
    marginTop: scale(8),
    marginHorizontal: HORIZONTAL_PADDING,
    backgroundColor: '#F2F2F2',
    borderRadius: scale(14),
    height: scale(48),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    color: '#333333',
    fontWeight: '500',
    paddingVertical: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  listPadding: {
    paddingBottom: scale(36),
    paddingTop: scale(18),
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(18),
    paddingTop: scale(10),
    paddingBottom: scale(10),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    minHeight: scale(136),
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(4),
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
  },
  iconHalo: {
    width: scale(74),
    height: scale(74),
    borderRadius: scale(37),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  subjectIcon: {
    width: scale(46),
    height: scale(46),
  },
  subjectTitle: {
    textAlign: 'center',
    fontSize: scale(15.5),
    fontWeight: '500',
    color: '#333333',
    lineHeight: scale(18),
  },
});

export default AllSubjects;
