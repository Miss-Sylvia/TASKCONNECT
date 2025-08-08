import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import axios from 'axios';

export default function UserInfoScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(null); // Fix default to null (not "Client")

  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState([
    { label: 'Client', value: 'Client' },
    { label: 'Tasker', value: 'Tasker' },
  ]);

  const baseURL = 'http://192.168.36.131:5000/api';

  const handleContinue = async () => {
    if (!firstName || !surname || !email || !phoneNumber || !password || !role) {
      return Alert.alert('Error', 'Please fill in all fields');
    }

    if (password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters long');
    }

    let formattedPhone = phoneNumber.trim();
    if (/^0\d{9}$/.test(formattedPhone)) {
      formattedPhone = formattedPhone.replace(/^0/, '+233');
    } else if (!/^\+233\d{9}$/.test(formattedPhone)) {
      return Alert.alert(
        'Invalid Phone Number',
        'Phone must start with 0 or +233 and be 10 digits long.'
      );
    }

    try {
      const response = await axios.post(`${baseURL}/auth/send-otp`, {
        phone: formattedPhone,
      });

      if (response.data.success) {
        navigation.navigate('OTPVerification', {
          firstName,
          surname,
          email,
          phoneNumber: formattedPhone,
          password,
          role,
        });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not send OTP. Check your network or try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          onChangeText={setFirstName}
          value={firstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Surname"
          onChangeText={setSurname}
          value={surname}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          onChangeText={setEmail}
          keyboardType="email-address"
          value={email}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          value={phoneNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
        <View style={{ zIndex: 1000 }}>
          <DropDownPicker
            open={open}
            value={role}
            items={roles}
            setOpen={setOpen}
            setValue={setRole}
            setItems={setRoles}
            placeholder="Select Role"
            style={{ borderColor: '#ccc' }}
            dropDownContainerStyle={{ borderColor: '#ccc' }}
          />
        </View>

        <View style={{ marginTop: 30 }}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    padding: 20,
    paddingTop: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});