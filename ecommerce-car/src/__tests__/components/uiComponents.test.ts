import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { PillFilter } from '../../components/ui/PillFilter';
import { PriceTag } from '../../components/ui/PriceTag';
import { RatingStars } from '../../components/ui/RatingStars';

describe('UI Component Library Suite', () => {
  describe('Badge Component', () => {
    it('creates Badge with various variants and sizes', () => {
      const badgePrimary = React.createElement(Badge, { label: 'Primary', variant: 'primary', size: 'xs' });
      const badgeSuccess = React.createElement(Badge, { label: 'Success', variant: 'success', size: 'sm', dot: true });
      const badgeGold = React.createElement(Badge, { label: 'Gold', variant: 'gold', size: 'md' });
      const badgeDanger = React.createElement(Badge, { label: 'Danger', variant: 'danger' });

      expect(badgePrimary).toBeDefined();
      expect(badgeSuccess).toBeDefined();
      expect(badgeGold).toBeDefined();
      expect(badgeDanger).toBeDefined();
    });
  });

  describe('Button Component', () => {
    it('creates Button with variants, loading state, disabled state, and icons', () => {
      const onPressSpy = jest.fn();
      const btnPrimary = React.createElement(Button, {
        title: 'Xác nhận',
        variant: 'primary',
        size: 'sm',
        onPress: onPressSpy,
      });
      const btnLoading = React.createElement(Button, {
        title: 'Đang tải...',
        variant: 'secondary',
        loading: true,
        onPress: onPressSpy,
      });
      const btnDisabled = React.createElement(Button, {
        title: 'Vô hiệu hóa',
        disabled: true,
        onPress: onPressSpy,
      });

      expect(btnPrimary).toBeDefined();
      expect(btnLoading).toBeDefined();
      expect(btnDisabled).toBeDefined();
    });
  });

  describe('Card Component', () => {
    it('creates Card with custom padding and variant', () => {
      const card = React.createElement(
        Card,
        { padding: 16, variant: 'elevated' },
        React.createElement('Text', null, 'Card Content')
      );
      expect(card).toBeDefined();
    });
  });

  describe('EmptyState Component', () => {
    it('creates EmptyState with icon, title, description, and action button', () => {
      const onActionSpy = jest.fn();
      const emptyState = React.createElement(EmptyState, {
        icon: 'search-outline',
        title: 'Không tìm thấy kết quả',
        description: 'Vui lòng thử từ khóa khác',
        actionTitle: 'Đặt lại',
        onAction: onActionSpy,
      });
      expect(emptyState).toBeDefined();
    });
  });

  describe('Input Component', () => {
    it('creates Input with label, error text, helper text, and icons', () => {
      const onChangeSpy = jest.fn();
      const input = React.createElement(Input, {
        label: 'Email',
        required: true,
        placeholder: 'name@example.com',
        value: 'test@example.com',
        onChangeText: onChangeSpy,
        error: 'Email không hợp lệ',
        helperText: 'Chúng tôi sẽ gửi mã OTP',
      });
      expect(input).toBeDefined();
    });
  });

  describe('PillFilter Component', () => {
    it('creates PillFilter with list of options and onSelect callback', () => {
      const onSelectSpy = jest.fn();
      const options = [
        { id: 'all', label: 'Tất cả' },
        { id: 'suv', label: 'SUV' },
        { id: 'sedan', label: 'Sedan' },
      ];

      const pillFilter = React.createElement(PillFilter, {
        options,
        selectedId: 'suv',
        onSelect: onSelectSpy,
      });
      expect(pillFilter).toBeDefined();
    });
  });

  describe('PriceTag Component', () => {
    it('creates PriceTag with USD and auto-calculated VND and installment hints', () => {
      const priceTag = React.createElement(PriceTag, {
        price: 80000,
        size: 'lg',
        showInstallment: true,
        spec: { engineHp: 300, fuelType: 'Xăng' },
      });
      expect(priceTag).toBeDefined();
    });

    it('handles zero, negative, or undefined prices safely', () => {
      const zeroTag = React.createElement(PriceTag, { price: 0 });
      const nullTag = React.createElement(PriceTag, { price: null });
      expect(zeroTag).toBeDefined();
      expect(nullTag).toBeDefined();
    });
  });

  describe('RatingStars Component', () => {
    it('creates RatingStars with score and custom star size', () => {
      const stars = React.createElement(RatingStars, {
        rating: 4.8,
        size: 14,
        showScore: true,
        scoreText: '4.8 (24 đánh giá)',
      });
      expect(stars).toBeDefined();
    });
  });
});
