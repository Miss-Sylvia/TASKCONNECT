import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    try {
      const response = await axios.post('http://192.168.36.131:5000/api/auth/login', {
        email: emailOrPhone,
        password,
      });

      const user = response.data.user;
      console.log('Login response:', user);

      if (!user.role) {
        navigation.replace('RoleSelection', { userId: user.id }); // optional: pass userId
      } else if (user.role === 'Client') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ClientTabs' }],
        });
      } else if (user.role === 'Tasker') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'TaskerTabs' }],
        });
      } else {
        Alert.alert('Login Error', 'User has an unknown role');
      }
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      if (error.response?.data?.message || error.response?.data?.error) {
        Alert.alert('Login Failed', error.response.data.message || error.response.data.error);
      } else {
        Alert.alert('Error', 'There was an error during login. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType="email-address"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Icon name={secureText ? 'eye-off' : 'eye'} size={22} color="gray" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007bff',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  forgotText: {
    textAlign: 'right',
    color: '#007bff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#007bff',
    fontSize: 16,
  },
});