// screens/client/EditTask.js
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';

const API_BASE = 'http://192.168.36.131:5000/api';

const STATUS_VALUES = ['Pending', 'InProgress', 'Completed', 'Cancelled'];

function allowedNextStatuses(current) {
  if (current === 'Pending')     return ['Pending', 'InProgress', 'Cancelled'];
  if (current === 'InProgress')  return ['InProgress', 'Completed', 'Cancelled'];
  return [current]; // Completed/Cancelled -> read-only
}

export default function EditTask() {
  const route = useRoute();
  const navigation = useNavigation();
  const { task, userId } = route.params;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [budget, setBudget] = useState(String(task.budget ?? ''));
  const [location, setLocation] = useState(task.location ?? '');
  const [status, setStatus] = useState(task.status);

  const api = useMemo(() => axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  }), []);

  const isPending = task.status === 'Pending';
  const isInProgress = task.status === 'InProgress';
  const isReadOnly = task.status === 'Completed' || task.status === 'Cancelled';

  const contentEditable = isPending; // only Pending can edit content
  const selectableStatuses = allowedNextStatuses(task.status);

  const onSave = async () => {
    try {
      // Build payload per rules
      const payload = { userId, status };
      if (contentEditable) {
        payload.title = title.trim();
        payload.description = description.trim();
        payload.budget = budget ? Number(budget) : null;
        payload.location = location.trim() || null;
      }

      await api.put(`/tasks/${task.id}`, payload);

      navigation.navigate('MyTasks', { refreshAt: Date.now(), userId });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update task';
      Alert.alert('Error', msg);
    }
  };

  const Input = (props) => (
    <TextInput
      editable={contentEditable}
      {...props}
      style={[
        {
          borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
          padding: 10, marginBottom: 12, backgroundColor: contentEditable ? '#fff' : '#f1f5f9'
        },
        props.style
      ]}
    />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Edit Task</Text>

      <Text>Title</Text>
      <Input value={title} onChangeText={setTitle} />

      <Text>Description</Text>
      <Input value={description} onChangeText={setDescription} multiline style={{ height: 100 }} />

      <Text>Budget</Text>
      <Input value={budget} onChangeText={setBudget} keyboardType="numeric" />

      <Text>Location</Text>
      <Input value={location} onChangeText={setLocation} />

      <Text>Status</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        {STATUS_VALUES.map((s) => {
          const allowed = selectableStatuses.includes(s);
          const active = status === s;
          return (
            <TouchableOpacity
              key={s}
              disabled={!allowed}
              onPress={() => setStatus(s)}
              style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                borderColor: active ? '#111' : '#ccc',
                backgroundColor: active ? '#eee' : '#fff',
                marginRight: 8, marginTop: 8,
                opacity: allowed ? 1 : 0.4
              }}
            >
              <Text style={{ fontWeight: active ? '700' : '500' }}>
                {s === 'InProgress' ? 'In Progress' : s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onSave}
        disabled={isReadOnly}
        style={{
          backgroundColor: isReadOnly ? '#94a3b8' : '#111',
          padding: 12, borderRadius: 8
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          {isReadOnly ? 'Read-only' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      {(isInProgress || isReadOnly) && !contentEditable ? (
        <Text style={{ marginTop: 8, color: '#64748b' }}>
          {isInProgress
            ? 'Content is locked while a task is In Progress. You can only mark it Completed or Cancelled.'
            : 'Completed/Cancelled tasks are read-only.'}
        </Text>
      ) : null}
    </ScrollView>
  );
}
