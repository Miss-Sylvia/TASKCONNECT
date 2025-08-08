import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const ClientHistoryScreen = () => {
  const historyData = [
    {
      id: '1',
      task: 'Grocery Shopping',
      date: '2023-11-15',
      status: 'Completed',
      tasker: 'Kwame A.',
      amount: '50'
    },
    {
      id: '2',
      task: 'Document Delivery',
      date: '2023-11-10',
      status: 'Cancelled',
      tasker: '-',
      amount: '30'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Errand History</Text>
      
      <FlatList
        data={historyData}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.task}</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tasker:</Text>
              <Text style={styles.detailValue}>{item.tasker}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[
                styles.statusText,
                item.status === 'Completed' ? styles.completed : styles.cancelled
              ]}>
                {item.status}
              </Text>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text style={styles.amountText}>GH₵{item.amount}</Text>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 30, // Added this line to move content down
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  statusText: {
    fontWeight: '500',
  },
  completed: {
    color: '#28a745',
  },
  cancelled: {
    color: '#dc3545',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default ClientHistoryScreen;