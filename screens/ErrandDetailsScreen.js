import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ErrandDetailsScreen({ route }) {
  const { title, description, location, price } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.location}>📍 {location}</Text>
      <Text style={styles.price}>💰 GH₵{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    paddingTop: 50,  // Moves content down a bit
    paddingHorizontal: 20, // Keeps content from touching screen edges
    backgroundColor: '#fff', // Keep background white
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  location: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007bff',
  },
});
