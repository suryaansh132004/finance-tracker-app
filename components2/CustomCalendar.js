import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CustomCalendar = ({ visible, onClose, onDateRangeSelect, initialStartDate, initialEndDate }) => {
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

  const isStartDate = (date) => {
    return startDate && date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (date) => {
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Range Display */}
          <View style={styles.selectedRangeContainer}>
            <Text style={styles.selectedRangeText}>{formatDateRange()}</Text>
            <Text style={styles.instructionText}>
              {selectionMode === 'start' ? 'Tap to select start date' : 'Tap to select end date'}
            </Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigationContainer}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Day Names Header */}
          <View style={styles.dayNamesContainer}>
            {dayNames.map(day => (
              <View key={day} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid - Fixed Sizing */}
          <ScrollView style={styles.calendarScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarGrid}>
              {days.map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    date && isStartDate(date) && styles.startDateButton,
                    date && isEndDate(date) && styles.endDateButton,
                    date && isDateInRange(date) && !isStartDate(date) && !isEndDate(date) && styles.rangeDateButton,
                  ]}
                  onPress={() => date && handleDatePress(date)}
                  disabled={!date}
                >
                  <Text style={[
                    styles.dayText,
                    date && (isStartDate(date) || isEndDate(date)) && styles.selectedDayText,
                    date && isDateInRange(date) && !isStartDate(date) && !isEndDate(date) && styles.rangeDayText,
                  ]}>
                    {date ? date.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            style={[styles.applyButton, (!startDate || !endDate) && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={!startDate || !endDate}
          >
            <Text style={[styles.applyButtonText, (!startDate || !endDate) && styles.applyButtonTextDisabled]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: height * 0.85, // 85% of screen height
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  selectedRangeContainer: {
    backgroundColor: '#2C2C2E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedRangeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 12,
    color: '#8E8E93',
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
    backgroundColor: '#2C2C2E',
  },
  monthText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: '#8E8E93',
    paddingVertical: 8,
  },
  calendarScrollView: {
    maxHeight: 240, // Fixed height for calendar grid
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: `${100/7}%`,
    height: 40, // ✅ FIXED HEIGHT instead of aspectRatio
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
  },
  startDateButton: {
    backgroundColor: '#FFFFFF',
  },
  endDateButton: {
    backgroundColor: '#FFFFFF',
  },
  rangeDateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dayText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#000000',
    fontWeight: '700',
  },
  rangeDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  applyButtonTextDisabled: {
    color: '#8E8E93',
  },
});

export default CustomCalendar;
