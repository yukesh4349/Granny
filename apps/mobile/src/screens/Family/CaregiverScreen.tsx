// ============================================================================
// Mobile Caregiver Dashboard Screen
// ============================================================================
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';

interface Props {
  highContrast?: boolean;
}

export default function CaregiverScreen({ highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>👵 Kamala's Daily Care Circle</Text>
        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Linked Caregiver: Rahul (Son)</Text>
      </View>

      {/* Medication Adherence */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💊 Medication Adherence (7 Days)</Text>
        <Text style={[styles.statLarge, { color: colors.success }]}>94%</Text>
        <Text style={[styles.statDesc, { color: colors.textSecondary }]}>
          Excellent consistency. Morning BP tablet taken on time today at 8:05 AM.
        </Text>
      </View>

      {/* Mood Trend */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>😊 Mood Trend</Text>
        <View style={styles.moodRow}>
          {['Mon 😊', 'Tue 😌', 'Wed 😊', 'Thu 🌿', 'Fri 😊', 'Sat 😌', 'Today 😊'].map((day) => (
            <View key={day} style={[styles.moodChip, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.moodText, { color: colors.primary }]}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cognitive Game Performance */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🧠 Cognitive Game Activity</Text>
        <View style={styles.gameStatRow}>
          <Text style={[styles.gameName, { color: colors.textPrimary }]}>Where Did I Keep It</Text>
          <Text style={[styles.gameScore, { color: colors.success }]}>100% (4/4)</Text>
        </View>
        <View style={styles.gameStatRow}>
          <Text style={[styles.gameName, { color: colors.textPrimary }]}>Memory Market</Text>
          <Text style={[styles.gameScore, { color: colors.success }]}>90% (3/3)</Text>
        </View>
        <View style={styles.gameStatRow}>
          <Text style={[styles.gameName, { color: colors.textPrimary }]}>Complete the Tune</Text>
          <Text style={[styles.gameScore, { color: colors.primary }]}>85% (3/4)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLarge: {
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statDesc: {
    fontSize: 16,
    lineHeight: 22,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  moodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  gameStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  gameName: {
    fontSize: 17,
    fontWeight: '500',
  },
  gameScore: {
    fontSize: 17,
    fontWeight: 'bold',
  },
});
