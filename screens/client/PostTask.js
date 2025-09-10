// screens/client/PostTask.js
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../../services/api';

// NEW: task draft store (as suggested for DeliveryDetails flow)
import { useTaskDraft } from '../../state/useTaskDraft';

const CATEGORY_OPTIONS = [
  { label: 'Handyman',     value: 'handyman' },
  { label: 'Cleaning',     value: 'cleaning' },
  { label: 'Moving',       value: 'moving' },     // treated like delivery (moving job)
  { label: 'Delivery',     value: 'delivery' },
  { label: 'General help', value: 'general_help' },
  { label: 'IT support',   value: 'it_support' },
];

const isMovingCategory = (v) => v === 'delivery' || v === 'moving';

export default function PostTask({ navigation }) {
  // Base fields (kept here, then synced into the draft store before nav)
  const [rawInput, setRawInput] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general_help');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('1');
  const [locationText, setLocationText] = useState('');

  // Quote remains for non-moving jobs
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quote, setQuote] = useState(null);

  // Draft store
  const { setDraft } = useTaskDraft();

  const canSuggest = useMemo(() => rawInput.trim().length > 3, [rawInput]);

  const syncBaseDraft = () => {
    setDraft({
      title: title.trim(),
      category,
      description: description.trim(),
      locationText: locationText.trim(),
      estimatedHours: Number(estimatedHours) || 0,
    });
  };

  const getAISuggestion = async () => {
    if (!canSuggest) {
      return Alert.alert('Type a bit more', 'Give me a brief note so I can suggest.');
    }
    try {
      setLoadingSuggest(true);
      const { data } = await axios.post(`${BASE_URL}/ai/suggest`, { rawInput });
      const aiTitle = data?.title || '';
      const aiDesc = data?.description || '';
      const guess = (data?.category || '').toLowerCase().replace(/\s+/g, '_');

      const known =
        CATEGORY_OPTIONS.find(c => c.value === guess)?.value ||
        (['delivery','moving','courier'].includes(guess) ? 'delivery' : 'general_help');

      setTitle(aiTitle);
      setCategory(known);
      setDescription(aiDesc);
      Alert.alert('Suggestion added', `Category → ${CATEGORY_OPTIONS.find(c => c.value === known)?.label}`);
    } catch {
      Alert.alert('AI Error', 'Could not generate a suggestion.');
    } finally {
      setLoadingSuggest(false);
    }
  };

  // Non-moving estimate validation
  const validateForEstimate = () => {
    const hoursNum = Number(estimatedHours);
    if (!CATEGORY_OPTIONS.some(c => c.value === category)) return 'Pick a valid category.';
    if (isMovingCategory(category)) return 'Use Delivery Options for estimates.';
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) return 'Estimated hours must be positive (e.g., 1.5).';
    return null;
  };

  // Non-moving proceed validation
  const validateForProceed = () => {
    if (!title.trim()) return 'Please add a short title.';
    if (!description.trim()) return 'Please add a short description.';
    if (!locationText.trim()) return 'Please provide your location.';
    if (!isMovingCategory(category)) {
      const hoursNum = Number(estimatedHours);
      if (!Number.isFinite(hoursNum) || hoursNum <= 0) return 'Estimated hours must be positive (e.g., 1.5).';
    }
    return null;
  };

  const getEstimate = async () => {
    const err = validateForEstimate();
    if (err) return Alert.alert('Info', err);
    try {
      setLoadingQuote(true);
      const body = {
        category,
        estimatedHours: Number(estimatedHours),
        distanceKm: 0,
        urgency: 'normal',
      };
      const { data } = await axios.post(`${BASE_URL}/ai/estimate-price`, body);
      setQuote(data);
    } catch {
      Alert.alert('Error', 'Failed to estimate price');
    } finally {
      setLoadingQuote(false);
    }
  };

  const continueToDelivery = () => {
    // push base data then go to DeliveryDetails for speed/vehicle/window/handling + live delivery estimate
    syncBaseDraft();
    navigation.navigate('DeliveryDetails');
  };

  const onContinue = () => {
    const err = validateForProceed();
    if (err) return Alert.alert('Missing info', err);

    if (isMovingCategory(category)) {
      // Delivery/Moving → go to delivery sub-flow
      return continueToDelivery();
    }

    // Non-moving → ConfirmTask, keep quote as "budget" candidate
    const task = {
      title: title.trim(),
      category,
      description: description.trim(),
      estimatedHours: Number(estimatedHours),
      locationText: locationText.trim(),
      quote: quote || null,
    };
    syncBaseDraft(); // helpful if ConfirmTask also reads from the draft store
    navigation.navigate('ConfirmTask', { task, selectedTasker: null });
  };

  const onViewRanked = () => {
    const err = validateForProceed();
    if (err) return Alert.alert('Missing info', err);

    if (isMovingCategory(category)) {
      // Delivery/Moving → first configure delivery options
      return continueToDelivery();
    }

    const task = {
      title: title.trim(),
      category,
      description: description.trim(),
      estimatedHours: Number(estimatedHours),
      locationText: locationText.trim(),
      quote: quote || null,
    };
    syncBaseDraft();
    navigation.navigate('AvailableTaskers', { task });
  };

  const Chip = ({ label, value }) => {
    const selected = category === value;
    return (
      <TouchableOpacity
        onPress={() => {
          setCategory(value);
          setQuote(null); // reset quote when changing category
        }}
        style={{
          paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18,
          borderWidth: 1, borderColor: selected ? '#0a7' : '#ddd',
          backgroundColor: selected ? '#0a7' : '#fff',
          marginRight: 8, marginBottom: 8
        }}
      >
        <Text style={{ color: selected ? '#fff' : '#333', fontWeight: '600' }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '800' }}>Post a Task</Text>

      <Text style={{ marginTop: 14, fontWeight: '700' }}>Describe what you need</Text>
      <TextInput
        placeholder="e.g., Mount my 55-inch TV on the wall; bring tools"
        value={rawInput}
        onChangeText={setRawInput}
        multiline
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, minHeight: 90, backgroundColor: '#fff', marginTop: 6 }}
      />
      <TouchableOpacity
        disabled={!canSuggest || loadingSuggest}
        onPress={getAISuggestion}
        style={{ backgroundColor: canSuggest ? '#111' : '#999', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 }}
      >
        {loadingSuggest ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>✨ AI Suggest</Text>}
      </TouchableOpacity>

      <Text style={{ marginTop: 18, fontWeight: '700' }}>Title</Text>
      <TextInput
        placeholder="Task title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
      />

      <Text style={{ marginTop: 18, fontWeight: '700' }}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CATEGORY_OPTIONS.map((c) => <Chip key={c.value} label={c.label} value={c.value} />)}
      </View>

      <Text style={{ marginTop: 18, fontWeight: '700' }}>Short Description</Text>
      <TextInput
        placeholder="Short details (what/where/when)"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, minHeight: 70, backgroundColor: '#fff' }}
      />

      {/* Hours only relevant for non-moving */}
      {!isMovingCategory(category) && (
        <>
          <Text style={{ marginTop: 18, fontWeight: '700' }}>Estimated Hours</Text>
          <TextInput
            placeholder="1"
            value={estimatedHours}
            onChangeText={setEstimatedHours}
            keyboardType="decimal-pad"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
          />
          <Text style={{ color: '#6b7280', marginTop: 4 }}>Your best guess (e.g., 1, 1.5, 3).</Text>
        </>
      )}

      <Text style={{ marginTop: 18, fontWeight: '700' }}>Your Location</Text>
      <TextInput
        placeholder="Type your area or address"
        value={locationText}
        onChangeText={setLocationText}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#fff' }}
      />

      {/* Price estimate: disabled for moving; handled in DeliveryDetails */}
      <View style={{ marginTop: 18 }}>
        <Text style={{ fontWeight: '700' }}>Estimated Price</Text>

        {isMovingCategory(category) ? (
          <View style={{ marginTop: 8, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10 }}>
            <Text>
              Estimates for Delivery/Moving are calculated on the next screen
              (service speed, time window, vehicle & distance).
            </Text>
            <TouchableOpacity
              onPress={continueToDelivery}
              style={{ marginTop: 10, backgroundColor: '#0a7', padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Set Delivery Options</Text>
            </TouchableOpacity>
          </View>
        ) : (
          !quote ? (
            <TouchableOpacity
              onPress={getEstimate}
              style={{ marginTop: 8, backgroundColor: '#0a7', padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              {loadingQuote ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Get Estimate</Text>}
            </TouchableOpacity>
          ) : (
            <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, marginTop: 8 }}>
              <Text>Range: GHS {quote.low} – {quote.high}</Text>
              <Text>Most Likely: GHS {quote.mostLikely}</Text>
              <TouchableOpacity
                onPress={getEstimate}
                style={{ marginTop: 10, backgroundColor: '#111', padding: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Recalculate</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={onContinue}
        style={{ backgroundColor: '#0a7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 18 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          {isMovingCategory(category) ? 'Continue to Delivery Options' : 'Continue'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onViewRanked}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 18 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          {isMovingCategory(category) ? 'Set Delivery Options First' : 'See Recommended Taskers (Optional)'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
