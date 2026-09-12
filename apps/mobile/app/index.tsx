import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../src/store/userStore';
import { useCompanionStore } from '../src/store/companionStore';
import { useReminderStore } from '../src/store/reminderStore';
import { audioService } from '../src/services/audioService';

export default function HomeScreen() {
  const router = useRouter();
  const { currentUser, elderProfile, activeRole, setRole } = useUserStore();
  const { distressAlertActive } = useCompanionStore();
  const { reminders } = useReminderStore();

  const nextReminder = reminders.find((r) => r.is_active && !r.last_confirmed_at);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top Bar: Role Switcher & Family Greeting */}
      <View style={styles.topBar}>
        <View style={styles.userHeader}>
          <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />
          <View>
            <Text style={styles.greetingSub}>Welcome Home,</Text>
            <Text style={styles.userName}>{currentUser.name}</Text>
          </View>
        </View>

        {/* Role Toggle for Evaluation & Demos */}
        <TouchableOpacity
          style={styles.roleToggle}
          onPress={() => {
            audioService.playTapSound();
            const nextRole = activeRole === 'ELDER' ? 'CAREGIVER' : 'ELDER';
            setRole(nextRole);
            if (nextRole === 'CAREGIVER') {
              router.push('/caregiver');
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.roleToggleText}>
            {activeRole === 'ELDER' ? '👵 Elder View' : '🩺 Caregiver View'}
          </Text>
          <Text style={styles.roleToggleHint}>(Switch)</Text>
        </TouchableOpacity>
      </View>

      {/* Distress Guardrail Alert Banner if triggered */}
      {distressAlertActive && (
        <View style={styles.distressAlertCard}>
          <Text style={styles.distressIcon}>🛡️</Text>
          <View style={styles.distressTextWrap}>
            <Text style={styles.distressTitle}>Safety Check Active</Text>
            <Text style={styles.distressSub}>
              Everything is calm and safe. Caregiver has been notified of your well-being.
            </Text>
          </View>
        </View>
      )}

      {/* Daily Streak & Well-Being Card */}
      <View style={styles.streakBanner}>
        <View style={styles.streakLeft}>
          <Text style={styles.streakFire}>🔥</Text>
          <View>
            <Text style={styles.streakTitle}>{elderProfile.daily_streak} Days Mind Streak!</Text>
            <Text style={styles.streakSub}>Cognitive Level: {elderProfile.cognitive_level} / 5</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.streakPill}
          onPress={() => {
            audioService.playSuccessSound();
            audioService.speak("You are doing wonderful today! Your mind is active, sharp, and vibrant.");
          }}
        >
          <Text style={styles.streakPillText}>Daily Praise ✨</Text>
        </TouchableOpacity>
      </View>

      {/* Active Reminder Pill */}
      {nextReminder && (
        <TouchableOpacity
          style={styles.reminderCard}
          onPress={() => {
            audioService.playTapSound();
            router.push('/reminders');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.reminderBell}>⏰</Text>
          <View style={styles.reminderInfo}>
            <Text style={styles.reminderTitle}>{nextReminder.title}</Text>
            <Text style={styles.reminderDesc}>{nextReminder.time_of_day} • {nextReminder.description}</Text>
          </View>
          <View style={styles.reminderAction}>
            <Text style={styles.reminderActionText}>View</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Main Core Action Hub */}
      <Text style={styles.sectionHeading}>What would you love to do today?</Text>

      <View style={styles.hubGrid}>
        {/* 1. Play Visual Games */}
        <TouchableOpacity
          style={[styles.hubCard, styles.hubCardGames]}
          onPress={() => {
            audioService.playTapSound();
            router.push('/games');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.hubIconBg}>
            <Text style={styles.hubIcon}>🧩</Text>
          </View>
          <Text style={styles.hubTitle}>Cognitive Games</Text>
          <Text style={styles.hubSubtitle}>10 Visual Photo & Music Challenges</Text>
          <View style={styles.hubBadge}>
            <Text style={styles.hubBadgeText}>10 Real Image Games ➔</Text>
          </View>
        </TouchableOpacity>

        {/* 2. AI Voice Companion */}
        <TouchableOpacity
          style={[styles.hubCard, styles.hubCardCompanion]}
          onPress={() => {
            audioService.playTapSound();
            router.push('/companion');
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.hubIconBg, { backgroundColor: '#FDEED9' }]}>
            <Text style={styles.hubIcon}>🎙️</Text>
          </View>
          <Text style={styles.hubTitle}>Voice Companion</Text>
          <Text style={styles.hubSubtitle}>Warm, loving AI conversation & memory recall</Text>
          <View style={[styles.hubBadge, { backgroundColor: '#D35400' }]}>
            <Text style={styles.hubBadgeText}>Talk with AI ➔</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Cherished Memories */}
        <TouchableOpacity
          style={[styles.hubCard, styles.hubCardMemories]}
          onPress={() => {
            audioService.playTapSound();
            router.push('/memories');
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.hubIconBg, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.hubIcon}>🖼️</Text>
          </View>
          <Text style={styles.hubTitle}>Cherished Memories</Text>
          <Text style={styles.hubSubtitle}>Family photo album & nostalgic stories</Text>
          <View style={[styles.hubBadge, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.hubBadgeText}>View Album ➔</Text>
          </View>
        </TouchableOpacity>

        {/* 4. Reminders & Routines */}
        <TouchableOpacity
          style={[styles.hubCard, styles.hubCardReminders]}
          onPress={() => {
            audioService.playTapSound();
            router.push('/reminders');
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.hubIconBg, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.hubIcon}>💊</Text>
          </View>
          <Text style={styles.hubTitle}>Daily Care & Routine</Text>
          <Text style={styles.hubSubtitle}>Medication times, water & family calls</Text>
          <View style={[styles.hubBadge, { backgroundColor: '#1565C0' }]}>
            <Text style={styles.hubBadgeText}>Reminders ➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Caregiver Portal Link */}
      <TouchableOpacity
        style={styles.caregiverPortalBtn}
        onPress={() => {
          audioService.playTapSound();
          router.push('/caregiver');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.caregiverPortalIcon}>📊</Text>
        <View style={styles.caregiverPortalTextWrap}>
          <Text style={styles.caregiverPortalTitle}>Caregiver & Family Portal</Text>
          <Text style={styles.caregiverPortalSub}>
            Cognitive health telemetry, custom photo upload, and safety alerts
          </Text>
        </View>
        <Text style={styles.caregiverPortalArrow}>➔</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#D4C3AC',
    marginRight: 12,
  },
  greetingSub: {
    fontSize: 14,
    color: '#7D6F5E',
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C1810',
  },
  roleToggle: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D8CAB7',
    alignItems: 'center',
  },
  roleToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  roleToggleHint: {
    fontSize: 10,
    color: '#8A7A6A',
  },
  distressAlertCard: {
    backgroundColor: '#FFF2F2',
    borderWidth: 2,
    borderColor: '#E74C3C',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  distressIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  distressTextWrap: {
    flex: 1,
  },
  distressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C0392B',
  },
  distressSub: {
    fontSize: 13,
    color: '#7F1D1D',
  },
  streakBanner: {
    backgroundColor: '#FFF8EE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EBD8C1',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFire: {
    fontSize: 32,
    marginRight: 12,
  },
  streakTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#8A4B13',
  },
  streakSub: {
    fontSize: 13,
    color: '#6B5A4B',
    fontWeight: '600',
  },
  streakPill: {
    backgroundColor: '#8A4B13',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  streakPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reminderCard: {
    backgroundColor: '#EFF8FF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BEDBF9',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reminderBell: {
    fontSize: 26,
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#154360',
  },
  reminderDesc: {
    fontSize: 12,
    color: '#34495E',
  },
  reminderAction: {
    backgroundColor: '#1B4F72',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reminderActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 14,
  },
  hubGrid: {
    gap: 14,
    marginBottom: 24,
  },
  hubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    padding: 18,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hubCardGames: {
    borderColor: '#E2D3BE',
  },
  hubCardCompanion: {
    borderColor: '#EAD1B8',
  },
  hubCardMemories: {
    borderColor: '#CFE6D3',
  },
  hubCardReminders: {
    borderColor: '#CFE2F3',
  },
  hubIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F3E9DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  hubIcon: {
    fontSize: 26,
  },
  hubTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  hubSubtitle: {
    fontSize: 14,
    color: '#655648',
    lineHeight: 20,
    marginBottom: 12,
  },
  hubBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C1810',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hubBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  caregiverPortalBtn: {
    backgroundColor: '#F3EDE2',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DBCAB6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  caregiverPortalIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  caregiverPortalTextWrap: {
    flex: 1,
  },
  caregiverPortalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
  },
  caregiverPortalSub: {
    fontSize: 12,
    color: '#655648',
  },
  caregiverPortalArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1810',
    marginLeft: 8,
  },
});
