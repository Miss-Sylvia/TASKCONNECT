// screens/Settings.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(prev => !prev);

  // local colors instead of theme provider
  const colors = isDark
    ? {
        background: '#0B0B0F',
        surface: '#14141A',
        text: '#FFFFFF',
        muted: '#9AA0A6',
        border: '#26262E',
      }
    : {
        background: '#FFFFFF',
        surface: '#F6F7FB',
        text: '#121212',
        muted: '#5F6368',
        border: '#E6E8EF',
      };

  const openEditProfile = () => navigation.navigate('EditProfile');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={openEditProfile}
      >
        <Icon name="create-outline" size={20} color={colors.text} />
        <Text style={[styles.cardText, { color: colors.text }]}>
          Edit Profile
        </Text>
        <Icon
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      <View
        style={[
          styles.cardRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.rowLeft}>
          <Icon name="contrast-outline" size={20} color={colors.text} />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Dark Mode
          </Text>
        </View>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <Text style={[styles.hint, { color: colors.muted }]}>
        Your theme choice is saved locally (not global).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { marginLeft: 10, fontSize: 15, fontWeight: '600' },
  hint: { marginTop: 16, fontSize: 12 },
});
