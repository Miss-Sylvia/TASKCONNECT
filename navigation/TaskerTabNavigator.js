import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screen Imports
import TaskerHomeScreen from '../screens/TaskerHomeScreen';
import TaskerTransactionScreen from '../screens/TaskerTransactionScreen';
import TaskerHistoryScreen from '../screens/TaskerHistoryScreen';
import TaskerAccountScreen from '../screens/TaskerAccountScreen';

const Tab = createBottomTabNavigator();

export default function TaskerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Transactions') iconName = focused ? 'cash' : 'cash-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 3,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={TaskerHomeScreen}
        options={{ tabBarLabel: 'Tasks' }}
      />
      
      <Tab.Screen 
        name="Transactions" 
        component={TaskerTransactionScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
      
      <Tab.Screen 
        name="History" 
        component={TaskerHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      
      <Tab.Screen 
        name="Account" 
        component={TaskerAccountScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}