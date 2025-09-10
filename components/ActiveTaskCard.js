// components/ActiveTaskCard.js
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GhostButton from './GhostButton';

export default function ActiveTaskCard({ task, onOpenTracker, onChat, onAdvanceStatus }) {
  const nextStatus = useMemo(() => {
    const map = {
      accepted: 'in_progress',
      in_progress: 'picked_up',
      picked_up: 'enroute',
      enroute: 'delivered',
      delivered: 'completed',
    };
    return map[task?.status] || null;
  }, [task?.status]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Active Task</Text>
        <Text style={styles.status}>{(task?.status || '').replace(/_/g, ' ')}</Text>
      </View>
      <Text style={styles.sub} numberOfLines={1}>
        {task?.title || task?.category} • {task?.pickupName} → {task?.dropoffName}
      </Text>
      <View style={styles.row}>
        <GhostButton label="Open Tracker" icon="navigate-outline" onPress={onOpenTracker} />
        <GhostButton label="Chat" icon="chatbubble-ellipses-outline" onPress={onChat} />
        {nextStatus && (
          <TouchableOpacity style={styles.progressBtn} onPress={() => onAdvanceStatus(nextStatus)}>
            <Text style={styles.progressTxt}>Mark {nextStatus.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, padding: 14, borderRadius: 12, backgroundColor: '#eef6ff', marginBottom: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 16 },
  status: { fontWeight: '600', color: '#2563eb' },
  sub: { color: '#374151', marginTop: 6 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  progressBtn: { backgroundColor: '#111827', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  progressTxt: { color: '#fff', fontWeight: '700' },
});
