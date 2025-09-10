// screens/shared/ChatInbox.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../services/api';

// Try a few likely inbox endpoints; first that works wins.
const ENDPOINTS = [
  '/chat/inbox',
  '/messages/inbox',
  '/chat/threads',
  '/messages/threads',
];

const normalize = (list) =>
  list.map((t, i) => ({
    id: t.id ?? t.threadId ?? t._id ?? i + 1,
    title: t.title ?? t.partnerName ?? `Chat #${t.id ?? i + 1}`,
    lastMessage:
      t.lastMessage?.text ?? t.last_text ?? t.snippet ?? t.preview ?? '',
    updatedAt:
      t.updatedAt ?? t.updated_at ?? t.lastMessage?.ts ?? t.ts ?? null,
    taskId: t.taskId ?? t.task_id ?? null,
    partner: t.partner ?? t.user ?? t.otherUser ?? null,
  }));

export default function ChatInbox({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    for (const path of ENDPOINTS) {
      try {
        const { data } = await axios.get(`${BASE_URL}${path}`);
        // Accept common shapes: {threads:[...]}, {data:[...]}, or [...]
        const list = data?.threads || data?.data || data || [];
        if (Array.isArray(list)) {
          setThreads(normalize(list));
          setLoading(false);
          return;
        }
      } catch {
        // try next endpoint
      }
    }
    setLoading(false);
    setError('Could not load your chats.');
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInbox();
    setRefreshing(false);
  }, [fetchInbox]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('ChatThread', {
          threadId: item.id,
          title: item.title,
          taskId: item.taskId,
          partner: item.partner,
        })
      }
      style={{
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
      }}
    >
      <Text style={{ fontWeight: '700' }}>{item.title}</Text>
      {!!item.lastMessage && (
        <Text numberOfLines={1} style={{ color: '#666', marginTop: 4 }}>
          {item.lastMessage}
        </Text>
      )}
      {!!item.updatedAt && (
        <Text style={{ color: '#999', marginTop: 4, fontSize: 12 }}>
          {new Date(item.updatedAt).toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading chats…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <Text style={{ marginBottom: 12 }}>{error}</Text>
        <TouchableOpacity
          onPress={fetchInbox}
          style={{ backgroundColor: '#111', padding: 12, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={threads}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={{ padding: 24 }}>
          <Text style={{ color: '#666' }}>No chats yet.</Text>
        </View>
      }
    />
  );
}
