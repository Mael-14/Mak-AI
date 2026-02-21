import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useToast } from '../context/ToastContext';

const VoiceRecorder = ({ 
  onVoiceRecorded, 
  onTranscriptReady, 
  style,
  mode = 'record' // 'record' | 'speak-to-text'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.5)).current;
  const waveAnim3 = useRef(new Animated.Value(0.7)).current;
  const durationInterval = useRef(null);

  const { showError, showSuccess, showWarning } = useToast();

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [recording]);

  // Request audio permissions
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showError('Microphone permission is required to record audio');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      showError('Failed to request microphone permission');
      return false;
    }
  };

  // Start pulse animation
  const startPulseAnimation = () => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const waveAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    pulseAnimation.start();
    waveAnimations.forEach(anim => anim.start());
  };

  // Stop animations
  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim1.stopAnimation();
    waveAnim2.stopAnimation();
    waveAnim3.stopAnimation();
    
    // Reset to default values
    pulseAnim.setValue(1);
    waveAnim1.setValue(0.3);
    waveAnim2.setValue(0.5);
    waveAnim3.setValue(0.7);
  };

  // Start recording
  const startRecording = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      startPulseAnimation();

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      showSuccess('Recording started');
    } catch (error) {
      console.error('Recording error:', error);
      showError('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      setIsRecording(false);
      stopAnimations();

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      if (uri) {
        if (mode === 'speak-to-text') {
          // Simulate transcription (in real app, you'd call a speech-to-text service)
          setIsTranscribing(true);
          showWarning('Transcribing audio... (This is a demo)');
          
          setTimeout(() => {
            const demoTranscript = "This is a demo transcription. In a real app, you would send the audio to a speech-to-text service.";
            setTranscript(demoTranscript);
            setIsTranscribing(false);
            onTranscriptReady && onTranscriptReady(demoTranscript);
            showSuccess('Audio transcribed successfully!');
          }, 2000);
        } else {
          onVoiceRecorded && onVoiceRecorded(uri, recordingDuration);
          showSuccess('Audio recorded successfully!');
        }
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      showError('Failed to stop recording');
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    setShowModal(true);
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowModal(false);
    setTranscript('');
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={mode === 'speak-to-text' ? "mic" : "musical-notes"} 
          size={wp('6%')} 
          color="#FF6B6B" 
        />
      </TouchableOpacity>

      {/* Recording Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={wp('6%')} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {mode === 'speak-to-text' ? 'Speech to Text' : 'Voice Recorder'}
            </Text>
            
            <View style={styles.placeholder} />
          </View>

          <View style={styles.recordingContainer}>
            {/* Waveform Animation */}
            <View style={styles.waveformContainer}>
              <Animated.View 
                style={[
                  styles.waveBar, 
                  styles.waveBar1,
                  { transform: [{ scaleY: waveAnim1 }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.waveBar, 
                  styles.waveBar2,
                  { transform: [{ scaleY: waveAnim2 }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.waveBar, 
                  styles.waveBar3,
                  { transform: [{ scaleY: waveAnim3 }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.waveBar, 
                  styles.waveBar2,
                  { transform: [{ scaleY: waveAnim2 }] }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.waveBar, 
                  styles.waveBar1,
                  { transform: [{ scaleY: waveAnim1 }] }
                ]} 
              />
            </View>

            {/* Record Button */}
            <Animated.View style={[styles.recordButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordingButton]}
                onPress={handleRecordToggle}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={wp('12%')} 
                    color="#FFF" 
                  />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Duration */}
            <Text style={styles.duration}>
              {formatDuration(recordingDuration)}
            </Text>

            {/* Status */}
            <Text style={styles.status}>
              {isTranscribing 
                ? 'Transcribing...' 
                : isRecording 
                  ? `Recording... Tap stop when finished` 
                  : 'Tap the microphone to start recording'
              }
            </Text>

            {/* Transcript */}
            {transcript && (
              <View style={styles.transcriptContainer}>
                <Text style={styles.transcriptTitle}>Transcript:</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {mode === 'speak-to-text' ? '🗣️ Tips for better transcription:' : '🎵 Recording Tips:'}
            </Text>
            <Text style={styles.instructionsText}>
              {mode === 'speak-to-text' 
                ? '• Speak clearly and at normal pace\n• Minimize background noise\n• Keep device close to your mouth'
                : '• Hold device steady while recording\n• Speak clearly for best quality\n• Keep recordings under 2 minutes'
              }
            </Text>
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
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('4%'),
  },
  modalContainer: {
    width: '100%',
    maxWidth: wp('90%'),
    height: hp('75%'),
    backgroundColor: '#F8F9FA',
    borderRadius: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: wp('10%'),
  },
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp('8%'),
    minHeight: 0,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp('4%'),
    height: hp('8%'),
  },
  waveBar: {
    width: wp('1.5%'),
    backgroundColor: '#FF6B6B',
    marginHorizontal: wp('0.5%'),
    borderRadius: wp('0.75%'),
  },
  waveBar1: {
    height: hp('3%'),
  },
  waveBar2: {
    height: hp('5%'),
  },
  waveBar3: {
    height: hp('7%'),
  },
  recordButtonContainer: {
    marginBottom: hp('2%'),
  },
  recordButton: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  duration: {
    fontSize: wp('6%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  status: {
    fontSize: wp('3.5%'),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  transcriptContainer: {
    backgroundColor: '#FFF',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    marginTop: hp('2%'),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transcriptTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: hp('1%'),
  },
  transcriptText: {
    fontSize: wp('3.5%'),
    color: '#374151',
    lineHeight: wp('5%'),
  },
  instructionsContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#374151',
    marginBottom: hp('1%'),
  },
  instructionsText: {
    fontSize: wp('3%'),
    color: '#6B7280',
    lineHeight: wp('4.5%'),
  },
});

export default VoiceRecorder;