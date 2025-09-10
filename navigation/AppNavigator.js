// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// 👇 go up one level to reach /screens/*
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import UserInfoScreen from '../screens/signup/UserInfoScreen';
import OTPVerificationScreen from '../screens/signup/OTPVerificationScreen';

// ⛔️ old single-file forgot screen removed

import ClientTabs from './ClientTabs';
import TaskerTabs from './TaskerTabs';

// 👇 these are also in /screens/*
import MyTasks from '../screens/client/MyTasks';
import WelcomeClient from '../screens/client/WelcomeClient';
import ProfilePictureModal from '../screens/ProfilePictureModal';
import EditTask from '../screens/client/EditTask';
import AvailableTaskers from '../screens/client/AvailableTaskers';
import ConfirmTask from '../screens/client/ConfirmTask';

// ✅ Forgot Password 3-step flow under /screens/auth/*
import ForgotPasswordRequest from '../screens/auth/ForgotPasswordRequest';
import ForgotPasswordCode from '../screens/auth/ForgotPasswordCode';
import ForgotPasswordNew from '../screens/auth/ForgotPasswordNew';
import Settings from '../screens/tasker/Settings';
import EditProfile from '../screens/tasker/EditProfile';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        {/* Auth / Onboarding */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={UserInfoScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="EditProfile" component={EditProfile} />

        {/* Alias the legacy route name to the new entry screen */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordRequest}
          options={{ headerShown: true, title: 'Reset Password' }}
        />

        {/* Role-based tabs
            IMPORTANT: when login succeeds, do:
            navigation.replace('TaskerTabs', { currentUser: userObjectFromLogin });
            or for a client-role:
            navigation.replace('ClientTabs', { currentUser: userObjectFromLogin });
        */}
        <Stack.Screen name="ClientTabs" component={ClientTabs} />
        <Stack.Screen name="TaskerTabs" component={TaskerTabs} />

        {/* Non-tab screens */}
        <Stack.Screen name="MyTasks" component={MyTasks} />
        <Stack.Screen name="WelcomeClient" component={WelcomeClient} />
        <Stack.Screen name="ProfilePicture" component={ProfilePictureModal} />
        <Stack.Screen name="EditTask" component={EditTask} />
        <Stack.Screen name="AvailableTaskers" component={AvailableTaskers} />
        <Stack.Screen name="ConfirmTask" component={ConfirmTask} />

        {/* Forgot Password flow */}
        <Stack.Screen
          name="ForgotPasswordRequest"
          component={ForgotPasswordRequest}
          options={{ headerShown: true, title: 'Reset Password' }}
        />
        <Stack.Screen
          name="ForgotPasswordCode"
          component={ForgotPasswordCode}
          options={{ headerShown: true, title: 'Enter Code' }}
        />
        <Stack.Screen
          name="ForgotPasswordNew"
          component={ForgotPasswordNew}
          options={{ headerShown: true, title: 'New Password' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
