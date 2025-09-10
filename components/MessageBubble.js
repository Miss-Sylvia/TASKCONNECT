import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Audio, Video } from 'expo-av';

function StatusTicks({ isMe, status }) {
  if (!isMe) return null;
  const text = status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓';
  const color = status === 'read' ? '#34B7F1' : 'rgba(255,255,255,0.9)';
  return <Text style={[styles.ticks, { color }]}>{text}</Text>;
}

export default function MessageBubble({ message, isMe, displayName, avatarUrl, onLongPress }) {
  const { type = 'text', text, mediaUrl, durationMs, createdAt, status, repliedTo, isDeleted } = message || {};
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  const togglePlay = async () => {
    try {
      if (!sound) {
        const { sound: s } = await Audio.Sound.createAsync({ uri: mediaUrl });
        setSound(s);
        s.setOnPlaybackStatusUpdate((st) => setPlaying(st.isPlaying));
        await s.playAsync();
      } else {
        const st = await sound.getStatusAsync();
        if (st.isPlaying) await sound.pauseAsync(); else await sound.playAsync();
      }
    } catch {}
  };

  const renderReplyPreview = () => {
    if (!repliedTo) return null;
    let preview = repliedTo.text || (repliedTo.type === 'image' ? 'Photo'
      : repliedTo.type === 'audio' ? 'Voice note'
      : repliedTo.type === 'video' ? 'Video' : '');
    return (
      <View style={styles.replyBox}>
        <View style={styles.replyBar} />
        <Text style={styles.replyText} numberOfLines={2}>{preview}</Text>
      </View>
    );
  };

  const body = (() => {
    if (isDeleted) {
      return <Text style={[styles.deleted]}>This message was deleted</Text>;
    }
    if (type === 'text' && !!text) {
      return <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>{text}</Text>;
    }
    if (type === 'image' && !!mediaUrl) {
      return <Image source={{ uri: mediaUrl }} style={styles.image} resizeMode="cover" />;
    }
    if (type === 'audio' && !!mediaUrl) {
      return (
        <TouchableOpacity onPress={togglePlay} style={styles.audio}>
          <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
            {playing ? '⏸️ Pause voice note' : '▶️ Play voice note'}
            {durationMs ? ` (${Math.round(durationMs/1000)}s)` : ''}
          </Text>
        </TouchableOpacity>
      );
    }
    if (type === 'video' && !!mediaUrl) {
      return (
        <Video
          source={{ uri: mediaUrl }}
          style={styles.video}
          useNativeControls
          resizeMode="cover"
          isLooping={false}
        />
      );
    }
    return null;
  })();

  return (
    <View style={[styles.wrap, isMe ? styles.wrapEnd : styles.wrapStart]}>
      {!isMe && !!avatarUrl && <Image source={{ uri: avatarUrl }} style={styles.avatar} />}
      <TouchableOpacity activeOpacity={0.8} onLongPress={() => onLongPress?.(message)}>
        <View style={[styles.bubble, isMe ? styles.me : styles.them]}>
          {!isMe && !!displayName && <Text style={[styles.name, isMe ? styles.nameMe : styles.nameThem]}>{displayName}</Text>}
          {renderReplyPreview()}
          {body}
          <View style={styles.metaRow}>
            {!!createdAt && (
              <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            <StatusTicks isMe={isMe} status={status} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: 12, marginVertical: 6, flexDirection: 'row' },
  wrapEnd: { justifyContent: 'flex-end' },
  wrapStart: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  me: { backgroundColor: '#2563eb' },
  them: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontSize: 12, marginBottom: 4, fontWeight: '700' },
  nameMe: { color: 'rgba(255,255,255,0.9)' },
  nameThem: { color: '#0f172a' },
  text: { fontSize: 16 },
  textMe: { color: 'white' },
  textThem: { color: '#0f172a' },
  image: { width: 220, height: 260, borderRadius: 12, overflow: 'hidden' },
  video: { width: 260, height: 260, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  audio: { paddingVertical: 6 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6, gap: 8 },
  time: { fontSize: 11 },
  timeMe: { color: 'rgba(255,255,255,0.8)' },
  timeThem: { color: '#64748b' },
  ticks: { fontSize: 12, marginLeft: 6 },
  replyBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 6 },
  replyBar: { width: 3, backgroundColor: '#22c55e', borderRadius: 2 },
  replyText: { flex: 1, color: '#0f172a', fontStyle: 'italic' },
  deleted: { fontStyle: 'italic', color: '#475569' },
});
