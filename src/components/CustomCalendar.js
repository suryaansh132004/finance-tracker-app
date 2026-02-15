import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // ✅ FIXED
import { useTheme } from '../data/ThemeContext'; // ✅ Added theme support

const { width, height } = Dimensions.get('window');

const CustomCalendar = ({ 
  visible, 
  onClose, 
  onDateRangeSelect, 
  initialStartDate, 
  initialEndDate 
}) => {
  const { theme } = useTheme(); // ✅ Theme integration
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [selectionMode, setSelectionMode] = useState('start');

  useEffect(() => {
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setSelectionMode('start');
  }, [visible, initialStartDate, initialEndDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDatePress = (date) => {
    if (selectionMode === 'start') {
      setStartDate(date);
      setEndDate(null);
      setSelectionMode('end');
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
        setSelectionMode('end');
      } else {
        setEndDate(date);
        setSelectionMode('start');
      }
    }
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isStartDateSelected = (date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isEndDateSelected = (date) => {
    return endDate && date.toDateString() === endDate.toDateString();
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onDateRangeSelect(startDate, endDate);
      onClose();
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectionMode('start');
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else if (startDate) {
      return `From: ${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    return 'Select start date';
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.calendarContainer, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>
              Select Date Range
            </Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={[styles.resetText, { color: theme.secondaryText }]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected Range Display */}
          <View style={[styles.selectedRangeContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.selectedRangeText, { color: theme.text }]}>
              {formatDateRange()}
            </Text>
            <Text style={[styles.instructionText, { color: theme.secondaryText }]}>
              {selectionMode === 'start' ? 'Tap to select start date' : 'Tap to select end date'}
            </Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
              <Icon name="chevron-back-outline" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: theme.text }]}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
              <Icon name="chevron-forward-outline" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Day Names Header */}
          <View style={styles.dayNamesContainer}>
            {dayNames.map(day => (
              <View key={day} style={styles.dayNameCell}>
                <Text style={[styles.dayNameText, { color: theme.secondaryText }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScrollView}>
            <View style={styles.calendarGrid}>
              {days.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => date && handleDatePress(date)}
                  disabled={!date}
                  style={[
                    styles.dayButton,
                    !date && styles.disabledDay,
                    date && isStartDateSelected(date) && styles.startDateButton,
                    date && isEndDateSelected(date) && styles.endDateButton,
                    date && isDateInRange(date) && !isStartDateSelected(date) && !isEndDateSelected(date) && styles.rangeDateButton,
                  ]}
                >
                  {date ? (
                    <Text style={[
                      styles.dayText,
                      isStartDateSelected(date) && styles.selectedDayText,
                      isEndDateSelected(date) && styles.selectedDayText,
                      isDateInRange(date) && styles.rangeDayText,
                      { color: theme.text }
                    ]}>
                      {date.getDate()}
                    </Text>
                  ) : (
                    <View style={styles.emptyDay} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            onPress={handleApply}
            disabled={!startDate || !endDate}
            style={[
              styles.applyButton,
              (!startDate || !endDate) && styles.applyButtonDisabled,
              { backgroundColor: theme.activeButton }
            ]}
          >
            <Text style={[
              styles.applyButtonText,
              (!startDate || !endDate) && styles.applyButtonTextDisabled,
              { color: theme.activeButtonText }
            ]}>
              Apply Date Range
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: height * 0.85,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedRangeContainer: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedRangeText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 12,
  },
  monthNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '600',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    width: `${100/7}%`,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 8,
  },
  calendarScrollView: {
    maxHeight: 240,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: `${100/7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  disabledDay: {
    opacity: 0.3,
  },
  startDateButton: {
    backgroundColor: '#10B981',
  },
  endDateButton: {
    backgroundColor: '#10B981',
  },
  rangeDateButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '700',
  },
  rangeDayText: {
    fontWeight: '600',
  },
  emptyDay: {
    width: 20,
    height: 20,
  },
  applyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonTextDisabled: {
    opacity: 0.5,
  },
});

export default CustomCalendar;
