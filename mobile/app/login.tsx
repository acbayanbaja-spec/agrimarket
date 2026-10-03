import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const demos = [
  { label: 'Buyer', email: 'buyer@agrimarket.com', password: 'buyer123' },
  { label: 'Seller', email: 'seller@agrimarket.com', password: 'seller123' },
  { label: 'Admin', email: 'admin@agrimarket.com', password: 'admin123' },
  { label: 'Rider', email: 'driver@agrimarket.com', password: 'driver123' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      const nextUser = await login(email, password);
      const roles = nextUser.roles;
      if (roles.includes('admin')) router.replace('/(tabs)/profile');
      else if (roles.includes('delivery')) router.replace('/(tabs)/orders');
      else if (roles.includes('seller')) router.replace('/seller');
      else router.replace('/(tabs)/marketplace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.kicker}>SOCCSKSARGEN</Text>
      <Text style={styles.title}>Log in to shop</Text>
      <Text style={styles.hint}>Guests cannot order. Buyers and sellers open the marketplace after sign-in. Riders wait for seller-confirmed pickups.</Text>
      <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Log in</Text>
      </Pressable>
      <View style={styles.grid}>
        {demos.map((demo) => (
          <Pressable key={demo.email} style={styles.demo} onPress={() => { setEmail(demo.email); setPassword(demo.password); }}>
            <Text style={styles.demoText}>{demo.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef', padding: 20 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  kicker: { color: '#15803d', fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', marginTop: 6, color: '#14532d' },
  hint: { color: '#6b7280', marginVertical: 16, lineHeight: 20 },
  input: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  error: { color: '#dc2626', marginBottom: 8 },
  submit: { backgroundColor: '#16a34a', borderRadius: 16, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  demo: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 12 },
  demoText: { fontWeight: '700', color: '#166534' },
});
