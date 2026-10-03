import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useStore } from '../src/context/StoreContext';
import { ID_DOCUMENT_TYPES, soccsksargenPlaces } from '../src/data/locations';

export default function BecomeSellerScreen() {
  const { hasRole, isAuthenticated } = useAuth();
  const { submitApplication, myApplication } = useStore();
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState(soccsksargenPlaces[0].label);
  const [idType, setIdType] = useState(ID_DOCUMENT_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [done, setDone] = useState(false);

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  if (hasRole('seller') || hasRole('admin')) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>You already have a stall</Text>
        <Pressable style={styles.submit} onPress={() => router.push('/seller')}><Text style={styles.submitText}>Open seller desk</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (myApplication?.status === 'Pending' || done) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Application received</Text>
        <Text style={styles.copy}>Admin will approve your {idType} if the ID number and SOCCSKSARGEN stall details match.</Text>
        <Pressable style={styles.submit} onPress={() => router.back()}><Text style={styles.submitText}>Back</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
        <Text style={styles.title}>Become a seller</Text>
        <Text style={styles.copy}>Upload-level KYC: passport or valid ID. Admin approves before you can list.</Text>
        <TextInput style={styles.input} placeholder="Farm name" value={farmName} onChangeText={setFarmName} />
        <TextInput style={styles.input} placeholder="ID / passport number" value={idNumber} onChangeText={setIdNumber} />
        <Text style={styles.label}>ID type</Text>
        <View style={styles.wrap}>
          {ID_DOCUMENT_TYPES.map((type) => (
            <Pressable key={type} onPress={() => setIdType(type)} style={[styles.chip, idType === type && styles.chipActive]}>
              <Text style={[styles.chipText, idType === type && styles.chipTextActive]}>{type}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Pickup city</Text>
        <View style={styles.wrap}>
          {soccsksargenPlaces.map((place) => (
            <Pressable key={place.label} onPress={() => setLocation(place.label)} style={[styles.chip, location === place.label && styles.chipActive]}>
              <Text style={[styles.chipText, location === place.label && styles.chipTextActive]}>{place.city}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.submit}
          onPress={() => {
            if (farmName.trim().length < 3 || idNumber.trim().length < 6) return;
            submitApplication({ farmName: farmName.trim(), location, idType, idNumber: idNumber.trim() });
            setDone(true);
          }}
        >
          <Text style={styles.submitText}>Submit for admin approval</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef', padding: 16 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532d' },
  copy: { color: '#6b7280', marginVertical: 12, lineHeight: 20 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  label: { fontWeight: '700', marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  chipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  submit: { backgroundColor: '#16a34a', borderRadius: 14, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
});
