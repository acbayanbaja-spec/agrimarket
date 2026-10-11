import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const TOKEN_KEY = 'user_token';
const CUSTOM_URL_KEY = 'agrimarket_custom_api_url';
const GEMINI_KEY_STORAGE = 'agrimarket_gemini_api_key';

let cachedBaseUrl: string | null = null;

export function resolveDefaultApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Expo Go provides the host machine's IP in hostUri (e.g. "192.168.1.15:8081")
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest?.debuggerHost;
  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}

export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  try {
    const saved = await AsyncStorage.getItem(CUSTOM_URL_KEY);
    if (saved && saved.trim()) {
      cachedBaseUrl = saved.trim().replace(/\/+$/, '');
      return cachedBaseUrl;
    }
  } catch {
    // fallback
  }
  cachedBaseUrl = resolveDefaultApiBaseUrl();
  return cachedBaseUrl;
}

export async function setCustomApiBaseUrl(url: string | null): Promise<void> {
  if (!url || !url.trim()) {
    await AsyncStorage.removeItem(CUSTOM_URL_KEY);
    cachedBaseUrl = resolveDefaultApiBaseUrl();
  } else {
    const clean = url.trim().replace(/\/+$/, '');
    await AsyncStorage.setItem(CUSTOM_URL_KEY, clean);
    cachedBaseUrl = clean;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const geminiKey = await AsyncStorage.getItem(GEMINI_KEY_STORAGE);
  const baseUrl = await getApiBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (geminiKey) {
    headers['x-gemini-api-key'] = geminiKey;
  }

  const url = `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // 10-second timeout controller
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

export const mobileApi = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  checkHealth: async (): Promise<{ ok: boolean; url: string; latency: number }> => {
    const start = Date.now();
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/products`, { method: 'GET' });
      return { ok: res.ok, url: baseUrl, latency: Date.now() - start };
    } catch {
      const baseUrl = await getApiBaseUrl();
      return { ok: false, url: baseUrl, latency: Date.now() - start };
    }
  },
};

export default mobileApi;
