import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screen Imports
import ClientHomeScreen from '../screens/ClientHomeScreen';
import ClientTransactionScreen from '../screens/ClientTransactionScreen';
import ClientHistoryScreen from '../screens/ClientHistoryScreen';
import ClientAccountScreen from '../screens/ClientAccountScreen';
import PostErrandScreen from '../screens/PostErrandScreen';

const Tab = createBottomTabNavigator();

export default function ClientTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Post') iconName = 'add-circle';
          else if (route.name === 'Transactions') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'History') iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';

          // Special larger icon for Post tab
          const iconSize = route.name === 'Post' ? size + 6 : size;
          
          return <Ionicons name={iconName} size={iconSize} color={color} />;
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
        component={ClientHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      
      <Tab.Screen 
        name="Post" 
        component={PostErrandScreen}
        options={{
          tabBarLabel: 'NEW',
          tabBarLabelStyle: {
            fontWeight: 'bold',
            marginBottom: 3,
          }
        }}
      />
      
      <Tab.Screen 
        name="Transactions" 
        component={ClientTransactionScreen}
        options={{ tabBarLabel: 'Payments' }}
      />
      
      <Tab.Screen 
        name="History" 
        component={ClientHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      
      <Tab.Screen 
        name="Account" 
        component={ClientAccountScreen}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}