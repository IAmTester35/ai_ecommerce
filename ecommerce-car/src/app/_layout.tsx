import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors, typography } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { GlobalDialog } from '../components/common/GlobalDialog';

export default function RootLayout() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'custom-scrollbar-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.16);
            border-radius: 9999px;
            transition: background-color 0.2s ease;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(239, 68, 68, 0.6);
          }
          ::-webkit-scrollbar-corner {
            background: transparent;
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [initAuth]);

  return (
    <>
      <StatusBar style="light" />
      <GlobalDialog />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: typography.weights.bold,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/change-password"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/edit-profile"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="car/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="cart"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="checkout"
          options={{ title: 'Thanh Toán Đặt Cọc', headerBackTitle: 'Quay lại' }}
        />
        <Stack.Screen
          name="orders"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

