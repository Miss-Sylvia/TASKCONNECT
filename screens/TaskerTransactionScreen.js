import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function TaskerTransactionScreen() {
  const [earnings] = React.useState([
    { id: '1', task: 'Grocery Delivery', amount: '50', date: '2023-11-15' },
    { id: '2', task: 'Document Pickup', amount: '30', date: '2023-11-10' }
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Earnings</Text>
      
      <FlatList
        data={earnings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.task}>{item.task}</Text>
            <Text style={styles.amount}>+GH₵{item.amount}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingTop: 30, // Added to push content down
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#003366',
    textAlign: 'center',
    marginTop: 10, // Added for extra spacing
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  task: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  amount: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
    marginVertical: 4
  },
  date: {
    color: '#666',
    fontSize: 14
  }
});