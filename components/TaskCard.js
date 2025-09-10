// components/TaskCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cedis } from '../utils/api';

export default function TaskCard({ task, canAccept, onPressAccept, onPressDetails }) {
  return (
    <TouchableOpacity onPress={onPressDetails} activeOpacity={0.9} style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{task.title || task.category || 'Task'}</Text>
        <Text style={styles.pay}>{cedis(task.offer || task.pay || 0)}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="pin-outline" size={16} />
        <Text numberOfLines={1} style={styles.muted}>
          {task.pickupName} → {task.dropoffName}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="time-outline" size={16} />
        <Text style={styles.muted}>{task.etaText || `${task.distanceKm ?? '?'} km`}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.badge}>
          <Ionicons name="star-outline" size={14} />
          <Text style={styles.badgeText}>{task.clientRating ?? 'New'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.acceptBtn, !canAccept && { opacity: 0.5 }]}
          disabled={!canAccept}
          onPress={onPressAccept}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 15 },
  pay: { fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  muted: { color: '#6b7280', flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999 },
  badgeText: { fontWeight: '600' },
  acceptBtn: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  acceptText: { color: '#fff', fontWeight: '700' },
});
