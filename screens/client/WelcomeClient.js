import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeClient({ navigation }) {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const fetchNameAndNavigate = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : {};
      const fullName = parsedUser.fullName || 'there';
      const first = fullName.split(' ')[0];
      setFirstName(first);

      // ⏳ Wait 2 seconds then go to dashboard
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ClientTabs' }],
        });
      }, 2000);
    };

    fetchNameAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>👋</Text>
      <Text style={styles.welcome}>Welcome back,</Text>
      <Text style={styles.name}>{firstName}!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007acc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 50,
  },
  welcome: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '400',
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
});
