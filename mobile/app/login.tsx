import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('buyer@agrimarket.com');
  const [password, setPassword] = useState('buyer123');
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setError('');
      await login(email, password);
      router.replace('/(tabs)/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.hint}>buyer@agrimarket.com / buyer123 · driver@agrimarket.com / driver123</Text>
      <TextInput style={styles.input} autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Sign in</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  back: { color: '#15803d', fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  hint: { color: '#6b7280', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  error: { color: '#dc2626', marginBottom: 8 },
  submit: { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '800' },
});
