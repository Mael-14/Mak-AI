import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useToast } from '../context/ToastContext';

const DocumentUploadModal = ({
  visible,
  onClose,
  onDocumentSelected,
  onDocumentAnalyzed,
  isAnalyzing = false,
  analysisResult = null,
}) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showError, showSuccess, showWarning } = useToast();

  // Supported document types
  const supportedTypes = {
    'application/pdf': { name: 'PDF', icon: 'document-text', color: '#EF4444' },
    'application/msword': { name: 'Word', icon: 'document', color: '#2563EB' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { name: 'Word', icon: 'document', color: '#2563EB' },
    'text/plain': { name: 'Text', icon: 'document-text', color: '#10B981' },
    'application/vnd.ms-excel': { name: 'Excel', icon: 'grid', color: '#059669' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { name: 'Excel', icon: 'grid', color: '#059669' },
  };

  // Request permissions for file access
  const requestFilePermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request media library permissions
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          showError('File access permission denied. Please enable it in settings.');
          return false;
        }
      } catch (error) {
        console.warn('Permission request error:', error);
        // Continue anyway, the document picker will handle it
      }
    }
    return true;
  };

  // Select document
  const selectDocument = async () => {
    try {
      // Request permissions first
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) {
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: Object.keys(supportedTypes),
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        setSelectedDocument(document);
        
        // Process document content
        await processDocument(document);
        
        showSuccess('Document selected successfully!');
        onDocumentSelected && onDocumentSelected(document);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      showError('Failed to select document. Please try again.');
    }
  };

  // Process document content
  const processDocument = async (document) => {
    try {
      setIsProcessing(true);
      
      // Check file size (limit to 10MB)
      if (document.size && document.size > 10 * 1024 * 1024) {
        showWarning('File size too large. Please select a file smaller than 10MB.');
        return;
      }

      // For text files, read content directly
      if (document.mimeType === 'text/plain') {
        try {
          const content = await FileSystem.readAsStringAsync(document.uri);
          setDocumentContent(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
        } catch (readError) {
          console.error('Error reading text file:', readError);
          setDocumentContent('Preview not available for this file type.');
        }
      } else {
        // For other file types, show file info
        setDocumentContent(`${document.name}\nSize: ${formatFileSize(document.size)}\nType: ${getFileTypeInfo(document.mimeType).name}`);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      showError('Failed to process document content');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type info
  const getFileTypeInfo = (mimeType) => {
    return supportedTypes[mimeType] || { name: 'Document', icon: 'document', color: '#6B7280' };
  };

  // Handle document analysis
  const handleAnalyze = async () => {
    if (!selectedDocument) {
      showError('No document selected for analysis');
      return;
    }

    try {
      await onDocumentAnalyzed(selectedDocument);
    } catch (error) {
      console.error('Document analysis error:', error);
      showError('Failed to analyze document. Please try again.');
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedDocument(null);
    setDocumentContent('');
    setIsProcessing(false);
    onClose();
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDocument(null);
    setDocumentContent('');
  };

  const fileTypeInfo = selectedDocument ? getFileTypeInfo(selectedDocument.mimeType) : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Document Analysis</Text>
          
          {selectedDocument && (
            <TouchableOpacity
              style={[styles.analyzeButton, (isAnalyzing || isProcessing) && styles.analyzeButtonDisabled]}
              onPress={handleAnalyze}
              disabled={isAnalyzing || isProcessing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.analyzeButtonText}>Analyze</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Document Selection */}
          {!selectedDocument ? (
            <View style={styles.selectionContainer}>
              <View style={styles.selectionContent}>
                <Ionicons name="cloud-upload" size={wp('15%')} color="#007AFF" />
                <Text style={styles.selectionTitle}>Select Document</Text>
                <Text style={styles.selectionText}>
                  Choose a document to analyze with AI. Supported formats include PDF, Word, Excel, and text files.
                </Text>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={selectDocument}
                  activeOpacity={0.7}
                >
                  <Ionicons name="folder-open" size={wp('5%')} color="#FFF" />
                  <Text style={styles.selectButtonText}>Choose File</Text>
                </TouchableOpacity>

                {/* Supported formats */}
                <View style={styles.formatsContainer}>
                  <Text style={styles.formatsTitle}>Supported Formats:</Text>
                  <View style={styles.formatChips}>
                    {Object.values(supportedTypes).map((type, index) => (
                      <View key={index} style={[styles.formatChip, { backgroundColor: type.color + '20' }]}>
                        <Ionicons name={type.icon} size={wp('4%')} color={type.color} />
                        <Text style={[styles.formatChipText, { color: type.color }]}>
                          {type.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Selected Document */}
              <View style={styles.documentContainer}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <Ionicons 
                      name={fileTypeInfo.icon} 
                      size={wp('8%')} 
                      color={fileTypeInfo.color} 
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={2}>
                      {selectedDocument.name}
                    </Text>
                    <Text style={styles.documentMeta}>
                      {formatFileSize(selectedDocument.size)} • {fileTypeInfo.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={clearSelection}
                  >
                    <Ionicons name="trash" size={wp('5%')} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Document Preview */}
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.processingText}>Processing document...</Text>
                  </View>
                ) : (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewTitle}>Preview:</Text>
                    <Text style={styles.previewContent}>{documentContent}</Text>
                  </View>
                )}
              </View>

              {/* Analysis Loading */}
              {isAnalyzing && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Analyzing document...</Text>
                  <Text style={styles.loadingSubtext}>
                    This may take a moment depending on document size and complexity
                  </Text>
                </View>
              )}

              {/* Analysis Results */}
              {analysisResult && !isAnalyzing && (
                <View style={styles.resultsContainer}>
                  <View style={styles.resultsHeader}>
                    <Ionicons name="bulb" size={wp('5%')} color="#007AFF" />
                    <Text style={styles.resultsTitle}>Analysis Results</Text>
                  </View>
                  
                  <View style={styles.resultsContent}>
                    <Text style={styles.resultsText}>{analysisResult}</Text>
                  </View>

                  <View style={styles.resultsActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => showWarning('Copy functionality coming soon!')}
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
            </>
          )}
        </ScrollView>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Document Analysis Tips:</Text>
          <Text style={styles.tipsText}>
            • PDF and Word documents work best{'\n'}
            • Ensure text is clear and readable{'\n'}
            • Files under 10MB process faster
          </Text>
        </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },
  container: {
    width: '100%',
    maxWidth: wp('90%'),
    height: hp('85%'),
    backgroundColor: '#F8F9FA',
    borderRadius: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#FFF',
    borderTopLeftRadius: wp('4%'),
    borderTopRightRadius: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: hp('2%'),
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  selectionContent: {
    alignItems: 'center',
  },
  selectionTitle: {
    fontSize: wp('6%'),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  selectionText: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: wp('5%'),
    marginBottom: hp('3%'),
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: wp('6%'),
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    marginBottom: hp('3%'),
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: wp('4%'),
    fontWeight: '600',
    marginLeft: wp('2%'),
  },
  formatsContainer: {
    alignItems: 'center',
  },
  formatsTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  formatChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('4%'),
    margin: wp('1%'),
  },
  formatChipText: {
    fontSize: wp('3%'),
    fontWeight: '500',
    marginLeft: wp('1%'),
  },
  documentContainer: {
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  documentIcon: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('2%'),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  documentMeta: {
    fontSize: wp('3%'),
    color: '#6B7280',
    marginTop: hp('0.5%'),
  },
  removeButton: {
    padding: wp('2%'),
  },
  previewContainer: {
    backgroundColor: '#F8F9FA',
    padding: wp('3%'),
    borderRadius: wp('2%'),
  },
  previewTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  previewContent: {
    fontSize: wp('3%'),
    color: '#6B7280',
    lineHeight: wp('4.5%'),
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: hp('4%'),
  },
  processingText: {
    fontSize: wp('4%'),
    color: '#333',
    marginTop: hp('2%'),
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

export default DocumentUploadModal;