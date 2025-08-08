import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TaskerHistoryScreen = () => {
  const historyData = [
    {
      id: '1',
      task: 'Grocery Shopping',
      client: 'Ama K.',
      date: '2023-11-15',
      earnings: '45',
      rating: 4,
    },
    {
      id: '2',
      task: 'Business Verification',
      client: 'Kwesi M.',
      date: '2023-11-12',
      earnings: '60',
      rating: 5,
    }
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.taskTitle}>{item.task}</Text>
        <MaterialIcons name="chevron-right" size={24} color="#888" />
      </View>

      <View style={styles.detailRow}>
        <MaterialIcons name="person" size={16} color="#555" />
        <Text style={styles.detailValue}>{item.client}</Text>
      </View>

      <View style={styles.detailRow}>
        <MaterialIcons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>
          {item.rating.toFixed(1)} ({'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)})
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={14} color="#666" />
          <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.earningsText}>+GH₵{item.earnings}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Task History</Text>
      
      <FlatList
        data={historyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 40, // Changed from 24 to 40 to push content down
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 24,
    paddingHorizontal: 8,
    marginTop: 10, // Added for extra spacing
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  earningsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
});

export default TaskerHistoryScreen;