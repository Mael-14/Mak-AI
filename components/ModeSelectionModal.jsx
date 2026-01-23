import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const ModeSelectionModal = ({ visible, onClose, onSelectMode, examTitle }) => {
  const handleModeSelect = (mode) => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Select Study Mode</Text>
          {examTitle && (
            <Text style={styles.subtitle}>{examTitle}</Text>
          )}
          
          <View style={styles.modeContainer}>
            {/* Revision Mode */}
            <TouchableOpacity
              style={[styles.modeButton, styles.revisionButton]}
              onPress={() => handleModeSelect('revision')}
            >
              <View style={styles.modeIconContainer}>
                <Ionicons name="book-outline" size={32} color="#fff" />
              </View>
              <Text style={styles.modeTitle}>Revision Mode</Text>
              <Text style={styles.modeDescription}>
                Study at your own pace with hints and explanations
              </Text>
              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>Hints available</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>Instant explanations</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>No time limit</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Exam Mode */}
            <TouchableOpacity
              style={[styles.modeButton, styles.examButton]}
              onPress={() => handleModeSelect('exam')}
            >
              <View style={styles.modeIconContainer}>
                <Ionicons name="timer-outline" size={32} color="#fff" />
              </View>
              <Text style={styles.modeTitle}>Exam Mode</Text>
              <Text style={styles.modeDescription}>
                Simulate real exam conditions with timer
              </Text>
              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>Timer enabled</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>Score tracking</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.featureText}>Results summary</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
  },
  modeContainer: {
    gap: 16,
    marginBottom: 16,
  },
  modeButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 180,
  },
  revisionButton: {
    backgroundColor: '#4CAF50',
  },
  examButton: {
    backgroundColor: '#2196F3',
  },
  modeIconContainer: {
    marginBottom: 12,
  },
  modeTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modeDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresContainer: {
    width: '100%',
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: 'white',
    fontSize: 13,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ModeSelectionModal;

