import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/userStore';
import { useGameStore } from '../../src/store/gameStore';
import { useMemoryStore } from '../../src/store/memoryStore';
import { useReminderStore } from '../../src/store/reminderStore';
import { useCompanionStore } from '../../src/store/companionStore';
import { audioService } from '../../src/services/audioService';

export default function CaregiverScreen() {
  const router = useRouter();
  const { elderProfile, currentUser, updateCognitiveLevel, setRole } = useUserStore();
  const { allSessions } = useGameStore();
  const { memories, addMemory } = useMemoryStore();
  const { reminders, addReminder } = useReminderStore();
  const { distressAlertActive, dismissDistressAlert } = useCompanionStore();

  // Custom photo upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newTag, setNewTag] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // New reminder form state
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('02:00 PM');
  const [remDesc, setRemDesc] = useState('');

  const handleAddCustomPhoto = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    audioService.playSuccessSound();
    addMemory({
      user_id: currentUser.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      image_url:
        newImageUrl.trim() ||
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
      tags: [newTag.trim() || 'family', 'custom_upload'],
      type: 'PHOTO',
      is_favorite: true,
    });

    setNewTitle('');
    setNewContent('');
    setNewImageUrl('');
    setNewTag('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleCreateReminder = () => {
    if (!remTitle.trim()) return;
    audioService.playSuccessSound();
    addReminder({
      user_id: currentUser.id,
      title: remTitle.trim(),
      description: remDesc.trim() || 'Scheduled by family caregiver',
      time_of_day: remTime,
      type: 'MEDICATION',
      is_active: true,
    });
    setRemTitle('');
    setRemDesc('');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Top Banner & Switch Back */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Caregiver & Clinical Dashboard</Text>
          <Text style={styles.headerSub}>
            Patient: {currentUser.name} • Family Group ID: #{currentUser.family_group_id}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => {
            audioService.playTapSound();
            setRole('ELDER');
            router.push('/');
          }}
        >
          <Text style={styles.switchBtnText}>👵 Back to Elder View</Text>
        </TouchableOpacity>
      </View>

      {/* Safety & Distress Notification Center */}
      <View
        style={[
          styles.safetyBanner,
          distressAlertActive ? styles.safetyAlert : styles.safetyNormal,
        ]}
      >
        <Text style={styles.safetyIcon}>{distressAlertActive ? '🚨' : '🛡️'}</Text>
        <View style={styles.safetyTextWrap}>
          <Text style={styles.safetyTitle}>
            {distressAlertActive
              ? 'Safety Alert: Distress Phrase Triggered'
              : 'Safety Status: Normal & Monitored'}
          </Text>
          <Text style={styles.safetySub}>
            {distressAlertActive
              ? 'Elder spoke an anxiety/disorientation phrase. AI provided immediate de-escalation.'
              : 'No acute agitation or distress detected in recent voice interactions.'}
          </Text>
        </View>
        {distressAlertActive && (
          <TouchableOpacity style={styles.resolveBtn} onPress={dismissDistressAlert}>
            <Text style={styles.resolveBtnText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cognitive Vitality Metrics */}
      <View style={styles.metricsCard}>
        <Text style={styles.cardSectionTitle}>🧠 Cognitive Health Telemetry</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>Level {elderProfile.cognitive_level}/5</Text>
            <Text style={styles.metricLabel}>Cognitive Baseline</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{elderProfile.daily_streak} Days</Text>
            <Text style={styles.metricLabel}>Daily Engagement Streak</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{allSessions.length} Sessions</Text>
            <Text style={styles.metricLabel}>Total Games Played</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>92%</Text>
            <Text style={styles.metricLabel}>Rolling Recall Accuracy</Text>
          </View>
        </View>

        {/* Manual Cognitive Level Calibration */}
        <View style={styles.calibrationRow}>
          <Text style={styles.calibText}>Adjust Adaptive Target Level:</Text>
          <View style={styles.levelButtons}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.lvlBtn,
                  elderProfile.cognitive_level === lvl && styles.lvlBtnActive,
                ]}
                onPress={() => {
                  audioService.playTapSound();
                  updateCognitiveLevel(lvl);
                }}
              >
                <Text
                  style={[
                    styles.lvlBtnText,
                    elderProfile.cognitive_level === lvl && styles.lvlBtnTextActive,
                  ]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Upload Custom Family Photos to Personalize Games */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>📷 Upload Family Photos for Personalization</Text>
        <Text style={styles.cardSectionSub}>
          Uploaded photos seamlessly personalize Memory Album, Remember My Home, and AI conversation stories.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Memory Title (e.g., Summer Trip to Lake Tahoe)"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Narrative Description (warm details Grandma loves remembering)"
          multiline
          numberOfLines={3}
          value={newContent}
          onChangeText={setNewContent}
        />
        <TextInput
          style={styles.input}
          placeholder="Image URL (or leave blank for high-res family stock photo)"
          value={newImageUrl}
          onChangeText={setNewImageUrl}
        />
        <TextInput
          style={styles.input}
          placeholder="Tag (e.g., Leo, Vacation, Cooking, Wedding)"
          value={newTag}
          onChangeText={setNewTag}
        />

        {uploadSuccess && (
          <View style={styles.successPill}>
            <Text style={styles.successText}>✓ Memory successfully added to Elder's album!</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={handleAddCustomPhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionText}>+ Upload & Personalize Games</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Medication / Care Reminders */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardSectionTitle}>⏰ Schedule Care & Medication Reminder</Text>
        <TextInput
          style={styles.input}
          placeholder="Reminder Title (e.g., Blood Pressure Medication)"
          value={remTitle}
          onChangeText={setRemTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Time of Day (e.g., 08:30 AM, 02:00 PM)"
          value={remTime}
          onChangeText={setRemTime}
        />
        <TextInput
          style={styles.input}
          placeholder="Dosage or Instruction Notes"
          value={remDesc}
          onChangeText={setRemDesc}
        />
        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: '#1B4F72' }]}
          onPress={handleCreateReminder}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionText}>+ Set Elder Reminder</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C1810',
  },
  headerSub: {
    fontSize: 13,
    color: '#706050',
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D4C6B2',
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
  },
  safetyBanner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
  },
  safetyNormal: {
    backgroundColor: '#EAF8EE',
    borderColor: '#98DBA8',
  },
  safetyAlert: {
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
  },
  safetyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  safetyTextWrap: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  safetySub: {
    fontSize: 12,
    color: '#55473A',
    marginTop: 2,
  },
  resolveBtn: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 18,
    shadowColor: '#2C1810',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  cardSectionSub: {
    fontSize: 13,
    color: '#706050',
    marginBottom: 14,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F9F5EF',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  metricLabel: {
    fontSize: 11,
    color: '#7A6B5C',
    textAlign: 'center',
    marginTop: 2,
  },
  calibrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFE6D8',
    paddingTop: 12,
  },
  calibText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3B2C',
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  lvlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0ECE4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lvlBtnActive: {
    backgroundColor: '#2C1810',
  },
  lvlBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#55473A',
  },
  lvlBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 18,
    gap: 10,
  },
  input: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderColor: '#DECABA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2C1810',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  primaryActionBtn: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  successPill: {
    backgroundColor: '#EAF8EE',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#98DBA8',
  },
  successText: {
    color: '#1E652E',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
