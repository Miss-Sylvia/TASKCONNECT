import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import axios from 'axios';

const API_URL =
  Platform.select({
    ios: 'http://192.168.59.131:5000',   // your LAN IP:PORT
    android: 'http://192.168.59.131:5000',
    default: 'http://localhost:5000',
  }) + '/api/auth';

export default function ForgotPasswordRequest({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!identifier.trim()) return Alert.alert('Enter phone or email');
    try {
      setLoading(true);
      const { data } = await axios.post(`${API_URL}/forgot-password`, { identifier });
      Alert.alert('Check your phone', data.message || 'Reset code sent.');
      navigation.navigate('ForgotPasswordCode', { identifier });
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.message || 'Could not send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Reset Password</Text>
      <TextInput
        style={s.input}
        placeholder="Enter phone (e.g. 050...) or email"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      <TouchableOpacity style={[s.button, loading && s.disabled]} onPress={sendCode} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Sending...' : 'Send Code'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#cfd8dc', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 14, color: '#007BFF', fontWeight: '600' },
});
