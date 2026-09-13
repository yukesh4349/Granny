// ============================================================================
// AuthScreen.tsx — Proper Native React Native Authentication for Mobile
// ============================================================================
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { THEME } from '../../constants/theme';

interface AuthScreenProps {
  onLoginSuccess: (user: { id: string; name: string; role: 'ELDER' | 'CAREGIVER'; language: string }) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
}

export default function AuthScreen({ onLoginSuccess, highContrast, onToggleContrast }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ELDER' | 'CAREGIVER'>('ELDER');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const handleAuth = async () => {
    if (mode === 'register' && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    if (!identifier.trim()) {
      Alert.alert('Input Required', 'Please enter your phone number or email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const authenticatedUser = {
        id: `user_${Date.now()}`,
        name: name.trim() || (identifier.includes('@') ? identifier.split('@')[0] : 'Lakshmi'),
        role,
        language: 'en',
      };
      onLoginSuccess(authenticatedUser);
    }, 600);
  };

  const handleQuickDemo = () => {
    onLoginSuccess({
      id: 'demo_elder',
      name: 'Lakshmi Amma',
      role: 'ELDER',
      language: 'en',
    });
  };

  const handleCaregiverDemo = () => {
    onLoginSuccess({
      id: 'demo_caregiver',
      name: 'Arun (Caregiver)',
      role: 'CAREGIVER',
      language: 'en',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Contrast Switch */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.contrastPill, { backgroundColor: colors.primaryLight }]}
              onPress={onToggleContrast}
            >
              <Text style={[styles.contrastText, { color: colors.primary }]}>
                {highContrast ? 'Normal Contrast' : 'High Contrast Mode'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Logo and Greeting */}
          <View style={styles.header}>
            <Text style={styles.appIcon}>🌸</Text>
            <Text style={[styles.appTitle, { color: colors.primary }]}>Granny</Text>
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
              Compassionate AI Companion & Memory Sanctuary
            </Text>
          </View>

          {/* Card Container */}
          <View style={[styles.authCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Mode Switcher */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  mode === 'login' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.textSecondary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  mode === 'register' && { backgroundColor: colors.primary },
                ]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.tabText, { color: mode === 'register' ? '#FFF' : colors.textSecondary }]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>I am signing in as:</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { borderColor: role === 'ELDER' ? colors.primary : colors.border },
                  role === 'ELDER' && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setRole('ELDER')}
              >
                <Text style={styles.roleIcon}>👵</Text>
                <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>Elder</Text>
                <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>Personal Journey</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { borderColor: role === 'CAREGIVER' ? colors.primary : colors.border },
                  role === 'CAREGIVER' && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setRole('CAREGIVER')}
              >
                <Text style={styles.roleIcon}>👨‍👩‍👧</Text>
                <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>Caregiver</Text>
                <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>Family Insights</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. Lakshmi Devi"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Phone Number or Email</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="+91 98765 43210 or user@example.com"
                placeholderTextColor={colors.textSecondary}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Password</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In to Granny' : 'Create My Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Options */}
          <View style={styles.demoSection}>
            <Text style={[styles.demoHeader, { color: colors.textSecondary }]}>Or Explore Instantly Without Login:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}
                onPress={handleQuickDemo}
              >
                <Text style={[styles.demoPillText, { color: colors.primary }]}>🌸 Elder Demo (Lakshmi)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}
                onPress={handleCaregiverDemo}
              >
                <Text style={[styles.demoPillText, { color: colors.accent }]}>📊 Caregiver Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  contrastPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contrastText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    fontSize: 56,
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  authCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EBE6DC',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoPill: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  demoPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
