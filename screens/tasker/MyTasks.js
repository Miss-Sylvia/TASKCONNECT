// screens/tasker/MyTasks.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

// ===== configure these to your env =====
const API_BASE = 'http://192.168.59.131:5000/api';
const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '');
// ======================================

const FILTERS = ['Accepted', 'In Progress', 'Completed', 'All'];

export default function MyTasks() {
  const navigation = useNavigation();
  const route = useRoute();

  const [taskerId, setTaskerId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState('Accepted');
  const socketRef = useRef(null);

  // Robust taskerId resolver (route -> auth storage JSON -> legacy key)
  const resolveTaskerId = useCallback(async () => {
    // 1) from route
    const fromRoute = route?.params?.taskerId;
    if (fromRoute) {
      await AsyncStorage.setItem('taskerId', String(fromRoute));
      return Number(fromRoute);
    }

    // 2) from saved auth user JSONs
    const keysToTry = ['currentUser', 'user', 'auth:user'];
    for (const k of keysToTry) {
      const raw = await AsyncStorage.getItem(k);
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          // common shapes: {id, role}, {user:{id,role}}, {profile:{id}}
          const id = obj?.id ?? obj?.user?.id ?? obj?.profile?.id;
          const role = (obj?.role ?? obj?.user?.role ?? obj?.profile?.role ?? '').toLowerCase();
          if (id && (!role || role === 'tasker')) return Number(id);
        } catch {}
      }
    }

    // 3) legacy single key
    const saved = await AsyncStorage.getItem('taskerId');
    if (saved) return Number(saved);

    return null;
  }, [route?.params?.taskerId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const id = await resolveTaskerId();
      if (alive) setTaskerId(id);
    })();
    return () => { alive = false; };
  }, [resolveTaskerId]);

  // Socket.IO live updates
  useEffect(() => {
    if (!taskerId) return;
    const s = io(SOCKET_BASE, { transports: ['websocket'], query: { taskerId: String(taskerId) } });
    socketRef.current = s;
    const onUpdate = (payload) => {
      if (!payload) return;
      if (payload.TaskerId && String(payload.TaskerId) !== String(taskerId)) return;
      load(false);
    };
    s.on('tasks:update', onUpdate);
    return () => { s.off('tasks:update', onUpdate); s.disconnect(); socketRef.current = null; };
  }, [taskerId]);

  const effectiveStatusParam = useMemo(() => {
    if (statusFilter === 'All') return null;
    if (statusFilter === 'In Progress') return 'InProgress';
    return statusFilter; // Accepted | Completed
  }, [statusFilter]);

  async function load(showSpinner = false) {
    if (!taskerId) return;
    try {
      if (showSpinner) setLoading(true);
      const params = { taskerId };
      if (effectiveStatusParam) params.status = effectiveStatusParam;
      const { data } = await axios.get(`${API_BASE}/tasks/tasker`, { params, timeout: 10000 });
      setTasks(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.log('Fetch MyTasks error:', e?.response?.data || e.message);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { if (taskerId) load(true); }, [taskerId, effectiveStatusParam]);
  useFocusEffect(React.useCallback(() => { if (taskerId) load(false); }, [taskerId, effectiveStatusParam]));
  const onRefresh = () => { setRefreshing(true); load(false); };

  // Progress helpers
  const statusInfo = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'pending')     return { label: 'Pending',     color: '#64748b', step: 0, pct: 0 };
    if (v === 'accepted')    return { label: 'Accepted',    color: '#0ea5e9', step: 1, pct: 33 };
    if (v === 'inprogress' || v === 'in_progress')
                             return { label: 'In Progress', color: '#f59e0b', step: 2, pct: 66 };
    if (v === 'completed')   return { label: 'Completed',   color: '#10b981', step: 3, pct: 100 };
    if (v === 'cancelled' || v === 'canceled')
                             return { label: 'Cancelled',   color: '#ef4444', step: 0, pct: 0 };
    return { label: s || 'Unknown', color: '#64748b', step: 0, pct: 0 };
  };

  const actionsFor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted')  return [{ key: 'start', label: 'Start', next: 'InProgress' }];
    if (s === 'inprogress' || s === 'in_progress') {
      return [
        { key: 'complete', label: 'Complete', next: 'Completed' },
        { key: 'cancel',   label: 'Cancel',   next: 'Cancelled', secondary: true },
      ];
    }
    return [];
  };

  async function updateStatus(taskId, nextStatus) {
    if (!taskerId) return;
    try {
      await axios.patch(`${API_BASE}/tasks/${taskId}/status`, { taskerId, status: nextStatus });
      setNotice('Client notified of progress');
      setTimeout(() => setNotice(''), 1500);
      await load(false);
    } catch (e) {
      Alert.alert('Update failed', e?.response?.data?.message || 'Try again.');
    }
  }

  const Filters = () => (
    <View style={styles.filtersRow}>
      {FILTERS.map(f => {
        const active = statusFilter === f;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        );
      })}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </View>
  );

  const renderItem = ({ item }) => {
    const id = item.id ?? item.Id;
    const title = item.title ?? item.Title ?? `Task #${id}`;
    const status = item.status ?? item.Status;
    const desc = item.description ?? item.Description;

    const disp = statusInfo(status);
    const aList = actionsFor(status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${disp.color}22`, borderColor: disp.color }]}>
            <Text style={[styles.statusText, { color: disp.color }]}>{disp.label}</Text>
          </View>
        </View>

        {desc ? <Text style={styles.desc} numberOfLines={2}>{desc}</Text> : null}

        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${disp.pct}%`,
              backgroundColor: disp.color === '#ef4444' ? '#ef4444' : '#10b981'
            }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, disp.step >= 0 && styles.progressDone]}>Pending</Text>
            <Text style={[styles.progressLabel, disp.step >= 1 && styles.progressDone]}>Accepted</Text>
            <Text style={[styles.progressLabel, disp.step >= 2 && styles.progressDone]}>In Progress</Text>
            <Text style={[styles.progressLabel, disp.step >= 3 && styles.progressDone]}>Completed</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          {aList.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actionBtn, a.secondary ? styles.actionSecondary : styles.actionPrimary]}
              onPress={() => updateStatus(id, a.next)}
              activeOpacity={0.9}
            >
              <Text style={[styles.actionText, a.secondary ? styles.actionTextDark : styles.actionTextLight]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Filters />

      {!taskerId ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ color: '#64748b', marginTop: 8, textAlign: 'center' }}>
            Getting your Tasker profile… Pull to refresh if it takes too long.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => String(t.id ?? t.Id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#64748b" />}
          ListHeaderComponent={
            loading ? (
              <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator />
                <Text style={{ color: '#64748b' }}>Loading…</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Ionicons name="briefcase-outline" size={28} color="#94a3b8" />
                <Text style={{ color: '#64748b', marginTop: 8 }}>
                  {statusFilter === 'All' ? 'No tasks found.' : `No ${statusFilter} tasks.`}
                </Text>
              </View>
            )
          }
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontWeight: '700', color: '#111827' },
  chipTextActive: { color: '#fff' },
  notice: { marginLeft: 6, color: '#10b981', fontWeight: '700' },

  card: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: 'white' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, paddingRight: 8 },

  statusPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },

  desc: { marginTop: 6, color: '#475569' },

  progressWrap: { marginTop: 10 },
  progressBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 999 },
  progressFill: { height: 8, borderRadius: 999 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontSize: 11, color: '#94a3b8' },
  progressDone: { color: '#111827', fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  actionPrimary: { backgroundColor: '#111827' },
  actionSecondary: { backgroundColor: '#f1f5f9' },
  actionText: { fontSize: 14, fontWeight: '700' },
  actionTextLight: { color: 'white' },
  actionTextDark: { color: '#111827' },
});
