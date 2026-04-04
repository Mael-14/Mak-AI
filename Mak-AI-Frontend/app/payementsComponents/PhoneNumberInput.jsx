import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';

const PhoneNumberInput = ({ value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputCard}>
        <Text style={styles.label}>ACCOUNT PHONE NUMBER</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder="+237 6xx xxx xxx"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={14}
          />
          <Ionicons name="phone-portrait-outline" size={20} color="#9CA3AF" style={styles.icon} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(15),
    paddingHorizontal: scale(10),
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: scale(14),
    // Standard card shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  label: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: verticalScale(12),
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB', // Matches the light grey background from the design
    borderRadius: 12,
    paddingHorizontal: scale(10),
    height: verticalScale(50),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1F2937',
  },
  icon: {
    marginLeft: scale(10),
  },
});

export default PhoneNumberInput;
