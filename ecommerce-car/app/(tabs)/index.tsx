import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useCarStore } from '../../src/store/useCarStore';
import { CarCard } from '../../src/components/car/CarCard';
import { QuickPrompts } from '../../src/components/chat/QuickPrompts';
import { Badge } from '../../src/components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { topCars, fetchTopCars, isLoading, error } = useCarStore();

  useEffect(() => {
    fetchTopCars();
  }, [fetchTopCars]);

  const handleSelectPrompt = (prompt: string) => {
    router.push({
      pathname: '/(tabs)/ai-chat' as any,
      params: { initialPrompt: prompt },
    });
  };

  const handleCarDetails = (carId: string) => {
    router.push(`/car/${carId}` as any);
  };

  const handleCarCompare = () => {
    router.push('/(tabs)/compare' as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>AutoMatch</Text>
            <Badge label="AI RAG" variant="primary" size="sm" />
          </View>
          <Text style={styles.subtitle}>Trợ lý tư vấn & Tìm kiếm ô tô thông minh</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* AI Search Bar Trigger */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/ai-chat' as any)}
      >
        <Ionicons name="sparkles" size={18} color={colors.primary} />
        <Text style={styles.searchText}>Hỏi AI: &quot;Xe thể thao 5 chỗ dưới 1 tỷ...&quot;</Text>
        <View style={styles.searchBtn}>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </View>
      </TouchableOpacity>

      {/* Hero AI Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Badge label="Conflict-Aware Logic" variant="secondary" size="sm" />
          <Text style={styles.heroTitle}>Tìm Xe Theo Ngữ Cảnh</Text>
          <Text style={styles.heroDesc}>
            Mô tả bằng ngôn ngữ tự nhiên. AI tự phát hiện mâu thuẫn ngân sách & gợi ý xe phù hợp nhất.
          </Text>
        </View>
      </View>

      {/* Quick Prompts */}
      <QuickPrompts onSelectPrompt={handleSelectPrompt} />

      {/* Recommended Cars Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Gợi Ý Xe Hot Nhất 2024</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/ai-chat' as any)}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 20 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.carList}>
          {topCars.map((car) => (
            <CarCard
              key={car.id}
              car={{
                ...car,
                engine_hp: car.engine_hp || undefined,
                price: car.price || undefined,
                image_url: car.image_url || undefined,
                metadata: car.metadata || undefined,
                similarity: 0.9,
                rerank_score: 0.92,
              }}
              onPressDetails={handleCarDetails}
              onPressCompare={handleCarCompare}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primaryMuted,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  heroContent: {
    gap: 6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  heroDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  carList: {
    paddingBottom: 24,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginVertical: 10,
    textAlign: 'center',
  },
});
