// screens/EditProfile.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function EditProfile() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setEmail(u.email || '');
        setPhone(u.phone || u.phoneNumber || '');
      }
    })();
  }, []);

  const save = async () => {
    const emailOk = /^\S+@\S+\.\S+$/.test(email);
    const phoneOk = phone.trim().length >= 6;
    if (!emailOk) return Alert.alert('Invalid email', 'Please enter a valid email address.');
    if (!phoneOk) return Alert.alert('Invalid phone', 'Please enter a valid phone number.');

    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      const updated = { ...u, email, phone, phoneNumber: phone };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
    }
    Alert.alert('Saved', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        style={styles.input}
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+233 55 123 4567"
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F9FAFB', padding:16, paddingTop:60 },
  title:{ fontSize:22, fontWeight:'800', color:'#111827', marginBottom:16 },
  label:{ fontSize:13, color:'#6B7280', marginTop:10, marginBottom:6 },
  input:{
    backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E7EB', borderRadius:12,
    paddingHorizontal:14, paddingVertical:12, fontSize:15, color:'#111827',
  },
  saveBtn:{
    marginTop:20, backgroundColor:'#111827', paddingVertical:12, borderRadius:12, alignItems:'center',
  },
  saveText:{ color:'#FFFFFF', fontWeight:'800', fontSize:15 },
});
