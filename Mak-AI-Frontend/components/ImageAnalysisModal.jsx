import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useToast } from '../context/ToastContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageAnalysisModal = ({
  visible,
  onClose,
  imageUri,
  onAnalyze,
  analysisResult,
  isAnalyzing,
}) => {
  const { showError } = useToast();

  const handleAnalyze = async () => {
    if (!imageUri) {
      showError('No image selected for analysis');
      return;
    }

    try {
      await onAnalyze(imageUri);
    } catch (error) {
      console.error('Image analysis error:', error);
      showError('Failed to analyze image. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Image Analysis</Text>
          
          <TouchableOpacity
            style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={isAnalyzing || !imageUri}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
              />
              <View style={styles.imageOverlay}>
                <View style={styles.imageInfo}>
                  <Ionicons name="image" size={wp('4%')} color="#FFF" />
                  <Text style={styles.imageInfoText}>Tap "Analyze" to get AI insights</Text>
                </View>
              </View>
            </View>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
              <Text style={styles.loadingSubtext}>
                This may take a few seconds depending on image complexity
              </Text>
            </View>
          )}

          {/* Analysis Results */}
          {analysisResult && !isAnalyzing && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeader}>
                <Ionicons name="bulb" size={wp('5%')} color="#007AFF" />
                <Text style={styles.resultsTitle}>AI Analysis Results</Text>
              </View>
              
              <View style={styles.resultsContent}>
                <Text style={styles.resultsText}>{analysisResult}</Text>
              </View>

              <View style={styles.resultsActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    // Copy to clipboard functionality can be added here
                    showError('Copy functionality coming soon!');
                  }}
                >
                  <Ionicons name="copy" size={wp('4%')} color="#666" />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  <Ionicons name="refresh" size={wp('4%')} color="#666" />
                  <Text style={styles.actionButtonText}>Re-analyze</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!imageUri && (
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={wp('15%')} color="#CCC" />
              <Text style={styles.emptyStateTitle}>No Image Selected</Text>
              <Text style={styles.emptyStateText}>
                Please select an image to analyze with AI
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for better analysis:</Text>
          <Text style={styles.tipsText}>
            • Use clear, well-lit images{'\n'}
            • Include text or objects you want analyzed{'\n'}
            • Mathematical equations work great for problem solving
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  closeButton: {
    padding: wp('2%'),
  },
  title: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    minWidth: wp('20%'),
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: wp('3.5%'),
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp('2%'),
  },
  imageContainer: {
    margin: wp('4%'),
    borderRadius: wp('3%'),
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: hp('40%'),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
  },
  imageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageInfoText: {
    color: '#FFF',
    fontSize: wp('3%'),
    marginLeft: wp('2%'),
  },
  loadingContainer: {
    alignItems: 'center',
    padding: wp('8%'),
  },
  loadingText: {
    fontSize: wp('4%'),
    color: '#333',
    marginTop: hp('2%'),
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: wp('3%'),
    color: '#666',
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  resultsContainer: {
    margin: wp('4%'),
    backgroundColor: '#FFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  resultsTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: wp('2%'),
  },
  resultsContent: {
    backgroundColor: '#F8F9FA',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
  },
  resultsText: {
    fontSize: wp('3.8%'),
    color: '#374151',
    lineHeight: wp('5.5%'),
  },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    backgroundColor: '#F3F4F6',
    borderRadius: wp('2%'),
  },
  actionButtonText: {
    marginLeft: wp('1.5%'),
    fontSize: wp('3.5%'),
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('10%'),
  },
  emptyStateTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: hp('2%'),
  },
  emptyStateText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: hp('1%'),
    paddingHorizontal: wp('8%'),
    lineHeight: wp('5%'),
  },
  tipsContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  tipsText: {
    fontSize: wp('3%'),
    color: '#6B7280',
    lineHeight: wp('4.5%'),
  },
});

export default ImageAnalysisModal;