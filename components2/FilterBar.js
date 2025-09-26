import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FilterBar = ({ filters, onFilterChange }) => {
  const dateRangeOptions = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const typeOptions = [
    { key: 'all', label: 'All' },
    { key: 'debit', label: 'Debit' },
    { key: 'credit', label: 'Credit' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        {dateRangeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              filters.dateRange === option.key && styles.activeFilterButton,
            ]}
            onPress={() => onFilterChange({ ...filters, dateRange: option.key })}
          >
            <Text
              style={[
                styles.filterButtonText,
                filters.dateRange === option.key && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={styles.separator} />
        
        {typeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              filters.transactionType === option.key && styles.activeFilterButton,
            ]}
            onPress={() => onFilterChange({ ...filters, transactionType: option.key })}
          >
            <Text
              style={[
                styles.filterButtonText,
                filters.transactionType === option.key && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
});

export default FilterBar;
