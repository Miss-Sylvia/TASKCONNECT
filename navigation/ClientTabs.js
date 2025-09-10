// navigation/ClientTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Tabs
import ClientHome from '../screens/client/ClientHome';
import PostTask from '../screens/client/PostTask';
import TaskTracker from '../screens/client/TaskTracker';
import Transactions from '../screens/client/Transactions';
import Account from '../screens/client/Account';
import RecentTasks from '../screens/client/RecentTasks'; 

// Chat stack screens
import Chat from '../screens/shared/Chat';
import ChatInbox from '../screens/shared/ChatInbox';

// Delivery sub-flow
import DeliveryDetails from '../screens/client/DeliveryDetails';
import ConfirmTask from '../screens/client/ConfirmTask';
import AvailableTaskers from '../screens/client/AvailableTaskers';

const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();
const PostTaskStack = createNativeStackNavigator();

function ChatStackScreen() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatInbox" component={ChatInbox} options={{ headerShown: true, title: 'Chats' }} />
      <ChatStack.Screen name="ChatThread" component={Chat} options={{ headerShown: true, title: 'Chat' }} />
    </ChatStack.Navigator>
  );
}

function PostTaskStackScreen() {
  return (
    <PostTaskStack.Navigator>
      <PostTaskStack.Screen name="PostTaskMain" component={PostTask} options={{ headerShown: true, title: 'Post a Task' }} />
      <PostTaskStack.Screen name="DeliveryDetails" component={DeliveryDetails} options={{ headerShown: true, title: 'Delivery Options' }} />
      <PostTaskStack.Screen name="ConfirmTask" component={ConfirmTask} options={{ headerShown: true, title: 'Confirm Task' }} />
      <PostTaskStack.Screen name="AvailableTaskers" component={AvailableTaskers} options={{ headerShown: true, title: 'Recommended Taskers' }} />
    </PostTaskStack.Navigator>
  );
}

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const map = {
            Home: 'home-outline',
            PostTaskTab: 'add-circle-outline',
            ChatsTab: 'chatbubble-ellipses-outline',
            TaskTracker: 'navigate-outline',
            Transactions: 'cash-outline',
            Account: 'person-circle-outline',
            RecentTasks: 'time-outline',
          };
          const name = map[route.name] || 'ellipse-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ClientHome} options={{ title: 'Home' }} />
      <Tab.Screen name="PostTaskTab" component={PostTaskStackScreen} options={{ title: 'Post Task' }} />
      <Tab.Screen name="ChatsTab" component={ChatStackScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="TaskTracker" component={TaskTracker} options={{ title: 'Tracker' }} />
      <Tab.Screen name="Transactions" component={Transactions} options={{ title: 'Wallet' }} />
      <Tab.Screen name="Account" component={Account} options={{ title: 'Account' }} />
      <Tab.Screen
       name="RecentTasks" component={RecentTasks}
        options={{ tabBarButton: () => null, headerShown: true, title: 'Recent Tasks' }}
    />
    </Tab.Navigator>
  );
}
