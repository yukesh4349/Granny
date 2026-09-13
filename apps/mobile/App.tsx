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
import FlagshipGame from './src/screens/Games/FlagshipGame';
import RemindersScreen from './src/screens/Health/RemindersScreen';
import CaregiverScreen from './src/screens/Family/CaregiverScreen';

interface MobileUser {
  id: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
}

type Tab = 'home' | 'companion' | 'health' | 'caregiver';

export default function App() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [inGame, setInGame] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency Assistance',
      'Connecting to your designated family contact: Rahul (Son - +91 98765 43210).\n\nGranny is staying on the line with you.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('home');
    setInGame(false);
  };

  if (!user) {
    return (
      <AuthScreen
        onLoginSuccess={(authUser) => setUser(authUser)}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(h => !h)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={highContrast ? 'light-content' : 'dark-content'} />

      {/* Top App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.logo, { color: colors.textPrimary }]}>👵 Granny</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>({user.name})</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.contrastBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => setHighContrast(h => !h)}
          >
            <Text style={[styles.contrastBtnText, { color: colors.primary }]}>
              {highContrast ? 'Normal' : 'High Contrast'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contrastBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <Text style={[styles.contrastBtnText, { color: '#DC2626' }]}>
              Exit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Screen */}
      <View style={styles.content}>
        {inGame ? (
          <FlagshipGame onBack={() => setInGame(false)} highContrast={highContrast} />
        ) : activeTab === 'home' ? (
          <HomeScreen
            onNavigate={(tab) => setActiveTab(tab as Tab)}
            onOpenGame={() => setInGame(true)}
            onEmergency={handleEmergency}
            highContrast={highContrast}
          />
        ) : activeTab === 'companion' ? (
          <CompanionScreen highContrast={highContrast} />
        ) : activeTab === 'health' ? (
          <RemindersScreen highContrast={highContrast} />
        ) : (
          <CaregiverScreen highContrast={highContrast} />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {!inGame && (
        <View style={[styles.navBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'home' && { borderTopColor: colors.primary, borderTopWidth: 3 }]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, { color: activeTab === 'home' ? colors.primary : colors.textSecondary }]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'companion' && { borderTopColor: colors.primary, borderTopWidth: 3 }]}
            onPress={() => setActiveTab('companion')}
          >
            <Text style={styles.navIcon}>🎙️</Text>
            <Text style={[styles.navText, { color: activeTab === 'companion' ? colors.primary : colors.textSecondary }]}>
              Companion
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'health' && { borderTopColor: colors.primary, borderTopWidth: 3 }]}
            onPress={() => setActiveTab('health')}
          >
            <Text style={styles.navIcon}>💊</Text>
            <Text style={[styles.navText, { color: activeTab === 'health' ? colors.primary : colors.textSecondary }]}>
              Medicines
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'caregiver' && { borderTopColor: colors.primary, borderTopWidth: 3 }]}
            onPress={() => setActiveTab('caregiver')}
          >
            <Text style={styles.navIcon}>👨‍👩‍👧</Text>
            <Text style={[styles.navText, { color: activeTab === 'caregiver' ? colors.primary : colors.textSecondary }]}>
              Family
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contrastBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contrastBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    minHeight: 64,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
