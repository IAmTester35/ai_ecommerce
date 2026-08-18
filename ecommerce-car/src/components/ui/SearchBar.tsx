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
  placeholder = 'Tìm hãng, dòng xe, khoảng giá...',
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
          size={18}
          color={colors.primary}
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
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
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
            size={18}
            color={activeFilterCount > 0 ? colors.textDark : colors.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badgeCount}>
              <Ionicons name="checkmark" size={10} color={colors.textDark} />
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
          <Ionicons name="sparkles" size={16} color={colors.textDark} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm + 1,
    height: '100%',
  },
  clearBtn: {
    padding: spacing.xs,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primaryHover,
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
  },
});
