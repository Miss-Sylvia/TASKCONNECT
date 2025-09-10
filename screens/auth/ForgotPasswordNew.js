import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL =
  Platform.select({
    ios: 'http://192.168.59.131:5000',
    android: 'http://192.168.59.131:5000',
    default: 'http://localhost:5000',
  }) + '/api/auth';

export default function ForgotPasswordNew({ route, navigation }) {
  const { identifier, code } = route.params;
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    if (!pwd || !confirm) return Alert.alert('Enter and confirm your new password');
    if (pwd.length < 6) return Alert.alert('Password must be at least 6 characters');
    if (pwd !== confirm) return Alert.alert('Passwords do not match');

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_URL}/reset-password`, { identifier, code, newPassword: pwd });
      Alert.alert('Done', data.message || 'Password reset complete');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); // back to Login
    } catch (e) {
      Alert.alert('Failed', e.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Create New Password</Text>

      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholder="New password"
          value={pwd}
          onChangeText={setPwd}
          secureTextEntry={!showPwd}
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.eye} onPress={() => setShowPwd(v => !v)}>
          <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#607D8B" />
        </TouchableOpacity>
      </View>

      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          placeholder="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
        />
        <TouchableOpacity style={s.eye} onPress={() => setShowConfirm(v => !v)}>
          <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#607D8B" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[s.button, loading && s.disabled]} onPress={reset} disabled={loading}>
        <Text style={s.buttonText}>{loading ? 'Saving...' : 'Reset Password'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 18 },
  inputWrap: { position: 'relative', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#cfd8dc', borderRadius: 8, padding: 12, backgroundColor: '#fafafa', paddingRight: 44 },
  eye: { position: 'absolute', right: 12, top: 12, height: 24, width: 24, alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
