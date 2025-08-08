// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import UserInfoScreen from '../screens/signup/UserInfoScreen';
import OTPVerificationScreen from '../screens/signup/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ClientTabNavigator from './ClientTabNavigator';
import TaskerTabNavigator from './TaskerTabNavigator';
import PostErrandScreen from '../screens/PostErrandScreen';
import ClientTabs from '../screens/ClientAccountScreen';
import TaskerTabs from '../screens/TaskerAccountScreen'; // Assuming you have a TaskerTabs similar to ClientTabs
// Don't add other screens yet

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={UserInfoScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ClientHome" component={ClientTabNavigator} />
      <Stack.Screen name="TaskerHome" component={TaskerTabNavigator} />
      <Stack.Screen name="PostErrand" component={PostErrandScreen} />
      <Stack.Screen name="ClientTabs" component={ClientTabs} />
      <Stack.Screen name="TaskerTabs" component={TaskerTabs} />
      {/* Add other screens as needed */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}