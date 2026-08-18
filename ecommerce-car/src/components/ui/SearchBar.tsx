import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';

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
    gap: spacing.xs + 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm + 2,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm,
    height: '100%',
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

