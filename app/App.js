// import React from 'react';
// import Login from './SignUpScreen.jsx';

// export default function App() {
//   return <Login />;
// }

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModalProvider } from '../context/ModalContext';


import LoginScreen from '../app/LoginScreen.jsx';
import SignUpScreen from '../app/SignUpScreen';
import OnboardingScreen from '../app/OnboardingScreen.jsx';
import QuestionCardScreen from '../app/QuestionCardScreen.jsx';
import Revision from './RevisionMode.jsx';
import Exam from './ExamMode.jsx';
import Paper from './PaperSelection.jsx';
import Ss from './SelectedCourseScreen.jsx';
import JunesModeScreen from './JunesModeScreen.jsx';
import TopicsModeScreen from './TopicsModeScreen.jsx';
import CustomsExamScreen from './CustomsExamScreen.jsx';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ModalProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Ss" screenOptions={{headerShown: false,}}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignUpScreen} />
        <Stack.Screen name="QuestionCard" component={QuestionCardScreen} />
        <Stack.Screen name="Revision" component={Revision} />
        <Stack.Screen name="Exam" component={Exam} />
        <Stack.Screen name="Paper" component={Paper} />
        <Stack.Screen name="Ss" component={Ss} />
        <Stack.Screen name="JunesMode" component={JunesModeScreen} />
        <Stack.Screen name="TopicsMode" component={TopicsModeScreen} />
        <Stack.Screen name="CustomsExamScreen" component={CustomsExamScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
    </ModalProvider>
  );
}