// screens/tasker/TaskBank.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.100:3000';
// TODO: replace with your real auth
const getAuthToken = async () => null;

const GH_MOMO = [
  { code: 'MTN', label: 'MTN MoMo' },
  { code: 'ATL', label: 'AirtelTigo Money' },
  { code: 'VOD', label: 'Telecel Cash' },
];

const isGhanaMomo = (msisdn) => {
  const n = (msisdn || '').replace(/\D/g, '');
  // Accept 9, 10, or 12 digits; normalize to 10 starting with 0
  if (n.length === 9) return /^([2-5]\d{8})$/.test(n);        // e.g., 55xxxxxxx
  if (n.length === 10) return /^0[2-5]\d{8}$/.test(n);        // 0[2-5]…
  if (n.length === 12) return /^233[2-5]\d{8}$/.test(n);      // 233[2-5]…
  return false;
};
const normalizeToLocal10 = (msisdn) => {
  const n = (msisdn || '').replace(/\D/g, '');
  if (n.startsWith('233') && n.length === 12) return '0' + n.slice(3);
  if (n.length === 9) return '0' + n;
  return n;
};

export default function TaskBank() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('MTN'); // MTN | ATL | VOD
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/api/wallet/me`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Failed to load wallet');
      const data = await res.json();
      setBalance(Number(data.available ?? data.balance ?? 0));
    } catch {
      setBalance(450.75);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const onSubmit = async () => {
    const amt = Number(amount);
    const msisdn = normalizeToLocal10(phone);

    if (!amt || isNaN(amt) || amt <= 0) return Alert.alert('Invalid amount', 'Enter an amount greater than 0.');
    if (amt > balance) return Alert.alert('Insufficient funds', 'Amount exceeds your available balance.');
    if (!isGhanaMomo(msisdn)) return Alert.alert('Invalid number', 'Enter a valid Ghana MoMo number.');

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/api/payouts/paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          amount: Math.round(amt * 100),    // Paystack amounts are in kobo/pesewas
          currency: 'GHS',
          phone: msisdn,                    // local 0XXXXXXXXX
          network,                          // 'MTN' | 'ATL' | 'VOD'
          note: note || undefined,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Withdraw failed');

      const data = JSON.parse(text || '{}');
      setBalance((b) => Math.max(0, b - amt));
      setAmount('');
      setPhone('');
      setNote('');
      Alert.alert('Withdrawal requested', `Reference: ${data.reference || data.transfer_code || 'N/A'}`);
    } catch (e) {
      Alert.alert('Withdraw failed', e.message.replace(/["{}]/g, ' '));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.h1}>TaskBank</Text>
        <Text style={styles.sub}>Withdraw to Ghana Mobile Money via Paystack</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Available Balance</Text>
          <View style={styles.rowBetween}>
            {loading ? <ActivityIndicator /> : <Text style={styles.balance}>GH₵ {balance.toFixed(2)}</Text>}
            <Pressable style={styles.refreshBtn} disabled={loading} onPress={fetchBalance}>
              <Ionicons name="refresh" size={16} />
              <Text style={styles.refreshTxt}>Refresh</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Withdraw</Text>

          <Text style={styles.inputLabel}>Amount (GHS)</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="e.g., 120" style={styles.input} />

          <Text style={styles.inputLabel}>Network</Text>
          <View style={styles.segmentBar}>
            {GH_MOMO.map((t) => (
              <Pressable key={t.code} onPress={() => setNetwork(t.code)} style={[styles.segment, network === t.code && styles.segmentActive]}>
                <Text style={[styles.segmentTxt, network === t.code && styles.segmentTxtActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>MoMo Number</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="e.g., 0551234567" style={styles.input} />

          <Text style={styles.inputLabel}>Note (optional)</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Description for your records" style={[styles.input, { height: 44 }]} />

          <Pressable style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={onSubmit}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Request Withdrawal</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb' },
  container: { flex: 1, padding: 16 },
  h1: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#6b7280', marginTop: 4, fontSize: 12 },

  card: { marginTop: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14 },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  balance: { color: '#0f172a', fontSize: 26, fontWeight: '900', marginTop: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  refreshTxt: { color: '#0f172a', fontWeight: '700' },

  inputLabel: { color: '#6b7280', fontSize: 12, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, height: 44, color: '#0f172a' },

  segmentBar: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 4, marginTop: 8 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segmentTxt: { color: '#6b7280', fontWeight: '700' },
  segmentTxtActive: { color: '#0f172a' },

  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  primaryBtnTxt: { color: '#fff', fontWeight: '800' },
});
