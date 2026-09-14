// ============================================================================
// Mobile Elder Home Screen — Warm, Dignified, Large Touch Targets
// Features: 2-Minute Brain Spark, 4 Primary Pillars, 1-Tap Family Dial with
// Ringtone synthesis, and Instant SOS Siren
// ============================================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, Image } from 'react-native';
import { THEME } from '../../constants/theme';
import { audioService } from '../../services/audioService';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenGames: () => void;
  onEmergency: () => void;
  language?: string;
  highContrast?: boolean;
  userName?: string;
}

export default function HomeScreen({ onNavigate, onOpenGames, onEmergency, language = 'ta', highContrast, userName }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const isTamil = language === 'ta';
  const displayName = userName || (isTamil ? 'தாத்தா / பாட்டி' : 'Dear Grandparent');
  const [sparkDone, setSparkDone] = useState(false);

  const handleCallFamily = () => {
    audioService.playIncomingCallRingtone();
    Alert.alert(
      isTamil ? 'குடும்ப நேரடி அழைப்பு' : 'Family 1-Tap Call',
      isTamil
        ? 'மகன் ராகுலை (+91 98765 43210) உடனடியாக அழைக்கவா?'
        : 'Connect direct phone call to Rahul (Son - +91 98765 43210)?',
      [
        { text: isTamil ? 'ரத்து' : 'Cancel', style: 'cancel' },
        {
          text: isTamil ? '📞 இப்போது அழை' : '📞 Call Now',
          onPress: () => Linking.openURL('tel:+919876543210').catch(() => {}),
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Greeting Banner */}
      <View style={[styles.greetingCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 6 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Image source={require('../../../assets/logo.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              {isTamil ? `வணக்கம், ${displayName}!` : `Welcome, ${displayName}!`}
            </Text>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              {isTamil
                ? 'இன்று உங்கள் நாள் நலமாக அமையட்டும் 🌸'
                : 'Wishing you a peaceful, joyful day 🌸'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2-Minute Brain Spark Banner */}
      <View style={[styles.sparkCard, { backgroundColor: '#EFFBF2', borderColor: '#B7E4C7' }]}>
        <Text style={[styles.sparkTitle, { color: '#1B4332' }]}>
          ✨ {isTamil ? '2 நிமிட மூளைப் புத்துணர்ச்சி பயிற்சி' : '2-Minute Brain Spark'}
        </Text>
        <Text style={[styles.sparkDesc, { color: '#2D6A4F' }]}>
          {isTamil
            ? 'உங்கள் அறையில் பச்சை அல்லது மஞ்சள் நிறத்தில் உள்ள 3 பொருட்களை உரக்க கூறுங்கள்!'
            : 'Quick observation: Name 3 items in your room right now that are green or yellow!'}
        </Text>
        <TouchableOpacity
          style={[styles.sparkBtn, { backgroundColor: sparkDone ? '#2D6A4F' : colors.primary }]}
          onPress={() => {
            audioService.playSuccessSound();
            setSparkDone(s => !s);
          }}
        >
          <Text style={styles.sparkBtnText}>
            {sparkDone
              ? (isTamil ? '✓ சிறப்பு! முடிந்தது' : '✓ Completed!')
              : (isTamil ? 'பயிற்சி செய் (1 நிமிடம்)' : 'Try Spark (1 min)')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Large Action Grid (WCAG AAA Targets) */}
      <View style={styles.grid}>
        {/* Talk with Asha Voice Companion */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E8F5E9', borderColor: '#81C784' }]}
          onPress={() => {
            audioService.playTapSound();
            onNavigate('companion');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>💬</Text>
          <Text style={[styles.cardTitle, { color: '#1B5E20' }]}>
            {isTamil ? 'ஆஷாவுடன் பேசுங்கள்' : 'Talk with Asha'}
          </Text>
          <Text style={styles.cardDesc}>
            {isTamil ? 'அமைதியான குரல் உரையாடல் & கதைகள்' : 'Patient voice conversation & memories'}
          </Text>
        </TouchableOpacity>

        {/* 20 Nostalgia Games */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#EDE7F6', borderColor: '#B39DDB' }]}
          onPress={() => {
            audioService.playTapSound();
            onOpenGames();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>🧩</Text>
          <Text style={[styles.cardTitle, { color: '#4A148C' }]}>
            {isTamil ? '20 விளையாட்டுகள்' : '20 Nostalgia Games'}
          </Text>
          <Text style={styles.cardDesc}>
            {isTamil ? 'நொண்டி, கோலி, தாயம், சினிமா...' : 'Hopscotch, Marbles, Thaayam, Cinema...'}
          </Text>
        </TouchableOpacity>

        {/* Nostalgia Vault / Family Memories */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#FDF2E9', borderColor: '#F5CBA7' }]}
          onPress={() => {
            audioService.playTapSound();
            onNavigate('memory');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>📸</Text>
          <Text style={[styles.cardTitle, { color: '#B9770E' }]}>
            {isTamil ? 'குடும்ப நினைவுகள்' : 'Family Vault'}
          </Text>
          <Text style={styles.cardDesc}>
            {isTamil ? 'புகைப்படங்கள் & இனிய கதைகள்' : 'Precious photos & stories'}
          </Text>
        </TouchableOpacity>

        {/* 1-Tap Family Circle Phone Call */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#E1F5FE', borderColor: '#81D4FA' }]}
          onPress={handleCallFamily}
          activeOpacity={0.8}
        >
          <Text style={styles.cardEmoji}>👨‍👩‍👦</Text>
          <Text style={[styles.cardTitle, { color: '#01579B' }]}>
            {isTamil ? 'குடும்ப அழைப்பு' : 'Family 1-Tap Call'}
          </Text>
          <Text style={styles.cardDesc}>
            {isTamil ? 'ஒரே தொடுதலில் ராகுல் (மகன்) அழைப்பு' : 'Direct 1-tap call to Rahul'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Help Button */}
      <TouchableOpacity
        style={[styles.emergencyBtn, { backgroundColor: '#DC2626' }]}
        onPress={onEmergency}
        activeOpacity={0.85}
      >
        <Text style={styles.emergencyText}>
          🚨 {isTamil ? 'அவசர உதவி (SOS) - குடும்பத்தினரை அழைக்க' : 'Emergency SOS - Broadcast Alert'}
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
