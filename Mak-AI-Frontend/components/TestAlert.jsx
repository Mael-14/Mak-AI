import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Picker } from '@react-native-picker/picker';

export default function TestSetupAlert({ visible, onClose, onStart }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('Algebra');
  const [mixedTopics, setMixedTopics] = useState(false);
  const [questions, setQuestions] = useState('20');
  const [paperType, setPaperType] = useState('mcq');
  const [timer, setTimer] = useState('30');

  return (
    <Modal transparent visible={visible} animationType="fade">
      <BlurView intensity={80} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>📝 Test Setup</Text>

            {/* Difficulty */}
            <Text style={styles.label}>Difficulty</Text>
            {['easy', 'medium', 'hard'].map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setDifficulty(level)}
                style={styles.checkRow}
              >
                <Text style={styles.checkbox}>
                  {difficulty === level ? '☑' : '☐'}
                </Text>
                <Text>{level.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}

            {/* Topic */}
            <Text style={styles.label}>Topic</Text>
            <View style={styles.pickerBox}>
              <Picker
                enabled={!mixedTopics}
                selectedValue={topic}
                onValueChange={setTopic}
              >
                <Picker.Item label="Algebra" value="Algebra" />
                <Picker.Item label="Geometry" value="Geometry" />
                <Picker.Item label="Trigonometry" value="Trigonometry" />
              </Picker>
            </View>

            <View style={styles.switchRow}>
              <Text>Mixed Topics</Text>
              <Switch value={mixedTopics} onValueChange={setMixedTopics} />
            </View>

            {/* Questions */}
            <Text style={styles.label}>Number of Questions</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={questions}
              onChangeText={setQuestions}
            />

            {/* Paper Type */}
            <Text style={styles.label}>Paper Type</Text>
            {[
              { label: 'MCQs (Paper 1)', value: 'mcq' },
              { label: 'Structural (Paper 2)', value: 'structure' }
            ].map(paper => (
              <TouchableOpacity
                key={paper.value}
                onPress={() => setPaperType(paper.value)}
                style={styles.checkRow}
              >
                <Text style={styles.checkbox}>
                  {paperType === paper.value ? '◉' : '○'}
                </Text>
                <Text>{paper.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Timer */}
            <Text style={styles.label}>Timer (minutes)</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={timer} onValueChange={setTimer}>
                <Picker.Item label="15 minutes" value="15" />
                <Picker.Item label="30 minutes" value="30" />
                <Picker.Item label="45 minutes" value="45" />
                <Picker.Item label="60 minutes" value="60" />
              </Picker>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  onStart({
                    difficulty,
                    topic: mixedTopics ? 'Mixed' : topic,
                    questions,
                    paperType,
                    timer
                  })
                }
              >
                <Text style={styles.start}>Start Test</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = {
  card: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    maxHeight: '90%'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center'
  },
  label: {
    marginTop: 15,
    fontWeight: '600'
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  checkbox: {
    fontSize: 20,
    marginRight: 10
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginTop: 5
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25
  },
  cancel: {
    color: 'red',
    fontSize: 16
  },
  start: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  }
};