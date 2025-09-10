// navigation/TaskerTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// your tasker screens
import TaskerHome from '../screens/tasker/TaskerHome';
import MyTasks from '../screens/tasker/MyTasks';
import TaskBank from '../screens/tasker/TaskBank';
import Account from '../screens/tasker/Account';

// shared chat screens
import ChatInbox from '../screens/shared/ChatInbox';
import Chat from '../screens/shared/Chat';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();

function ChatStackScreen({ route }) {
  const injectedUser = route?.params?.currentUser || null;
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen
        name="ChatInbox"
        component={ChatInbox}
        initialParams={{ currentUser: injectedUser }}
        options={{ headerShown: true, title: 'Chats' }}
      />
      {/* renamed from "Chat" -> "ChatThread" to avoid duplicate name warning */}
      <ChatStack.Screen
        name="ChatThread"
        component={Chat}
        options={{ headerShown: true, title: 'Chat' }}
      />
    </ChatStack.Navigator>
  );
}

export default function TaskerTabs({ route }) {
  // currentUser should be passed from Login -> navigation.replace('TaskerTabs', { currentUser: user })
  const currentUser = route?.params?.currentUser || null;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={TaskerHome}
        initialParams={{ currentUser }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="My Tasks"
        component={MyTasks}
        initialParams={{ currentUser }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ChatThread"
        component={Chat}
        initialParams={{ currentUser }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Task Bank"
        component={TaskBank}
        initialParams={{ currentUser }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        initialParams={{ currentUser }}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
