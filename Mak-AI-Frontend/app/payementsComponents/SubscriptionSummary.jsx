import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/scaling';

const plans = [
  { id: 1, name: 'Basic Plan', price: 1000 },
  { id: 2, name: 'Premium Plan', price: 2000 },
  { id: 3, name: 'Pro Plan', price: 3000 },
];

const SubscriptionSummary = ({ selectedPlanId, selectedDuration }) => {
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[2];
  const totalAmount = selectedPlan.price * selectedDuration;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>SUBSCRIPTION SUMMARY</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{selectedPlan.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{selectedDuration} {selectedDuration === 1 ? 'Month' : 'Months'}</Text>
        </View>

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>XAF {totalAmount.toLocaleString()}</Text>
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
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: scale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  sectionTitle: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: verticalScale(15),
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(13),
    color: '#6B7280',
  },
  value: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#1F2937',
  },
  totalRow: {
    marginTop: verticalScale(5),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#1E3A8A',
  },
});

export default SubscriptionSummary;
