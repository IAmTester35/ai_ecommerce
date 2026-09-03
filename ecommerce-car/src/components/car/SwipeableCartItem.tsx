import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../theme';
import { CartItem } from '../../types';
import { formatVndPrice } from '../../utils/currency';
import { FALLBACK_CAR_URL } from '../../constants/images';
import { globalAlert } from '../../store/useDialogStore';

interface SwipeableCartItemProps {
  item: CartItem;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

const ACTION_WIDTH = 80;

export const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const [isOpen, setIsOpen] = useState(false);

  const fallbackImage = FALLBACK_CAR_URL;
  const car = item.car;

  // Extract variants & specs
  const transmission = car?.metadata?.transmission || car?.metadata?.transmission_type || 'Tự động';
  const fuelType = car?.metadata?.engine_fuel_type || car?.metadata?.fuel_type || 'Xăng';
  const engineHp = car?.engine_hp ? `${car.engine_hp} HP` : null;
  const seating = car?.metadata?.seating_capacity ? `${car.metadata.seating_capacity} chỗ` : null;
  const selectedColor = car?.metadata?.color || car?.metadata?.color_options?.[0] || null;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 4,
    }).start(() => setIsOpen(false));
  };

  const openSwipe = () => {
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: Platform.OS !== 'web',
      bounciness: 4,
    }).start(() => setIsOpen(true));
  };

  const handleDeleteWithAnimation = () => {
    Animated.timing(itemOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onRemove(item.id);
    });
  };

  const handleDecreaseQuantity = () => {
    if (item.quantity <= 1) {
      globalAlert(
        'Xóa mẫu xe khỏi giỏ?',
        `Bạn có chắc chắn muốn bỏ "${car ? `${car.make} ${car.model}` : 'mẫu xe này'}" khỏi danh sách đặt cọc?`,
        [
          { text: 'Giữ lại', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: handleDeleteWithAnimation,
          },
        ]
      );
      return;
    }
    onUpdateQuantity(item.id, item.quantity - 1);
  };

  const handleIncreaseQuantity = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  // PanResponder for mobile swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left
          const newX = Math.max(-ACTION_WIDTH - 20, gestureState.dx - (isOpen ? ACTION_WIDTH : 0));
          translateX.setValue(newX);
        } else if (isOpen) {
          // Swiping right to close
          const newX = Math.min(0, -ACTION_WIDTH + gestureState.dx);
          translateX.setValue(newX);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35 || (isOpen && gestureState.dx < 10)) {
          openSwipe();
        } else {
          closeSwipe();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { opacity: itemOpacity }]}>
      {/* Background Revealed Delete Button */}
      <View style={styles.revealedActionArea}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.revealedDeleteBtn}
          onPress={handleDeleteWithAnimation}
          accessibilityLabel="Xóa xe khỏi giỏ hàng"
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.revealedDeleteText}>Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Swipeable Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardForeground,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Car Thumbnail */}
        <Image
          source={{ uri: car?.image_url || fallbackImage }}
          style={styles.itemThumb}
          contentFit="cover"
        />

        {/* Item Info Body */}
        <View style={styles.itemInfo}>
          {/* Header Row: Title & Direct Delete Icon */}
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemCarName} numberOfLines={1}>
              {car ? `${car.make} ${car.model}` : 'Mẫu xe AutoMatch'}
            </Text>

            <TouchableOpacity
              onPress={handleDeleteWithAnimation}
              style={styles.topDeleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Xóa sản phẩm"
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>

          {/* Model Year & Showroom Location */}
          <View style={styles.metaRow}>
            <Text style={styles.itemYear}>Đời {car?.year || 2024}</Text>
            {car?.showroom && (
              <View style={styles.showroomPill}>
                <Ionicons name="business-outline" size={10} color={colors.primaryHover} />
                <Text style={styles.showroomText} numberOfLines={1}>
                  {car.showroom.name} ({car.showroom.city})
                </Text>
              </View>
            )}
          </View>

          {/* Selected Variant Badges */}
          <View style={styles.variantBadgesWrap}>
            {fuelType ? (
              <View style={styles.variantChip}>
                <Ionicons name="flash-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.variantChipText}>{fuelType}</Text>
              </View>
            ) : null}

            {transmission ? (
              <View style={styles.variantChip}>
                <Ionicons name="cog-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.variantChipText}>{transmission}</Text>
              </View>
            ) : null}

            {engineHp ? (
              <View style={styles.variantChip}>
                <Ionicons name="speedometer-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.variantChipText}>{engineHp}</Text>
              </View>
            ) : null}

            {seating ? (
              <View style={styles.variantChip}>
                <Ionicons name="people-outline" size={10} color={colors.textSecondary} />
                <Text style={styles.variantChipText}>{seating}</Text>
              </View>
            ) : null}

            {selectedColor ? (
              <View style={[styles.variantChip, styles.colorChip]}>
                <View style={styles.colorDot} />
                <Text style={styles.variantChipText}>{selectedColor}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Row: Price & Quantity Stepper */}
          <View style={styles.bottomRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Niêm yết:</Text>
              <Text style={styles.itemPrice}>
                {formatVndPrice(car?.price, 'usd', {
                  engineHp: car?.engine_hp,
                  fuelType: car?.metadata?.engine_fuel_type || car?.metadata?.fuel_type,
                })}
              </Text>
            </View>

            {/* Tap-Friendly Accessible Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={handleDecreaseQuantity}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Giảm số lượng"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                  size={15}
                  color={item.quantity === 1 ? colors.danger : colors.text}
                />
              </TouchableOpacity>

              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValueText}>{item.quantity}</Text>
              </View>

              <TouchableOpacity
                onPress={handleIncreaseQuantity}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Tăng số lượng"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={15} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radii.md,
  },
  revealedActionArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  revealedDeleteBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  revealedDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  cardForeground: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: spacing.sm + 2,
    zIndex: 2,
  },
  itemThumb: {
    width: 90,
    height: 76,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm + 4,
    justifyContent: 'space-between',
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  itemCarName: {
    color: colors.text,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
    flex: 1,
  },
  topDeleteBtn: {
    padding: 4,
    borderRadius: radii.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  itemYear: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.weights.medium,
  },
  showroomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radii.xs,
  },
  showroomText: {
    color: colors.primaryHover,
    fontSize: 10,
    fontWeight: typography.weights.medium,
  },
  variantBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  colorChip: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryHover,
  },
  variantChipText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    fontWeight: typography.weights.medium,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
  },
  itemPrice: {
    color: colors.primaryHover,
    fontSize: 12.5,
    fontWeight: typography.weights.bold,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  stepperValueBox: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  stepperValueText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
});
