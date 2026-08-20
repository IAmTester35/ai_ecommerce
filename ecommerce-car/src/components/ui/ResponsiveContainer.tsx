import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from 'react-native';
import { colors, layout, spacing } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

export type ContainerMaxWidthKey = keyof typeof layout.containerMaxWidth;

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number | ContainerMaxWidthKey;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  withPadding?: boolean;
  align?: 'center' | 'flex-start' | 'stretch';
  fullHeight?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

/**
 * Container component that enforces maximum width and horizontal centering on larger viewports.
 * Prevents awkward stretching on tablet and desktop screens.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  style,
  contentContainerStyle,
  scrollable = false,
  showsVerticalScrollIndicator = false,
  refreshControl,
  withPadding = true,
  align = 'center',
  fullHeight = true,
  keyboardShouldPersistTaps,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const resolvedMaxWidth: number =
    typeof maxWidth === 'number'
      ? maxWidth
      : layout.containerMaxWidth[maxWidth] || layout.containerMaxWidth.xl;

  const horizontalPadding = withPadding
    ? isDesktop
      ? spacing['3xl']
      : isTablet
      ? spacing['2xl']
      : spacing.lg
    : 0;

  const innerStyle: ViewStyle = {
    width: '100%',
    maxWidth: resolvedMaxWidth,
    alignSelf: align,
    paddingHorizontal: horizontalPadding,
  };

  if (scrollable) {
    return (
      <View style={[styles.outer, fullHeight && styles.fullHeight, style]}>
        <ScrollView
          style={[styles.scroll, fullHeight && styles.fullHeight]}
          contentContainerStyle={[
            styles.scrollContent,
            innerStyle,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outer, fullHeight && styles.fullHeight, style]}>
      <View style={[styles.inner, innerStyle, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    backgroundColor: colors.background,
  },
  fullHeight: {
    flex: 1,
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
});
