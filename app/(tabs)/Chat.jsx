import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Modal,
  Pressable,
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
} from 'lucide-react-native';

const AiChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true); // Track if this is a new chat
  const scrollViewRef = useRef();

  // "Pro" Amelioration: Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputText.trim() === '') return;

    // If this is a new chat (first message), clear any existing messages
    const newMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Start new chat if it's the first message
    if (isNewChat) {
      setMessages([newMessage]);
      setIsNewChat(false);
    } else {
      setMessages([...messages, newMessage]);
    }

    setInputText('');
    Keyboard.dismiss();

    // Simulate AI thinking and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        title: 'Quick Answer:',
        text: "I'm here to help! How can I assist you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsNewChat(true);
    setShowDropdown(false);
    setInputText('');
  };

  const handleHistory = () => {
    // TODO: Implement history functionality
    console.log('History button pressed');
    setShowDropdown(false);
    // For now, just close the dropdown
    // You can add navigation to history screen or show history modal here
    alert('History feature coming soon!');
  };

  const UserMessage = ({ text, time }) => (
    <View style={styles.userMessageContainer}>
      <View style={styles.userBubble}>
        <Text style={styles.userMessageText}>{text}</Text>
        {/* <Text style={styles.userTimeText}>{time}</Text> */}
      </View>
      <Text style={styles.userTimeText}>{time}</Text>
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Edit2 size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <RotateCcw size={16} color="#666" />
        </TouchableOpacity>
        
      </View>
    </View>
  );

  const AiMessage = ({ title, text, time }) => (
    <View style={styles.aiMessageContainer}>
      <View style={styles.aiContent}>
        {title && <Text style={styles.aiTitle}>{title}</Text>}
        <Text style={styles.aiMessageText}>{text}</Text>
      </View>
      <View style={styles.aiActions}>
        <TouchableOpacity style={styles.actionButton}>
          <ThumbsUp size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <ThumbsDown size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Copy size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const TypingIndicator = () => (
    <View style={styles.aiMessageContainer}>
      <View style={[styles.aiContent, styles.typingContainer]}>
        <Text style={styles.typingText}>AI is thinking...</Text>
      </View>
    </View>
  );

  const SalutationMessage = () => (
    <View style={styles.salutationContainer}>
      <View style={styles.salutationContent}>
        <Text style={styles.salutationTitle}>Hello! 👋</Text>
        <Text style={styles.salutationText}>
          I'm your AI assistant. How can I help you today?
        </Text>
      </View>
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
          <TouchableOpacity style={styles.headerButton}>
            <ChevronLeft size={24} color="#000" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.settingsContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => {
                  console.log('Settings clicked, showDropdown:', !showDropdown);
                  setShowDropdown(!showDropdown);
                }}
              >
                <Settings2 size={20} color={showDropdown ? "#007AFF" : "#000"} />
              </TouchableOpacity>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <View style={styles.dropdown}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('History clicked');
                      handleHistory();
                    }}
                    activeOpacity={0.7}
                  >
                    <History size={18} color="#000" />
                    <Text style={styles.dropdownText}>History</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      console.log('New Chat clicked');
                      handleNewChat();
                    }}
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

        {/* Overlay to close dropdown when clicking outside */}
        {showDropdown && (
          <Pressable 
            style={styles.dropdownOverlay}
            onPress={() => {
              console.log('Overlay clicked, closing dropdown');
              setShowDropdown(false);
            }}
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
                {new Date().toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            
            {messages.map((msg) => (
              msg.type === 'user' ? (
                <UserMessage key={msg.id} text={msg.text} time={msg.time} />
              ) : (
                <AiMessage key={msg.id} title={msg.title} text={msg.text} time={msg.time} />
              )
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton}>
            <Plus size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={inputText.trim() ? "#007AFF" : "#ccc"} fill={inputText.trim() ? "#007AFF" : "none"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2F0', // Slightly off-white background like the image
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
    elevation: 0,
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
    backgroundColor: '#D1D5FF', // Soft purple from the image
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
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  aiMessageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
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
    opacity: 0.6,
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
    // Shadow for the input container
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
    maxWidth: 300,
  },
  salutationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  salutationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
});

export default AiChatScreen;

