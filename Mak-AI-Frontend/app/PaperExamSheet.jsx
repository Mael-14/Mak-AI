import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verticalScale, moderateScale, scale } from '../utils/scaling';
import { LinearGradient } from 'expo-linear-gradient';
import MathJaxProvider from '../components/MathJaxProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LaTeXToPDFConverter from '../components/LaTeXToPDFConverter';

const { width } = Dimensions.get('window');
const TEMP_EXAM_KEY = '@temp_exam_data';

const SUBJECTS_DATA = {
  1: { title: 'Mathematics', colors: ['#ffb380', '#FF8C42'] },
  2: { title: 'Biology', colors: ['#90EE90', '#32CD32'] },
  3: { title: 'Chemistry', colors: ['#FFD700', '#FFA500'] },
  4: { title: 'Physics', colors: ['#87CEEB', '#00BFFF'] },
  5: { title: 'Computer Science', colors: ['#DDA0DD', '#BA55D3'] },
  6: { title: 'Math Stats', colors: ['#F0E68C', '#DAA520'] },
  7: { title: 'Geography', colors: ['#98D8C8', '#20B2AA'] },
  8: { title: 'Further Math', colors: ['#FFA07A', '#FF7F50'] },
};

// OPTIMIZED: Render single question card with combined MathJax content
const QuestionCard = React.memo(({ question, index, questionType }) => {
  const [showSolution, setShowSolution] = useState(false);

  if (!question || typeof question !== 'object' || !question.question) {
    return (
      <View style={styles.questionCard}>
        <Text style={styles.errorText}>Invalid question data</Text>
      </View>
    );
  }

  // OPTIMIZATION: Combine all text into ONE MathJax render instead of multiple WebViews
  const combinedContent = useMemo(() => {
    let content = `**${index + 1}.** ${question.question}`;
    
    // Add options to the same content if they exist
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      content += '\n\n';
      question.options.forEach((opt, optIdx) => {
        if (!opt) return;
        const label = opt.label || String.fromCharCode(65 + optIdx);
        const value = opt.value || opt;
        content += `**${label}.** ${value}\n\n`;
      });
    }
    
    return content;
  }, [question, index]);

  // Format solution content for MathJax rendering
  const solutionContent = useMemo(() => {
    if (!question.solution && !question.answer && !question.explanation) {
      return '**Solution:** Not available for this question.';
    }
    
    let content = '';
    
    // Add answer if available
    if (question.answer) {
      content += `**Answer:** ${question.answer}\n\n`;
    }
    
    // Add solution/explanation if available
    if (question.solution) {
      content += `**Solution:**\n${question.solution}`;
    } else if (question.explanation) {
      content += `**Explanation:**\n${question.explanation}`;
    }
    
    return content;
  }, [question.solution, question.answer, question.explanation]);

  const toggleSolution = () => {
    setShowSolution(!showSolution);
  };

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeaderSimple}>
        <View style={styles.questionTextContainer}>
          {/* SINGLE WebView for entire question including options */}
          <MathJaxProvider html={combinedContent} fontSize="11px" />
        </View>
        <Text style={styles.marks}>[{question.marks || 1}]</Text>
      </View>

      {/* Solution Toggle Button */}
      <TouchableOpacity style={styles.solutionToggle} onPress={toggleSolution}>
        <Text style={styles.solutionToggleText}>
          {showSolution ? 'Hide Solution' : 'Show Solution'}
        </Text>
        <Ionicons 
          name={showSolution ? 'chevron-up' : 'chevron-down'} 
          size={16} 
          color="#007AFF" 
        />
      </TouchableOpacity>

      {/* Solution Display */}
      {showSolution && (
        <View style={styles.solutionContainer}>
          <MathJaxProvider html={solutionContent} fontSize="11px" />
        </View>
      )}

      {/* Answer Space for Structural/Mixed - Hidden when solution is shown */}
      {(questionType === 'Structural (Paper 2)' || questionType === 'Mixed') && !showSolution && (
        <View style={styles.answerSpace}>
          {Array(Math.max(1, Math.min(6, (question.marks || 1) > 2 ? 4 : (question.marks || 1) > 1 ? 3 : 2)))
            .fill()
            .map((_, lineIdx) => (
              <View key={lineIdx} style={styles.answerLine} />
            ))}
        </View>
      )}
    </View>
  );
});

const PaperExamSheet = () => {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [subject, setSubject] = useState('Mathematics');
  const [subjectId, setSubjectId] = useState(1);
  const [level, setLevel] = useState('Ordinary Level');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(45);
  const [questionType, setQuestionType] = useState('Structural (Paper 2)');
  const [examId, setExamId] = useState('EXAM-123');
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExamData = async () => {
      try {
        setError(null);
        let parsedQuestions = [];
        let validQuestions = [];

        console.log('📋 Loading exam params...');

        // OPTIMIZATION: Check if we should load from AsyncStorage
        if (localParams?.useStoredData === 'true') {
          console.log('📦 Loading from AsyncStorage...');
          
          const storedData = await AsyncStorage.getItem(TEMP_EXAM_KEY);
          if (storedData) {
            const examData = JSON.parse(storedData);
            
            // Validate and set data
            parsedQuestions = examData.questions || [];
            
            if (Array.isArray(parsedQuestions)) {
              validQuestions = parsedQuestions.filter(
                q => q && typeof q === 'object' && q.question && typeof q.question === 'string'
              );
              setQuestions(validQuestions);

              if (validQuestions.length === 0 && parsedQuestions.length > 0) {
                setError('No valid questions found in exam data');
              }
            } else {
              setQuestions([]);
              setError('Invalid question data format');
            }
            
            setSubject(examData.subject || 'Mathematics');
            setSubjectId(examData.subjectId || 1);
            setLevel(examData.level || 'Ordinary Level');
            setDifficulty(examData.difficulty || 'Medium');
            setDuration(examData.duration || 45);
            setQuestionType(examData.questionType || 'Structural (Paper 2)');
            setExamId(examData.examId || examData.id || 'EXAM-123');
            setTimestamp(examData.createdAt || examData.timestamp || new Date().toISOString());
            
            console.log('✅ Loaded', validQuestions.length, 'questions from AsyncStorage');
            
            // Clean up stored data after loading
            await AsyncStorage.removeItem(TEMP_EXAM_KEY);
          } else {
            setError('No exam data found');
          }
        } 
        // Fallback: Load from URL params (old method)
        else if (localParams && Object.keys(localParams).length > 0) {
          console.log('📋 Loading from URL params (fallback)...');
          
          // Parse questions
          if (localParams.questions) {
            try {
              if (typeof localParams.questions === 'string') {
                parsedQuestions = JSON.parse(localParams.questions);
              } else if (Array.isArray(localParams.questions)) {
                parsedQuestions = localParams.questions;
              }
            } catch (parseError) {
              console.error('❌ Error parsing questions:', parseError);
              setError('Failed to load exam questions');
              parsedQuestions = [];
            }
          }

          // Validate questions
          if (Array.isArray(parsedQuestions)) {
            validQuestions = parsedQuestions.filter(
              q => q && typeof q === 'object' && q.question && typeof q.question === 'string'
            );
            setQuestions(validQuestions);

            if (validQuestions.length === 0 && parsedQuestions.length > 0) {
              setError('No valid questions found in exam data');
            }
          } else {
            setQuestions([]);
            setError('Invalid question data format');
          }

          setSubject(localParams.subject || 'Mathematics');
          setSubjectId(parseInt(localParams.subjectId) || 1);
          setLevel(localParams.level || 'Ordinary Level');
          setDifficulty(localParams.difficulty || 'Medium');
          setDuration(parseInt(localParams.duration) || 45);
          setQuestionType(localParams.questionType || 'Structural (Paper 2)');
          setExamId(localParams.examId || 'EXAM-123');
          setTimestamp(localParams.timestamp || new Date().toISOString());

          console.log('✅ Loaded', validQuestions.length, 'questions from URL params');
        } else {
          // Wait a bit for params
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try AsyncStorage again
          const storedData = await AsyncStorage.getItem(TEMP_EXAM_KEY);
          if (storedData) {
            const examData = JSON.parse(storedData);
            parsedQuestions = examData.questions || [];
            // ... rest of parsing logic (same as above)
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading exam:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadExamData();
  }, []);

  const subjectInfo = SUBJECTS_DATA[subjectId] || SUBJECTS_DATA[1];
  const totalMarks = Array.isArray(questions)
    ? questions.reduce((sum, q) => sum + (q.marks || 1), 0)
    : 0;

  const handleDownloadPDF = async (includeAnswers = false) => {
    try {
      setIsGeneratingPDF(true);
      setShowDownloadModal(false);
      
      // Show loading feedback
      Alert.alert(
        'Generating PDF', 
        `Please wait while we prepare your ${includeAnswers ? 'exam sheet with answers' : 'exam sheet'}...`, 
        [], 
        { cancelable: false }
      );
      
      const html = generateExamHTML(includeAnswers);
      
      // Generate PDF with better options
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612, // A4 width in points
        height: 792, // A4 height in points
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${subject} - ${level} ${includeAnswers ? 'Exam Paper with Answers' : 'Exam Paper'}`,
          UTI: 'com.adobe.pdf',
        });
        
        Alert.alert(
          'PDF Generated Successfully!', 
          `Your ${includeAnswers ? 'exam paper with answers' : 'exam paper'} has been generated and is ready to share or save to your device.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'PDF Generated', 
          'PDF has been generated but sharing is not available on this device.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert(
        'PDF Generation Failed', 
        `Unable to generate PDF: ${error.message || 'Unknown error'}. Please try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const generateExamHTML = (includeAnswers = false) => {
    const questionHTML = questions
      .map((q, idx) => {
        const questionNum = idx + 1;
        const marks = q.marks || 1;
        
        // Clean the question text for PDF
        const cleanQuestionText = LaTeXToPDFConverter.cleanMathExpression(q.question);
        
        let optionsHTML = '';
        
        if (q.options && q.options.length > 0) {
          optionsHTML = `<div class="options">${q.options
            .map((opt, optIdx) => {
              const label = opt.label || String.fromCharCode(65 + optIdx);
              const value = opt.value || opt;
              const cleanValue = LaTeXToPDFConverter.cleanMathExpression(value);
              return `<div class="option"><strong>${label}.</strong> ${cleanValue}</div>`;
            })
            .join('')}</div>`;
        }

        let answerSpaceHTML = '';
        let solutionHTML = '';

        if (includeAnswers) {
          // Include solutions instead of answer spaces
          if (q.solution || q.answer || q.explanation) {
            let solutionContent = '';
            if (q.answer) {
              solutionContent += `<strong>Answer:</strong> ${LaTeXToPDFConverter.cleanMathExpression(q.answer)}<br><br>`;
            }
            if (q.solution) {
              solutionContent += `<strong>Solution:</strong><br>${LaTeXToPDFConverter.cleanMathExpression(q.solution)}`;
            } else if (q.explanation) {
              solutionContent += `<strong>Explanation:</strong><br>${LaTeXToPDFConverter.cleanMathExpression(q.explanation)}`;
            }
            
            solutionHTML = `<div class="solution-container">
              <div class="solution-content">${solutionContent}</div>
            </div>`;
          } else {
            solutionHTML = `<div class="solution-container">
              <div class="solution-content"><strong>Solution:</strong> Not available for this question.</div>
            </div>`;
          }
        } else {
          // Include answer spaces for non-answer version
          if (questionType === 'Structural (Paper 2)' || questionType === 'Mixed') {
            const answerLines = Math.max(2, Math.min(6, marks > 2 ? 4 : marks > 1 ? 3 : 2));
            answerSpaceHTML = `<div class="answer-space">${Array(answerLines)
              .fill('<div class="answer-line"></div>')
              .join('')}</div>`;
          }
        }

        return `
          <div class="question-container">
            <div class="question-header">
              <div class="question-text"><strong>${questionNum}.</strong> ${cleanQuestionText}</div>
              <div class="marks">[${marks}]</div>
            </div>
            ${optionsHTML}
            ${answerSpaceHTML}
            ${solutionHTML}
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject} - ${level} Exam Paper</title>
        <style>
          @page { 
            margin: 15mm 20mm 25mm 20mm; 
            size: A4;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 11pt; 
            line-height: 1.4; 
            color: #000;
            background: white;
            position: relative;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(0, 0, 0, 0.05);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
            user-select: none;
            text-align: center;
            white-space: nowrap;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 25px; 
            page-break-inside: avoid;
          }
          .title { 
            font-size: 20pt; 
            font-weight: bold; 
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .subtitle { 
            font-size: 14pt; 
            font-weight: normal;
            margin-bottom: 10px; 
          }
          .details { 
            display: flex; 
            justify-content: space-around; 
            margin: 15px 0;
            font-size: 12pt;
            font-weight: bold;
          }
          .instructions {
            background: #f8f8f8;
            border: 1px solid #ddd;
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 4px;
            page-break-inside: avoid;
          }
          .instructions-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 8px;
          }
          .instructions-list {
            font-size: 10pt;
            line-height: 1.6;
          }
          .question-container {
            margin-bottom: 25px;
            page-break-inside: avoid;
            border-left: 3px solid #ddd;
            padding-left: 10px;
          }
          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .question-text {
            flex: 1;
            margin-right: 15px;
            font-size: 11pt;
            line-height: 1.5;
          }
          .marks {
            font-weight: bold;
            font-size: 11pt;
            white-space: nowrap;
          }
          .options {
            margin: 10px 0 10px 20px;
          }
          .option {
            margin-bottom: 6px;
            font-size: 11pt;
          }
          .answer-space {
            margin-top: 15px;
            margin-left: 20px;
          }
          .answer-line {
            border-bottom: 1px solid #999;
            height: 25px;
            margin-bottom: 15px;
          }
          .solution-container {
            margin-top: 15px;
            padding: 12px;
            background-color: #f0f8ff;
            border-radius: 8px;
            border-left: 3px solid #007AFF;
          }
          .solution-content {
            font-size: 11pt;
            line-height: 1.5;
          }
          .footer {
            position: fixed;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            height: 15mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8pt;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 5px;
            background: white;
            z-index: 1000;
          }
          .footer-left {
            flex: 1;
            text-align: left;
            font-size: 7pt;
          }
          .footer-center {
            flex: 1;
            text-align: center;
            font-size: 9pt;
            color: #666;
          }
          .footer-right {
            flex: 1;
            text-align: right;
            font-weight: bold;
            font-size: 8pt;
          }
          .content-wrapper {
            padding-bottom: 25mm;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .question-container { break-inside: avoid; }
            .footer { 
              position: fixed;
              bottom: 0;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="watermark">MAK-AI</div>
        
        <div class="content-wrapper">
          <div class="header">
            <div class="title">${subject}</div>
            <div class="subtitle">${level} - ${questionType}</div>
            <div class="details">
              <span>Duration: ${duration} minutes</span>
              <span>Total Marks: ${totalMarks}</span>
              <span>Questions: ${questions.length}</span>
            </div>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">Instructions:</div>
            <div class="instructions-list">
              • Answer all questions in the spaces provided<br>
              • Show all your working clearly<br>
              • Marks may be awarded for correct working<br>
              • Write your answers in the answer spaces provided
            </div>
          </div>
          
          <div class="questions">
            ${questionHTML}
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-left">Generated by MAK-AI • mak-ai@gmail.com • ADK-Enterprise</div>
          <div class="footer-center">Exam Paper</div>
          <div class="footer-right">MAK-AI</div>
        </div>
      </body>
      </html>
    `;
  };

  // Render item for FlatList (OPTIMIZED for virtualization)
  const renderQuestion = ({ item, index }) => (
    <QuestionCard question={item} index={index} questionType={questionType} />
  );

  // Key extractor
  const keyExtractor = (item, index) => `question-${index}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={styles.loadingText}>Loading exam sheet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerView}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>{error || 'No questions available'}</Text>
          <Text style={styles.errorSubtext}>
            {error ? 'Please try again or contact support' : 'This exam has no questions'}
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={subjectInfo.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{subject}</Text>
            <Text style={styles.headerSubtitle}>
              {questions.length} Questions • {totalMarks} Marks
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowDownloadModal(true)}
            style={styles.menuButton}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Download Options Modal */}
      <Modal
        visible={showDownloadModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowDownloadModal(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleDownloadPDF(false)}
            >
              <Ionicons name="document-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Download Paper</Text>
            </TouchableOpacity>
            
            <View style={styles.modalDivider} />
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleDownloadPDF(true)}
            >
              <Ionicons name="document-text-outline" size={20} color="#333" />
              <Text style={styles.modalOptionText}>Download with Answers</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* OPTIMIZED: Use FlatList for virtualization instead of ScrollView */}
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        initialNumToRender={5} // Only render 5 questions initially
        maxToRenderPerBatch={5} // Render 5 at a time when scrolling
        windowSize={5} // Keep 5 screens worth in memory
        removeClippedSubviews={true} // Unmount off-screen components
        ListHeaderComponent={
          <View style={styles.examHeader}>
            <Text style={styles.examTitle}>{level} Examination</Text>
            <View style={styles.examDetailsRow}>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{duration} min</Text>
              </View>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Total Marks</Text>
                <Text style={styles.detailValue}>{totalMarks}</Text>
              </View>
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Questions</Text>
                <Text style={styles.detailValue}>{questions.length}</Text>
              </View>
            </View>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Instructions:</Text>
              <Text style={styles.instructionsText}>
                • Answer all questions in the spaces provided
              </Text>
              <Text style={styles.instructionsText}>• Show all your working</Text>
              <Text style={styles.instructionsText}>
                • Marks may be awarded for correct working
              </Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
  },
  centerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: moderateScale(12),
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: moderateScale(12),
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#3F51B5',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerContainer: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: scale(16),
    paddingBottom: verticalScale(20),
  },
  examHeader: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  examTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  examDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  detailBox: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: moderateScale(10),
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#333',
  },
  instructionsBox: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#333',
    padding: scale(12),
    borderRadius: 4,
  },
  instructionsTitle: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  instructionsText: {
    fontSize: moderateScale(11),
    color: '#555',
    marginBottom: 4,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: scale(12),
    marginBottom: verticalScale(12),
  },
  questionHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  marks: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#666',
  },
  answerSpace: {
    marginTop: 12,
  },
  answerLine: {
    height: 18,
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  solutionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    marginTop: verticalScale(8),
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  solutionToggleText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 6,
  },
  solutionContainer: {
    marginTop: verticalScale(12),
    padding: scale(12),
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: verticalScale(80),
    paddingRight: scale(16),
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: verticalScale(8),
    minWidth: scale(180),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
  },
  modalOptionText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#333',
    marginLeft: scale(12),
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: scale(16),
  },
});

export default PaperExamSheet;