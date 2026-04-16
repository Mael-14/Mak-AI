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
  Image,
  Dimensions,
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
  Play,
  Music,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MathJaxProvider from '../../components/MathJaxProvider';
import { multiModalAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, AudioModule } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================
const CONFIG = {
  // Replace with your n8n webhook URL after importing the workflow
  API_URL: 'https://n8n.srv1427812.hstgr.cloud/webhook/chat',

  // Student level - can be made dynamic based on user profile
  STUDENT_LEVEL: 'A-Level', // or 'O-Level'

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,

  // Enable debug mode to see full response in console
  DEBUG: true,
};

// ============================================================
// HELPERS
// ============================================================

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Document';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  if (mimeType === 'text/plain') return 'Text';
  return 'Document';
};

const formatVoiceDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const VOICE_WAVE_HEIGHTS = [6, 10, 16, 8, 18, 12, 20, 10, 16, 8, 14, 10];

const getFileIconColor = (mimeType) => {
  if (!mimeType) return '#6B7280';
  if (mimeType === 'application/pdf') return '#EF4444';
  if (mimeType.includes('word')) return '#2563EB';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#059669';
  return '#6B7280';
};

// ============================================================
// MESSAGE COMPONENTS — defined outside AiChatScreen so they
// are stable across re-renders and never cause WebView reloads
// ============================================================

const UserMessage = ({ text, time, hasImage, hasDocument, imageUri, document, audioUri, duration, hasVoice, onEdit, onRegenerate }) => (
  <View style={styles.userMessageContainer}>

    {/* ── Voice note card — standalone grey card, outside bubble ── */}
    {hasVoice && audioUri && (
      <View style={styles.voiceNoteCard}>
        <View style={styles.voicePlayBtn}>
          <Play size={14} color="#fff" fill="#fff" />
        </View>
        <View style={styles.voiceWaveRow}>
          {VOICE_WAVE_HEIGHTS.map((h, i) => (
            <View key={i} style={[styles.voiceWaveBar, { height: h }]} />
          ))}
        </View>
        <Text style={styles.voiceNoteDuration}>{formatVoiceDuration(duration)}</Text>
      </View>
    )}

    {/* ── Document card — standalone grey card, outside bubble ── */}
    {hasDocument && document && (
      <View style={styles.docAttachmentCard}>
        <View style={[styles.docAttachmentIconBox, { backgroundColor: getFileIconColor(document.mimeType) + '22' }]}>
          <FileText size={20} color={getFileIconColor(document.mimeType)} />
        </View>
        <View style={styles.docAttachmentInfo}>
          <Text style={styles.docAttachmentName} numberOfLines={1}>{document.name}</Text>
          <Text style={styles.docAttachmentMeta}>
            {getFileTypeLabel(document.mimeType)}{document.size ? '  ·  ' + formatFileSize(document.size) : ''}
          </Text>
        </View>
      </View>
    )}

    {/* ── Bubble — only for image + text ── */}
    {(hasImage || !!text) && (
      <View style={styles.userBubble}>
        {hasImage && imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.messageImageThumb}
            resizeMode="cover"
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />
        )}
        {!!text && <Text style={styles.userMessageText}>{text}</Text>}
      </View>
    )}

    <Text style={styles.userTimeText}>{time}</Text>
    <View style={styles.userActions}>
      <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(text)}>
        <Edit2 size={16} color="#666" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onRegenerate(text)}>
        <RotateCcw size={16} color="#666" />
      </TouchableOpacity>
    </View>
  </View>
);

const AiMessage = ({ title, text, time, isError, onCopy }) => (
  <View style={styles.aiMessageContainer}>
    <View style={[styles.aiAvatar, isError && styles.aiAvatarError]}>
      <Text style={styles.aiAvatarText}>M</Text>
    </View>
    <View style={styles.aiMessageBody}>
      <View style={[styles.aiContent, isError && styles.errorContent]}>
        {title && <Text style={[styles.aiTitle, isError && styles.errorTitle]}>{title}</Text>}
        <MathJaxProvider html={text} />
        <Text style={styles.aiTimeText}>{time}</Text>
      </View>
      {!isError && (
        <View style={styles.aiActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ThumbsUp size={16} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ThumbsDown size={16} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onCopy(text)}>
            <Copy size={16} color="#999" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

const TypingIndicator = () => (
  <View style={styles.aiMessageContainer}>
    <View style={styles.aiAvatar}>
      <Text style={styles.aiAvatarText}>M</Text>
    </View>
    <View style={[styles.aiContent, styles.typingContainer]}>
      <View style={styles.typingRow}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.typingText}>Mak is thinking...</Text>
      </View>
    </View>
  </View>
);

const SalutationMessage = ({ studentLevel }) => (
  <View style={styles.salutationContainer}>
    <View style={styles.salutationContent}>
      <Text style={styles.salutationTitle}>Hello! 👋</Text>
      <Text style={styles.salutationText}>
        I'm your GCE AI tutor. Ask me anything about {studentLevel} subjects:
      </Text>
    </View>
  </View>
);

// ============================================================

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
  const recordingTimerRef = useRef(null);

  // Multi-modal states
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null); // { uri, duration }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Audio recorder hook (expo-audio)
  const audioRecorder = useAudioRecorder({
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    extension: '.m4a',
    outputFormat: 'mpeg_4',
  });

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
          inputType: 'text',
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
   * Show camera/gallery choice sheet
   */
  const handleImageUpload = () => {
    setShowPlusMenu(false);
    // Delay alert so the plus menu finishes closing first
    setTimeout(() => {
      Alert.alert(
        'Add Image',
        null,
        [
          // Delay picker launch so the alert finishes dismissing first (Android requirement)
          { text: 'Take Photo', onPress: () => setTimeout(handleTakePhoto, 300) },
          { text: 'Choose from Gallery', onPress: () => setTimeout(handleSelectFromGallery, 300) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }, 200);
  };

  /**
   * Handle document upload — directly opens file picker, no modal
   */
  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedDocument(result.assets[0]);
        setShowPlusMenu(false);
      }
    } catch (error) {
      showError('Failed to select document. Please try again.');
    }
  };

  /**
   * Handle voice recording from plus menu
   */
  /**
   * Start inline recording (WhatsApp-style)
   */
  const handleStartRecording = async () => {
    setShowPlusMenu(false);
    setTimeout(async () => {
      try {
        const { status } = await AudioModule.requestRecordingPermissionsAsync();
        if (status !== 'granted') {
          showError('Microphone permission is required to record audio');
          return;
        }
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (e) {
        showError('Failed to start recording. Please try again.');
      }
    }, 250);
  };

  /**
   * Stop recording and create voice chip (user then sends manually)
   */
  const handleStopRecording = async () => {
    try {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const capturedDuration = recordingDuration;
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setIsRecording(false);
      setRecordingDuration(0);
      if (uri) {
        setSelectedVoice({ uri, duration: capturedDuration });
      }
    } catch (e) {
      setIsRecording(false);
      setRecordingDuration(0);
      showError('Failed to stop recording.');
    }
  };

  /**
   * Cancel recording without saving
   */
  const handleCancelRecording = async () => {
    try {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioRecorder.isRecording) await audioRecorder.stop();
    } catch (_) { }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  /**
   * Import an audio file from device storage
   */
  const handleImportAudio = async () => {
    setShowPlusMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setSelectedVoice({ uri: file.uri, duration: 0, name: file.name });
      }
    } catch (e) {
      showError('Failed to import audio file.');
    }
  };

  const handleVoiceRecordFromMenu = handleStartRecording;

  /**
   * Take photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('Camera permission is required to take photos');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      showError('Failed to take photo. Please try again.');
    }
  };

  /**
   * Pick image from gallery
   */
  const handleSelectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Gallery permission is required to select photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      showError('Failed to select image. Please try again.');
    }
  };

  /**
   * Send message with attachments — encodes files as base64 and routes by inputType
   */
  const sendMessageWithAttachments = async (messageText, imageUri = null, documentData = null, voiceData = null) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

      let body;

      if (imageUri) {
        // Encode image to base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        // Detect mime type from extension
        const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        const imageMediaType = mimeMap[ext] || 'image/jpeg';

        body = {
          message: messageText || 'Please analyze this image.',
          sessionId,
          userId,
          level: CONFIG.STUDENT_LEVEL,
          inputType: 'image',
          imageBase64: base64,
          imageMediaType,
        };
      } else if (documentData) {
        let documentContent = '';
        let documentBase64 = '';
        if (documentData.mimeType === 'text/plain' && documentData.uri) {
          try {
            documentContent = await FileSystem.readAsStringAsync(documentData.uri, { encoding: FileSystem.EncodingType.UTF8 });
          } catch (_) { documentContent = ''; }
        } else if (documentData.uri) {
          // Read PDF/Word/Excel as base64 for Anthropic document API
          try {
            documentBase64 = await FileSystem.readAsStringAsync(documentData.uri, { encoding: FileSystem.EncodingType.Base64 });
          } catch (_) { documentBase64 = ''; }
        }

        body = {
          message: messageText || 'Please analyze this document.',
          sessionId,
          userId,
          level: CONFIG.STUDENT_LEVEL,
          inputType: 'document',
          documentName: documentData.name || 'document',
          documentMimeType: documentData.mimeType || 'application/octet-stream',
          documentContent,
          documentBase64,
        };
      } else if (voiceData) {
        // Encode audio to base64
        const base64Audio = await FileSystem.readAsStringAsync(voiceData.uri, { encoding: FileSystem.EncodingType.Base64 });
        const ext = voiceData.uri.split('.').pop()?.toLowerCase() || 'm4a';
        const audioMimeMap = { m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm' };
        const audioMimeType = audioMimeMap[ext] || 'audio/mp4';

        body = {
          message: messageText || '',
          sessionId,
          userId,
          level: CONFIG.STUDENT_LEVEL,
          inputType: 'voice',
          audioBase64: base64Audio,
          audioMimeType,
          audioDuration: voiceData.duration || 0,
        };
      } else {
        body = {
          message: messageText,
          sessionId,
          userId,
          level: CONFIG.STUDENT_LEVEL,
          inputType: 'text',
        };
      }

      if (CONFIG.DEBUG) {
        const logBody = { ...body };
        if (logBody.imageBase64) logBody.imageBase64 = `[base64 ${logBody.imageBase64.length} chars]`;
        if (logBody.audioBase64) logBody.audioBase64 = `[base64 ${logBody.audioBase64.length} chars]`;
        console.log('📤 Sending multimodal request:', logBody);
      }

      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await res.text();
      let data;
      try { data = JSON.parse(responseText); } catch (_) {
        throw new Error('AI service returned invalid response');
      }

      if (!res.ok) throw new Error((data && data.error) || `Server error: ${res.status}`);

      if (data && data.success === true && data.response) {
        return { text: data.response, sessionId: data.sessionId || sessionId, timestamp: data.timestamp || new Date().toISOString() };
      }
      if (data && data.success === false && data.error) throw new Error(data.error);
      if (typeof data === 'string') return { text: data, sessionId, timestamp: new Date().toISOString() };
      if (data && data.response) return { text: data.response, sessionId: data.sessionId || sessionId, timestamp: data.timestamp || new Date().toISOString() };

      throw new Error('Invalid response format from server');
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Request timeout. Please try again.');
      console.error('Send message with attachments error:', error);
      throw error;
    }
  };

  /**
   * Handle sending a message
   */
  const handleSend = async () => {
    if (inputText.trim() === '' && !selectedImage && !selectedDocument && !selectedVoice) return;

    const userMessageText = inputText.trim();
    const capturedImage = selectedImage;
    const capturedDocument = selectedDocument;
    const capturedVoice = selectedVoice;

    const newMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: userMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasImage: !!capturedImage,
      hasDocument: !!capturedDocument,
      hasVoice: !!capturedVoice,
      imageUri: capturedImage,
      document: capturedDocument,
      audioUri: capturedVoice?.uri,
      duration: capturedVoice?.duration,
    };

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
    setSelectedVoice(null);
    Keyboard.dismiss();

    setIsTyping(true);

    try {
      const aiResponse = await sendMessageWithAttachments(userMessageText, capturedImage, capturedDocument, capturedVoice);

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
  const handleCopyMessage = React.useCallback((text) => {
    // TODO: Implement clipboard copy
    Alert.alert('Copied', 'Message copied to clipboard');
  }, []);

  const handleEditMessage = React.useCallback((text) => {
    setInputText(text);
  }, []);

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
            <SalutationMessage studentLevel={CONFIG.STUDENT_LEVEL} />
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
                  onEdit={handleEditMessage}
                  onRegenerate={handleRegenerate}
                />
              ) : (
                <AiMessage
                  key={msg.id}
                  title={msg.title}
                  text={msg.text}
                  time={msg.time}
                  isError={msg.isError}
                  onCopy={handleCopyMessage}
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
                handleVoiceRecordFromMenu();
              }}
            >
              <View style={styles.plusMenuIcon}>
                <Mic size={18} color="#FF6B6B" />
              </View>
              <Text style={styles.plusMenuText}>Record Voice</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.plusMenuItem}
              onPress={handleImportAudio}
            >
              <View style={styles.plusMenuIcon}>
                <Music size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.plusMenuText}>Import Audio</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {/* Image attachment chip */}
          {selectedImage && (
            <View style={styles.imageChipRow}>
              <View style={styles.imageChipWrapper}>
                <Image source={{ uri: selectedImage }} style={styles.imageChip} resizeMode="cover" />
                <TouchableOpacity style={styles.imageChipRemove} onPress={() => setSelectedImage(null)}>
                  <X size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Voice attachment chip */}
          {selectedVoice && !isRecording && (
            <View style={styles.docChipRow}>
              <View style={styles.voiceInputChip}>
                <View style={styles.voiceInputPlayBtn}>
                  <Play size={13} color="#fff" fill="#fff" />
                </View>
                <View style={styles.voiceInputWave}>
                  {[6, 10, 16, 8, 18, 12, 14, 9].map((h, i) => (
                    <View key={i} style={[styles.voiceInputBar, { height: h }]} />
                  ))}
                </View>
                <Text style={styles.voiceInputDuration}>{formatVoiceDuration(selectedVoice.duration)}</Text>
                <TouchableOpacity onPress={() => setSelectedVoice(null)} style={styles.docChipRemove}>
                  <X size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Document attachment chip */}
          {selectedDocument && (
            <View style={styles.docChipRow}>
              <View style={styles.docChip}>
                <View style={[styles.docChipIconBox, { backgroundColor: getFileIconColor(selectedDocument.mimeType) + '18' }]}>
                  <FileText size={16} color={getFileIconColor(selectedDocument.mimeType)} />
                </View>
                <View style={styles.docChipInfo}>
                  <Text style={styles.docChipName} numberOfLines={1}>{selectedDocument.name}</Text>
                  <Text style={styles.docChipMeta}>
                    {getFileTypeLabel(selectedDocument.mimeType)}{selectedDocument.size ? '  ·  ' + formatFileSize(selectedDocument.size) : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDocument(null)} style={styles.docChipRemove}>
                  <X size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Input row */}
          {isRecording ? (
            /* ── WhatsApp-style recording bar ── */
            <View style={styles.recordingBar}>
              <TouchableOpacity style={styles.recordingCancelBtn} onPress={handleCancelRecording}>
                <Trash2 size={22} color="#EF4444" />
              </TouchableOpacity>

              <View style={styles.recordingInfo}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTimer}>{formatVoiceDuration(recordingDuration)}</Text>
                <View style={styles.recordingWave}>
                  {[6, 12, 18, 10, 16, 8, 14, 12, 18, 10].map((h, i) => (
                    <View key={i} style={[styles.recordingWaveBar, { height: h }]} />
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.recordingSendBtn} onPress={handleStopRecording}>
                <Send size={20} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Normal input row ── */
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => setShowPlusMenu(!showPlusMenu)}
              >
                <Plus size={24} color={showPlusMenu ? "#007AFF" : "#000"} />
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={selectedDocument ? 'Add instructions...' : selectedVoice ? 'Add a note...' : 'Ask a GCE question...'}
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
                  ((!inputText.trim() && !selectedDocument && !selectedImage && !selectedVoice) || isTyping) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={(!inputText.trim() && !selectedDocument && !selectedImage && !selectedVoice) || isTyping}
              >
                {isTyping ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Send
                    size={20}
                    color={(inputText.trim() || selectedDocument || selectedImage || selectedVoice) ? "#007AFF" : "#ccc"}
                    fill={(inputText.trim() || selectedDocument || selectedImage || selectedVoice) ? "#007AFF" : "none"}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfdff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fdfdfdff',
    //marginTop: 20,
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
    paddingTop: 8,
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
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A2F6E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    flexShrink: 0,
  },
  aiAvatarError: {
    backgroundColor: '#FF4444',
  },
  aiAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  aiMessageBody: {
    flex: 1,
  },
  aiContent: {
    backgroundColor: 'transparent',
    paddingBottom: 4,
  },
  errorContent: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    color: '#007AFF',
  },
  errorTitle: {
    color: '#FF4444',
  },
  aiTimeText: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 6,
  },
  aiActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  typingContainer: {
    paddingVertical: 4,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingText: {
    fontStyle: 'italic',
    color: '#888',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  docChipRow: {
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docChipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  docChipInfo: {
    flex: 1,
  },
  docChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  docChipMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  docChipRemove: {
    padding: 4,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // ── Voice note card inside sent message ──
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 10,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  voiceWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#6B7280',
    opacity: 0.8,
  },
  voiceNoteDuration: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flexShrink: 0,
  },
  // ── Recording bar (replaces input row while recording) ──
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  recordingCancelBtn: {
    padding: 8,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingTimer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    minWidth: 36,
  },
  recordingWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  recordingWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    opacity: 0.6,
  },
  recordingSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Voice chip in input bar (imported or recorded) ──
  voiceInputChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  voiceInputPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInputWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  voiceInputBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    opacity: 0.6,
  },
  voiceInputDuration: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  imageContainer: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  // Image chip in input bar
  imageChipRow: {
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  imageChipWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imageChip: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imageChipRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Image thumbnail inside message bubble
  messageImageThumb: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.5,
    marginHorizontal: -16,
    marginTop: -12,
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
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
  docAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  docAttachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  docAttachmentInfo: {
    flex: 1,
  },
  docAttachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  docAttachmentMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
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