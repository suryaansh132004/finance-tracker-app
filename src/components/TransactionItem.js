import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../data/ThemeContext';
import { formatCurrency } from '../data/currencyService';

const TransactionItem = ({ item, currency }) => {
  const { theme } = useTheme();

  // Fallback so we never crash if item is missing
  const transaction = item || {};
  const isCredit = transaction.type === 'credit';

  const rawDate = transaction.date || transaction.timestamp;
const dateObj = rawDate ? new Date(rawDate) : null;


  const dateStr = dateObj
    ? dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const timeStr = dateObj
    ? dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const bankLabel =
    transaction.bank || transaction.bankHint
      ? ` • ${transaction.bank || transaction.bankHint}`
      : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View
        style={[
          styles.colorBar,
          { backgroundColor: isCredit ? '#10B981' : '#EF4444' },
        ]}
      />
      <View style={styles.detailsContainer}>
        <Text style={[styles.merchantName, { color: theme.text }]}>
          {transaction.merchant || 'Unknown Merchant'}
        </Text>
        <Text style={[styles.transactionMeta, { color: theme.secondaryText }]}>
          {dateStr} {dateStr && timeStr ? ' • ' : ''}{timeStr}
          {bankLabel}
        </Text>
        {transaction.originalCurrency &&
          transaction.originalCurrency !== currency && (
            <Text
              style={[styles.originalCurrency, { color: theme.tertiaryText }]}
            >
              Originally:{' '}
              {formatCurrency(
                transaction.originalAmount ?? transaction.amount ?? 0,
                transaction.originalCurrency
              )}
            </Text>
          )}
      </View>
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.transactionAmount,
            { color: isCredit ? '#10B981' : '#EF4444' },
          ]}
        >
          {isCredit ? '+' : '-'}{' '}
          {formatCurrency(transaction.amount ?? 0, currency)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  colorBar: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
  },
  originalCurrency: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  amountContainer: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default TransactionItem;
