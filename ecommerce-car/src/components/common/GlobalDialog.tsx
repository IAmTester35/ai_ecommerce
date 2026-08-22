import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import useDialogStore, {
  DialogActionType,
  DialogAction,
} from '../../store/useDialogStore';

interface DialogButtonProps {
  action: DialogAction;
  index: number;
  isHorizontal: boolean;
  onPress: () => void;
}

const DialogButton: React.FC<DialogButtonProps> = ({
  action,
  index,
  isHorizontal,
  onPress,
}) => {
  const [timeLeft, setTimeLeft] = useState(
    action.pendingActionMs ? Math.ceil(action.pendingActionMs / 1000) : 0
  );

  useEffect(() => {
    if (!action.pendingActionMs) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [action.pendingActionMs]);

  const isPending = timeLeft > 0;
  const buttonText = isPending ? `${action.text} (${timeLeft}s)` : action.text;

  const getActionStyles = (type?: DialogActionType) => {
    switch (type) {
      case 'primary':
        return {
          textColor: '#FFFFFF',
          bgColor: colors.primary,
          fontWeight: typography.weights.bold,
        };
      case 'danger':
        return {
          textColor: colors.danger,
          bgColor: 'transparent',
          fontWeight: typography.weights.semibold,
        };
      case 'warning':
        return {
          textColor: colors.warning,
          bgColor: 'transparent',
          fontWeight: typography.weights.semibold,
        };
      case 'normal':
      default:
        return {
          textColor: colors.textSecondary,
          bgColor: 'transparent',
          fontWeight: typography.weights.medium,
        };
    }
  };

  const actionStyle = getActionStyles(action.type);
  const isPrimary = action.type === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={isPending ? 1 : 0.75}
      disabled={isPending}
      style={[
        styles.button,
        isHorizontal ? styles.buttonHorizontal : styles.buttonVertical,
        isPrimary && styles.buttonPrimary,
        !isPrimary && isHorizontal && index === 0 && styles.buttonSeparatorRight,
        isPending && { opacity: 0.5 },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: actionStyle.textColor,
            fontWeight: actionStyle.fontWeight,
          },
        ]}
      >
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

export const GlobalDialog: React.FC = () => {
  const options = useDialogStore((state) => state.options);
  const visible = useDialogStore((state) => state.visible);
  const hideDialog = useDialogStore((state) => state.hideDialog);

  const [isInternalVisible, setIsInternalVisible] = useState(false);
  const progress = useSharedValue(0);

  const onHideComplete = () => {
    setIsInternalVisible(false);
  };

  useEffect(() => {
    if (visible) {
      setIsInternalVisible(true);
      progress.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = withTiming(
        0,
        { duration: 150, easing: Easing.in(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished) {
            runOnJS(onHideComplete)();
          }
        }
      );
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const alertStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.9, 1],
      Extrapolation.CLAMP
    );
    return {
      opacity: progress.value,
      transform: [{ scale }],
    };
  });

  const shouldRender = visible || isInternalVisible;

  if (!shouldRender || !options) {
    return null;
  }

  const isHorizontal = options.actions && options.actions.length === 2;

  const renderIcon = () => {
    if (options.icon) {
      return (
        <View style={styles.iconWrapper}>
          <Ionicons name={options.icon as any} size={28} color={colors.primaryHover} />
        </View>
      );
    }
    if (options.type === 'success') {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
        </View>
      );
    }
    if (options.type === 'warning') {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <Ionicons name="warning" size={28} color={colors.warning} />
        </View>
      );
    }
    if (options.type === 'error') {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Ionicons name="alert-circle" size={28} color={colors.danger} />
        </View>
      );
    }
    if (options.type === 'info') {
      return (
        <View style={[styles.iconWrapper, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
          <Ionicons name="information-circle" size={28} color={colors.primaryHover} />
        </View>
      );
    }
    return null;
  };

  const renderedContent = () => {
    if (!options.content) return null;
    return options.content.split('\n\n').map((paragraph, pIndex) => (
      <Text key={pIndex} style={styles.messageText}>
        {paragraph.split('\n').map((line, lIndex) => (
          <Text key={lIndex}>
            {line}
            {lIndex < paragraph.split('\n').length - 1 ? '\n' : ''}
          </Text>
        ))}
      </Text>
    ));
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={options.focus ? undefined : hideDialog}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.alertWrapper, alertStyle]} pointerEvents="box-none">
        <View style={styles.alertContainer}>
          <View style={styles.contentContainer}>
            {renderIcon()}

            {options.title ? (
              <Text style={styles.title}>{options.title}</Text>
            ) : null}

            <View style={styles.messageContainer}>{renderedContent()}</View>
          </View>

          <View
            style={[
              styles.actionsContainer,
              isHorizontal ? styles.actionsRow : styles.actionsColumn,
            ]}
          >
            {options.actions?.map((action, index) => (
              <DialogButton
                key={index}
                action={action}
                index={index}
                isHorizontal={!!isHorizontal}
                onPress={() => {
                  action.onPress?.();
                  hideDialog();
                }}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  alertWrapper: {
    width: Math.min(SCREEN_WIDTH - 48, 330),
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  alertContainer: {
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 22,
  },
  messageContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  messageText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: colors.surface,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  button: {
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  buttonHorizontal: {
    flex: 1,
  },
  buttonVertical: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSeparatorRight: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  buttonText: {
    fontSize: typography.sizes.xs + 1.5,
    textAlign: 'center',
  },
});

export default GlobalDialog;
