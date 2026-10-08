import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';

interface TabIconProps {
  nameActive: keyof typeof Ionicons.glyphMap;
  nameInactive: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: any;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({
  nameActive,
  nameInactive,
  focused,
  color,
  size,
}) => {
  return (
    <View style={tabStyles.iconWrapper}>
      <Ionicons
        name={focused ? nameActive : nameInactive}
        size={focused ? size + 1 : size}
        color={color}
      />
      {focused && <View style={tabStyles.activePill} />}
    </View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);
  const barHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.semibold,
          letterSpacing: -0.2,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: colors.primaryHover,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: typography.weights.medium,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              nameActive="compass"
              nameInactive="compass-outline"
              focused={focused}
              color={color}
              size={size - 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Kho xe',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              nameActive="car-sport"
              nameInactive="car-sport-outline"
              focused={focused}
              color={color}
              size={size - 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Match',
          headerTitle: 'Trợ Lý AI',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              nameActive="sparkles"
              nameInactive="sparkles-outline"
              focused={focused}
              color={color}
              size={size - 2}
            />
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
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              nameActive="person"
              nameInactive="person-outline"
              focused={focused}
              color={color}
              size={size - 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activePill: {
    position: 'absolute',
    bottom: -5,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primaryHover,
    shadowColor: colors.primaryHover,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});

