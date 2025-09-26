import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency, formatDate } from '../data/utils';

const TransactionItem = ({ transaction, onPress }) => {
  const isCredit = transaction.type === 'credit';
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(transaction)}>
      <View style={styles.leftSection}>
        <Text style={styles.merchantName}>{transaction.merchant}</Text>
        <Text style={styles.transactionDate}>{formatTime(transaction.timestamp)}</Text>
        <Text style={styles.amountLabel}>{formatCurrency(transaction.amount)}</Text>
        {transaction.category && (
          <Text style={styles.category}>{transaction.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  leftSection: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#888888',
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});

export default TransactionItem;
