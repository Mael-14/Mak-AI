import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { verticalScale, moderateScale, scale } from '../utils/scaling';

const { width } = Dimensions.get('window');

const SUBJECT_COLORS = {
  'Mathematics': { color: '#FF8C42', icon: 'calculator-variant' },
  'Biology': { color: '#32CD32', icon: 'dna' },
  'Chemistry': { color: '#FFD700', icon: 'flask' },
  'Physics': { color: '#00BFFF', icon: 'atom' },
  'Computer Science': { color: '#BA55D3', icon: 'laptop' },
  'Math Stats': { color: '#DAA520', icon: 'chart-line' },
  'Geography': { color: '#20B2AA', icon: 'earth' },
  'Further Math': { color: '#FF7F50', icon: 'math-integral-box' },
};

const ExamHistoryCard = ({ exam, onPress, onDelete }) => {
  const subjectColor = SUBJECT_COLORS[exam.subject] || {
    color: '#667eea',
    icon: 'book',
  };

  // Format date with Android/iOS compatibility
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      return 'Unknown time';
    }
  };

  const formattedDate = formatDate(exam.createdAt);
  const formattedTime = formatTime(exam.createdAt);

  // Determine status style
  const getStatusStyle = () => {
    switch (exam.status) {
      case 'completed':
        return { backgroundColor: '#C8E6C9', color: '#2E7D32' };
      case 'in-progress':
        return { backgroundColor: '#FFE0B2', color: '#E65100' };
      case 'saved':
      default:
        return { backgroundColor: '#E8EAF6', color: '#3F51B5' };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with subject icon and delete button */}
      <View style={styles.cardHeader}>
        <View style={styles.subjectBadge}>
          <MaterialCommunityIcons
            name={subjectColor.icon}
            size={24}
            color={subjectColor.color}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.subjectTitle}>{exam.subject}</Text>
          <Text style={styles.cardMeta}>
            {exam.questionType} • {exam.numQuestions} questions
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>

      {/* Exam details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="school-outline" size={14} color="#666" />
            <Text style={styles.detailLabel}>{exam.level}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={14} color="#666" />
            <Text style={styles.detailLabel}>{exam.difficulty}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.detailLabel}>{exam.duration} min</Text>
          </View>
        </View>

        {/* Topics */}
        {exam.topics && exam.topics.length > 0 && (
          <View style={styles.topicsRow}>
            <Text style={styles.topicsLabel}>Topics:</Text>
            <View style={styles.topicsTags}>
              {exam.topics.slice(0, 3).map((topic, idx) => (
                <View key={idx} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
              {exam.topics.length > 3 && (
                <View style={styles.topicTag}>
                  <Text style={styles.topicText}>+{exam.topics.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Footer with date and status */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.backgroundColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {exam.status === 'in-progress'
              ? 'In Progress'
              : exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Total marks indicator */}
      <View style={styles.marksIndicator}>
        <Text style={styles.marksText}>{exam.totalMarks} marks</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: verticalScale(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  subjectBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#333',
  },
  cardMeta: {
    fontSize: moderateScale(11),
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  detailsContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FAFAFA',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: moderateScale(11),
    color: '#666',
    fontWeight: '500',
  },
  topicsRow: {
    marginTop: verticalScale(10),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  topicsLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicTag: {
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#3F51B5',
  },
  topicText: {
    fontSize: moderateScale(9),
    color: '#3F51B5',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  dateText: {
    fontSize: moderateScale(11),
    color: '#666',
    fontWeight: '600',
  },
  timeText: {
    fontSize: moderateScale(10),
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  marksIndicator: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(10),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  marksText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#3F51B5',
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});

export default ExamHistoryCard;
