// screens/tasker/TaskerHome.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { api, cedis } from '../../utils/api';
import TaskCard from '../../components/TaskCard';
import ActiveTaskCard from '../../components/ActiveTaskCard';

export default function TaskerHome({ navigation, route }) {
  const currentUser = route?.params?.currentUser;
  const TASKER_ID = currentUser?.id;

  const [online, setOnline] = useState(false);
  const [summary, setSummary] = useState(null);

  // Default to "My Area" and GPS off for predictable demo
  const [tab, setTab] = useState('location'); // 'nearby' | 'location'
  const [useGps, setUseGps] = useState(false);

  const [filters, setFilters] = useState({ minPay: 0, category: 'All' });
  const [coords, setCoords] = useState(null);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');
  const loadMoreRef = useRef(false);

  // ---- Location helpers (for Nearby tab) ----
  const requestCoords = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({});
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch { return null; }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!useGps) { setCoords(null); return; }
      const c = await requestCoords();
      if (alive) setCoords(c);
    })();
    return () => { alive = false; };
  }, [useGps, requestCoords]);

  // ---- Summary (optional) ----
  const loadSummary = useCallback(async () => {
    try {
      if (!TASKER_ID) return; // summary needs a tasker id
      setSummary(await api(`/api/taskers/${TASKER_ID}/summary`));
    } catch (e) { console.warn('summary', e.message); }
  }, [TASKER_ID]);

  // ---- Feed builders ----
  function buildOpenUrl(pg = 1, opts = {}) {
    const { withLocation = true } = opts;
    const myArea = (currentUser?.location || currentUser?.address || '').trim();
    const qs = new URLSearchParams({
      page: String(pg),
      limit: '10',
      ...(withLocation && tab === 'location' && myArea ? { location: myArea } : {}),
      ...(filters.minPay ? { minPay: String(filters.minPay) } : {}),
      ...(filters.category && filters.category !== 'All' ? { category: filters.category } : {}),
    });
    return `/api/tasks/open?${qs.toString()}`;
  }

  function buildNearbyUrl() {
    const qs = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius_km: '10',
    });
    return `/api/tasks/nearby?${qs.toString()}`;
  }

  // ---- Load feed (with fallbacks) ----
  const loadPage = useCallback(async (pg = 1, replace = false) => {
    if (loadMoreRef.current) return;
    loadMoreRef.current = true;
    setNote('');
    try {
      if (pg === 1) setLoading(true);

      // Nearby tab: try GPS → fallback to area → fallback to ALL
      if (tab === 'nearby' && useGps && coords?.lat && coords?.lng) {
        const data = await api(buildNearbyUrl());
        let items = data.items || [];
        if (!items.length) {
          setNote('No nearby pins found — showing tasks in your area.');
          const data2 = await api(buildOpenUrl(1, { withLocation: true }));
          items = data2.items || [];
          if (!items.length) {
            setNote('No matches in your area — showing all open tasks.');
            const data3 = await api(buildOpenUrl(1, { withLocation: false }));
            items = data3.items || [];
            setHasMore(Boolean(data3?.nextPage));
          } else {
            setHasMore(Boolean(data2?.nextPage));
          }
          setPage(1);
          setList(items);
        } else {
          setHasMore(false);
          setPage(1);
          setList(items);
        }
        setLoading(false);
        loadMoreRef.current = false;
        return;
      }

      // Location tab (or GPS off): try area first → fallback to ALL
      const data = await api(buildOpenUrl(pg, { withLocation: true }));
      let items = data.items || [];

      if (!items.length && pg === 1) {
        setNote('No tasks in your area — showing all open tasks.');
        const data2 = await api(buildOpenUrl(1, { withLocation: false }));
        items = data2.items || [];
        setHasMore(Boolean(data2?.nextPage));
        setPage(1);
        setList(items);
      } else {
        setHasMore(Boolean(data?.nextPage));
        setPage(pg);
        setList(prev => (replace || pg === 1) ? items : [...prev, ...items]);
      }
    } catch (e) {
      console.warn('feed', e.message);
      if (pg === 1) setList([]);
    } finally {
      setLoading(false);
      loadMoreRef.current = false;
    }
  }, [tab, useGps, coords?.lat, coords?.lng, filters.minPay, filters.category, currentUser?.location, currentUser?.address]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadPage(1, true); }, [loadPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSummary(), loadPage(1, true)]);
    setRefreshing(false);
  }, [loadSummary, loadPage]);

  const onEndReached = () => { if (!loading && hasMore) loadPage(page + 1); };

  // ---- Actions ----
  const toggleOnline = async (value) => {
    setOnline(value);
    try {
      if (!TASKER_ID) return;
      await api(`/api/taskers/${TASKER_ID}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ online: value }),
      });
    } catch {
      setOnline(!value);
      Alert.alert('Error', 'Could not update availability.');
    }
  };

  const toggleGps = async (value) => {
    setUseGps(value);
    if (value) {
      const c = await requestCoords();
      if (!c) {
        Alert.alert('Location', 'Turn on location to see nearby tasks.', [
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: async () => { try { await Linking.openSettings(); } catch {} } }
        ]);
      }
      setCoords(c || null);
      setTab('nearby');
    } else {
      setCoords(null);
      setTab('location');
    }
  };

  const acceptTask = async (task) => {
    if (!online) { Alert.alert('Go Online', 'Switch Online to accept tasks.'); return; }
    try {
      if (!TASKER_ID) { Alert.alert('Login needed', 'Please log in again as a tasker.'); return; }
      const taskId = task.Id ?? task.id;
      await api(`/api/tasks/${taskId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ taskerId: TASKER_ID }),
      });
      await loadSummary();
      await loadPage(1, true);
      navigation.navigate('Task Tracker', { taskId });
    } catch (e) {
      Alert.alert('Could not accept', e.message?.replace?.(/<[^>]*>?/gm, '') || 'Please try again.');
    }
  };

  const declineTask = async (task) => {
    try {
      if (!TASKER_ID) { Alert.alert('Login needed', 'Please log in again as a tasker.'); return; }
      const taskId = task.Id ?? task.id;
      await api(`/api/tasks/${taskId}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({ taskerId: TASKER_ID }),
      });
      await loadPage(1, true);
    } catch (e) {
      Alert.alert('Could not decline', e.message?.replace?.(/<[^>]*>?/gm, '') || 'Please try again.');
    }
  };

  const openTaskBank = () => {
    try { navigation.navigate('Task Bank'); } catch { navigation.navigate('Transactions'); }
  };

  // ---- UI sections ----
  const activeTask = summary?.activeTask || null;
  const rating = Number(summary?.overallRating ?? 0);
  const ratingCount = Number(summary?.ratingCount ?? 0);

  const Header = () => (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.hi}>Hi {currentUser?.fullName?.split(' ')[0] || ''}</Text>
        <Text style={styles.sub}>Make some moves today</Text>
      </View>
      <View style={styles.rightToggles}>
        <View style={styles.availability}>
          <Text style={styles.availabilityText}>{online ? 'Online' : 'Offline'}</Text>
          <Switch value={online} onValueChange={toggleOnline} />
        </View>
        <View style={styles.gpsBox}>
          <Text style={styles.gpsLabel}>{useGps ? 'GPS On' : 'GPS Off'}</Text>
          <Switch value={useGps} onValueChange={toggleGps} />
        </View>
      </View>
    </View>
  );

  const Metrics = () => (
    <View>
      <View style={styles.metricsRow}>
        <Metric label="Today" value={cedis(summary?.todayEarnings || 0)} />
        <Metric label="This Week" value={cedis(summary?.weekEarnings || 0)} />
        <Metric label="Jobs Done" value={String(summary?.jobsDone || 0)} />
      </View>

      <View style={styles.rowBetween}>
        <View style={styles.ratingCard}>
          <Ionicons name="star" size={16} />
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} <Text style={styles.ratingSub}>({ratingCount})</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.withdrawBtn} onPress={openTaskBank}>
          <Ionicons name="wallet-outline" size={16} />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const Tabs = () => (
    <View style={styles.tabs}>
      <TabBtn label="Nearby"  active={tab === 'nearby'}  onPress={() => { setTab('nearby'); if (useGps) requestCoords().then(setCoords); }} />
      <TabBtn label="My Area" active={tab === 'location'} onPress={() => setTab('location')} />
    </View>
  );

  const Filters = () => (
    <View style={styles.filters}>
      <TouchableOpacity
        style={[styles.filterChip, filters.minPay ? styles.filterChipActive : null]}
        onPress={() => setFilters(f => ({ ...f, minPay: f.minPay >= 50 ? 0 : 50 }))}
      >
        <Ionicons name="cash-outline" size={16} />
        <Text style={styles.filterText}>{filters.minPay ? `Min ₵${filters.minPay}` : 'Any ₵'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterChip}
        onPress={() => {
          const seq = ['All', 'Errand', 'Delivery'];
          setFilters(f => ({ ...f, category: seq[(seq.indexOf(f.category) + 1) % seq.length] }));
        }}
      >
        <Ionicons name="funnel-outline" size={16} />
        <Text style={styles.filterText}>{filters.category}</Text>
      </TouchableOpacity>

      {tab === 'nearby' && (
        <TouchableOpacity style={styles.filterChip} onPress={() => toggleGps(!useGps)}>
          <Ionicons name={useGps && coords ? 'location' : 'location-outline'} size={16} />
          <Text style={styles.filterText}>{useGps && coords ? 'GPS on' : 'GPS off'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ListHeader = () => (
    <View>
      <Header />
      <Metrics />
      {activeTask && (
        <ActiveTaskCard
          task={activeTask}
          onOpenTracker={() => navigation.navigate('Task Tracker', { taskId: activeTask.id })}
          onChat={() => navigation.navigate('ChatThread', { taskId: activeTask.id, peerId: activeTask.clientId })}
          onAdvanceStatus={async (next) => {
            try {
              await api(`/api/tasks/${activeTask.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ taskerId: TASKER_ID, status: next }),
              });
              await loadSummary();
            } catch { Alert.alert('Update failed', 'Try again.'); }
          }}
        />
      )}
      <Tabs />
      <Filters />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <Text style={styles.sectionTitle}>Recent client posts</Text>
    </View>
  );

  const ActionsRow = ({ item }) => (
    <View style={styles.actionsRow}>
      <TouchableOpacity style={[styles.btnAction, styles.btnDecline]} onPress={() => declineTask(item)}>
        <Ionicons name="close-circle-outline" size={16} />
        <Text style={styles.btnActionText}>Decline</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btnAction, styles.btnAccept, !online && { opacity: 0.6 }]}
        disabled={!online}
        onPress={() => acceptTask(item)}
      >
        <Ionicons name="checkmark-circle-outline" size={16} />
        <Text style={styles.btnActionText}>{online ? 'Accept' : 'Go Online to Accept'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 8 }}>
      <TaskCard
        task={item}
        canAccept={online}
        onPressAccept={() => acceptTask(item)}
        onPressDetails={() => navigation.navigate('Task Details', { taskId: item.Id ?? item.id })}
      />
      <ActionsRow item={item} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(it) => String(it.Id ?? it.id)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
        onEndReachedThreshold={0.25}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={{ padding:16 }}>
            <Text style={{ color:'#6b7280' }}>No open tasks found here.</Text>
          </View>
        }
      />
    </View>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },

  header:{ flexDirection:'row', alignItems:'center', padding:16 },
  hi:{ fontSize:20, fontWeight:'700' },
  sub:{ color:'#6b7280', marginTop:2 },

  rightToggles:{ gap:12, alignItems:'flex-end' },
  availability:{ alignItems:'flex-end' },
  availabilityText:{ fontWeight:'600', marginBottom:6 },

  gpsBox:{ alignItems:'flex-end' },
  gpsLabel:{ fontWeight:'600', marginBottom:6 },

  metricsRow:{ flexDirection:'row', gap:10, paddingHorizontal:16, marginBottom:8 },
  metricCard:{ flex:1, backgroundColor:'#f3f4f6', padding:12, borderRadius:12, alignItems:'center' },
  metricValue:{ fontWeight:'700', fontSize:16 },
  metricLabel:{ color:'#6b7280', fontSize:12, marginTop:2 },

  rowBetween:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, marginBottom:6 },

  ratingCard:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#fef9c3', paddingVertical:8, paddingHorizontal:12, borderRadius:10, borderWidth:1, borderColor:'#fde68a' },
  ratingText:{ fontWeight:'700' },
  ratingSub:{ color:'#6b7280', fontWeight:'500' },

  withdrawBtn:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#eef2ff', paddingVertical:8, paddingHorizontal:12, borderRadius:10, borderWidth:1, borderColor:'#c7d2fe' },
  withdrawText:{ fontWeight:'700' },

  tabs:{ flexDirection:'row', gap:8, paddingHorizontal:16, marginTop:8 },
  tabBtn:{ paddingVertical:8, paddingHorizontal:12, borderRadius:9999, backgroundColor:'#f3f4f6' },
  tabBtnActive:{ backgroundColor:'#111827' },
  tabText:{ color:'#111827', fontWeight:'600' },
  tabTextActive:{ color:'#fff' },

  filters:{ flexDirection:'row', gap:8, paddingHorizontal:16, marginTop:10, marginBottom:6 },
  filterChip:{ flexDirection:'row', alignItems:'center', gap:6, paddingVertical:6, paddingHorizontal:10, borderRadius:9999, backgroundColor:'#f9fafb', borderWidth:1, borderColor:'#e5e7eb' },
  filterChipActive:{ backgroundColor:'#e5ffe7', borderColor:'#bbf7d0' },
  filterText:{ fontWeight:'600' },

  note:{ color:'#6b7280', paddingHorizontal:16, marginTop:4 },

  sectionTitle:{ paddingHorizontal:16, marginTop:8, marginBottom:6, fontWeight:'700' },

  actionsRow:{ flexDirection:'row', gap:10, paddingHorizontal:16, marginTop:6 },
  btnAction:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:10, borderWidth:1 },
  btnDecline:{ backgroundColor:'#fff1f2', borderColor:'#fecdd3' },
  btnAccept:{ backgroundColor:'#ecfeff', borderColor:'#bae6fd' },
  btnActionText:{ fontWeight:'700' },
});
