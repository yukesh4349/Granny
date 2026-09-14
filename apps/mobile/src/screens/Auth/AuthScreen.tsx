// ============================================================================
// AuthScreen.tsx — Real Authentication for Granny Mobile
// Uses supabaseService for signUp/signIn with local-first + Supabase fallback
// ============================================================================
import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Image,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { supabaseAuth } from '../../services/supabaseService';

interface AuthScreenProps {
  onLoginSuccess: (user: { id: string; name: string; role: 'ELDER' | 'CAREGIVER'; language: string }, token: string) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  language?: string;
  onToggleLanguage?: () => void;
}

export default function AuthScreen({
  onLoginSuccess,
  highContrast,
  onToggleContrast,
  language = 'en',
  onToggleLanguage,
}: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'ELDER' | 'CAREGIVER'>('ELDER');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const ta = language === 'ta';

  const handleAuth = async () => {
    setError('');
    if (mode === 'register' && !name.trim()) {
      setError(ta ? 'பெயர் தேவை' : 'Name is required.');
      return;
    }
    if (!identifier.trim()) {
      setError(ta ? 'தொலைபேசி எண் அல்லது மின்னஞ்சல் தேவை' : 'Phone or email is required.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError(ta ? 'கடவுச்சொல் (4 எழுத்துகளாவது) தேவை' : 'Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      let result;
      const isEmail = identifier.includes('@');
      if (mode === 'register') {
        result = await supabaseAuth.signUp({
          name: name.trim(),
          email: isEmail ? identifier.trim() : `${identifier.replace(/[^0-9]/g, '')}@granny.app`,
          phone: !isEmail ? identifier.trim() : undefined,
          password: password.trim(),
          role,
          language,
        });
      } else {
        result = await supabaseAuth.signIn({
          email: isEmail ? identifier.trim() : undefined,
          phone: !isEmail ? identifier.trim() : undefined,
          password: password.trim(),
        });
      }

      await supabaseAuth.persistAuth(result.user, result.accessToken);
      onLoginSuccess(result.user, result.accessToken);
    } catch (e: any) {
      setError(e?.message || (ta ? 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoRole: 'ELDER' | 'CAREGIVER') => {
    const demoUser = demoRole === 'ELDER'
      ? { id: 'demo_elder', name: 'Lakshmi Amma & Ramanathan Thatha', role: 'ELDER' as const, language }
      : { id: 'demo_caregiver', name: 'Arun (Caregiver)', role: 'CAREGIVER' as const, language };
    onLoginSuccess(demoUser, `demo_token_${demoRole}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar with Language Toggle and High Contrast */}
          <View style={styles.topBar}>
            {onToggleLanguage && (
              <TouchableOpacity
                style={[styles.langPill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={onToggleLanguage}
              >
                <Text style={[styles.langText, { color: colors.primaryDark }]}>
                  🌐 {ta ? 'English' : 'தமிழ்'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.contrastPill, { backgroundColor: colors.primaryLight }]}
              onPress={onToggleContrast}
            >
              <Text style={[styles.contrastText, { color: colors.primary }]}>
                {highContrast ? (ta ? 'சாதாரண' : 'Normal') : (ta ? 'அதிக வேறுபாடு' : 'High Contrast')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Official Logo & Title PNG */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Image
              source={require('../../../assets/title.png')}
              style={styles.titleImage}
              resizeMode="contain"
            />
            <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
              {ta ? 'தாத்தா & பாட்டிக்கான அன்பான AI நண்பர்' : 'Compassionate AI Companion & Memory Sanctuary'}
            </Text>
          </View>

          {/* Auth Card */}
          <View style={[styles.authCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {/* Mode Tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.tabButton, mode === 'login' && { backgroundColor: colors.primary }]}
                onPress={() => { setMode('login'); setError(''); }}
              >
                <Text style={[styles.tabText, { color: mode === 'login' ? '#FFF' : colors.textSecondary }]}>
                  {ta ? 'உள்நுழைக' : 'Sign In'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, mode === 'register' && { backgroundColor: colors.primary }]}
                onPress={() => { setMode('register'); setError(''); }}
              >
                <Text style={[styles.tabText, { color: mode === 'register' ? '#FFF' : colors.textSecondary }]}>
                  {ta ? 'பதிவு செய்க' : 'Register'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
              {ta ? 'நான் யார்?' : 'I am signing in as:'}
            </Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleCard, { borderColor: role === 'ELDER' ? colors.primary : colors.border }, role === 'ELDER' && { backgroundColor: colors.primaryLight }]}
                onPress={() => setRole('ELDER')}
              >
                <Text style={styles.roleIcon}>👵</Text>
                <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>{ta ? 'முதியோர்' : 'Elder'}</Text>
                <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>{ta ? 'தாத்தா/பாட்டி' : 'Grandparent'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleCard, { borderColor: role === 'CAREGIVER' ? colors.primary : colors.border }, role === 'CAREGIVER' && { backgroundColor: colors.primaryLight }]}
                onPress={() => setRole('CAREGIVER')}
              >
                <Text style={styles.roleIcon}>👨‍👩‍👧</Text>
                <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>{ta ? 'பராமரிப்பாளர்' : 'Caregiver'}</Text>
                <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>{ta ? 'மகன்/மகள்' : 'Family Member'}</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  {ta ? 'முழு பெயர்' : 'Full Name'}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={ta ? 'உ.ம்: லட்சுமி தேவி' : 'e.g. Lakshmi Devi'}
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {ta ? 'தொலைபேசி அல்லது மின்னஞ்சல்' : 'Phone Number or Email'}
              </Text>
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
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {ta ? 'கடவுச்சொல்' : 'Password'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={ta ? 'கடவுச்சொல் உள்ளிடவும்' : 'Enter password'}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Error */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login'
                    ? (ta ? 'உள்நுழைக' : 'Sign In to Granny')
                    : (ta ? 'கணக்கை உருவாக்குக' : 'Create My Account')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo Buttons */}
          <View style={styles.demoSection}>
            <Text style={[styles.demoHeader, { color: colors.textSecondary }]}>
              {ta ? 'அல்லது நேரடியாக முயன்று பாருங்கள்:' : 'Or explore instantly without login:'}
            </Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}
                onPress={() => handleQuickDemo('ELDER')}
              >
                <Text style={[styles.demoPillText, { color: colors.primary }]}>
                  🌸 {ta ? 'முதியோர் சோதனை' : 'Elder Demo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoPill, { backgroundColor: colors.cardBg, borderColor: colors.accent }]}
                onPress={() => handleQuickDemo('CAREGIVER')}
              >
                <Text style={[styles.demoPillText, { color: colors.accent }]}>
                  📊 {ta ? 'பராமரிப்பாளர் சோதனை' : 'Caregiver Demo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 12 },
  langPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  langText: { fontSize: 13, fontWeight: '700' },
  contrastPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  contrastText: { fontSize: 13, fontWeight: 'bold' },
  header: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 84, height: 84, marginBottom: 8 },
  titleImage: { width: 170, height: 42, marginBottom: 8 },
  appSubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 },
  authCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  modeTabs: { flexDirection: 'row', backgroundColor: '#EBE6DC', borderRadius: 12, padding: 4, marginBottom: 18 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { fontSize: 16, fontWeight: '700' },
  fieldLabel: { fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleCard: { flex: 1, borderWidth: 2, borderRadius: 14, padding: 12, alignItems: 'center' },
  roleIcon: { fontSize: 30, marginBottom: 4 },
  roleTitle: { fontSize: 16, fontWeight: '700' },
  roleDesc: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  inputGroup: { marginBottom: 14 },
  input: { height: 54, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, fontSize: 17, backgroundColor: '#FFFFFF' },
  errorBox: { borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  submitButton: { minHeight: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  demoSection: { marginTop: 28, alignItems: 'center' },
  demoHeader: { fontSize: 14, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  demoButtonsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  demoPill: { borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  demoPillText: { fontSize: 14, fontWeight: '700' },
});
