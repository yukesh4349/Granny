// ============================================================================
// Mobile Elder Home Screen — Warm, Dignified, Large Touch Targets
// ============================================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { THEME } from '../../constants/theme';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenGames: () => void;
  onEmergency: () => void;
  language?: string;
  highContrast?: boolean;
}

export default function HomeScreen({ onNavigate, onOpenGames, onEmergency, language = 'en', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const [sparkDone, setSparkDone] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Greeting Banner */}
      <View style={[styles.greetingCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
            🌸 {language === 'ta' ? 'வணக்கம், லட்சுமி அம்மா & ராமநாதன் தாத்தா!' : 'Welcome, Lakshmi Amma & Ramanathan Thatha!'}
          </Text>
        </View>
        <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
          {language === 'ta'
            ? 'இன்று உங்கள் உடல்நலமும் மனநலமும் எப்படி உள்ளது?'
            : 'How are you feeling today? Asha Voice AI is ready to chat.'}
        </Text>
      </View>

      {/* 2-Minute Brain Spark Banner */}
      <View style={[styles.sparkCard, { backgroundColor: '#EFFBF2', borderColor: '#B7E4C7' }]}>
        <Text style={[styles.sparkTitle, { color: '#1B4332' }]}>
          ✨ {language === 'ta' ? '2 நிமிட மூளைப் பயிற்சி' : '2-Minute Brain Spark'}
        </Text>
        <Text style={[styles.sparkDesc, { color: '#2D6A4F' }]}>
          {language === 'ta'
            ? 'உங்கள் அறையில் நீல அல்லது பச்சை நிறத்தில் உள்ள 3 பொருட்களை கூறுங்கள்!'
            : 'Quick observation: Name 3 things in your room right now that are green or blue!'}
        </Text>
        <TouchableOpacity
          style={[styles.sparkBtn, { backgroundColor: sparkDone ? '#2D6A4F' : colors.primary }]}
          onPress={() => setSparkDone(s => !s)}
        >
          <Text style={styles.sparkBtnText}>
            {sparkDone
              ? (language === 'ta' ? '✓ முடிந்தது' : '✓ Completed')
              : (language === 'ta' ? 'தொடங்கு (1 நிமிடம்)' : 'Try Spark (1 min)')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Large Action Grid (WCAG AAA Targets) */}
      <View style={styles.grid}>
        {/* Talk with Asha Voice Companion */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E8F5E9', borderColor: '#81C784' }]}
          onPress={() => onNavigate('companion')}
        >
          <Text style={styles.cardEmoji}>💬</Text>
          <Text style={[styles.cardTitle, { color: '#1B5E20' }]}>
            {language === 'ta' ? 'ஆஷாவுடன் பேசுங்கள்' : 'Talk with Asha'}
          </Text>
          <Text style={styles.cardDesc}>
            {language === 'ta' ? 'அமைதியான குரல் உரையாடல்' : 'Patient voice conversation'}
          </Text>
        </TouchableOpacity>

        {/* 20 Nostalgia Games */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#EDE7F6', borderColor: '#B39DDB' }]}
          onPress={onOpenGames}
        >
          <Text style={styles.cardEmoji}>🧩</Text>
          <Text style={[styles.cardTitle, { color: '#4A148C' }]}>
            {language === 'ta' ? 'பாரம்பரிய விளையாட்டுகள்' : '20 Nostalgia Games'}
          </Text>
          <Text style={styles.cardDesc}>
            {language === 'ta' ? 'நொண்டி, கோலி, தாயம், சினிமா...' : 'Hopscotch, Marbles, Thaayam, Cinema...'}
          </Text>
        </TouchableOpacity>

        {/* Health & Alarms */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#FFF3E0', borderColor: '#FFB74D' }]}
          onPress={() => onNavigate('health')}
        >
          <Text style={styles.cardEmoji}>💊</Text>
          <Text style={[styles.cardTitle, { color: '#E65100' }]}>
            {language === 'ta' ? 'மருந்து & அலாரங்கள்' : 'Health & Alarms'}
          </Text>
          <Text style={styles.cardDesc}>
            {language === 'ta' ? 'மருந்து நினைவூட்டல் அட்டவணை' : 'Daily medication schedule'}
          </Text>
        </TouchableOpacity>

        {/* 1-Tap Family Circle */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E1F5FE', borderColor: '#81D4FA' }]}
          onPress={() => {
            Alert.alert(
              language === 'ta' ? 'குடும்ப அழைப்பு' : 'Family 1-Tap Call',
              language === 'ta' ? 'மகன் ராகுலை அழைக்கவா? (+91 98765 43210)' : 'Call Rahul (Son)? (+91 98765 43210)',
              [
                { text: language === 'ta' ? 'ரத்து' : 'Cancel', style: 'cancel' },
                { text: language === 'ta' ? '📞 அழை' : '📞 Call Now', onPress: () => Linking.openURL('tel:+919876543210').catch(() => {}) }
              ]
            );
          }}
        >
          <Text style={styles.cardEmoji}>👨‍👩‍👦</Text>
          <Text style={[styles.cardTitle, { color: '#01579B' }]}>
            {language === 'ta' ? 'குடும்ப வட்டம்' : 'Family Circle'}
          </Text>
          <Text style={styles.cardDesc}>
            {language === 'ta' ? 'ஒரே தொடுதலில் நேரடி அழைப்பு' : 'Call loved ones in 1 tap'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Help Button */}
      <TouchableOpacity
        style={[styles.emergencyBtn, { backgroundColor: colors.accent }]}
        onPress={onEmergency}
      >
        <Text style={styles.emergencyText}>
          🚨 {language === 'ta' ? 'அவசர உதவி (SOS) - குடும்பத்தினரை அழைக்க' : 'Emergency SOS - Call Family'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 50 },
  greetingCard: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 4, elevation: 2 },
  greetingTitle: { fontSize: 19, fontWeight: '800' },
  greetingSub: { fontSize: 14, lineHeight: 20 },
  sparkCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 8 },
  sparkTitle: { fontSize: 16, fontWeight: '800' },
  sparkDesc: { fontSize: 14, lineHeight: 20 },
  sparkBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sparkBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 6, minHeight: 140, justifyContent: 'center' },
  cardEmoji: { fontSize: 36 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardDesc: { fontSize: 12, color: '#4B5563', lineHeight: 16 },
  emergencyBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  emergencyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});
