// screens/client/Chat.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Alert,
  Platform, Keyboard, KeyboardAvoidingView, Image, Animated, PanResponder
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Audio, Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import io from 'socket.io-client';
import { useRoute } from '@react-navigation/native';

// ---- expo-image-picker compatibility shim (new + old APIs) ----
const MEDIA = (() => {
  const MT = ImagePicker?.MediaType;
  const MTO = ImagePicker?.MediaTypeOptions;
  if (MT) {
    const image = MT.image ?? MT.images;
    const video = MT.video ?? MT.videos;
    const all = MT.all ?? [image, video].filter(Boolean);
    return { image, video, all };
  }
  if (MTO) return { image: MTO.Images, video: MTO.Videos, all: MTO.All };
  return { image: undefined, video: undefined, all: undefined };
})();

// 🔧 Your LAN/API
const API_BASE = 'http://192.168.59.131:5000/api'; // <- keep in sync with backend
const SOCKET_URL = API_BASE.replace('/api', '');     // http://192.168.59.131:5000

/* -------------------- Helpers -------------------- */
async function ensurePlayableUri(asset) {
  const uri = asset?.uri || '';
  if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) return uri;
      const id = asset.assetId || asset?.assetId || null;
      if (!id) return uri;
      const info = await MediaLibrary.getAssetInfoAsync(id);
      return info?.localUri || uri;
    } catch {
      return uri;
    }
  }
  return uri;
}

/* -------------------- Audio bubble (play/pause) -------------------- */
function AudioBubble({ uri, mine }) {
  const soundRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  useEffect(() => () => { if (soundRef.current) soundRef.current.unloadAsync(); }, []);

  const fmt = (ms) => {
    const s = Math.floor((ms || 0) / 1000);
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? '0' : ''}${ss}`;
  };

  async function ensureLoaded() {
    if (isLoaded || soundRef.current) return;
    const sound = new Audio.Sound();
    sound.setOnPlaybackStatusUpdate((st) => {
      if (!st.isLoaded) return;
      setDurationMs(st.durationMillis || 0);
      setPositionMs(st.positionMillis || 0);
      if (st.didJustFinish) setIsPlaying(false);
    });
    await sound.loadAsync({ uri }, {}, true);
    soundRef.current = sound;
    setIsLoaded(true);
  }

  async function togglePlay() {
    try {
      await ensureLoaded();
      if (!soundRef.current) return;
      const st = await soundRef.current.getStatusAsync();
      if (st.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      Alert.alert('Playback error', 'Could not play this audio.');
    }
  }

  const progress = durationMs > 0 ? Math.min(100, (positionMs / durationMs) * 100) : 0;

  return (
    <View style={{
      backgroundColor: mine ? '#DCF8C6' : '#fff',
      borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
      maxWidth: '85%', borderWidth: 1, borderColor: '#e5e7eb',
      flexDirection: 'row', alignItems: 'center', gap: 10,
    }}>
      <TouchableOpacity onPress={togglePlay} style={{ paddingRight: 4 }}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 3, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ height: 3, width: `${progress}%`, backgroundColor: '#9ca3af' }} />
        </View>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          {fmt(positionMs)} / {fmt(durationMs)}
        </Text>
      </View>
    </View>
  );
}

/* -------- A single message row with swipe-to-reply -------- */
function SwipeableRow({ item, onReply, children }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
      onPanResponderMove: (_, g) => { if (g.dx > 0) translateX.setValue(Math.min(80, g.dx)); },
      onPanResponderRelease: (_, g) => {
        const shouldReply = g.dx > 60;
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(
          () => shouldReply && onReply(item)
        );
      },
      onPanResponderTerminate: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start(),
    })
  ).current;

  return (
    <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}

/* ----------------------------- Chat screen ----------------------------- */
export default function Chat() {
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Expect navigation to pass: { threadId, taskId, user: { id, name } }
  const threadId = route?.params?.threadId ?? route?.params?.taskId; // fallback
  const taskId   = route?.params?.taskId   ?? threadId;
  const user     = route?.params?.user     ?? { id: 0, name: 'You' };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(40);

  // reply state
  const [replyTo, setReplyTo] = useState(null);

  // recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recElapsedMs, setRecElapsedMs] = useState(0);
  const recTimerRef = useRef(null);
  const recStartTsRef = useRef(0);
  const recordingRef = useRef(null);

  // camera guard
  const cameraBusyRef = useRef(false);

  // typing state
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimerRef = useRef(null);

  // socket
  const socket = useMemo(() => io(SOCKET_URL, { transports: ['websocket'] }), []);

  // normalize helper
  function normalizeMessage(m, optimistic = false) {
    return {
      id: m.id || m.tempId || String(Date.now()),
      tempId: m.tempId,
      type: m.type || m.kind || 'text',
      text: m.text || m.Body || m.Text || m.Content || '',
      uri: m.mediaUrl || m.MediaUrl || m.uri || null,
      mine: (m.senderId || m.userId) === user.id || m.mine === true,
      replyTo: m.replyTo || null,
      pending: optimistic,
      createdAt: m.createdAt || new Date().toISOString(),
    };
  }

  /* -------------------- Load initial messages -------------------- */
  useEffect(() => {
    (async () => {
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!threadId) return;
        const { data } = await axios.get(`${API_BASE}/chat/${threadId}/messages?limit=30`, { timeout: 10000 });
        const normalized = (data?.messages || []).map((m) => normalizeMessage(m));
        setMessages(normalized.reverse());
      } catch (err) {
        console.log('initial load error', err?.response?.data || err.message);
        // Don't break UI if backend not ready yet
      }
    })();
  }, [threadId]);

  /* -------------------- Socket wiring -------------------- */
  useEffect(() => {
    if (!taskId) return;

    socket.emit('join', { taskId, userId: user.id });

    socket.on('message:new', (m) => {
      setMessages((prev) => [normalizeMessage(m), ...prev]);
    });

    socket.on('message:ack', ({ tempId, id }) => {
      setMessages((prev) => prev.map((mm) => (mm.tempId === tempId ? { ...mm, id, pending: false } : mm)));
    });

    socket.on('typing', ({ userId, isTyping }) => {
      if (userId === user.id) return;
      setIsPeerTyping(!!isTyping);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTyping) {
        typingTimerRef.current = setTimeout(() => setIsPeerTyping(false), 1500);
      }
    });

    socket.on('read', ({ userId, messageIds }) => {
      // optional: mark read state in UI
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, user.id]);

  /* -------------------- Media uploads -------------------- */
  async function uploadMediaAsync(localUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      const form = new FormData();
      const name = localUri.split('/').pop() || `upload-${Date.now()}`;
      const typeGuess = name.toLowerCase().endsWith('.m4a')
        ? 'audio/m4a'
        : (name.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');

      form.append('file', {
        uri: localUri,
        name,
        type: typeGuess,
      });
      form.append('folder', 'chat');

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
        body: form,
      });
      const data = await res.json();
      if (!data?.url) throw new Error('No URL from upload');
      return data.url;
    } catch (e) {
      console.log('upload error', e);
      Alert.alert('Upload failed', 'Could not upload media. Sending locally only.');
      return null; // allow local optimistic display even if upload fails
    }
  }

  /* -------------------- Send helpers -------------------- */
  function optimisticSend(base) {
    const tempId = `tmp-${Date.now()}`;
    const msg = {
      tempId,
      threadId,
      taskId,
      senderId: user.id,
      type: base.type,
      text: base.text || '',
      mediaUrl: base.mediaUrl || null,
      replyTo: base.replyTo || null,
    };
    setMessages((prev) => [normalizeMessage({ ...msg, mine: true }, true), ...prev]);
    socket.emit('message:new', msg);
  }

  async function sendText() {
    const txt = input.trim();
    if (!txt) return;
    optimisticSend({ type: 'text', text: txt, replyTo });
    setInput('');
    setReplyTo(null);
  }

  async function sendImage(localUri) {
    const url = await uploadMediaAsync(localUri);
    optimisticSend({ type: 'image', mediaUrl: url || localUri, replyTo });
    setReplyTo(null);
  }

  async function sendVideo(localUri) {
    const url = await uploadMediaAsync(localUri);
    optimisticSend({ type: 'video', mediaUrl: url || localUri, replyTo });
    setReplyTo(null);
  }

  async function sendAudio(localUri) {
    const url = await uploadMediaAsync(localUri);
    optimisticSend({ type: 'audio', mediaUrl: url || localUri, replyTo });
    setReplyTo(null);
  }

  /* -------------------- Camera / Library -------------------- */
  async function openPhotoQuick() {
    if (cameraBusyRef.current) return;
    cameraBusyRef.current = true;
    Keyboard.dismiss();
    try {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) return Alert.alert('Permission needed', 'Please allow Camera permission.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: MEDIA.image, allowsEditing: false, quality: 0.9 });
      if (!result.canceled) {
        const asset = result.assets?.[0];
        const playable = await ensurePlayableUri(asset);
        await sendImage(playable);
      }
    } finally {
      cameraBusyRef.current = false;
    }
  }

  async function openVideoQuick() {
    if (cameraBusyRef.current) return;
    cameraBusyRef.current = true;
    Keyboard.dismiss();
    try {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) return Alert.alert('Permission needed', 'Please allow Camera permission.');
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: MEDIA.video, allowsEditing: false, quality: 0.9, videoMaxDuration: 60 });
      if (!result.canceled) {
        const asset = result.assets?.[0];
        const playable = await ensurePlayableUri(asset);
        await sendVideo(playable);
      }
    } finally {
      cameraBusyRef.current = false;
    }
  }

  async function openMediaLibrary() {
    Keyboard.dismiss();
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission needed', 'Please allow Photos permission.');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: MEDIA.all, allowsEditing: false, quality: 0.9, selectionLimit: 1 });
      if (!result.canceled) {
        const asset = result.assets?.[0];
        const playable = await ensurePlayableUri(asset);
        const isVideo =
          (asset?.type || '').toLowerCase().includes('video') ||
          (asset?.mimeType || '').toLowerCase().includes('video');
        if (isVideo) await sendVideo(playable);
        else await sendImage(playable);
      }
    } catch (e) {
      console.log('openMediaLibrary error', e);
    }
  }

  /* -------------------- Voice notes -------------------- */
  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return Alert.alert('Permission needed', 'Microphone permission was denied.');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;

      recStartTsRef.current = Date.now();
      setRecElapsedMs(0);
      setIsRecording(true);
      recTimerRef.current && clearInterval(recTimerRef.current);
      recTimerRef.current = setInterval(() => setRecElapsedMs(Date.now() - recStartTsRef.current), 200);
    } catch (e) {
      Alert.alert('Audio error', 'Could not start recording.');
    }
  }

  async function stopRecording() {
    try {
      const r = recordingRef.current;
      if (!r) return;
      await r.stopAndUnloadAsync();
      const uri = r.getURI();
      recordingRef.current = null;

      recTimerRef.current && clearInterval(recTimerRef.current);
      setIsRecording(false);

      const elapsed = Date.now() - recStartTsRef.current;
      setRecElapsedMs(elapsed);

      if (elapsed < 600) return;
      if (uri) {
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || (info.size ?? 0) < 800) return;
      }
      await sendAudio(uri);
    } catch {
      setIsRecording(false);
      recTimerRef.current && clearInterval(recTimerRef.current);
    }
  }

  function toggleMic() { if (isRecording) stopRecording(); else startRecording(); }

  /* -------------------- Typing indicator -------------------- */
  function onChangeText(text) {
    setInput(text);
    socket.emit('typing', { taskId, userId: user.id, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing', { taskId, userId: user.id, isTyping: false });
    }, 1000);
  }

  /* -------------------- Rendering -------------------- */
  function previewFromMessage(m) {
    if (!m) return '';
    if (m.type === 'text') return m.text.slice(0, 60);
    if (m.type === 'image') return 'Photo';
    if (m.type === 'video') return 'Video';
    if (m.type === 'audio') return 'Voice note';
    return 'Message';
  }

  const renderItem = ({ item }) => {
    const wrap = { padding: 8, alignItems: item.mine ? 'flex-end' : 'flex-start' };
    const Bubble = () => {
      const quoted = item.replyTo;
      return (
        <View style={{
          backgroundColor: item.mine ? '#DCF8C6' : '#fff',
          borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12,
          maxWidth: '85%', borderWidth: 1, borderColor: '#e5e7eb',
          opacity: item.pending ? 0.6 : 1
        }}>
          {quoted ? (
            <View style={{
              marginBottom: 6, padding: 6, borderLeftWidth: 3, borderLeftColor: '#93C5FD',
              backgroundColor: '#F3F4F6', borderRadius: 8,
            }}>
              <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600' }}>Replying to</Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>{previewFromMessage(quoted)}</Text>
            </View>
          ) : null}

          {item.type === 'text'   && <Text style={{ fontSize: 16 }}>{item.text}</Text>}
          {item.type === 'image'  && <Image source={{ uri: item.uri }} style={{ width: 220, height: 220, borderRadius: 12 }} resizeMode="cover" />}
          {item.type === 'video'  && (
            <Video source={{ uri: item.uri }} style={{ width: 240, height: 240, borderRadius: 12, backgroundColor: '#000' }}
                   useNativeControls resizeMode={ResizeMode.COVER} isLooping={false} />
          )}
          {item.type === 'audio'  && <AudioBubble uri={item.uri} mine={item.mine} />}
        </View>
      );
    };
    return (
      <View style={wrap}>
        <SwipeableRow item={item} onReply={(m) => setReplyTo(m)}>
          <Bubble />
        </SwipeableRow>
      </View>
    );
  };

  const recSecs = Math.floor(recElapsedMs / 1000);
  const recTimerLabel = isRecording ? `• ${Math.floor(recSecs / 60)}:${(recSecs % 60).toString().padStart(2, '0')}` : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={insets.bottom + 8}>
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 8 }}
          inverted
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isPeerTyping ? (
              <View style={{ alignItems: 'flex-start', padding: 8 }}>
                <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>typing…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Reply banner */}
        {replyTo ? (
          <View style={{
            backgroundColor: '#EFF6FF', borderTopWidth: 1, borderColor: '#DBEAFE',
            paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Ionicons name="return-down-back" size={18} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#1D4ED8', fontWeight: '600' }}>Replying to</Text>
              <Text style={{ fontSize: 12, color: '#374151' }} numberOfLines={1}>
                {previewFromMessage(replyTo)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input Bar */}
        <View style={{
          padding: 8, paddingBottom: 8 + insets.bottom, backgroundColor: '#fff',
          borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          {/* Mic */}
          <TouchableOpacity onPress={() => (isRecording ? stopRecording() : startRecording())} style={{ padding: 6 }}>
            <MaterialCommunityIcons name={isRecording ? 'stop-circle-outline' : 'microphone'} size={26} color={isRecording ? 'red' : undefined} />
          </TouchableOpacity>

          {/* Library */}
          <TouchableOpacity onPress={openMediaLibrary} style={{ padding: 6 }}>
            <Ionicons name="attach" size={26} />
          </TouchableOpacity>

          {/* Camera: tap = photo, long-press = video */}
          <TouchableOpacity onPress={openPhotoQuick} onLongPress={openVideoQuick} delayLongPress={350} style={{ padding: 6 }}>
            <Ionicons name="camera" size={26} />
          </TouchableOpacity>

          {/* Text input */}
          <View style={{
            flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20,
            paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
          }}>
            <TextInput
              value={input}
              onChangeText={onChangeText}
              placeholder={isRecording ? 'Recording…' : 'Message'}
              editable={!isRecording}
              multiline
              blurOnSubmit={false}
              returnKeyType="default"
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                setInputHeight(Math.max(40, Math.min(120, h)));
              }}
              style={{ flex: 1, height: inputHeight, color: '#111827', textAlignVertical: 'top', paddingTop: 10, paddingBottom: 8 }}
              placeholderTextColor="#9CA3AF"
            />
            {isRecording ? <Text style={{ color: 'red', fontWeight: '600' }}>{recTimerLabel}</Text> : null}
          </View>

          {/* Send */}
          <TouchableOpacity onPress={sendText} style={{ padding: 6 }}>
            <Ionicons name="send" size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
