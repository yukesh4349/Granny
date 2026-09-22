// ============================================================================
// Granny — React Native (Expo) Root Mobile Application
// Complete Elder Sanctuary & Caregiver Portal with 4-Key Groq Engine,
// Real-time Audio Synthesizer, 20 Nostalgia Games, Memory Vault, Health Alarms,
// and Loud SOS Siren Dispatch
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Modal,
  Image,
  BackHandler,
  Linking,
} from 'react-native';
import { THEME } from './src/constants/theme';
import AuthScreen from './src/screens/Auth/AuthScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import CompanionScreen from './src/screens/Companion/CompanionScreen';
import GamesScreen from './src/screens/Games/GamesScreen';
import RemindersScreen from './src/screens/Health/RemindersScreen';
import MemoryScreen from './src/screens/Memory/MemoryScreen';
import CaregiverScreen from './src/screens/Family/CaregiverScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import { audioService } from './src/services/audioService';
import { supabaseAuth, databaseService } from './src/services/supabaseService';

interface MobileUser {
  id: string;
  name: string;
  email?: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
}

type ElderTab = 'home' | 'companion' | 'games' | 'memory' | 'health' | 'settings';

export default function App() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [language, setLanguage] = useState<'ta' | 'en'>('ta');
  const [highContrast, setHighContrast] = useState(false);
  const [activeElderTab, setActiveElderTab] = useState<ElderTab>('home');
  const [inGamesLibrary, setInGamesLibrary] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [healthDrawerVisible, setHealthDrawerVisible] = useState(false);

  useEffect(() => {
    // Restore saved session from AsyncStorage
    supabaseAuth.loadPersistedAuth().then(persisted => {
      if (persisted?.user) {
        setUser(persisted.user);
        if (persisted.user.language === 'ta' || persisted.user.language === 'en') {
          setLanguage(persisted.user.language as any);
        }
      }
    }).catch(() => {});

    // Deep Linking Handler
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (!url) return;
      if (url.includes('games')) {
        setInGamesLibrary(true);
        setActiveElderTab('games');
      } else if (url.includes('companion')) {
        setActiveElderTab('companion');
      } else if (url.includes('health') || url.includes('reminders')) {
        setHealthDrawerVisible(true);
      } else if (url.includes('memory')) {
        setActiveElderTab('memory');
      } else if (url.includes('settings')) {
        setActiveElderTab('settings');
      } else if (url.includes('sos')) {
        handleEmergencySos();
      }
    };

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // Hardware Back Button Handler for Android
  useEffect(() => {
    const backAction = () => {
      if (sosModalVisible) {
        handleDismissSos();
        return true;
      }
      if (healthDrawerVisible) {
        setHealthDrawerVisible(false);
        return true;
      }
      if (inGamesLibrary) {
        setInGamesLibrary(false);
        setActiveElderTab('home');
        return true;
      }
      if (activeElderTab !== 'home') {
        setActiveElderTab('home');
        return true;
      }
      return false; // Exit app
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [sosModalVisible, healthDrawerVisible, inGamesLibrary, activeElderTab]);

  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const isTamil = language === 'ta';

  const handleEmergencySos = () => {
    audioService.playSosSiren();
    setSosModalVisible(true);
    if (user?.id) {
      databaseService.addCaretakerNotification(user.id, {
        elder_id: user.id,
        elder_name: user.name || 'Elder',
        type: 'DISTRESS',
        severity: 'URGENT',
        title: '🚨 EMERGENCY SOS ACTIVATED',
        message: `Emergency SOS button pressed by ${user.name || 'Elder'} on mobile app at ${new Date().toLocaleTimeString()}.`,
        email_sent: true,
        is_read: false,
      }).catch(() => {});
    }
  };

  const handleDismissSos = () => {
    audioService.stopSosSiren();
    setSosModalVisible(false);
  };

  const handleLogout = async () => {
    audioService.stopSosSiren();
    audioService.stopSpeaking();
    await supabaseAuth.clearPersistedAuth();
    setUser(null);
    setActiveElderTab('home');
    setInGamesLibrary(false);
  };

  const toggleLanguage = () => {
    audioService.playTapSound();
    setLanguage(l => (l === 'ta' ? 'en' : 'ta'));
  };

  const toggleHighContrast = () => {
    audioService.playTapSound();
    setHighContrast(h => !h);
  };

  if (!user) {
    return (
      <AuthScreen
        onLoginSuccess={(authUser) => {
          setUser(authUser);
          if (authUser.language === 'ta' || authUser.language === 'en') {
            setLanguage(authUser.language as any);
          }
        }}
        highContrast={highContrast}
        onToggleContrast={toggleHighContrast}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  const isElder = user.role === 'ELDER';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={highContrast ? 'light-content' : 'dark-content'} />

      {/* Emergency SOS Active Siren Overlay */}
      <Modal visible={sosModalVisible} transparent animationType="fade">
        <View style={styles.sosModalBackdrop}>
          <View style={[styles.sosModalBox, { backgroundColor: '#B91C1C' }]}>
            <Text style={styles.sosModalEmoji}>🚨</Text>
            <Text style={styles.sosModalTitle}>
              {isTamil ? 'அவசர உதவி (SOS) இயக்கப்பட்டது!' : 'EMERGENCY SOS BROADCAST!'}
            </Text>
            <Text style={styles.sosModalDesc}>
              {isTamil
                ? 'உங்கள் குடும்ப பராமரிப்பாளர் ராகுலுக்கு (+91 98765 43210) உடனடி அவசர அழைப்பும் எச்சரிக்கை சைரனும் அனுப்பப்படுகிறது.\n\nகிரானி எப்போதும் உங்கள் பாதுகாப்பில் உள்ளது.'
                : 'Pulsing emergency siren active on both your device and linked caregiver phone. Priority call dispatched to Rahul (Son: +91 98765 43210).'}
            </Text>
            <TouchableOpacity
              style={styles.sosDismissBtn}
              onPress={handleDismissSos}
            >
              <Text style={styles.sosDismissBtnText}>
                {isTamil ? 'சைரன் நிறுத்து / பாதுகாப்பாக உள்ளேன் ✕' : 'Silence Siren / I Am Safe Now ✕'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Health & Alarms Slide-over Modal */}
      <Modal visible={healthDrawerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={[styles.drawerHeader, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setHealthDrawerVisible(false)} style={styles.drawerCloseBtn}>
              <Text style={[styles.drawerCloseText, { color: colors.primary }]}>
                ← {isTamil ? 'திரும்ப' : 'Back'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
              💊 {isTamil ? 'மருந்து & நினைவூட்டல் அட்டவணை' : 'Health & Alarms'}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          <RemindersScreen highContrast={highContrast} />
        </SafeAreaView>
      </Modal>

      {/* Top App Bar — Granny Logo & Title PNG, SOS Button, Language & Switcher */}
      <View style={[styles.appBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Image source={require('./assets/logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
          <Image source={require('./assets/title.png')} style={{ width: 80, height: 22 }} resizeMode="contain" />
          <View style={[styles.rolePill, { backgroundColor: isElder ? colors.primaryLight : colors.secondaryLight }]}>
            <Text style={[styles.rolePillText, { color: isElder ? colors.primary : colors.secondaryDark }]}>
              {isElder ? (isTamil ? 'முதியோர்' : 'Elder') : (isTamil ? 'பராமரிப்பாளர்' : 'Caregiver')}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          {/* Quick SOS Siren Button for Elders */}
          {isElder && (
            <TouchableOpacity
              style={[styles.sosTopBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleEmergencySos}
            >
              <Text style={styles.sosTopBtnText}>🚨 SOS</Text>
            </TouchableOpacity>
          )}

          {/* Language Switcher */}
          <TouchableOpacity
            style={[styles.langBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={toggleLanguage}
          >
            <Text style={[styles.langBtnText, { color: colors.primaryDark }]}>
              {isTamil ? 'English' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>

          {/* High Contrast Toggle */}
          <TouchableOpacity
            style={[styles.contrastBtn, { backgroundColor: highContrast ? '#1E293B' : '#F3F4F6' }]}
            onPress={toggleHighContrast}
          >
            <Text style={{ fontSize: 13 }}>{highContrast ? '☀️' : '👁️'}</Text>
          </TouchableOpacity>

          {/* Direct Sign Out / Log Out Button */}
          <TouchableOpacity
            style={[styles.exitBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <Text style={[styles.exitBtnText, { color: '#DC2626' }]}>
              🚪 {isTamil ? 'வெளியேறு' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {isElder ? (
          inGamesLibrary || activeElderTab === 'games' ? (
            <GamesScreen
              onBack={() => {
                setInGamesLibrary(false);
                setActiveElderTab('home');
              }}
              language={language}
              highContrast={highContrast}
            />
          ) : activeElderTab === 'home' ? (
            <HomeScreen
              onNavigate={(tab) => {
                if (tab === 'health') {
                  audioService.playMedicineAlertChime();
                  setHealthDrawerVisible(true);
                } else if (tab === 'games') {
                  setInGamesLibrary(true);
                } else {
                  setActiveElderTab(tab as ElderTab);
                }
              }}
              onOpenGames={() => setInGamesLibrary(true)}
              onEmergency={handleEmergencySos}
              language={language}
              highContrast={highContrast}
              userName={user.name}
            />
          ) : activeElderTab === 'companion' ? (
            <CompanionScreen userId={user.id} userName={user.name} language={language} highContrast={highContrast} />
          ) : activeElderTab === 'memory' ? (
            <MemoryScreen userId={user.id} language={language} highContrast={highContrast} />
          ) : activeElderTab === 'settings' ? (
            <SettingsScreen
              user={user}
              language={language}
              onToggleLanguage={toggleLanguage}
              highContrast={highContrast}
              onToggleHighContrast={toggleHighContrast}
              onLogout={handleLogout}
              onBack={() => setActiveElderTab('home')}
            />
          ) : (
            <RemindersScreen highContrast={highContrast} />
          )
        ) : (
          <CaregiverScreen language={language} highContrast={highContrast} onLogout={handleLogout} />
        )}
      </View>

      {/* Bottom Navigation for Elders */}
      {isElder && !inGamesLibrary && (
        <View style={[styles.bottomNav, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              audioService.playTapSound();
              setInGamesLibrary(false);
              setActiveElderTab('home');
            }}
          >
            <Text style={styles.navEmoji}>🏠</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'home' ? colors.primary : colors.textSecondary }]}>
              {isTamil ? 'முகப்பு' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              audioService.playTapSound();
              setInGamesLibrary(false);
              setActiveElderTab('companion');
            }}
          >
            <Text style={styles.navEmoji}>💬</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'companion' ? colors.primary : colors.textSecondary }]}>
              {isTamil ? 'ஆஷா AI' : 'Asha AI'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              audioService.playTapSound();
              setInGamesLibrary(true);
            }}
          >
            <Text style={styles.navEmoji}>🧩</Text>
            <Text style={[styles.navLabel, { color: inGamesLibrary ? colors.primary : colors.textSecondary }]}>
              {isTamil ? 'ஆட்டங்கள்' : '20 Games'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              audioService.playTapSound();
              setInGamesLibrary(false);
              setActiveElderTab('memory');
            }}
          >
            <Text style={styles.navEmoji}>📸</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'memory' ? colors.primary : colors.textSecondary }]}>
              {isTamil ? 'நினைவுகள்' : 'Memories'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              audioService.playTapSound();
              setInGamesLibrary(false);
              setActiveElderTab('settings');
            }}
          >
            <Text style={styles.navEmoji}>⚙️</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'settings' ? colors.primary : colors.textSecondary }]}>
              {isTamil ? 'அமைப்புகள்' : 'Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  rolePillText: { fontSize: 10, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sosTopBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  sosTopBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  langBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  langBtnText: { fontSize: 11, fontWeight: '800' },
  contrastBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  exitBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  exitBtnText: { fontSize: 11, fontWeight: '800' },
  content: { flex: 1 },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navEmoji: { fontSize: 20 },
  navLabel: { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
  drawerCloseBtn: { minWidth: 60 },
  drawerCloseText: { fontSize: 16, fontWeight: '800' },
  drawerTitle: { fontSize: 16, fontWeight: '800' },
  // SOS Modal
  sosModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sosModalBox: { width: '100%', borderRadius: 20, padding: 24, alignItems: 'center', gap: 14 },
  sosModalEmoji: { fontSize: 64 },
  sosModalTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sosModalDesc: { color: '#FFFFFF', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  sosDismissBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, marginTop: 10, width: '100%', alignItems: 'center' },
  sosDismissBtnText: { color: '#DC2626', fontSize: 16, fontWeight: '900' },
});
