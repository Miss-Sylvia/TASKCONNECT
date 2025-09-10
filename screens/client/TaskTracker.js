// screens/client/TaskTracker.js
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.59.131:3000';
const STATUS_CHIPS = ['All','Pending','Assigned','Picked Up','In Transit','Delivered','Cancelled'];

export default function TaskTracker({ route }) {
  const currentUser = route?.params?.currentUser;  // or your auth context
  const clientId = currentUser?.id || route?.params?.clientId;

  const [tab, setTab] = useState('All');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/client/${clientId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTasks(json.tasks || []);
    } catch (e) {
      console.log('TaskTracker fetch error:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTasks(); }, [clientId]));

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (tasks || []).filter(t => {
      const inTab = tab === 'All' ? true : (t.status === tab);
      if (!inTab) return false;
      if (!ql) return true;
      return [t.title, t.code, t.pickup, t.dropoff, t.runnerName]
        .filter(Boolean)
        .some(s => String(s).toLowerCase().includes(ql));
    });
  }, [tasks, tab, q]);

  const Badge = ({ label, tone='default' }) => (
    <View style={{
      paddingHorizontal:10, paddingVertical:6, borderRadius:999,
      backgroundColor: tone==='success' ? '#E6F7EE' :
                      tone==='info'    ? '#EAF2FF' : '#F1F2F4'
    }}>
      <Text style={{fontSize:12, fontWeight:'600',
        color: tone==='success' ? '#0E9F6E' :
               tone==='info'    ? '#2563EB' : '#111827' }}>{label}</Text>
    </View>
  );

  const ProgressBar = ({ pct=0 }) => (
    <View style={{height:8, backgroundColor:'#E5E7EB', borderRadius:999, overflow:'hidden'}}>
      <View style={{height:8, width:`${Math.max(0,Math.min(100,pct))}%`, backgroundColor:'#111827'}} />
    </View>
  );

  const Row = ({ icon, label, value }) => (
    <View style={{ flexDirection:'row', alignItems:'center' }}>
      <Text style={{ width:24 }}>{icon}</Text>
      <Text style={{ color:'#6B7280', width:64 }}>{label}</Text>
      <Text style={{ fontWeight:'600', flexShrink:1 }}>{value}</Text>
    </View>
  );

  const Item = ({ item }) => {
    const tone = item.status === 'Delivered' ? 'success'
               : (item.status === 'Assigned' || item.status === 'Picked Up' || item.status === 'In Transit') ? 'info'
               : 'default';
    return (
      <View style={{ backgroundColor:'#fff', borderRadius:16, padding:14, marginHorizontal:12, marginVertical:8, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8, elevation:1 }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <Text style={{ fontSize:16, fontWeight:'700' }}>{item.title}</Text>
          <Badge label={item.status} tone={tone} />
        </View>

        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
          <View style={{ gap:6 }}>
            <Row icon="🆔" label="Task ID" value={item.code} />
            <Row icon="🍴" label="Pickup" value={item.pickup || '—'} />
            <Row icon="🏁" label="Dropoff" value={item.dropoff || '—'} />
            {item.runnerName ? <Row icon="🏃" label="Runner" value={item.runnerName} /> : null}
          </View>
          <View style={{ alignItems:'flex-end' }}>
            <Text style={{ color:'#6B7280', fontSize:12 }}>
              Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
            </Text>
          </View>
        </View>

        <View style={{ gap:6 }}>
          <ProgressBar pct={item.progress} />
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ fontWeight:'600' }}>{item.progress}%</Text>
            {item.etaMinutes ? <Text style={{ color:'#6B7280' }}>{item.etaMinutes} mins</Text> : <View/>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex:1, backgroundColor:'#F8FAFC' }}>
      {/* Header */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:8 }}>
        <Text style={{ fontSize:22, fontWeight:'800' }}>Task Tracker</Text>
        <View style={{ flexDirection:'row', gap:12, marginTop:6 }}>
          <Badge label="Live ETA" tone="info" />
          <Badge label="Verified Runners" tone="default" />
        </View>

        {/* Search */}
        <View style={{ marginTop:12, backgroundColor:'#fff', borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:'#E5E7EB' }}>
          <TextInput
            placeholder="Search by id, title, pickup or dropoff"
            value={q}
            onChangeText={setQ}
            style={{ fontSize:14 }}
          />
        </View>

        {/* Chips */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:12 }}>
          {STATUS_CHIPS.map(s => (
            <TouchableOpacity key={s} onPress={() => setTab(s)}>
              <View style={{
                paddingHorizontal:12, paddingVertical:8, borderRadius:999,
                backgroundColor: s===tab ? '#111827' : '#E5E7EB'
              }}>
                <Text style={{ color: s===tab ? '#fff' : '#111827', fontWeight:'700' }}>{s}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop:8 }}>Loading tasks…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => <Item item={item} />}
          contentContainerStyle={{ paddingBottom:24 }}
        />
      )}
    </View>
  );
}
