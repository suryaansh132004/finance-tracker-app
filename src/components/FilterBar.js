import React from 'react'; // ✅ ADDED
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../data/ThemeContext'; // ✅ ADDED

const FilterBar = ({ filters, onFilterChange }) => {
  const { theme } = useTheme(); // ✅ Theme support

  const dateRangeOptions = [
    { key: 'Today', label: 'Today' },
    { key: 'Week', label: 'This Week' },
    { key: 'Month', label: 'This Month' },
  ];

  const typeOptions = [
    { key: 'All', label: 'All' },
    { key: 'Debit', label: 'Debit' },
    { key: 'Credit', label: 'Credit' },
  ];

  const isActive = (category, key) => {
    return filters[category] === key;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Range Filters */}
        {dateRangeOptions.map((option) => (
          <TouchableOpacity
            key={`date-${option.key}`}
            onPress={() => onFilterChange({ ...filters, dateRange: option.key })}
            style={[
              styles.filterButton,
              isActive('dateRange', option.key) && styles.activeFilterButton,
              { 
                backgroundColor: isActive('dateRange', option.key) 
                  ? theme.activeButton 
                  : theme.background,
                borderColor: theme.border 
              }
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              isActive('dateRange', option.key) && styles.activeFilterButtonText,
              { 
                color: isActive('dateRange', option.key) 
                  ? theme.activeButtonText 
                  : theme.secondaryText 
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        {/* Type Filters */}
        {typeOptions.map((option) => (
          <TouchableOpacity
            key={`type-${option.key}`}
            onPress={() => onFilterChange({ ...filters, transactionType: option.key })}
            style={[
              styles.filterButton,
              isActive('transactionType', option.key) && styles.activeFilterButton,
              { 
                backgroundColor: isActive('transactionType', option.key) 
                  ? theme.activeButton 
                  : theme.background,
                borderColor: theme.border 
              }
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              isActive('transactionType', option.key) && styles.activeFilterButtonText,
              { 
                color: isActive('transactionType', option.key) 
                  ? theme.activeButtonText 
                  : theme.secondaryText 
              }
            ]}>
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
    paddingVertical: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  activeFilterButton: {
    borderWidth: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 8,
    alignSelf: 'center',
  },
});

export default FilterBar;
