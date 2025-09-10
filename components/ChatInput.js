// components/ChatInput.js
import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

export default function ChatInput({
  onSendText,
  onSendImage,
  onSendVideo,
  onSendAudio,
  onCancelReply,
  replyPreview,
}) {
  const [text, setText] = useState('');

  // voice recording
  const recordingRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordStart, setRecordStart] = useState(0);

  // pick from gallery (images)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library permission is needed.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onSendImage?.(res.assets[0].uri);
    }
  };

  // capture photo
  const captureCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onSendImage?.(res.assets[0].uri);
    }
  };

  // capture video
  const captureVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
      videoMaxDuration: 60, // seconds (optional)
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onSendVideo?.(res.assets[0].uri);
    }
  };

  // start voice recording (press in)
  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Microphone permission is needed.');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recordingRef.current = rec;
    setRecordStart(Date.now());
    setRecording(true);
  };

  // stop voice recording (press out)
  const stopRecording = async () => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const durationMs = Math.max(0, Date.now() - recordStart);
      setRecording(false);
      if (uri) onSendAudio?.(uri, durationMs);
    } catch (e) {
      setRecording(false);
      console.log('stopRecording error', e);
    } finally {
      recordingRef.current = null;
    }
  };

  // send text
  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText?.(trimmed);
    setText('');
  };

  return (
    <View>
      {!!replyPreview && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBar} />
          <Text numberOfLines={2} style={styles.replyBannerText}>
            {replyPreview}
          </Text>
          <TouchableOpacity onPress={onCancelReply}>
            <Text style={styles.replyClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        <TouchableOpacity style={styles.action} onPress={pickImage}>
          <Text style={styles.actionText}>📎</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={captureCamera}>
          <Text style={styles.actionText}>📷</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={captureVideo}>
          <Text style={styles.actionText}>🎥</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Message"
          style={styles.input}
          value={text}
          onChangeText={setText}
          multiline
        />

        {text.trim().length > 0 ? (
          <TouchableOpacity style={[styles.btn, styles.send]} onPress={handleSendText}>
            <Text style={styles.btnText}>Send</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, recording ? styles.recActive : styles.mic]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Text style={styles.btnText}>{recording ? '● REC' : '🎤'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#e2e8f0',
  },
  replyBar: { width: 3, height: '90%', backgroundColor: '#22c55e', borderRadius: 2 },
  replyBannerText: { flex: 1, color: '#0f172a' },
  replyClose: { paddingHorizontal: 8, fontSize: 16, color: '#0f172a' },

  container: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  actionText: { fontSize: 18 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    minWidth: 64,
    height: 44,
  },
  btnText: { color: 'white', fontWeight: '700' },
  send: { backgroundColor: '#2563eb' },
  mic: { backgroundColor: '#0ea5e9' },
  recActive: { backgroundColor: '#ef4444' },
});
