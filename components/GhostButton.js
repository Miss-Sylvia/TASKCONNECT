// components/GhostButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GhostButton({ label, icon, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, disabled && { opacity: 0.5 }]}>
      {icon ? <Ionicons name={icon} size={16} /> : null}
      <Text style={styles.txt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
  },
  txt: { fontWeight: '600' },
});
