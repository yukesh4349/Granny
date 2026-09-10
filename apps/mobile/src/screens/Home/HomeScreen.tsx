// ============================================================================
// Mobile Elder Home Screen — 4 Large Action Cards + Emergency Button
// ============================================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '../../constants/theme';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenGame: () => void;
  onEmergency: () => void;
  highContrast?: boolean;
}

export default function HomeScreen({ onNavigate, onOpenGame, onEmergency, highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Greeting Banner */}
      <View style={[styles.greetingCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>👵 Welcome Back, Kamala</Text>
        <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
          I'm Granny. How can I help you today?
        </Text>
      </View>

      {/* 4 Large Action Cards (Elderly Touch Targets > 80px) */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E8F0FE', borderColor: '#4A6FA5' }]}
          onPress={() => onNavigate('companion')}
        >
          <Text style={styles.cardEmoji}>🎙️</Text>
          <Text style={[styles.cardTitle, { color: '#1A365D' }]}>Talk to Granny</Text>
          <Text style={styles.cardDesc}>Voice chat & friendly companion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#FDF0EC', borderColor: '#E07A5F' }]}
          onPress={onOpenGame}
        >
          <Text style={styles.cardEmoji}>🧠</Text>
          <Text style={[styles.cardTitle, { color: '#7C2D12' }]}>Brain Games</Text>
          <Text style={styles.cardDesc}>Play "Where Did I Keep It"</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}
          onPress={() => onNavigate('health')}
        >
          <Text style={styles.cardEmoji}>💊</Text>
          <Text style={[styles.cardTitle, { color: '#14532D' }]}>Today's Medicines</Text>
          <Text style={styles.cardDesc}>Reminders & health schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#F3E8FF', borderColor: '#7E22CE' }]}
          onPress={() => onNavigate('caregiver')}
        >
          <Text style={styles.cardEmoji}>👨‍👩‍👧</Text>
          <Text style={[styles.cardTitle, { color: '#581C87' }]}>Care Circle</Text>
          <Text style={styles.cardDesc}>Family notes & adherence stats</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contact Button */}
      <TouchableOpacity
        style={[styles.emergencyBtn, { backgroundColor: colors.accent }]}
        onPress={onEmergency}
      >
        <Text style={styles.emergencyText}>🚨 Call Family / Emergency Help</Text>
      </TouchableOpacity>
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
  greetingCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  greetingSub: {
    fontSize: 18,
  },
  grid: {
    gap: 16,
  },
  actionCard: {
    minHeight: 100,
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 16,
    color: '#4B5563',
  },
  emergencyBtn: {
    minHeight: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
