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
// import SessionScreen from '../app/SessionScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ModalProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown: false,}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignUpScreen} />
        {/* <Stack.Screen name="Session" component={SessionScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
    </ModalProvider>
  );
}