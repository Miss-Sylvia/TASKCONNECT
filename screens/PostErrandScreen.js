import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';

const PostErrandScreen = ({ navigation }) => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = () => {
    if (!description.trim() || !location.trim() || !budget.trim()) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    if (isNaN(Number(budget))) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    Alert.alert('Success', 'Errand posted successfully!');
    setDescription('');
    setLocation('');
    setBudget('');
    
    // Optional: Navigate back after submission
    // navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Post a New Errand</Text>

        <TextInput
          placeholder="Task Description"
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TextInput
          placeholder="Location"
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <TextInput
          placeholder="Budget (GHS ₵)"
          style={styles.input}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Post Errand</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Changed from '#f0f8ff' to white
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#003366',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  input: {
    height: 50,
    borderColor: '#003366',
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007bff', // Matching your TransactionScreen button color
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PostErrandScreen;