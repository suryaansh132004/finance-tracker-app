import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCurrency } from '../data/currencyService';
import { useTheme } from '../data/ThemeContext';

const SummaryCard = ({
  title,
  amount,
  type = 'neutral', // income, expense, neutral
  currency = 'INR',
  theme: propTheme,
}) => {
  const { theme } = useTheme();
  const finalTheme = propTheme || theme;

  const getTypeStyles = () => {
    switch (type) {
      case 'income':
      case 'credit':
        return {
          barColor: '#10B981',
          textColor: '#10B981',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          badgeLabel: 'Income',
        };
      case 'expense':
      case 'debit':
        return {
          barColor: '#EF4444',
          textColor: '#EF4444',
          badgeBg: 'rgba(239, 68, 68, 0.12)',
          badgeLabel: 'Expense',
        };
      default:
        return {
          barColor: finalTheme.text,
          textColor: finalTheme.text,
          badgeBg: finalTheme.cardBackground,
          badgeLabel: '',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: finalTheme.cardBackground },
      ]}
    >
      {/* Single left accent bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: typeStyles.barColor },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: finalTheme.secondaryText }]}>
          {title}
        </Text>

        <Text style={[styles.amount, { color: typeStyles.textColor }]}>
          {formatCurrency(amount ?? 0, currency)}
        </Text>

        {typeStyles.badgeLabel ? (
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeStyles.badgeBg },
            ]}
          >
            <Text
              style={[styles.typeText, { color: typeStyles.barColor }]}
            >
              {typeStyles.badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginVertical: 6,
    alignItems: 'center',
  },
  accentBar: {
    width: 4,
    height: '100%',
    borderRadius: 999,
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SummaryCard;
