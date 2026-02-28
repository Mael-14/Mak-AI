import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { 
  ChevronLeft, 
  Settings2, 
  HelpCircle, 
  Plus, 
  Send, 
  Edit2, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Copy,
  History,
  MessageSquarePlus,
  Menu,
  X,
  Trash2,
  Camera,
  Mic,
  FileText,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MathJaxProvider from '../../components/MathJaxProvider';
import ImageAnalysisModal from '../../components/ImageAnalysisModal';
import ImageUploadButton from '../../components/ImageUploadButton';
import VoiceRecorder from '../../components/VoiceRecorder';
import DocumentUploadModal from '../../components/DocumentUploadModal';
import { multiModalAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import * as ImagePicker from 'expo-image-picker';

// ============================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================
const CONFIG = {
  // Replace with your n8n webhook URL after importing the workflow
  API_URL: 'https://n8n.srv1427812.hstgr.cloud/webhook-test/chat',
  
  // Student level - can be made dynamic based on user profile
  STUDENT_LEVEL: 'A-Level', // or 'O-Level'
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Enable debug mode to see full response in console
  DEBUG: true,
};

const AiChatScreen = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const scrollViewRef = useRef();

  // Multi-modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showPlusImageModal, setShowPlusImageModal] = useState(false);
  const [showPlusVoiceModal, setShowPlusVoiceModal] = useState(false);

  const { showError, showSuccess, showWarning } = useToast();


  // Get user ID from route params or use default
  const userId = route?.params?.userId || 'anonymous';


  /**
   * Load all conversations from AsyncStorage
   */
  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem(`chats_${userId}`);
      if (stored) {
        const chats = JSON.parse(stored);
        setConversations(chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  /**
   * Save current conversation to AsyncStorage
   */
  const saveConversation = async (chatId, chatMessages) => {
    try {
      const chats = await AsyncStorage.getItem(`chats_${userId}`);
      const existingChats = chats ? JSON.parse(chats) : [];
      
      const chatTitle = chatMessages.length > 0 
        ? chatMessages[0].text.substring(0, 40) + (chatMessages[0].text.length > 40 ? '...' : '')
        : 'New Chat';

      const chatObj = {
        id: chatId,
        title: chatTitle,
        messages: chatMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update or add chat
      const updatedChats = existingChats.filter(c => c.id !== chatId);
      updatedChats.unshift(chatObj);

      await AsyncStorage.setItem(`chats_${userId}`, JSON.stringify(updatedChats));
      setConversations(updatedChats);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  /**
   * Delete a conversation
   */
  const deleteConversation = async (chatId) => {
    try {
      const chats = await AsyncStorage.getItem(`chats_${userId}`);
      const existingChats = chats ? JSON.parse(chats) : [];
      const filteredChats = existingChats.filter(c => c.id !== chatId);
      
      await AsyncStorage.setItem(`chats_${userId}`, JSON.stringify(filteredChats));
      setConversations(filteredChats);
      
      if (currentChatId === chatId) {
        setMessages([]);
        setIsNewChat(true);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  /**
   * Load a past conversation
   */
  const loadConversation = async (chatId) => {
    try {
      const chats = await AsyncStorage.getItem(`chats_${userId}`);
      const existingChats = chats ? JSON.parse(chats) : [];
      const chat = existingChats.find(c => c.id === chatId);
      
      if (chat) {
        setMessages(chat.messages);
        setCurrentChatId(chatId);
        setIsNewChat(false);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [userId]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveConversation(currentChatId, messages);
    }
  }, [messages]);

  /**
   * Send message to n8n webhook and get AI response
   */
  const sendMessageToAI = async (message) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      if (CONFIG.DEBUG) {
        console.log('📤 Sending request to:', CONFIG.API_URL);
        console.log('📤 Request body:', {
          message,
          sessionId,
          userId,
          level: CONFIG.STUDENT_LEVEL,
        });
      }

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          userId: userId,
          level: CONFIG.STUDENT_LEVEL,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (CONFIG.DEBUG) {
        console.log('📥 Response status:', response.status);
      }

      // Get response text first
      const responseText = await response.text();
      
      if (CONFIG.DEBUG) {
        console.log('📥 Raw response:', responseText.substring(0, 200));
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        if (CONFIG.DEBUG) {
          console.log('✅ Parsed JSON successfully');
        }
      } catch (jsonError) {
        console.error('❌ JSON Parse Error:', jsonError);
        throw new Error('AI service returned invalid response');
      }

      if (!response.ok) {
        throw new Error((data && data.error) || `Server error: ${response.status}`);
      }

      // Handle different response formats
      if (data && data.success === true && data.response) {
        return {
          text: data.response,
          sessionId: data.sessionId || sessionId,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }
      
      if (data && data.success === false && data.error) {
        throw new Error(data.error);
      }

      if (typeof data === 'string') {
        return {
          text: data,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
        };
      }

      if (data && data.response && typeof data.response === 'string') {
        return {
          text: data.response,
          sessionId: data.sessionId || sessionId,
          timestamp: data.timestamp || new Date().toISOString(),
        };
      }

      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('❌ Error calling AI API:', error);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  };

  /**
   * Handle image upload from plus menu
   */
  const handleImageUpload = () => {
    setShowPlusImageModal(true);
  };

  /**
   * Handle document upload from plus menu
   */
  const handleDocumentUpload = () => {
    // Trigger the document upload modal
    setShowDocumentModal(true);
  };

  /**
   * Handle voice recording from plus menu
   */
  const handleVoiceRecordFromMenu = () => {
    setShowPlusVoiceModal(true);
  };

  /**
   * Handle camera photo from plus menu
   */
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('Camera permission is required to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowPlusImageModal(false);
        handleImageSelected(imageUri);
        showSuccess('Photo captured successfully!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      showError('Failed to take photo. Please try again.');
    }
  };

  /**
   * Handle gallery selection from plus menu
   */
  const handleSelectFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Gallery permission is required to select photos');
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowPlusImageModal(false);
        handleImageSelected(imageUri);
        showSuccess('Image selected successfully!');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      showError('Failed to select image. Please try again.');
    }
  };

  /**
   * Handle image selection
   */
  const handleImageSelected = (imageUri) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  /**
   * Handle image analysis
   */
  const handleImageAnalysis = async (imageUri) => {
    try {
      setIsAnalyzingImage(true);
      setImageAnalysis(null);

      // Try the new multi-modal API first, then fall back to existing endpoint
      let response;
      try {
        response = await multiModalAPI.analyzeImage(imageUri, inputText || 'Analyze this image', sessionId, userId);
      } catch (apiError) {
        console.warn('Multi-modal API not available, falling back to existing endpoint');
        // Fallback: Add image as attachment and send with existing text
        response = await multiModalAPI.sendToExistingEndpoint(
          inputText || 'Please analyze this image and help me understand what it shows.',
          imageUri,
          sessionId,
          userId,
          CONFIG.STUDENT_LEVEL
        );
      }

      const analysisText = response?.response || response?.text || 'Analysis completed';
      setImageAnalysis(analysisText);
      return analysisText;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  /**
   * Handle document selection
   */
  const handleDocumentSelected = (document) => {
    setSelectedDocument(document);
  };

  /**
   * Handle document analysis
   */
  const handleDocumentAnalysis = async (document) => {
    try {
      setIsAnalyzingDocument(true);
      setDocumentAnalysis(null);

      // Try the new multi-modal API
      const response = await multiModalAPI.analyzeDocument(
        document.uri,
        document.name,
        inputText || 'Analyze this document',
        sessionId,
        userId
      );

      const analysisText = response?.response || response?.text || 'Document analysis completed';
      setDocumentAnalysis(analysisText);
      return analysisText;
    } catch (error) {
      console.error('Document analysis error:', error);
      // Fallback for document analysis
      const fallbackText = `I can see you've uploaded a document: "${document.name}". While I can't process this document directly in this demo, I can help you with questions about its content if you describe what it contains.`;
      setDocumentAnalysis(fallbackText);
      return fallbackText;
    } finally {
      setIsAnalyzingDocument(false);
    }
  };

  /**
   * Handle voice recording
   */
  const handleVoiceRecorded = async (audioUri, duration) => {
    try {
      // Add voice message to chat
      const voiceMessage = {
        id: Date.now().toString(),
        type: 'user',
        messageType: 'voice',
        audioUri: audioUri,
        duration: duration,
        text: `🎵 Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, voiceMessage]);
      showSuccess('Voice message added to chat!');
    } catch (error) {
      console.error('Voice recording error:', error);
      showError('Failed to process voice message');
    }
  };

  /**
   * Handle speech-to-text conversion
   */
  const handleTranscriptReady = (transcript) => {
    setInputText(transcript);
    showSuccess('Speech converted to text!');
  };

  /**
   * Send message with attachments
   */
  const sendMessageWithAttachments = async (messageText, imageUri = null, documentData = null) => {
    try {
      let response;
      let analysisResult = '';

      if (imageUri) {
        // Handle image analysis
        analysisResult = await handleImageAnalysis(imageUri);
        response = {
          text: analysisResult,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
        };
      } else if (documentData) {
        // Handle document analysis
        analysisResult = await handleDocumentAnalysis(documentData);
        response = {
          text: analysisResult,
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Regular text message
        response = await sendMessageToAI(messageText);
      }

      return response;
    } catch (error) {
      console.error('Send message with attachments error:', error);
      throw error;
    }
  };

  /**
   * Handle sending a message
   */
  const handleSend = async () => {
    if (inputText.trim() === '' && !selectedImage && !selectedDocument) return;

    const userMessageText = inputText.trim();
    
    // Create user message with attachments
    const newMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasImage: !!selectedImage,
      hasDocument: !!selectedDocument,
      imageUri: selectedImage,
      document: selectedDocument,
    };

    // Create new chat ID if this is the first message
    let chatId = currentChatId;
    if (isNewChat) {
      chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentChatId(chatId);
      setMessages([newMessage]);
      setIsNewChat(false);
    } else {
      setMessages(prev => [...prev, newMessage]);
    }

    setInputText('');
    setSelectedImage(null);
    setSelectedDocument(null);
    setShowImageModal(false);
    setShowDocumentModal(false);
    Keyboard.dismiss();

    // Show typing indicator
    setIsTyping(true);

    try {
      // Get AI response based on message type
      const aiResponse = await sendMessageWithAttachments(userMessageText, selectedImage, selectedDocument);

      setIsTyping(false);

      // Add AI response to messages
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        title: 'Answer:',
        text: aiResponse.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sessionId: aiResponse.sessionId,
        serverTimestamp: aiResponse.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setIsTyping(false);

      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        title: 'Error:',
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);

      // Show toast for network errors
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        showError('Unable to connect to the AI service. Please check your internet connection and try again.');
      }
    }
  };

  /**
   * Handle starting a new chat
   */
  const handleNewChat = () => {
    Alert.alert(
      'Start New Chat',
      'Are you sure you want to start a new conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Chat',
          onPress: async () => {
            // Save current chat if it has messages
            if (messages.length > 0 && currentChatId) {
              await saveConversation(currentChatId, messages);
            }

            // Reset for new chat
            setMessages([]);
            setIsNewChat(true);
            setCurrentChatId(null);
            setShowDropdown(false);
            setInputText('');
            await loadConversations();
          },
        },
      ]
    );
  };

  /**
   * Handle viewing chat history
   */
  const handleHistory = () => {
    setShowDropdown(false);
    setShowSidebar(true);
  };

  /**
   * Handle copying message text
   */
  const handleCopyMessage = (text) => {
    // TODO: Implement clipboard copy
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  /**
   * Handle regenerating response
   */
  const handleRegenerate = async (messageText) => {
    setIsTyping(true);
    try {
      const aiResponse = await sendMessageToAI(messageText);
      setIsTyping(false);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        title: 'Regenerated Answer:',
        text: aiResponse.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setIsTyping(false);
      Alert.alert('Error', 'Failed to regenerate response');
    }
  };

  /**
   * User Message Component with multi-modal support
   */
  const UserMessage = ({ text, time, hasImage, hasDocument, imageUri, document, messageType, audioUri, duration, hasVoice }) => (
    <View style={styles.userMessageContainer}>
      <View style={styles.userBubble}>
        {/* Voice Message */}
        {hasVoice && audioUri && (
          <View style={styles.voiceMessageContainer}>
            <View style={styles.voiceIcon}>
              <Text style={styles.voiceIconText}>🎵</Text>
            </View>
            <Text style={styles.voiceText}>Voice message ({duration}s)</Text>
          </View>
        )}
        
        {/* Image Attachment */}
        {hasImage && imageUri && (
          <View style={styles.imageContainer}>
            <Text style={styles.attachmentText}>📷 Image attached</Text>
          </View>
        )}
        
        {/* Document Attachment */}
        {hasDocument && document && (
          <View style={styles.documentContainer}>
            <Text style={styles.attachmentText}>📄 {document.name}</Text>
          </View>
        )}
        
        {/* Message Text */}
        <Text style={styles.userMessageText}>{text}</Text>
      </View>
      <Text style={styles.userTimeText}>{time}</Text>
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setInputText(text)}
        >
          <Edit2 size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleRegenerate(text)}
        >
          <RotateCcw size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * AI Message Component with MathJax support
   */
  const AiMessage = ({ title, text, time, isError }) => (
    <View style={styles.aiMessageContainer}>
      <View style={[styles.aiContent, isError && styles.errorContent]}>
        {title && <Text style={[styles.aiTitle, isError && styles.errorTitle]}>{title}</Text>}
        <MathJaxProvider html={text} />
        <Text style={styles.aiTimeText}>{time}</Text>
      </View>
      {!isError && (
        <View style={styles.aiActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ThumbsUp size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ThumbsDown size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleCopyMessage(text)}
          >
            <Copy size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /**
   * Typing Indicator Component
   */
  const TypingIndicator = () => (
    <View style={styles.aiMessageContainer}>
      <View style={[styles.aiContent, styles.typingContainer]}>
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Welcome/Salutation Message Component
   */
  const SalutationMessage = () => (
    <View style={styles.salutationContainer}>
      <View style={styles.salutationContent}>
        <Text style={styles.salutationTitle}>Hello! 👋</Text>
        <Text style={styles.salutationText}>
          I'm your GCE AI tutor. Ask me anything about {CONFIG.STUDENT_LEVEL} subjects:
        </Text>
        {/* <View style={styles.subjectChips}>
          {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'].map((subject) => (
            <View key={subject} style={styles.chip}>
              <Text style={styles.chipText}>{subject}</Text>
            </View>
          ))}
        </View> */}
        {/* <Text style={styles.examplePrompt}>Try: "Explain photosynthesis with steps" or "Solve: $x^2 - 5x + 6 = 0$"</Text> */}
      </View>
    </View>
  );

  /**
   * Sidebar Component - Shows past conversations
   */
  const SidebarContent = () => (
    <View style={styles.sidebarContent}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Chat History</Text>
        <TouchableOpacity onPress={() => setShowSidebar(false)}>
          <X size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          handleNewChat();
          setShowSidebar(false);
        }}
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.newChatButtonText}>New Chat</Text>
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <History size={32} color="#ccc" />
          <Text style={styles.emptyStateText}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.conversationItem,
                currentChatId === item.id && styles.conversationItemActive,
              ]}
              onPress={() => loadConversation(item.id)}
            >
              <View style={styles.conversationItemContent}>
                <Text
                  style={[
                    styles.conversationTitle,
                    currentChatId === item.id && styles.conversationTitleActive,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text style={styles.conversationTime}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Chat',
                    'Are you sure you want to delete this conversation?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteConversation(item.id),
                      },
                    ]
                  );
                }}
              >
                <Trash2 size={16} color="#FF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSidebar(!showSidebar)}
          >
            <Menu size={24} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>GCE AI Tutor</Text>
            <Text style={styles.headerSubtitle}>{CONFIG.STUDENT_LEVEL} • Revision Space</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.settingsContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Settings2 size={20} color={showDropdown ? "#007AFF" : "#000"} />
              </TouchableOpacity>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <View style={styles.dropdown}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={handleHistory}
                    activeOpacity={0.7}
                  >
                    <History size={18} color="#000" />
                    <Text style={styles.dropdownText}>History</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={handleNewChat}
                    activeOpacity={0.7}
                  >
                    <MessageSquarePlus size={18} color="#000" />
                    <Text style={styles.dropdownText}>New Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.headerButton}>
              <HelpCircle size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overlay to close dropdown */}
        {showDropdown && (
          <Pressable 
            style={styles.dropdownOverlay}
            onPress={() => setShowDropdown(false)}
          />
        )}

        {/* Overlay to close plus menu */}
        {showPlusMenu && (
          <Pressable 
            style={styles.dropdownOverlay}
            onPress={() => setShowPlusMenu(false)}
          />
        )}

        {/* Message Area */}
        {isNewChat && messages.length === 0 ? (
          <View style={styles.messageList}>
            <SalutationMessage />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length > 0 && (
              <Text style={styles.dateSeparator}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
            
            {messages.map((msg) => (
              msg.type === 'user' ? (
                <UserMessage 
                  key={msg.id} 
                  text={msg.text} 
                  time={msg.time}
                  hasImage={msg.hasImage}
                  hasDocument={msg.hasDocument}
                  hasVoice={msg.hasVoice}
                  imageUri={msg.imageUri}
                  document={msg.document}
                  audioUri={msg.audioUri}
                  duration={msg.duration}
                />
              ) : (
                <AiMessage 
                  key={msg.id} 
                  title={msg.title} 
                  text={msg.text} 
                  time={msg.time}
                  isError={msg.isError}
                />
              )
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>
        )}

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <View style={styles.attachmentsPreview}>
            {attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentPreviewItem}>
                <Text style={styles.attachmentPreviewText}>
                  {attachment.type === 'image' && '📷 '}
                  {attachment.type === 'document' && '📄 '}
                  {attachment.type === 'voice' && '🎵 '}
                  {attachment.name || `${attachment.type} attachment`}
                </Text>
                <TouchableOpacity 
                  onPress={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  style={styles.removeAttachment}
                >
                  <X size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Plus Menu Drop-up */}
        {showPlusMenu && (
          <View style={styles.plusMenuContainer}>
            <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                handleImageUpload();
              }}
            >
              <View style={styles.plusMenuIcon}>
                <Camera size={18} color="#007AFF" />
              </View>
              <Text style={styles.plusMenuText}>Analyze Image</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                handleDocumentUpload();
              }}
            >
              <View style={styles.plusMenuIcon}>
                <FileText size={18} color="#10B981" />
              </View>
              <Text style={styles.plusMenuText}>Import Document</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.plusMenuItem}
              onPress={() => {
                setShowPlusMenu(false);
                handleVoiceRecordFromMenu();
              }}
            >
              <View style={styles.plusMenuIcon}>
                <Mic size={18} color="#FF6B6B" />
              </View>
              <Text style={styles.plusMenuText}>Record Voice</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.plusButton}
            onPress={() => setShowPlusMenu(!showPlusMenu)}
          >
            <Plus size={24} color={showPlusMenu ? "#007AFF" : "#000"} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask a GCE question..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isTyping}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!inputText.trim() && attachments.length === 0 || isTyping) && styles.sendButtonDisabled
            ]} 
            onPress={handleSend}
            disabled={!inputText.trim() && attachments.length === 0 || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Send 
                size={20} 
                color={(inputText.trim() || attachments.length > 0) ? "#007AFF" : "#ccc"} 
                fill={(inputText.trim() || attachments.length > 0) ? "#007AFF" : "none"} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      {showSidebar && (
        <>
          <Pressable
            style={styles.sidebarOverlay}
            onPress={() => setShowSidebar(false)}
          />
          <View style={styles.sidebar}>
            <SidebarContent />
          </View>
        </>
      )}

      {/* Multi-modal Modals */}
      <ImageAnalysisModal
        visible={showImageModal}
        imageUri={selectedImage}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
          setImageAnalysis(null);
        }}
        onAnalyze={handleImageAnalysis}
        isAnalyzing={isAnalyzingImage}
        analysisResult={imageAnalysis}
      />

      <DocumentUploadModal
        visible={showDocumentModal}
        onClose={() => {
          setShowDocumentModal(false);
          setSelectedDocument(null);
          setDocumentAnalysis(null);
        }}
        onDocumentSelected={handleDocumentSelected}
        onAnalyze={handleDocumentAnalysis}
        selectedDocument={selectedDocument}
        isAnalyzing={isAnalyzingDocument}
        analysisResult={documentAnalysis}
      />

      {/* Image Upload Modal from Plus Menu */}
      <Modal
        visible={showPlusImageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPlusImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Select Image Source</Text>
              <TouchableOpacity
                onPress={() => setShowPlusImageModal(false)}
                style={styles.imageModalClose}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.imageModalOption}
              onPress={handleTakePhoto}
            >
              <Camera size={24} color="#007AFF" />
              <View style={styles.imageModalOptionText}>
                <Text style={styles.imageModalOptionTitle}>Take Photo</Text>
                <Text style={styles.imageModalOptionDesc}>Capture a new image with your camera</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.imageModalOption}
              onPress={handleSelectFromGallery}
            >
              <FileText size={24} color="#10B981" />
              <View style={styles.imageModalOptionText}>
                <Text style={styles.imageModalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.imageModalOptionDesc}>Select an existing image from your photos</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Voice Recorder Modal from Plus Menu */}
      {showPlusVoiceModal && (
        <VoiceRecorder 
          onVoiceRecorded={(uri, duration) => {
            handleVoiceRecorded(uri, duration);
            setShowPlusVoiceModal(false);
          }}
          onTranscriptReady={(transcript) => {
            setInputText(prev => prev + transcript);
            setShowPlusVoiceModal(false);
          }}
          mode="speak-to-text"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F2F0',
    marginTop: 20,
    zIndex: 1000,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dateSeparator: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginVertical: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  userBubble: {
    backgroundColor: '#D1D5FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  userTimeText: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userActions: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
    paddingRight: 4,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  aiContent: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  errorContent: {
    backgroundColor: '#FFF3F3',
    borderLeftWidth: 3,
    borderLeftColor: '#FF4444',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#007AFF',
  },
  errorTitle: {
    color: '#FF4444',
  },
  aiTimeText: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  aiActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  typingContainer: {
    opacity: 0.8,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typingText: {
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  plusButton: {
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    maxHeight: 100,
  },
  input: {
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  salutationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  salutationContent: {
    alignItems: 'center',
    maxWidth: 350,
  },
  salutationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  salutationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  subjectChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#E8E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    color: '#4A4AFF',
    fontWeight: '500',
  },
  examplePrompt: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  settingsContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownText: {
    fontSize: 15,
    color: '#000',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: '#fff',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebarContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 20,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  conversationItemActive: {
    backgroundColor: '#f1f1f1',
  },
  conversationItemContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conversationTitleActive: {
    color: '#007bff',
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  // Multi-modal styles
  attachmentsPreview: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  attachmentPreviewText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  removeAttachment: {
    padding: 4,
  },
  multiModalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  multiModalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  multiModalButtonText: {
    fontSize: 16,
  },
  voiceMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  voiceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  voiceIconText: {
    fontSize: 12,
    color: '#FFF',
  },
  voiceText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  imageContainer: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  documentContainer: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  attachmentText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  // Plus menu styles
  plusMenuContainer: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  plusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    activeOpacity: 0.7,
  },
  plusMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  plusMenuText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  plusButton: {
    padding: 12,
    marginRight: 8,
  },
  hiddenComponents: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    top: -1000,
  },
  // Image Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: '90%',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  imageModalClose: {
    padding: 4,
  },
  imageModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageModalOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  imageModalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  imageModalOptionDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AiChatScreen;