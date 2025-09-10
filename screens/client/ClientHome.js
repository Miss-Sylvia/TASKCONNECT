// screens/client/ClientHome.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.59.131:5000/api';

export default function ClientHome() {
  const navigation = useNavigation();
  const [recentTasks, setRecentTasks] = useState([]);
  const [clientId, setClientId] = useState(null);

  // Load user id once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          setClientId(user?.id ?? null);
        }
      } catch (e) {
        console.log('AsyncStorage error:', e?.message);
      }
    })();
  }, []);

  // Fetch recent tasks whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchRecent = async () => {
        if (!clientId) return;
        try {
          const { data } = await axios.get(`${API_URL}/tasks/client/${clientId}?limit=3`);
          if (isActive) setRecentTasks(data.tasks || []);
        } catch (e) {
          console.log('Fetch tasks error:', e?.response?.data || e.message);
        }
      };

      fetchRecent();
      return () => {
        isActive = false;
      };
    }, [clientId])
  );

  // Navigate to RecentTasks whether it's in the Tab or parent Stack
  const goRecentTasks = useCallback(() => {
    try {
      const state = navigation.getState?.();
      const inThisNav = state?.routeNames?.includes?.('RecentTasks');
      if (inThisNav) {
        navigation.navigate('RecentTasks');
        return;
      }
      const parent = navigation.getParent?.();
      const inParent = parent?.getState?.()?.routeNames?.includes?.('RecentTasks');
      if (inParent) {
        parent.navigate('RecentTasks');
        return;
      }
      // Fallback: try current nav anyway (no crash if missing)
      navigation.navigate('RecentTasks');
    } catch (e) {
      console.log('goRecentTasks error:', e?.message);
    }
  }, [navigation]);

  const handlePostTask = () => {
    // Go to the Post Task tab (loads PostTaskMain as initial screen)
    navigation.navigate('PostTaskTab'); 
    // If you ever need to deep-link explicitly:
    // navigation.navigate('PostTaskTab', { screen: 'PostTaskMain' });
  };

  const handleViewTasks = () => {
    // Navigate to parent stack screen from inside tabs
    navigation.getParent()?.navigate('MyTasks');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Dashboard</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card} onPress={handlePostTask} activeOpacity={0.9}>
          <Text style={styles.cardTitle}>📌 Post New Task</Text>
          <Text style={styles.cardDesc}>Quickly post a task and get help fast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleViewTasks} activeOpacity={0.9}>
          <Text style={styles.cardTitle}>🗂 My Tasks</Text>
          <Text style={styles.cardDesc}>View and manage your recent tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Tasks header with "View all" link */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        <TouchableOpacity onPress={goRecentTasks} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {/* Make the entire list (or empty state) tappable to open RecentTasks */}
      <TouchableOpacity activeOpacity={0.85} onPress={goRecentTasks}>
        <View style={styles.section}>
          {recentTasks.length ? (
            recentTasks.map((t) => (
              <View
                key={t.id}
                style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10 }}
              >
                <Text style={{ fontWeight: '600' }}>{t.title}</Text>
                <Text style={{ color: '#666', marginTop: 3 }}>
                  {t.location} • {t.status}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>No recent tasks.</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.tipBox}>
        <Text style={styles.tip}>💡 Tip: Be detailed when posting tasks for faster matches!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007acc',
  },
  cardContainer: {
    flexDirection: 'column',
    gap: 15,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#d1d1fcff',
    padding: 18,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardDesc: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    color: '#2563EB',
    fontWeight: '700',
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  tipBox: {
    marginTop: 30,
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
  },
  tip: {
    color: '#007acc',
    fontSize: 14,
  },
});
