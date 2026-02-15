// components/AlignedTextInput.js
import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '../data/ThemeContext';

export const AlignedTextInput = ({ label, value, onChangeText, placeholder, optional = false, ...props }) => {
  const { theme } = useTheme();

  return (
    <View style={{ marginBottom: 16, flex: 1 }}>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
        {label} {optional && <Text style={{ color: theme.tertiaryText, fontSize: 11, fontWeight: '400' }}>(Optional)</Text>}
      </Text>
      <TextInput
        style={{
          backgroundColor: theme.cardBackground,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.border,
          color: theme.text,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          height: 48,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.tertiaryText}
        {...props}
      />
    </View>
  );
};
