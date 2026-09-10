// ============================================================================
// Mobile Health & Medication Reminders Screen
// ============================================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { MobileReminder } from '../../services/api';

interface Props {
  highContrast?: boolean;
}

export default function RemindersScreen({ highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const [reminders, setReminders] = useState<MobileReminder[]>([
    {
      id: '1',
      type: 'medication',
      time: '8:00 AM',
      title: 'Morning Blood Pressure Medicine',
      details: 'Amlodipine 5mg with a full glass of water after breakfast',
      confirmed: true,
    },
    {
      id: '2',
      type: 'hydration',
      time: '11:00 AM',
      title: 'Hydration Time',
      details: 'Drink 1 fresh glass of warm water',
      confirmed: true,
    },
    {
      id: '3',
      type: 'medication',
      time: '2:00 PM',
      title: 'Afternoon Calcium Tablet',
      details: 'Take 1 tablet after lunch',
      confirmed: false,
    },
    {
      id: '4',
      type: 'medication',
      time: '8:30 PM',
      title: 'Evening Diabetes Tablet',
      details: 'Metformin 500mg before dinner',
      confirmed: false,
    },
  ]);

  const toggleConfirm = (id: string) => {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, confirmed: !r.confirmed } : r))
    );
  };

  const completedCount = reminders.filter(r => r.confirmed).length;
  const adherencePercent = Math.round((completedCount / reminders.length) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Adherence Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Today's Routine</Text>
        <Text style={[styles.summaryStat, { color: colors.success }]}>
          {adherencePercent}% Completed
        </Text>
        <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
          {completedCount} of {reminders.length} items checked off today
        </Text>
      </View>

      {/* Reminders List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {reminders.map((item) => (
          <View
            key={item.id}
            style={[
              styles.reminderCard,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
              item.confirmed && { borderColor: colors.success },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.timeBadge, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
                ⏰ {item.time}
              </Text>
              {item.confirmed && (
                <Text style={[styles.statusBadge, { color: colors.success }]}>
                  ✓ Completed
                </Text>
              )}
            </View>

            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.cardDetails, { color: colors.textSecondary }]}>{item.details}</Text>

            {/* Accessible Confirmation Button */}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                item.confirmed
                  ? { backgroundColor: colors.successLight, borderColor: colors.success }
                  : { backgroundColor: colors.primary },
              ]}
              onPress={() => toggleConfirm(item.id)}
            >
              <Text
                style={[
                  styles.confirmBtnText,
                  { color: item.confirmed ? colors.success : '#FFFFFF' },
                ]}
              >
                {item.confirmed ? '✓ I Took This' : 'Tap When Taken'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryStat: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  summarySub: {
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    gap: 16,
    paddingBottom: 24,
  },
  reminderCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadge: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardDetails: {
    fontSize: 18,
    lineHeight: 24,
  },
  confirmBtn: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
