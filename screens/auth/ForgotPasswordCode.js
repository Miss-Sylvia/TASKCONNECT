import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import axios from 'axios';

const API_URL =
  Platform.select({
    ios: 'http://192.168.59.131:5000',
    android: 'http://192.168.59.131:5000',
    default: 'http://localhost:5000',
  }) + '/api/auth';

export default function ForgotPasswordCode({ route, navigation }) {
  const { identifier } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async () => {
    if (code.length < 4) return Alert.alert('Enter the code sent to your phone');
    try {
      setLoading(true);
      await axios.post(`${API_URL}/verify-reset-code`, { identifier, code });
      navigation.navigate('ForgotPasswordNew', { identifier, code });
    } catch (e) {
      Alert.alert('Invalid/expired', e.response?.data?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (seconds > 0) return;
    try {
      setSeconds(60);
      await axios.post(`${API_URL}/forgot-password`, { identifier });
      Alert.alert('Code resent', 'Check your phone');
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.message || 'Could not resend code');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Enter Reset Code</Text>
      <Text style={s.sub}>{identifier}</Text>

      <TextInput
        style={s.input}
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity style={[s.button, loading && s.disabled]} onPress={verify} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Verifying...' : 'Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={resend} disabled={seconds > 0}>
        <Text style={[s.link, seconds > 0 && { opacity: 0.5 }]}>
          Resend code {seconds > 0 ? `in ${seconds}s` : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('ForgotPasswordRequest')}>
        <Text style={s.smallLink}>Change phone/email</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { textAlign: 'center', color: '#546e7a', marginBottom: 16, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#cfd8dc', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fafafa', textAlign: 'center', letterSpacing: 3 },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 14, color: '#007BFF', fontWeight: '600' },
  smallLink: { textAlign: 'center', marginTop: 12, color: '#546e7a' },
});
