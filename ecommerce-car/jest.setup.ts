// Declare jest globals for TypeScript
declare const jest: any;
declare const afterEach: any;

// Mock global crypto.randomUUID
if (typeof (globalThis as any).crypto === 'undefined') {
  (globalThis as any).crypto = {
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000',
  };
} else if (!(globalThis as any).crypto.randomUUID) {
  (globalThis as any).crypto.randomUUID = () => '123e4567-e89b-12d3-a456-426614174000';
}

// Mock React Native Platform & Dimensions
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: (obj: any) => obj.ios ?? obj.default,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    useWindowDimensions: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(() => Promise.resolve()),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
    },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => style,
    },
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    ActivityIndicator: 'ActivityIndicator',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    RefreshControl: 'RefreshControl',
    Modal: 'Modal',
  };
});

// Mock react-native-mmkv
const memoryStore = new Map<string, any>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn((key: string, value: any) => memoryStore.set(key, value)),
    getString: jest.fn((key: string) => memoryStore.get(key) ?? null),
    getNumber: jest.fn((key: string) => memoryStore.get(key) ?? null),
    getBoolean: jest.fn((key: string) => memoryStore.get(key) ?? null),
    remove: jest.fn((key: string) => memoryStore.delete(key)),
    clearAll: jest.fn(() => memoryStore.clear()),
    contains: jest.fn((key: string) => memoryStore.has(key)),
  })),
  MMKV: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://mock.supabase.co',
      supabaseAnonKey: 'mock-anon-key',
    },
  },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'opened' })),
}));

// Mock react-native-nitro-sse
jest.mock('react-native-nitro-sse', () => {
  const mockClient = {
    setup: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    removeAllEventListeners: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    restart: jest.fn(),
    flush: jest.fn(),
    isConnected: jest.fn(() => false),
    getStats: jest.fn(() => ({})),
    updateHeaders: jest.fn(),
    setLastProcessedId: jest.fn(),
    injectMockEvent: jest.fn(),
    getState: jest.fn(() => 'idle'),
    dispose: jest.fn(),
  };

  return {
    createNitroSse: jest.fn(() => {
      throw new Error('Native NitroSse not available in Jest');
    }),
    useNitroSse: jest.fn((options: any) => ({
      client: mockClient,
      isReady: true,
      state: 'idle',
      isConnected: false,
      start: jest.fn(),
      stop: jest.fn(),
      restart: jest.fn(),
      flush: jest.fn(),
      updateHeaders: jest.fn(),
      setLastProcessedId: jest.fn(),
      getStats: jest.fn(),
      injectMockEvent: jest.fn(),
    })),
    safeSerializeConfig: jest.fn((val: any) => JSON.stringify(val)),
    createSSEClient: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
  };
});

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props: any) => React.createElement('Image', props),
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props: any) => React.createElement('Ionicons', props),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 48, left: 0, right: 0, bottom: 34 };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  memoryStore.clear();
});
