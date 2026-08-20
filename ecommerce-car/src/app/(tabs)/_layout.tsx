import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: typography.sizes.sm + 1,
          fontWeight: typography.weights.semibold,
          letterSpacing: -0.2,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: 56,
          paddingBottom: 6,
          paddingTop: 4,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: typography.weights.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Kho xe',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Match',
          headerTitle: 'Trợ Lý AI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size - 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          href: null,
          title: 'So sánh',
          headerTitle: 'So Sánh Xe',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          headerTitle: 'Tài Khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size - 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

