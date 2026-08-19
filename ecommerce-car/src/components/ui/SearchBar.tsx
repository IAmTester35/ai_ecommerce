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
  placeholder = 'Tìm kiếm xe...',
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
          size={15}
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
            <Ionicons name="close-circle" size={14} color={colors.textMuted} />
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
            size={15}
            color={activeFilterCount > 0 ? '#FFFFFF' : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badgeCount}>
              <Ionicons name="checkmark" size={7} color="#FFFFFF" />
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
          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.xs + 1,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  badgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

