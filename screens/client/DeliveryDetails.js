// screens/client/DeliveryDetails.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTaskDraft } from '../../state/useTaskDraft';
import { getEstimate } from '../../services/api'; // GET /estimate

const SPEEDS = [
  { key: 'economy',  label: 'Economy',  badge: 'Cheapest',    etaNote: '2–4 hrs' },
  { key: 'standard', label: 'Standard', badge: 'Recommended', etaNote: '60–90 min' },
  { key: 'express',  label: 'Express',  badge: 'Fastest',     etaNote: '30–45 min' },
];

const VEHICLES = ['bike','car','van'];

export default function DeliveryDetails({ navigation }) {
  const { draft, setDraft } = useTaskDraft();

  // Delivery options
  const [service, setService] = useState(draft.service_level || 'standard');
  const [vehicle, setVehicle] = useState(draft.vehicle || 'bike');
  const [fragile, setFragile] = useState(!!draft.handling_fragile);
  const [food, setFood] = useState(!!draft.handling_food);
  const [large, setLarge] = useState(!!draft.handling_large);
  const [signature, setSignature] = useState(!!draft.require_signature);

  // Flexible window (Economy only)
  const [winStart, setWinStart] =
    useState(draft.window_start ? new Date(draft.window_start) : new Date());
  const [winEnd, setWinEnd] =
    useState(draft.window_end ? new Date(draft.window_end) : new Date(Date.now() + 2*60*60*1000));

  // Pickup / Drop-off (text for now; map/coords later)
  const [pickupText, setPickupText] = useState(draft.pickupText || '');
  const [dropoffText, setDropoffText] = useState(draft.dropoffText || '');

  const [price, setPrice] = useState(draft.estimated_price ?? null);
  const [eta, setEta] = useState(draft.eta_mins ?? null);

  const isEconomy = service === 'economy';

  // Auto-estimate when we have coords (will stay "--" until you add map/coords)
  useEffect(() => {
    (async () => {
      if (!draft.pickup_lat || !draft.dropoff_lat) return;
      const q = {
        pickup: { lat: draft.pickup_lat, lng: draft.pickup_lng },
        dropoff: { lat: draft.dropoff_lat, lng: draft.dropoff_lng },
        service_level: service,
        vehicle,
        window_start: isEconomy ? winStart.toISOString() : null,
        window_end:   isEconomy ? winEnd.toISOString()   : null,
        handling: { fragile, food, large, signature },
      };
      const res = await getEstimate(q); // { price, eta_mins, breakdown }
      setPrice(res?.price ?? null);
      setEta(res?.eta_mins ?? null);
    })();
  }, [
    draft.pickup_lat, draft.dropoff_lat,
    service, vehicle, fragile, food, large, signature,
    winStart, winEnd
  ]);

  const onContinue = () => {
    setDraft({
      // keep existing base draft (title, description, category, etc.)
      service_level: service,
      vehicle,
      handling_fragile: fragile,
      handling_food: food,
      handling_large: large,
      require_signature: signature,
      window_start: isEconomy ? winStart.toISOString() : null,
      window_end:   isEconomy ? winEnd.toISOString()   : null,
      estimated_price: price,
      eta_mins: eta,
      pickupText: pickupText.trim(),
      dropoffText: dropoffText.trim(),
      // (optional) later add: pickup_lat/lng, dropoff_lat/lng once map is integrated
    });
    navigation.navigate('ConfirmTask');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Pickup & Drop-off</Text>
        <TextInput
          placeholder="Pickup address or landmark"
          value={pickupText}
          onChangeText={setPickupText}
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, backgroundColor:'#fff' }}
        />
        <TextInput
          placeholder="Drop-off address or landmark"
          value={dropoffText}
          onChangeText={setDropoffText}
          style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, backgroundColor:'#fff' }}
        />
        {/* Later: add a 'Set on Map' button to capture coords */}

        <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8 }}>Service speed</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {SPEEDS.map(s => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setService(s.key)}
              style={{
                flex: 1, padding: 12, borderRadius: 12,
                borderWidth: service === s.key ? 2 : 1,
                borderColor: service === s.key ? '#2d6cdf' : '#ddd',
              }}>
              <Text style={{ fontWeight: '600' }}>{s.label} {s.badge ? `• ${s.badge}` : ''}</Text>
              <Text style={{ color: '#555' }}>{s.etaNote}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isEconomy && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Time window</Text>
            <Text style={{ color: '#555' }}>Choose a flexible window to save more.</Text>
            <Text style={{ marginTop: 8 }}>From</Text>
            <DateTimePicker value={winStart} mode="time" onChange={(_, d)=> d && setWinStart(d)} />
            <Text style={{ marginTop: 8 }}>To</Text>
            <DateTimePicker value={winEnd} mode="time" onChange={(_, d)=> d && setWinEnd(d)} />
          </View>
        )}

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Vehicle</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {VEHICLES.map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setVehicle(v)}
                style={{
                  paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
                  borderWidth: 1, borderColor: vehicle === v ? '#2d6cdf' : '#ddd',
                }}>
                <Text style={{ textTransform: 'capitalize' }}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>Special handling</Text>
          {[
            { key:'fragile', label:'Fragile', val:fragile, set:setFragile },
            { key:'food', label:'Food', val:food, set:setFood },
            { key:'large', label:'Large Item', val:large, set:setLarge },
            { key:'signature', label:'Signature on delivery', val:signature, set:setSignature },
          ].map(opt => (
            <View key={opt.key} style={{ flexDirection:'row', justifyContent:'space-between', paddingVertical:8 }}>
              <Text>{opt.label}</Text>
              <Switch value={opt.val} onValueChange={opt.set} />
            </View>
          ))}
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Sticky estimate footer */}
      <View style={{
        position:'absolute', left:0, right:0, bottom:0, padding:16,
        borderTopWidth:1, borderColor:'#eee', backgroundColor:'#fff'
      }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
          <Text style={{ fontSize:16 }}>Estimated</Text>
          <Text style={{ fontSize:18, fontWeight:'700' }}>
            {price != null ? `GHS ${price.toFixed(2)}` : '--'}
          </Text>
        </View>
        <Text style={{ color:'#555', marginBottom:12 }}>
          ETA {eta != null ? `${eta} min` : '--'} • Based on distance, speed & vehicle
        </Text>
        <TouchableOpacity onPress={onContinue} style={{ backgroundColor:'#2d6cdf', borderRadius:12, padding:14, alignItems:'center' }}>
          <Text style={{ color:'#fff', fontWeight:'700' }}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
