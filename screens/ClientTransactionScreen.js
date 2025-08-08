import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const TransactionScreen = () => {
  // Mock data - will be replaced with backend data later
  const [transactions, setTransactions] = useState([
    {
      id: '1',
      type: 'Payment',
      amount: '50',
      date: '2023-11-15',
      status: 'Completed',
      task: 'Grocery Shopping'
    },
    {
      id: '2',
      type: 'Withdrawal',
      amount: '120',
      date: '2023-11-10',
      status: 'Processing',
      task: 'Document Delivery'
    },
    {
      id: '3',
      type: 'Payment',
      amount: '75',
      date: '2023-11-05',
      status: 'Completed',
      task: 'Business Verification'
    }
  ]);

  const [balance, setBalance] = useState('245.00');

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>GH₵{balance}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.buttonText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.buttonText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions Header */}
      <Text style={styles.sectionHeader}>Recent Transactions</Text>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionType}>{item.type}</Text>
              <Text style={[
                styles.transactionAmount,
                item.type === 'Withdrawal' ? styles.negativeAmount : styles.positiveAmount
              ]}>
                {item.type === 'Withdrawal' ? '-' : '+'}GH₵{item.amount}
              </Text>
            </View>
            
            <Text style={styles.transactionTask}>{item.task}</Text>
            
            <View style={styles.transactionFooter}>
              <Text style={styles.transactionDate}>{item.date}</Text>
              <Text style={[
                styles.transactionStatus,
                item.status === 'Completed' ? styles.completedStatus : styles.pendingStatus
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
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
    paddingTop: 30, // Added to move content down
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#28a745', // Green for incoming
  },
  negativeAmount: {
    color: '#dc3545', // Red for outgoing
  },
  transactionTask: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionDate: {
    fontSize: 13,
    color: '#888',
  },
  transactionStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  completedStatus: {
    color: '#28a745',
  },
  pendingStatus: {
    color: '#ffc107',
  },
});

export default TransactionScreen;