// ============================================================================
// Mobile Health & Medication Reminders Screen
// Features: Accessible checklist, Adherence stats, Sound Chimes on taken,
// Bilingual Tamil / English support, and Temple Bell / Alert sound synthesizer
// ============================================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { THEME } from '../../constants/theme';
import { audioService } from '../../services/audioService';

interface Props {
  language?: string;
  highContrast?: boolean;
}

interface Reminder {
  id: string;
  type: 'medication' | 'hydration' | 'activity' | 'sleep';
  time: string;
  titleTa: string;
  titleEn: string;
  detailsTa: string;
  detailsEn: string;
  confirmed: boolean;
}

export default function RemindersScreen({ language = 'ta', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const isTamil = language === 'ta';

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      type: 'medication',
      time: '08:00 AM',
      titleTa: 'காலை இரத்த அழுத்த மாத்திரை',
      titleEn: 'Morning Blood Pressure Medicine',
      detailsTa: 'ஆம்லோடிபைன் 5mg — காலை உணவுக்குப் பின் ஒரு டம்ளர் தண்ணீருடன்',
      detailsEn: 'Amlodipine 5mg with a full glass of water after breakfast',
      confirmed: true,
    },
    {
      id: '2',
      type: 'hydration',
      time: '11:00 AM',
      titleTa: 'இளநீர் & தண்ணீர் நேரம்',
      titleEn: 'Hydration & Tender Coconut',
      detailsTa: '1 டம்ளர் வெதுவெதுப்பான நீர் அல்லது இளநீர் அருந்தவும்',
      detailsEn: 'Drink 1 fresh glass of warm water or tender coconut',
      confirmed: true,
    },
    {
      id: '3',
      type: 'medication',
      time: '02:00 PM',
      titleTa: 'மதிய கால்சியம் மாத்திரை',
      titleEn: 'Afternoon Calcium Tablet',
      detailsTa: 'மதிய உணவுக்குப் பின் 1 மாத்திரை எடுக்கவும்',
      detailsEn: 'Take 1 tablet after lunch',
      confirmed: false,
    },
    {
      id: '4',
      type: 'activity',
      time: '05:30 PM',
      titleTa: 'மாலை நடைப்பயிற்சி & காற்று வாங்குதல்',
      titleEn: 'Evening Verandah Walk',
      detailsTa: 'முற்றத்தில் அல்லது வராண்டாவில் 15 நிமிடங்கள் மெதுவாக நடக்கவும்',
      detailsEn: 'Gentle 15-minute walk in courtyard or verandah',
      confirmed: false,
    },
    {
      id: '5',
      type: 'medication',
      time: '08:30 PM',
      titleTa: 'இரவு சர்க்கரை மாத்திரை',
      titleEn: 'Evening Diabetes Tablet',
      detailsTa: 'மெட்ஃபோர்மின் 500mg — இரவு உணவுக்கு முன்',
      detailsEn: 'Metformin 500mg before dinner',
      confirmed: false,
    },
  ]);

  const toggleConfirm = (id: string) => {
    setReminders(prev =>
      prev.map(r => {
        if (r.id === id) {
          const nextState = !r.confirmed;
          if (nextState) {
            audioService.playSuccessSound();
          } else {
            audioService.playTapSound();
          }
          return { ...r, confirmed: nextState };
        }
        return r;
      })
    );
  };

  const completedCount = reminders.filter(r => r.confirmed).length;
  const adherencePercent = Math.round((completedCount / reminders.length) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Adherence Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
            🌸 {isTamil ? 'இன்றைய சுகாதார அட்டவணை' : "Today's Routine"}
          </Text>
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => audioService.playTempleBellChime()}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primaryDark }}>🔔 {isTamil ? 'மணி ஒலி' : 'Chime'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.summaryStat, { color: '#059669' }]}>
          {adherencePercent}% {isTamil ? 'முடிக்கப்பட்டது' : 'Completed'}
        </Text>
        <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
          {isTamil
            ? `${reminders.length} பணிகளில் ${completedCount} பணிகள் முடிந்தது`
            : `${completedCount} of ${reminders.length} items checked off today`}
        </Text>
      </View>

      {/* Reminders List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {reminders.map(item => {
          const title = isTamil ? item.titleTa : item.titleEn;
          const details = isTamil ? item.detailsTa : item.detailsEn;

          return (
            <View
              key={item.id}
              style={[
                styles.reminderCard,
                { backgroundColor: colors.cardBg, borderColor: item.confirmed ? '#10B981' : colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.timeBadge, { backgroundColor: colors.primaryLight, color: colors.primaryDark }]}>
                  ⏰ {item.time}
                </Text>
                {item.confirmed && (
                  <View style={styles.completedTag}>
                    <Text style={styles.completedTagText}>✓ {isTamil ? 'உட்கொள்ளப்பட்டது' : 'Taken'}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.cardDetails, { color: colors.textSecondary }]}>{details}</Text>

              {/* Accessible Confirmation Button */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  item.confirmed
                    ? { backgroundColor: '#EFFBF2', borderColor: '#10B981' }
                    : { backgroundColor: colors.primary },
                ]}
                onPress={() => toggleConfirm(item.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.confirmBtnText,
                    { color: item.confirmed ? '#059669' : '#FFFFFF' },
                  ]}
                >
                  {item.confirmed
                    ? (isTamil ? '✓ நான் எடுத்துக்கொண்டேன்' : '✓ I Took This')
                    : (isTamil ? '💊 எடுத்தவுடன் இங்கே தொடவும்' : 'Tap When Taken')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    margin: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    elevation: 2,
  },
  summaryTitle: { fontSize: 18, fontWeight: '800' },
  bellBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  summaryStat: { fontSize: 28, fontWeight: '900', marginVertical: 2 },
  summarySub: { fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 14 },
  listContent: { gap: 12, paddingBottom: 40 },
  reminderCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBadge: { fontSize: 14, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  completedTag: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  completedTagText: { color: '#065F46', fontSize: 12, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardDetails: { fontSize: 14, lineHeight: 20 },
  confirmBtn: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800' },
});
