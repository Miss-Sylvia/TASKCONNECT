// screens/client/ConfirmTask.js
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../services/api';
import { useTaskDraft } from '../../state/useTaskDraft'; // ← use the central draft store

// 🔐 Replace with your real auth user id
const CURRENT_USER_ID = 1018;

const CATEGORY_LABELS = {
  handyman: 'Handyman',
  cleaning: 'Cleaning',
  moving: 'Moving',
  delivery: 'Delivery',
  general_help: 'General help',
  it_support: 'IT support',
};

// Try multiple endpoints and return the first success
async function postFirst(candidates, payload) {
  let lastErr;
  for (const url of candidates) {
    try {
      const r = await axios.post(url, payload);
      return r;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export default function ConfirmTask({ route, navigation }) {
  const { draft } = useTaskDraft();
  const { task: taskFromParams, selectedTasker = null } = route?.params || {};
  const [submitting, setSubmitting] = useState(false);

  // Prefer params.task, else fall back to the draft store (used by DeliveryDetails/PostTask flows)
  const task = useMemo(() => {
    const t = taskFromParams || draft || {};
    // If DeliveryDetails put only estimated_price, normalize it to a quote object for UI/payload
    if (!t.quote && typeof t.estimated_price === 'number') {
      t.quote = {
        low: Math.max(0, t.estimated_price * 0.9),
        high: t.estimated_price * 1.1,
        mostLikely: t.estimated_price,
      };
    }
    return t;
  }, [taskFromParams, draft]);

  const label = (v) => CATEGORY_LABELS[v] || v || '—';

  // Single helper to reach the tab named "TaskTracker"
  const gotoTracker = (params) => {
    try { navigation.getParent()?.navigate('TaskTracker', params); return; } catch {}
    try { navigation.navigate('TaskTracker', params); return; } catch {}
  };

  const onCreatePendingAndGo = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Validate minimal fields
      if (!task || !task.title?.trim() || !task.description?.trim()) {
        Alert.alert('Missing info', 'Go back and complete Title and Description.');
        return;
      }

      // Build task payload
      const payload = {
        userId: CURRENT_USER_ID,
        title: task.title.trim(),
        description: task.description.trim(),
        budget: task?.quote?.mostLikely ? Number(task.quote.mostLikely) : 0,
        location: task.locationText?.trim() || null,
        category: task.category || 'general_help',
        estimatedHours: typeof task.estimatedHours === 'number'
          ? task.estimatedHours
          : Number(task.estimatedHours) || 0,
      };

      // Create task (/api already included in BASE_URL)
      let newTaskId;
      try {
        const resp = await postFirst([`${BASE_URL}/tasks`], payload);
        newTaskId = resp?.data?.task?.id || resp?.data?.id || resp?.data?.data?.id;
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Task create failed';
        Alert.alert('Create failed', String(msg));
        return;
      }
      if (!newTaskId) {
        Alert.alert('Create failed', 'Server did not return a task id.');
        return;
      }

      // If Delivery, create delivery record (non-fatal if it fails)
      if (String(task.category).toLowerCase() === 'delivery' || String(task.category).toLowerCase() === 'moving') {
        try {
          const deliveryPayload = {
            taskId: newTaskId,
            pickup_address_text: task.pickupText || '',
            drop_address_text: task.dropoffText || '',
            // later: include coords, service_level, vehicle, etc. if your backend supports them
          };
          await postFirst([`${BASE_URL}/deliveries`], deliveryPayload);
        } catch (e) {
          const msg = e?.response?.data?.message || 'Delivery endpoint missing (add /api/deliveries).';
          Alert.alert('Heads up', String(msg));
        }
        // Go to tracker focusing this task
        gotoTracker({ taskId: newTaskId });
        return;
      }

      // Non-delivery → MyTasks (or Home as fallback)
      try {
        navigation.navigate('MyTasks', {
          initialStatus: 'Pending',
          backTo: route?.name || 'ConfirmTask',
        });
      } catch {
        navigation.navigate('ClientHome');
      }
    } catch (e) {
      Alert.alert('Unexpected error', String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  // If we truly have nothing, show a tiny guard UI
  if (!task || (!taskFromParams && !draft)) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No task details found. Please go back and fill the form.</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 12, backgroundColor: '#111', padding: 12, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '800' }}>Confirm Your Task</Text>

      <View style={{ marginTop: 14 }}>
        <Text style={{ fontWeight: '700' }}>Title</Text>
        <Text>{task.title || '-'}</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '700' }}>Description</Text>
        <Text>{task.description || '-'}</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '700' }}>Category</Text>
        <Text>{label(task.category)}</Text>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: '700' }}>Estimated Hours</Text>
        <Text>{task.estimatedHours ?? '-'}</Text>
      </View>

      {!!task.locationText && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: '700' }}>Location</Text>
          <Text>{task.locationText}</Text>
        </View>
      )}

      {/* Delivery summary */}
      {String(task.category).toLowerCase() === 'delivery' && (
        <View style={{ marginTop: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontWeight: '700' }}>Delivery</Text>
          <Text>Pickup: {task.pickupText || '-'}</Text>
          <Text>Drop-off: {task.dropoffText || '-'}</Text>
        </View>
      )}

      {!!task.quote && (
        <View style={{ marginTop: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontWeight: '700' }}>Estimated Price</Text>
          <Text>Range: GHS {task.quote.low?.toFixed ? task.quote.low.toFixed(2) : task.quote.low} – {task.quote.high?.toFixed ? task.quote.high.toFixed(2) : task.quote.high}</Text>
          <Text>Most Likely: GHS {task.quote.mostLikely?.toFixed ? task.quote.mostLikely.toFixed(2) : task.quote.mostLikely}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onCreatePendingAndGo}
        disabled={submitting}
        style={{
          backgroundColor: submitting ? '#6B7280' : '#0a7',
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginTop: 18,
          marginBottom: 18,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {submitting && <ActivityIndicator color="#fff" />}
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          {submitting ? 'Creating…' : 'Create Task'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
