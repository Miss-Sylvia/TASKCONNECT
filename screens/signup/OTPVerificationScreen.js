import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

export default function OTPVerificationScreen({ route, navigation }) {
  const {
    firstName,
    surname,
    email,
    phoneNumber,
    role,
    password,
  } = route.params || {};

  const isParamsMissing = !firstName || !surname || !email || !phoneNumber || !role || !password;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSubmitDone, setAutoSubmitDone] = useState(false);

  const baseURL = 'http://192.168.36.131:5000/api'; // Adjust if your backend IP changes

  useEffect(() => {
    if (otp.length === 6 && !autoSubmitDone) {
      setAutoSubmitDone(true);
      handleVerifyOTP();
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${baseURL}/auth/verify-otp`, {
        phone: phoneNumber,
        otp,
      });

      if (res.data.message === 'OTP verified successfully') {
        const userId = res.data.userId;
        await completeSignup(userId);
      } else {
        Alert.alert('Verification Failed', res.data.message || 'OTP verification failed');
        setAutoSubmitDone(false);
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'An error occurred during verification';
      console.error('OTP Error:', errMsg);
      Alert.alert('Error', errMsg);
      setAutoSubmitDone(false);
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (userId) => {
    try {
      const res = await axios.post(`${baseURL}/auth/signup`, {
        fullName: `${firstName} ${surname}`,
        email,
        phone: phoneNumber,
        password,
        role,
      });

      if (res.data.message === 'User registered successfully') {
        Alert.alert('Signup Successful', 'You can now log in.');
        navigation.replace('Login');
      } else {
        Alert.alert('Signup Failed', res.data.message || 'Unexpected error during signup');
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Signup failed. Please try again.';
      console.error('Signup error:', errMsg);
      Alert.alert('Error', errMsg);
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await axios.post(`${baseURL}/auth/send-otp`, {
        phone: phoneNumber,
      });

      if (res.data.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
        setOtp('');
        setAutoSubmitDone(false);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to resend OTP.');
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Could not resend OTP.';
      console.error('Resend OTP error:', errMsg);
      Alert.alert('Error', errMsg);
    }
  };

  if (isParamsMissing) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Required signup info is missing. Please restart the signup process.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <>
          <Text style={styles.label}>Enter the 6-digit OTP sent to your phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={(val) => {
              setOtp(val);
              if (val.length < 6) setAutoSubmitDone(false);
            }}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
          >
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  resendButton: { marginTop: 20 },
  resendText: { textAlign: 'center', color: '#007BFF', fontWeight: 'bold' },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'red',
    padding: 20,
  },
});