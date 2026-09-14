// ============================================================================
// Granny Mobile — Settings & Preferences Screen
// Language Switcher, High-Contrast Calibration, Caregiver Link Code, & AI Key Status
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { audioService } from '../../services/audioService';
import { groqService, type GroqKeySlot } from '../../services/groqService';
import { databaseService } from '../../services/supabaseService';

interface Props {
  user?: { id: string; name: string; role: 'ELDER' | 'CAREGIVER'; language: string };
  language: 'ta' | 'en';
  onToggleLanguage: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onLogout: () => void;
  onBack?: () => void;
}

export default function SettingsScreen({
  user,
  language,
  onToggleLanguage,
  highContrast,
  onToggleHighContrast,
  onLogout,
  onBack,
}: Props) {
  const isTamil = language === 'ta';
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const [linkCode, setLinkCode] = useState<string>('------');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [groqSlots, setGroqSlots] = useState<GroqKeySlot[]>([]);
  const [testingKeyIndex, setTestingKeyIndex] = useState<number | null>(null);

  useEffect(() => {
    loadLinkCode();
    loadGroqSlots();
  }, [user?.id]);

  const loadLinkCode = async () => {
    if (!user?.id) return;
    try {
      const code = await databaseService.getElderLinkCode(user.id);
      setLinkCode(code || '------');
    } catch {
      setLinkCode('------');
    }
  };

  const loadGroqSlots = () => {
    try {
      const slots = groqService.getKeySlots();
      setGroqSlots(slots);
    } catch {}
  };

  const handleGenerateNewCode = async () => {
    if (!user?.id) return;
    setIsGeneratingCode(true);
    audioService.playTapSound();
    try {
      const newCode = await databaseService.generateElderLinkCode(user.id);
      setLinkCode(newCode);
      audioService.playSuccessSound();
      Alert.alert(
        isTamil ? 'புதிய இணைப்பு எண் உருவாக்கப்பட்டது!' : 'New Link Code Generated!',
        isTamil
          ? `உங்கள் 6-இலக்க எண்: ${newCode}\n\nஇந்த எண்ணைப் பயன்படுத்தி உங்கள் குடும்பத்தினர் தங்கள் மொபைலில் இணைக்கலாம்.`
          : `Your 6-digit code is: ${newCode}\n\nShare this code with your family members to link their dashboard.`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not generate code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleTestGroqKey = async (slot: GroqKeySlot) => {
    if (!slot.key) {
      Alert.alert(
        isTamil ? 'சாவி இல்லை' : 'No Key Configured',
        isTamil ? 'இந்த ஸ்லாட்டில் API Key எதுவும் இல்லை.' : 'No API Key configured in this slot.'
      );
      return;
    }

    setTestingKeyIndex(slot.index);
    audioService.playTapSound();
    try {
      const res = await groqService.testKey(slot.key);
      if (res.success) {
        audioService.playSuccessSound();
        Alert.alert(
          isTamil ? '✅ வெற்றிகரமான இணைப்பு!' : '✅ Connected Successfully!',
          `${res.message} (${res.latencyMs}ms)`
        );
      } else {
        Alert.alert(
          isTamil ? '❌ இணைப்பு தோல்வி' : '❌ Connection Failed',
          res.message
        );
      }
    } catch (e: any) {
      Alert.alert('Test Error', e?.message || 'Network test failed');
    } finally {
      setTestingKeyIndex(null);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            ⚙️ {isTamil ? 'அமைப்புகள் & விருப்பங்கள்' : 'Settings & Preferences'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isTamil ? 'மொழி, பார்வைத்திறன் மற்றும் குடும்ப இணைப்பு' : 'Language, accessibility and family sync'}
          </Text>
        </View>
      </View>

      {/* User Profile Card */}
      {user && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
            👤 {isTamil ? 'பயனர் கணக்கு' : 'Active Account'}
          </Text>
          <View style={styles.profileRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isTamil ? 'பெயர்:' : 'Name:'}</Text>
            <Text style={[styles.val, { color: colors.textPrimary }]}>{user.name}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{isTamil ? 'வகை:' : 'Role:'}</Text>
            <Text style={[styles.val, { color: colors.primary }]}>{user.role}</Text>
          </View>
        </View>
      )}

      {/* Language & Accessibility */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
          🌐 {isTamil ? 'மொழி & திரை அமைப்பு' : 'Language & Accessibility'}
        </Text>

        {/* Language Row */}
        <TouchableOpacity style={styles.settingRow} onPress={onToggleLanguage}>
          <View>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              {isTamil ? 'பயன்பாட்டு மொழி' : 'App Language'}
            </Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              {isTamil ? 'தற்போது: தமிழ் (Tamil)' : 'Current: English'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.primaryDark }]}>
              {isTamil ? 'Switch to English' : 'தமிழுக்கு மாறுக'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* High Contrast Mode Row */}
        <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
              👁️ {isTamil ? 'அதிக மாறுபட்ட திரை வண்ணம்' : 'High Contrast Mode'}
            </Text>
            <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
              {isTamil ? 'எழுத்துகளை எளிதாகப் படிக்க உதவும் கருப்பு-மஞ்சள் திரை' : 'WCAG AAA high readability mode'}
            </Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={onToggleHighContrast}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
          />
        </View>
      </View>

      {/* Caregiver Link Code */}
      {user?.role === 'ELDER' && (
        <View style={[styles.card, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={[styles.cardHeader, { color: '#166534' }]}>
            🔗 {isTamil ? 'குடும்ப பராமரிப்பாளர் இணைப்பு எண்' : 'Caregiver Sync Code'}
          </Text>
          <Text style={[styles.settingSub, { color: '#15803D', marginBottom: 12 }]}>
            {isTamil
              ? 'இந்த 6-இலக்க எண்ணை உங்கள் மகன், மகள் அல்லது மருத்துவரிடம் பகிர்ந்து கொள்ளவும்.'
              : 'Share this 6-digit code with your caregiver or family to link their dashboard.'}
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{linkCode}</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={handleGenerateNewCode}
            disabled={isGeneratingCode}
          >
            {isGeneratingCode ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionBtnText}>
                🔄 {isTamil ? 'புதிய எண் உருவாக்கு' : 'Generate New Link Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Groq Cloud Pool Status */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>
          ⚡ {isTamil ? 'கிரோக் ஏஐ செயற்கை நுண்ணறிவு நிலை' : 'Groq AI Cloud Key Pool'}
        </Text>
        <Text style={[styles.settingSub, { color: colors.textSecondary, marginBottom: 10 }]}>
          {isTamil
            ? '4 ஸ்லாட்டுகள் சுழற்சி முறையில் இயக்கப்படுகின்றன'
            : '4-Key rotation with automatic rate-limit failover'}
        </Text>

        {groqSlots.map(slot => (
          <View key={slot.index} style={[styles.keySlotRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.keySlotName, { color: colors.textPrimary }]}>{slot.name}</Text>
              <Text style={[styles.keySlotStatus, { color: slot.key ? '#16A34A' : '#DC2626' }]}>
                {slot.key ? `● Configured (...${slot.key.slice(-6)})` : '○ Unconfigured'}
              </Text>
            </View>
            {slot.key ? (
              <TouchableOpacity
                style={styles.testBtn}
                onPress={() => handleTestGroqKey(slot)}
                disabled={testingKeyIndex === slot.index}
              >
                {testingKeyIndex === slot.index ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text style={styles.testBtnText}>Test</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
        onPress={() => {
          Alert.alert(
            isTamil ? 'கணக்கிலிருந்து வெளியேறு' : 'Log Out',
            isTamil ? 'நிச்சயமாக வெளியேற விரும்புகிறீர்களா?' : 'Are you sure you want to log out?',
            [
              { text: isTamil ? 'ரத்து' : 'Cancel', style: 'cancel' },
              { text: isTamil ? 'வெளியேறு' : 'Log Out', style: 'destructive', onPress: onLogout },
            ]
          );
        }}
      >
        <Text style={styles.logoutBtnText}>
          🚪 {isTamil ? 'கணக்கிலிருந்து வெளியேறு (Log Out)' : 'Log Out & Switch User'}
        </Text>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#86EFAC',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#166534',
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  keySlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  keySlotName: {
    fontSize: 14,
    fontWeight: '600',
  },
  keySlotStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  testBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
