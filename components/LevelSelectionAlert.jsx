import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { BlurView } from 'expo-blur';

const LevelSelectionAlert = ({ visible, onClose, onSelectLevel, subjectTitle }) => {
  const handleLevelSelect = (level) => {
    onSelectLevel(level);
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
        <View style={styles.alertBox}>
          <Text style={styles.title}>Select Level</Text>
          <Text style={styles.message}>
            Choose the level for {subjectTitle || 'this subject'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.levelButton, styles.ordinaryButton]}
              onPress={() => handleLevelSelect('Ordinary Level')}
            >
              <Text style={styles.buttonText}>Ordinary Level</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.levelButton, styles.advanceButton]}
              onPress={() => handleLevelSelect('Advance Level')}
            >
              <Text style={styles.buttonText}>Advance Level</Text>
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
  alertBox: {
    width: '85%',
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
    marginBottom: 12,
    color: '#000',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  levelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ordinaryButton: {
    backgroundColor: '#4CAF50',
  },
  advanceButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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

export default LevelSelectionAlert;

