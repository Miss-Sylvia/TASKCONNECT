import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../services/api';

export default function AvailableTaskers({ route, navigation }) {
  const { task } = route.params || {};
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRankedTaskers = async () => {
    try {
      const { data } = await axios.post(`${BASE_URL}/ai/rank-taskers`, { task });
      setItems(data.items || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load taskers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankedTaskers();
  }, []);

  const renderItem = ({ item }) => (
    <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.FullName}</Text>
      <Text>Score: {item.score}</Text>
      <Text>Distance: {item.distanceKm ?? '-'} km</Text>
      <Text>Rating: {item.rating ?? '-'}</Text>
      <Text>Completed: {item.completed ?? 0}</Text>
      <Text>Response Median: {item.responseMins ?? '-'} mins</Text>
      <Text>Skill Match: {item.skillMatch ? 'Yes' : 'No'}</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('ConfirmTask', { task, selectedTasker: item })}
        style={{ marginTop: 10, backgroundColor: '#111', padding: 10, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white' }}>Choose {item.FullName}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Ranking taskers…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 10 }}>Top Matches</Text>
      <FlatList
        data={items || []}
        keyExtractor={(it) => String(it.TaskerId)}
        renderItem={renderItem}
      />
    </View>
  );
}
