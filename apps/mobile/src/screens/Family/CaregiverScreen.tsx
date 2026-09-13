// ============================================================================
// Mobile Caretaker Portal Screen (Dedicated Caregiver Tools)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { THEME } from '../../constants/theme';

interface Props {
  language?: string;
  highContrast?: boolean;
}

interface MedicalReportItem {
  id: string;
  title: string;
  doctor: string;
  date: string;
  summary: string;
}

interface AlarmItem {
  id: string;
  title: string;
  time: string;
  type: string;
}

interface ContactItem {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isEmergency: boolean;
}

export default function CaregiverScreen({ language = 'en', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'alarms' | 'contacts' | 'link'>('overview');
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [linkedElderName, setLinkedElderName] = useState('Lakshmi Amma & Ramanathan Thatha');

  // Medical Reports State
  const [reports, setReports] = useState<MedicalReportItem[]>([
    {
      id: 'rep_1',
      title: 'Monthly BP & Cardiac Checkup',
      doctor: 'Dr. S. Ranganathan, Apollo Clinic',
      date: '2026-09-10',
      summary: 'BP 125/82 mmHg stable. Continue Amlodipine 5mg morning post breakfast.',
    },
    {
      id: 'rep_2',
      title: 'Fasting Blood Sugar & HbA1c',
      doctor: 'Dr. V. Meenakshi, Diabetologist',
      date: '2026-08-28',
      summary: 'HbA1c 6.8%. Excellent control. Maintain 20 mins verandah walking.',
    },
  ]);
  const [reportTitle, setReportTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [showAddReport, setShowAddReport] = useState(false);

  // Alarms State
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    { id: 'al_1', title: 'Morning Blood Pressure Medicine', time: '08:00 AM', type: 'MEDICATION' },
    { id: 'al_2', title: 'Mid-Morning Hydration & Tender Coconut', time: '11:00 AM', type: 'WATER' },
    { id: 'al_3', title: 'Evening Walk & Jasmine Garland', time: '05:30 PM', type: 'ACTIVITY' },
  ]);
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('08:00 AM');
  const [showAddAlarm, setShowAddAlarm] = useState(false);

  // Family Contacts State
  const [contacts, setContacts] = useState<ContactItem[]>([
    { id: 'c_1', name: 'Rahul (Son)', relation: 'Son', phone: '+91 98765 43210', isEmergency: true },
    { id: 'c_2', name: 'Priya (Daughter)', relation: 'Daughter', phone: '+91 98450 11223', isEmergency: true },
    { id: 'c_3', name: 'Arjun (Grandson)', relation: 'Grandson', phone: '+91 97890 33445', isEmergency: false },
  ]);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);

  const handleLinkElder = () => {
    if (!linkCodeInput.trim()) {
      Alert.alert('Error', language === 'ta' ? 'இணைப்பு குறியீட்டை உள்ளிடவும்' : 'Please enter 6-digit link code');
      return;
    }
    Alert.alert(
      language === 'ta' ? 'வெற்றி' : 'Success',
      language === 'ta'
        ? `முதியோர் கணக்கு (${linkCodeInput}) வெற்றிகரமாக இணைக்கப்பட்டது!`
        : `Successfully linked to Elder Account (${linkCodeInput})!`
    );
    setLinkedElderName('Lakshmi Amma & Ramanathan Thatha');
  };

  const handleAddReport = () => {
    if (!reportTitle.trim()) return;
    const newRep: MedicalReportItem = {
      id: `rep_${Date.now()}`,
      title: reportTitle,
      doctor: doctorName || 'Consultant Physician',
      date: new Date().toISOString().split('T')[0],
      summary: reportSummary || 'Prescription updated and synced with elder screen.',
    };
    setReports([newRep, ...reports]);
    setReportTitle('');
    setDoctorName('');
    setReportSummary('');
    setShowAddReport(false);
    Alert.alert('Success', 'Medical report saved and synced!');
  };

  const handleAddAlarm = () => {
    if (!alarmTitle.trim()) return;
    const newAl: AlarmItem = {
      id: `al_${Date.now()}`,
      title: alarmTitle,
      time: alarmTime,
      type: 'MEDICATION',
    };
    setAlarms([...alarms, newAl]);
    setAlarmTitle('');
    setShowAddAlarm(false);
    Alert.alert('Success', 'Alarm scheduled on Elder screen!');
  };

  const handleAddContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    const newCt: ContactItem = {
      id: `c_${Date.now()}`,
      name: contactName,
      relation: contactRelation || 'Family',
      phone: contactPhone,
      isEmergency: false,
    };
    setContacts([...contacts, newCt]);
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setShowAddContact(false);
    Alert.alert('Success', 'Family contact added to Elder 1-Tap calling screen!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Caretaker Sub-Navigation Bar */}
      <View style={[styles.subNavBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subNavScroll}>
          {[
            { id: 'overview' as const, label: language === 'ta' ? '📊 கண்காணிப்பு' : '📊 Monitor' },
            { id: 'alarms' as const, label: language === 'ta' ? '⏰ அலாரங்கள்' : '⏰ Alarms' },
            { id: 'reports' as const, label: language === 'ta' ? '🩺 அறிக்கைகள்' : '🩺 Medical' },
            { id: 'contacts' as const, label: language === 'ta' ? '👨‍👩‍👦 குடும்ப எண்கள்' : '👨‍👩‍👦 Contacts' },
            { id: 'link' as const, label: language === 'ta' ? '🔗 இணைப்பு' : '🔗 Link Elder' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navPill,
                {
                  backgroundColor: activeTab === tab.id ? colors.primary : colors.bg,
                  borderColor: activeTab === tab.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.navPillText, { color: activeTab === tab.id ? '#FFFFFF' : colors.textPrimary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Linked Elder Card Banner */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 6 }]}>
          <Text style={[styles.elderName, { color: colors.primaryDark }]}>🌿 {linkedElderName}</Text>
          <Text style={[styles.elderStatus, { color: colors.textSecondary }]}>
            {language === 'ta'
              ? 'நேரலை இணைப்பு இயக்கத்தில் உள்ளது • ஆஷா குரல் AI துணையுடன்'
              : 'Live Telemetry Active • Assisted by Asha Voice AI'}
          </Text>
        </View>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <>
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>
                💊 {language === 'ta' ? 'மருந்து உட்கொள்ளல் நிலை' : 'Medication Adherence'}
              </Text>
              <Text style={[styles.metricHighlight, { color: colors.success }]}>96%</Text>
              <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
                {language === 'ta'
                  ? 'காலை இரத்த அழுத்த மருந்து 8:05 AM மணிக்கு உறுதி செய்யப்பட்டது.'
                  : 'Morning BP tablet confirmed at 8:05 AM today.'}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>
                🧩 {language === 'ta' ? 'நினைவாற்றல் விளையாட்டு செயல்பாடுகள்' : 'Cognitive Games Played'}
              </Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textPrimary }]}>1. Nondi (Hopscotch)</Text>
                <Text style={[styles.statScore, { color: colors.success }]}>100% (4/4)</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textPrimary }]}>2. Ilaiyaraaja Song Memory</Text>
                <Text style={[styles.statScore, { color: colors.primary }]}>90% (3/3)</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.textPrimary }]}>3. Thaayam Strategy</Text>
                <Text style={[styles.statScore, { color: colors.accent }]}>85% (3/4)</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>
                😊 {language === 'ta' ? 'வாராந்திர மனநிலை' : 'Weekly Mood Rhythm'}
              </Text>
              <View style={styles.moodGrid}>
                {['Mon 😊', 'Tue 😌', 'Wed 😊', 'Thu 🌿', 'Fri 😊', 'Sat 😌', 'Today 🌸'].map(m => (
                  <View key={m} style={[styles.moodChip, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.moodChipText, { color: colors.primary }]}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ─── TAB 2: ALARMS ─── */}
        {activeTab === 'alarms' && (
          <>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddAlarm(s => !s)}
            >
              <Text style={styles.primaryActionBtnText}>
                {showAddAlarm ? '✕ Close Form' : '+ ' + (language === 'ta' ? 'புதிய அலாரம் அமைக்க' : 'Set New Alarm for Elder')}
              </Text>
            </TouchableOpacity>

            {showAddAlarm && (
              <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
                <Text style={[styles.formTitle, { color: colors.primaryDark }]}>⏰ New Alarm / Reminder</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={language === 'ta' ? 'அலாரம் பெயர் (உதா: மாலை மாத்திரை)' : 'Alarm Title (e.g. Evening BP Pill)'}
                  value={alarmTitle}
                  onChangeText={setAlarmTitle}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Time (e.g. 05:30 PM)"
                  value={alarmTime}
                  onChangeText={setAlarmTime}
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddAlarm}>
                  <Text style={styles.saveBtnText}>{language === 'ta' ? 'சேமிக்க' : 'Set on Elder Device'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {alarms.map(a => (
              <View key={a.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alarmTimeBadge, { color: colors.primaryDark }]}>⏰ {a.time}</Text>
                  <Text style={[styles.alarmTitle, { color: colors.textPrimary }]}>{a.title}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.statusPillText, { color: colors.primary }]}>ACTIVE</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ─── TAB 3: MEDICAL REPORTS ─── */}
        {activeTab === 'reports' && (
          <>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddReport(s => !s)}
            >
              <Text style={styles.primaryActionBtnText}>
                {showAddReport ? '✕ Close Form' : '+ ' + (language === 'ta' ? 'புதிய மருத்துவ அறிக்கை பதிவேற்ற' : 'Add Medical Report')}
              </Text>
            </TouchableOpacity>

            {showAddReport && (
              <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
                <Text style={[styles.formTitle, { color: colors.primaryDark }]}>🩺 Upload Medical Diagnosis</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Report Title / Diagnosis"
                  value={reportTitle}
                  onChangeText={setReportTitle}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Doctor / Clinic Name"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, height: 70 }]}
                  placeholder="Doctor Summary & Prescription Advice"
                  multiline
                  value={reportSummary}
                  onChangeText={setReportSummary}
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddReport}>
                  <Text style={styles.saveBtnText}>{language === 'ta' ? 'சேமிக்க' : 'Save & Sync Report'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {reports.map(r => (
              <View key={r.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.reportTitle, { color: colors.primaryDark }]}>{r.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{r.date}</Text>
                </View>
                <Text style={[styles.reportDoc, { color: colors.textSecondary }]}>👨‍⚕️ {r.doctor}</Text>
                <Text style={[styles.reportSummaryText, { color: colors.textPrimary }]}>{r.summary}</Text>
              </View>
            ))}
          </>
        )}

        {/* ─── TAB 4: FAMILY CONTACTS ─── */}
        {activeTab === 'contacts' && (
          <>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddContact(s => !s)}
            >
              <Text style={styles.primaryActionBtnText}>
                {showAddContact ? '✕ Close Form' : '+ ' + (language === 'ta' ? 'புதிய எண் சேர்க்க' : 'Add Family Contact')}
              </Text>
            </TouchableOpacity>

            {showAddContact && (
              <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
                <Text style={[styles.formTitle, { color: colors.primaryDark }]}>👨‍👩‍👦 Add Contact</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Name"
                  value={contactName}
                  onChangeText={setContactName}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Relationship (e.g. Son, Daughter)"
                  value={contactRelation}
                  onChangeText={setContactRelation}
                />
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddContact}>
                  <Text style={styles.saveBtnText}>{language === 'ta' ? 'சேமிக்க' : 'Save to Elder Screen'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {contacts.map(c => (
              <View key={c.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <View>
                  <Text style={[styles.contactName, { color: colors.textPrimary }]}>{c.name}</Text>
                  <Text style={[styles.contactRelation, { color: colors.primaryDark }]}>{c.relation} • {c.phone}</Text>
                </View>
                {c.isEmergency && (
                  <View style={[styles.sosPill, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.sosPillText, { color: '#D32F2F' }]}>🚨 SOS</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* ─── TAB 5: LINK ELDER ─── */}
        {activeTab === 'link' && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, gap: 14 }]}>
            <Text style={[styles.cardHeading, { color: colors.primaryDark }]}>
              🔗 {language === 'ta' ? 'முதியோர் கணக்கை இணைத்தல்' : 'Link Elder Account'}
            </Text>
            <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
              {language === 'ta'
                ? 'முதியோரின் திரையில் காட்டப்படும் 6-இலக்க இணைப்பு குறியீட்டை உள்ளிட்டு அவர்களின் கணக்குடன் இணைக்கவும்.'
                : 'Enter the 6-digit Link Code shown in Grandpa/Grandma’s settings to monitor their cognitive health.'}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.primary, color: colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' }]}
              placeholder="e.g. GRN-4892"
              value={linkCodeInput}
              onChangeText={setLinkCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleLinkElder}>
              <Text style={styles.saveBtnText}>
                {language === 'ta' ? 'கணக்கை இணைக்க' : 'Link Elder Account'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subNavBar: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  subNavScroll: { flexDirection: 'row', gap: 8 },
  navPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  navPillText: { fontSize: 13, fontWeight: '700' },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, elevation: 2 },
  elderName: { fontSize: 18, fontWeight: '800' },
  elderStatus: { fontSize: 13 },
  cardHeading: { fontSize: 16, fontWeight: '800' },
  metricHighlight: { fontSize: 32, fontWeight: '900', marginVertical: 2 },
  metricDesc: { fontSize: 13, lineHeight: 18 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statLabel: { fontSize: 14, fontWeight: '600' },
  statScore: { fontSize: 14, fontWeight: '800' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  moodChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  moodChipText: { fontSize: 12, fontWeight: '700' },
  primaryActionBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  formCard: { borderRadius: 16, borderWidth: 2, padding: 16, gap: 10 },
  formTitle: { fontSize: 16, fontWeight: '800' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFFFF' },
  saveBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  alarmTimeBadge: { fontSize: 15, fontWeight: '800' },
  alarmTitle: { fontSize: 13, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  reportTitle: { fontSize: 16, fontWeight: '800' },
  reportDoc: { fontSize: 13, fontWeight: '600' },
  reportSummaryText: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  contactName: { fontSize: 16, fontWeight: '800' },
  contactRelation: { fontSize: 13, marginTop: 2 },
  sosPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  sosPillText: { fontSize: 11, fontWeight: '800' },
});
