// screens/client/MyTasks.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../../services/api';

const CURRENT_USER_ID = 1018;

// --- DELIVERY vs ERRAND DETECTION ---
// We try multiple signals coming from different schemas.
// If none found, we fallback to title/status keyword hints.
const looksLikeDelivery = (row) => {
  // explicit flags / enums
  if (row?.IsDelivery === 1 || row?.IsDelivery === true) return true;
  if (row?.isDelivery === true) return true;
  const cat = String(row?.Category || row?.category || row?.Type || '').toLowerCase();
  if (cat === 'delivery' || cat === 'courier' || cat === 'ride') return true;

  // pickup/dropoff coordinates or addresses
  if (row?.PickupLat || row?.PickupLng || row?.DropoffLat || row?.DropoffLng) return true;
  if (row?.PickupAddress || row?.DropoffAddress) return true;
  if (row?.pickup || row?.dropoff) return true;

  // related delivery id
  if (row?.DeliveryId || row?.deliveryId) return true;

  // sometimes Address/City/Region pairs encode travel
  if ((row?.PickupCity || row?.DropoffCity) || (row?.PickupRegion || row?.DropoffRegion)) return true;

  // keyword fallbacks (title or status)
  const title = String(row?.Title || row?.title || '').toLowerCase();
  const status = String(row?.Status || row?.status || '').toLowerCase();
  const deliveryHints = ['deliver', 'pickup', 'pick up', 'dropoff', 'drop off', 'parcel', 'package', 'ride', 'courier', 'dispatch'];
  if (deliveryHints.some(h => title.includes(h) || status.includes(h))) return true;

  return false; // treat as Errand by default
};

// derive % progress from status if no numeric progress
const progressFromStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('cancel')) return 0;
  if (s.includes('completed') || s.includes('delivered')) return 100;
  if (s.includes('transit')) return 80;
  if (s.includes('progress') || s.includes('pick')) return 60;
  if (s.includes('accept') || s.includes('assign')) return 40;
  if (s.includes('pending')) return 10;
  return 20;
};

const STATUS_CHIPS = ['All','Deliveries','Errands'];

export default function MyTasks({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('All');
  const [q, setQ] = useState('');

  const shape = (row) => {
    const delivery = looksLikeDelivery(row);
    const id = row?.Id ?? row?.id;
    const title = row?.Title ?? row?.title;
    const status = row?.Status ?? row?.status;
    const progress = Number.isFinite(Number(row?.progress))
      ? Number(row.progress)
      : progressFromStatus(status);
    const updatedAt = row?.UpdatedAt || row?.updatedAt || row?.CreatedAt || row?.createdAt;

    // include a normalized flag the UI can use
    return {
      id,
      title,
      status,
      isDelivery: delivery,
      category: row?.Category || row?.category || (delivery ? 'Delivery' : 'Errand'),
      progress,
      updatedAt,
    };
  };

  const fetchTasks = useCallback(async () => {
    try {
      const url = `${BASE_URL}/tasks/user?userId=${CURRENT_USER_ID}`;
      const res = await axios.get(url);
      const list = Array.isArray(res?.data?.items) ? res.data.items.map(shape) : [];
      setTasks(list);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err?.response?.data || err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useFocusEffect(useCallback(() => { fetchTasks(); }, [fetchTasks]));
  const onRefresh = useCallback(() => { setRefreshing(true); fetchTasks(); }, [fetchTasks]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (tasks || []).filter(t => {
      const inTab =
        tab === 'All' ? true :
        tab === 'Deliveries' ? t.isDelivery :
        !t.isDelivery;
      if (!inTab) return false;
      if (!ql) return true;
      return [t.title, t.status, t.category].filter(Boolean)
        .some(s => String(s).toLowerCase().includes(ql));
    });
  }, [tasks, tab, q]);

  const ProgressBar = ({ pct=0 }) => (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, pct))}%` }]} />
    </View>
  );

  const Badge = ({ label, tone='default' }) => (
    <View style={[
      styles.badge,
      tone==='success'?{backgroundColor:'#E6F7EE'}:tone==='info'?{backgroundColor:'#EAF2FF'}:{backgroundColor:'#F1F2F4'}
    ]}>
      <Text style={[
        styles.badgeText,
        tone==='success'?{color:'#0E9F6E'}:tone==='info'?{color:'#2563EB'}:{color:'#111827'}
      ]}>{label}</Text>
    </View>
  );

  const goTrack = (taskId) => {
    const tabs = navigation.getParent?.('ROOT_TABS');
    if (tabs?.navigate) tabs.navigate('Task Tracker', { taskId });
    else navigation.getParent?.()?.navigate?.('Task Tracker', { taskId });
  };

  const renderItem = ({ item }) => {
    const tone =
      /delivered|completed/i.test(item.status) ? 'success' :
      /transit|assign|accept|pick|progress/i.test(item.status) ? 'info' : 'default';

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.title} numberOfLines={2}>{item.title || 'Untitled task'}</Text>
          <Badge label={item.isDelivery ? 'Delivery' : 'Errand'} tone={item.isDelivery ? 'info':'default'} />
        </View>

        <View style={[styles.row, {marginTop:4}]}>
          <Text style={styles.meta}>Status: </Text>
          <Badge label={item.status || '—'} tone={tone} />
        </View>

        <View style={{marginTop:10}}>
          <ProgressBar pct={item.progress} />
          <View style={styles.rowBetween}>
            <Text style={styles.pct}>{item.progress}%</Text>
            {item.updatedAt ? <Text style={styles.updated}>Updated {new Date(item.updatedAt).toLocaleString()}</Text> : <View/>}
          </View>
        </View>

        {item.isDelivery ? (
          <TouchableOpacity style={styles.btn} onPress={() => goTrack(item.id)}>
            <Text style={styles.btnText}>Track Progress</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hint}>No travel required — this is an Errand.</Text>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={{flex:1}}>
      {/* filters + search */}
      <View style={{paddingHorizontal:16, paddingTop:12}}>
        <View style={styles.tabsRow}>
          {STATUS_CHIPS.map(s => (
            <TouchableOpacity key={s} onPress={() => setTab(s)}>
              <View style={[styles.tab, tab===s && styles.tabActive]}>
                <Text style={[styles.tabText, tab===s && styles.tabTextActive]}>{s}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchBox}>
          <TextInput placeholder="Search tasks…" value={q} onChangeText={setQ} style={{fontSize:14}} />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text>No tasks found.</Text>
          <TouchableOpacity style={[styles.btn, {marginTop:12}]} onPress={onRefresh}>
            <Text style={styles.btnText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ padding:16, paddingTop:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow:{ flexDirection:'row', gap:8 },
  tab:{ paddingHorizontal:14, paddingVertical:8, borderRadius:999, backgroundColor:'#E5E7EB' },
  tabActive:{ backgroundColor:'#111827' },
  tabText:{ fontWeight:'700', color:'#111827' },
  tabTextActive:{ color:'#fff' },
  searchBox:{ marginTop:10, backgroundColor:'#fff', borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1, borderColor:'#E5E7EB' },

  card:{ backgroundColor:'#fff', padding:16, marginBottom:12, borderRadius:12, borderWidth:1, borderColor:'#eee' },
  row:{ flexDirection:'row', alignItems:'center' },
  rowBetween:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  title:{ fontSize:16, fontWeight:'700', flex:1, paddingRight:8 },
  meta:{ color:'#374151', fontSize:13 },
  badge:{ paddingHorizontal:10, paddingVertical:6, borderRadius:999 },
  badgeText:{ fontSize:12, fontWeight:'600' },
  progressTrack:{ height:8, backgroundColor:'#E5E7EB', borderRadius:999, overflow:'hidden' },
  progressFill:{ height:8, backgroundColor:'#111827' },
  pct:{ fontWeight:'700' },
  updated:{ color:'#6B7280', fontSize:12 },
  btn:{ marginTop:12, backgroundColor:'#111827', paddingVertical:10, borderRadius:10, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'700' },
  hint:{ marginTop:10, color:'#6B7280', fontStyle:'italic' },
  center:{ flex:1, justifyContent:'center', alignItems:'center', padding:24 },
});
