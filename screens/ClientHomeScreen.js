import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const ClientHomeScreen = () => {
  const [activeErrands, setActiveErrands] = useState([
    {
      id: '1',
      title: 'Grocery Shopping',
      description: 'Need groceries from Makola Market',
      status: 'In Progress',
      tasker: 'Kwame A.',
      price: '50'
    },
    {
      id: '2',
      title: 'Document Delivery',
      description: 'Deliver contracts to East Legon',
      status: 'Pending',
      tasker: 'Not assigned yet',
      price: '30'
    }
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Active Errands</Text>
      
      <FlatList
        data={activeErrands}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDetails}>{item.description}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>Status: {item.status}</Text>
              <Text style={styles.metaText}>Tasker: {item.tasker}</Text>
            </View>
            <Text style={styles.taskPrice}>💰 GH₵{item.price}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active errands. Post a new one using the + tab below!</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60, // Changed from 20 to 60 to move content down
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#003366',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  taskContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#003366',
  },
  taskDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  taskPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default ClientHomeScreen;