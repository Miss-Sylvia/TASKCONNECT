// screens/Account.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Account() {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedImage = await AsyncStorage.getItem('profileImage');
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedImage) setProfileImage(storedImage);
    };
    fetchUser();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Camera roll access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem('profileImage', uri);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('profileImage');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const openSettings = () => navigation.navigate('Settings');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading account info...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Account</Text>

      <View style={styles.profileCard}>
        <TouchableOpacity
          onPress={() => {
            if (profileImage) navigation.navigate('ProfilePicture', { uri: profileImage });
            else pickImage();
          }}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Icon name="person-circle-outline" size={80} color="#007acc" />
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.role}>{user.role}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.tapText}>Tap to change profile picture</Text>
        </TouchableOpacity>
      </View>

      {/* Settings only */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.optionCard} onPress={openSettings}>
          <Icon name="settings-outline" size={20} color="#333" />
          <Text style={styles.optionText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Logout fixed at bottom */}
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
        <Icon name="log-out-outline" size={20} color="#d9534f" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, flex: 1, backgroundColor: '#f9f9f9' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#007acc', marginBottom: 20 },

  profileCard: {
    alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 30,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, borderColor: '#007acc', borderWidth: 2 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 10, color: '#333' },
  role: { fontSize: 14, color: '#777', marginTop: 2 },
  email: { fontSize: 13, color: '#999', marginTop: 2 },
  tapText: { fontSize: 12, color: '#007acc', marginTop: 6 },

  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginBottom: 10 },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14,
    borderRadius: 10, marginBottom: 12, gap: 10, elevation: 1,
  },
  optionText: { fontSize: 15, color: '#333', fontWeight: '500' },

  logoutCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5',
    padding: 14, borderRadius: 10, gap: 10, elevation: 1,
  },
  logoutText: { fontSize: 15, color: '#d9534f', fontWeight: 'bold' },

  loading: { fontSize: 16, textAlign: 'center', marginTop: 50, color: '#666' },
});
