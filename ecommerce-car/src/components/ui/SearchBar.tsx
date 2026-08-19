import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography, shadows } from '../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  activeFilterCount?: number;
  onAiPress?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Tìm hãng, mẫu xe, dòng xe...',
  onClear,
  onSubmit,
  onFilterPress,
  activeFilterCount = 0,
  onAiPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />

        {value.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onChangeText('');
              onClear?.();
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {onFilterPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onFilterPress}
          style={[
            styles.filterBtn,
            activeFilterCount > 0 ? styles.filterBtnActive : null,
          ]}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? '#FFFFFF' : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badgeCount}>
              <Ionicons name="checkmark" size={8} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {onAiPress && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAiPress}
          style={styles.aiBtn}
        >
          <Ionicons name="sparkles" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 46,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowCyan,
  },
});

