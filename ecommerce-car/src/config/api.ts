import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // If explicitly set in .env to a non-localhost URL (e.g., LAN IP or production domain)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Web environment
  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:8000';
  }

  // Physical device running via Expo Go / Dev Client (extract host IP from debuggerHost)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000`;
    }
  }

  // Android Emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // Default iOS Simulator / local fallback
  return envUrl || 'http://localhost:8000';
};
