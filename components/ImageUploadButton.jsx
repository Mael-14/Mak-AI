import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useToast } from '../context/ToastContext';

const ImageUploadButton = ({ onImageSelected, style }) => {
  const [showModal, setShowModal] = useState(false);
  const { showError, showSuccess } = useToast();

  // Request permissions
  const requestPermissions = async () => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        showError('Camera permission is required to take photos');
        return false;
      }

      if (mediaLibraryPermission.status !== 'granted') {
        showError('Media library permission is required to select photos');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission error:', error);
      showError('Failed to request permissions');
      return false;
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowModal(false);
        onImageSelected(imageUri);
        showSuccess('Photo captured successfully!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      showError('Failed to take photo. Please try again.');
    }
  };

  // Select from gallery
  const selectFromGallery = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowModal(false);
        onImageSelected(imageUri);
        showSuccess('Image selected successfully!');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      showError('Failed to select image. Please try again.');
    }
  };

  const handlePress = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons name="camera" size={wp('6%')} color="#007AFF" />
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Image Source</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={wp('6%')} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={takePhoto}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="camera" size={wp('8%')} color="#007AFF" />
                  </View>
                  <Text style={styles.optionTitle}>Take Photo</Text>
                  <Text style={styles.optionDescription}>
                    Capture a new image with your camera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={selectFromGallery}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="images" size={wp('8%')} color="#10B981" />
                  </View>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDescription}>
                    Select an existing image from your photos
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: wp('3%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: wp('6%'),
    borderTopRightRadius: wp('6%'),
    paddingBottom: hp('4%'),
    minHeight: hp('40%'),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('3%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: wp('2%'),
  },
  optionsContainer: {
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('2%'),
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIconContainer: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionDescription: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    flex: 2,
    marginTop: hp('0.5%'),
  },
  cancelButton: {
    marginHorizontal: wp('6%'),
    marginTop: hp('2%'),
    padding: hp('2%'),
    backgroundColor: '#F3F4F6',
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default ImageUploadButton;