// screens/client/RecentTasks.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { BASE_URL } from '../../services/api';

const DEFAULT_USER_ID = 1018; // fallback if not passed via route

export default function RecentTasks({ route }) {
  const userId = route?.params?.currentUser?.id ?? DEFAULT_USER_ID;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const shape = (row) => ({
    id: row.Id ?? row.id,
    title: row.Title ?? row.title ?? 'Untitled task',
    status: row.Status ?? row.status ?? 'Pending',
    updatedAt: row.UpdatedAt || row.updatedAt || row.CreatedAt || row.createdAt,
  });

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      // 🔒 EXACT same pattern as your working MyTasks
      const url = `${BASE_URL}/tasks/user?userId=${userId}`;
      const res = await axios.get(url, { timeout: 8000 });
      const arr = Array.isArray(res?.data?.items) ? res.data.items : [];
      const list = arr.map(shape).sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0));
      setItems(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Server error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));
  const onRefresh = React.useCallback(() => { setRefreshing(true); load(); }, [load]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>ID: {String(item.id)}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.meta}>Status: {item.status}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.meta}>
          {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
        </Text>
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={{ flex:1, backgroundColor:'#f8fafc', padding:16 }}>
      <Text style={styles.header}>Recent Tasks</Text>

      {err ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>Failed to load: {String(err)}</Text>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text>No recent tasks.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  card: { backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:'#e5e7eb', padding:14, marginBottom:12 },
  title: { fontSize:16, fontWeight:'700', color:'#0f172a' },
  metaRow: { flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:6, alignItems:'center' },
  meta: { color:'#475569', fontSize:12, fontWeight:'600' },
  dot: { color:'#94a3b8', marginHorizontal:2 },
  errorBar:{ backgroundColor:'#FEF2F2', borderWidth:1, borderColor:'#FECACA', padding:10, borderRadius:10, marginBottom:8 },
  errorText:{ color:'#991B1B', fontWeight:'700' },
  center:{ flex:1, alignItems:'center', justifyContent:'center' },
});
