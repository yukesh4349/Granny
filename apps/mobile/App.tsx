// ============================================================================
// Granny — React Native (Expo) Root Mobile Application
// ============================================================================
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { THEME } from './src/constants/theme';
import AuthScreen from './src/screens/Auth/AuthScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import CompanionScreen from './src/screens/Companion/CompanionScreen';
import GamesScreen from './src/screens/Games/GamesScreen';
import RemindersScreen from './src/screens/Health/RemindersScreen';
import CaregiverScreen from './src/screens/Family/CaregiverScreen';

interface MobileUser {
  id: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
}

type ElderTab = 'home' | 'companion' | 'games' | 'health';
type CaregiverTab = 'caregiver' | 'alarms' | 'medical';

export default function App() {
  const [user, setUser] = useState<MobileUser | null>({
    id: 'demo_user',
    name: 'Lakshmi Amma & Ramanathan Thatha',
    role: 'ELDER',
    language: 'ta',
  });
  const [activeElderTab, setActiveElderTab] = useState<ElderTab>('home');
  const [inGamesLibrary, setInGamesLibrary] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('ta');
  const [highContrast, setHighContrast] = useState(false);

  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const handleEmergency = () => {
    Alert.alert(
      language === 'ta' ? '🚨 அவசர உதவி (SOS)' : '🚨 Emergency Assistance',
      language === 'ta'
        ? 'குடும்ப அவசர தொடர்பு: ராகுல் (மகன் - +91 98765 43210).\n\nகிரானி எப்போதும் உங்களுடன் பாதுகாப்பாக உள்ளது.'
        : 'Connecting to priority emergency contact: Rahul (Son - +91 98765 43210).\n\nGranny stays right on screen with you.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleLogout = () => {
    setUser(null);
    setActiveElderTab('home');
    setInGamesLibrary(false);
  };

  const toggleLanguage = () => {
    setLanguage(l => l === 'ta' ? 'en' : 'ta');
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
        onToggleContrast={() => setHighContrast(h => !h)}
      />
    );
  }

  const isElder = user.role === 'ELDER';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={highContrast ? 'light-content' : 'dark-content'} />

      {/* Top App Bar — Strictly Granny Brand & Language Toggle */}
      <View style={[styles.appBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.logo, { color: colors.primaryDark }]}>🌸 Granny</Text>
          <View style={[styles.rolePill, { backgroundColor: isElder ? colors.primaryLight : colors.secondaryLight }]}>
            <Text style={[styles.rolePillText, { color: isElder ? colors.primary : colors.secondaryDark }]}>
              {isElder ? (language === 'ta' ? 'முதியோர் சரணாலயம்' : 'Elder Space') : (language === 'ta' ? 'பராமரிப்பாளர் தளம்' : 'Caretaker Portal')}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          {/* Language Toggle */}
          <TouchableOpacity
            style={[styles.langBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={toggleLanguage}
          >
            <Text style={[styles.langBtnText, { color: colors.primaryDark }]}>
              {language === 'ta' ? 'English' : 'தமிழ்'}
            </Text>
          </TouchableOpacity>

          {/* Exit */}
          <TouchableOpacity
            style={[styles.exitBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <Text style={[styles.exitBtnText, { color: '#DC2626' }]}>
              {language === 'ta' ? 'வெளியேறு' : 'Exit'}
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
              onNavigate={(tab) => setActiveElderTab(tab as ElderTab)}
              onOpenGames={() => setInGamesLibrary(true)}
              onEmergency={handleEmergency}
              language={language}
              highContrast={highContrast}
            />
          ) : activeElderTab === 'companion' ? (
            <CompanionScreen highContrast={highContrast} />
          ) : (
            <RemindersScreen highContrast={highContrast} />
          )
        ) : (
          <CaregiverScreen language={language} highContrast={highContrast} />
        )}
      </View>

      {/* Bottom Navigation for Elders */}
      {isElder && !inGamesLibrary && (
        <View style={[styles.bottomNav, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { setInGamesLibrary(false); setActiveElderTab('home'); }}
          >
            <Text style={styles.navEmoji}>🏠</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'home' ? colors.primary : colors.textSecondary }]}>
              {language === 'ta' ? 'முகப்பு' : 'Home'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { setInGamesLibrary(false); setActiveElderTab('companion'); }}
          >
            <Text style={styles.navEmoji}>💬</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'companion' ? colors.primary : colors.textSecondary }]}>
              {language === 'ta' ? 'ஆஷா' : 'Asha AI'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setInGamesLibrary(true)}
          >
            <Text style={styles.navEmoji}>🧩</Text>
            <Text style={[styles.navLabel, { color: inGamesLibrary ? colors.primary : colors.textSecondary }]}>
              {language === 'ta' ? 'விளையாட்டு' : '20 Games'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { setInGamesLibrary(false); setActiveElderTab('health'); }}
          >
            <Text style={styles.navEmoji}>💊</Text>
            <Text style={[styles.navLabel, { color: activeElderTab === 'health' ? colors.primary : colors.textSecondary }]}>
              {language === 'ta' ? 'மருந்து' : 'Health'}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  rolePillText: { fontSize: 11, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  langBtnText: { fontSize: 12, fontWeight: '800' },
  exitBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  exitBtnText: { fontSize: 12, fontWeight: '800' },
  content: { flex: 1 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  navItem: { alignItems: 'center', minWidth: 64 },
  navEmoji: { fontSize: 22 },
  navLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});
