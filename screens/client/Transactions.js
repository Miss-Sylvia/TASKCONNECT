// screens/client/Transactions.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, Pressable, ActivityIndicator,
  TextInput, Alert, Linking, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.59.131:5000';

// Read auth from AsyncStorage. Expecting you stored:
// await AsyncStorage.setItem('auth', JSON.stringify({ token, user: { id, email, fullName, role } }));
async function getAuth() {
  try {
    const raw = await AsyncStorage.getItem('auth');
    if (raw) return JSON.parse(raw);
  } catch {}
  // try legacy keys
  try {
    const token = await AsyncStorage.getItem('token');
    const userRaw = await AsyncStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (token || user) return { token, user };
  } catch {}
  return { token: null, user: null };
}

const FILTERS = ['All', 'In', 'Out'];
const SEGMENTS = ['History', 'Deposit', 'Send'];
const SOURCES  = ['Wallet', 'Mobile Money'];

export default function ClientTransactions() {
  const [segment, setSegment] = useState(1); // open Deposit while testing

  // Wallet & history
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState(0);

  // Deposit
  const [depAmount, setDepAmount] = useState('');
  const [depNote, setDepNote] = useState('');
  const [lastInitRef, setLastInitRef] = useState(null);

  // Send / Escrow (kept as-is)
  const [source, setSource] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sending, setSending] = useState(false);
  const [beneficiary, setBeneficiary] = useState(null);
  const lookupTimer = useRef(null);
  const [otpNeeded, setOtpNeeded] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSession, setOtpSession] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { token } = await getAuth();
      const w = await fetch(`${API_URL}/api/wallet/me?role=client`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const t = await fetch(`${API_URL}/api/transactions?role=client&limit=100`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      if (w.ok) {
        const wallet = await w.json();
        setBalance(Number(wallet.available ?? wallet.balance ?? 0));
      } else setBalance(0);

      if (t.ok) {
        const list = await t.json();
        const norm = (Array.isArray(list) ? list : []).map((x, i) => ({
          id: String(x.id ?? x.reference ?? i),
          reference: x.reference ?? `TX-${i + 1}`,
          amount: Number(x.amount ?? 0),
          currency: x.currency ?? 'GHS',
          direction: x.direction ?? (Number(x.amount ?? 0) >= 0 ? 'in' : 'out'),
          status: x.status ?? 'success',
          title: x.title ?? x.type ?? 'Payment',
          note: x.note ?? '',
          createdAt: x.createdAt ?? x.date ?? new Date().toISOString(),
        }));
        setTxns(norm);
        setPending(norm.filter((r) => r.status === 'pending').length);
        setCompleted(norm.filter((r) => r.status === 'success').length);
      } else setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredTxns = useMemo(() => {
    if (filter === 1) return txns.filter((x) => x.direction === 'in');
    if (filter === 2) return txns.filter((x) => x.direction === 'out');
    return txns;
  }, [txns, filter]);

  /* ---------- Deposit (Paystack checkout) ---------- */
  const initDeposit = async () => {
    const amt = Number(depAmount);
    if (!amt || isNaN(amt) || amt <= 0) return Alert.alert('Invalid amount', 'Enter an amount greater than 0.');

    try {
      const { token, user } = await getAuth();

      const res = await fetch(`${API_URL}/api/payments/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          amount: Math.round(amt * 100), // pesewas
          currency: 'GHS',
          note: depNote || undefined,
          email: user?.email || undefined,           // helps Paystack + server email fallback
          metadata: user?.id ? { userId: user.id } : undefined, // BEST way to credit your wallet
          // channels: ['card','mobile_money'], // optional
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to initialize');

      const url = data.authorization_url || data.authorizationUrl || data.data?.authorization_url;
      if (!url) throw new Error('No checkout URL returned');

      setLastInitRef(data.reference || null);

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('Cannot open checkout URL');

      await Linking.openURL(url);
      Alert.alert('Continue in browser', 'Complete payment, then tap “Verify deposit”.');
    } catch (e) {
      console.log('Deposit init error:', e?.message || e);
      Alert.alert('Deposit failed', String(e.message || e));
    }
  };

  const verifyLastDeposit = async () => {
    try {
      if (!lastInitRef) return Alert.alert('No reference', 'Start a deposit first.');
      const { user } = await getAuth();
      const url = `${API_URL}/api/payments/paystack/verify/${encodeURIComponent(lastInitRef)}${
        user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''
      }`;
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.message || 'Verification failed');

      if (j.status === 'success' && j.credited) {
        Alert.alert('Deposit successful', 'Wallet credited. Pull to refresh.');
        await fetchData();
      } else {
        // Show why it didn’t credit to help debugging
        Alert.alert('Not completed', `Payment status: ${j.status}. Credit: ${j.credited}. Reason: ${j.credit_reason || 'unknown'}. Try again shortly.`);
      }
    } catch (e) {
      Alert.alert('Verify error', String(e.message || e));
    }
  };

  /* ---------- Beneficiary validation (unchanged) ---------- */
  const resolveBeneficiary = useCallback(async (query) => {
    try {
      if (!query || query.trim().length < 3) { setBeneficiary(null); return; }
      const { token } = await getAuth();
      const r = await fetch(`${API_URL}/api/beneficiaries/resolve?query=${encodeURIComponent(query)}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!r.ok) { setBeneficiary(null); return; }
      const b = await r.json();
      setBeneficiary(b);
    } catch {
      setBeneficiary(null);
    }
  }, []);

  const onChangeSendTo = (v) => {
    setSendTo(v);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => resolveBeneficiary(v), 400);
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.h1}>Transactions</Text>
        <Text style={styles.sub}>Deposit to wallet or send to a tasker (escrow supported)</Text>
      </View>

      {/* Summary */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.card, styles.rowBetween]}>
          <View>
            <Text style={styles.label}>Available Balance</Text>
            <Text style={styles.kpiValue}>GH₵ {balance.toFixed(2)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallStat}>Completed: {completed}</Text>
            <Text style={styles.smallStat}>Pending: {pending}</Text>
          </View>
        </View>
      </View>

      {/* Segments */}
      <View style={styles.segmentBar}>
        {SEGMENTS.map((label, i) => (
          <Pressable key={label} onPress={() => setSegment(i)} style={[styles.segment, segment === i && styles.segmentActive]}>
            <Text style={[styles.segmentTxt, segment === i && styles.segmentTxtActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Deposit */}
      {segment === 1 && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.card}>
            <Text style={styles.title}>Deposit</Text>
            <Text style={styles.inputLabel}>Amount (GHS)</Text>
            <TextInput value={depAmount} onChangeText={setDepAmount} keyboardType="decimal-pad" placeholder="e.g., 200" style={styles.input} />
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput value={depNote} onChangeText={setDepNote} placeholder="Reference for your records" style={[styles.input, { height: 44 }]} />
            <Pressable style={styles.primaryBtn} onPress={initDeposit}><Text style={styles.primaryBtnTxt}>Continue to Paystack</Text></Pressable>

            {lastInitRef && (
              <Pressable style={[styles.primaryBtn, { backgroundColor: '#0ea5e9' }]} onPress={verifyLastDeposit}>
                <Text style={styles.primaryBtnTxt}>Verify deposit</Text>
              </Pressable>
            )}

            <Text style={[styles.sub, { marginTop: 8 }]}>Complete payment on Paystack, then tap “Verify deposit” or pull to refresh.</Text>
          </View>
        </View>
      )}

      {/* History */}
      {segment === 0 && (
        <>
          <View style={styles.filterBar}>
            {FILTERS.map((f, i) => (
              <Pressable key={f} onPress={() => setFilter(i)} style={[styles.filterChip, filter === i && styles.filterChipActive]}>
                <Text style={[styles.filterTxt, filter === i && styles.filterTxtActive]}>{f}</Text>
              </Pressable>
            ))}
            <Pressable onPress={onRefresh} style={[styles.filterChip, { marginLeft: 'auto' }]}>
              <Ionicons name="refresh" size={16} /><Text style={styles.filterTxt}>Refresh</Text>
            </Pressable>
          </View>
          <FlatList
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            data={filteredTxns}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<View style={{ paddingVertical: 36, alignItems: 'center' }}>{loading ? <ActivityIndicator /> : <Text style={styles.sub}>No transactions</Text>}</View>}
            renderItem={({ item }) => <TxnRow item={item} />}
          />
        </>
      )}

      {/* Send tab placeholder (unchanged) */}
      {segment === 2 && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.card}><Text style={styles.title}>Send to Tasker (Escrow)</Text></View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function TxnRow({ item }) {
  const debit = item.amount < 0 || item.direction === 'out';
  const statusColor = item.status === 'success' ? '#16a34a' : item.status === 'pending' ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBubble, { backgroundColor: debit ? '#fee2e2' : '#dcfce7', borderColor: debit ? '#fecaca' : '#bbf7d0' }]}>
          <Ionicons name={debit ? 'arrow-up' : 'arrow-down'} size={16} color={debit ? '#991b1b' : '#065f46'} />
        </View>
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.reference} • {new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.amount, debit ? styles.amountOut : styles.amountIn]}>
          {debit ? '-' : '+'}GH₵ {Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  h1: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, marginTop: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  kpiValue: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 6 },
  smallStat: { color: '#0f172a', fontSize: 12, fontWeight: '700' },

  segmentBar: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 4, marginTop: 10, marginHorizontal: 16 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segmentTxt: { color: '#6b7280', fontWeight: '700' },
  segmentTxtActive: { color: '#0f172a' },

  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12, marginBottom: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterTxt: { color: '#0f172a', fontWeight: '700' },
  filterTxtActive: { color: '#fff' },

  row: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '900' },
  amountIn: { color: '#065f46' },
  amountOut: { color: '#991b1b' },
  status: { fontSize: 11, marginTop: 4 },

  inputLabel: { color: '#6b7280', fontSize: 12, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, height: 44, color: '#0f172a' },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  primaryBtnTxt: { color: '#fff', fontWeight: '800' },
});