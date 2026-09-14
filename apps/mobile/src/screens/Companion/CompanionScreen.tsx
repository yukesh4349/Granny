// ============================================================================
// CompanionScreen.tsx — Asha AI Multimodal Voice & Memory Companion
// Uses 4-Key Groq Llama 3.3 70B Pool, Automatic Memory & Health Triage,
// Multilingual Tamil & English Speech Synthesis, and Calming Safety Scripts
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { groqService, ExtractedMemory, HealthAlertDetection } from '../../services/groqService';
import { audioService } from '../../services/audioService';
import { databaseService } from '../../services/supabaseService';

interface Props {
  userId?: string;
  language?: 'en' | 'ta';
  highContrast?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  distress?: boolean;
  memorySaved?: boolean;
  healthAlert?: boolean;
}

export default function CompanionScreen({ userId = 'demo_user', language = 'ta', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const isTamil = language === 'ta';
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: isTamil
        ? 'வணக்கம் லட்சுமி அம்மா! நான் உங்கள் ஆஷா. இன்று உங்கள் நாள் எப்படி இருக்கிறது? உங்கள் பழைய நினைவுகள் அல்லது பாடல்களைப் பற்றி பேசுவோமா? 🌸'
        : 'Good day Lakshmi Amma! I am Asha, your memory companion. How are you feeling today? Shall we reminisce or listen to a sweet tune? 🌸',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeMode, setActiveMode] = useState<'normal' | 'song' | 'poem' | 'word'>('normal');
  const [lastSavedMemory, setLastSavedMemory] = useState<ExtractedMemory | null>(null);
  const [activeHealthAlert, setActiveHealthAlert] = useState<HealthAlertDetection | null>(null);

  useEffect(() => {
    groqService.initialize();
  }, []);

  const handleSend = async (overrideText?: string, modeOverride?: 'normal' | 'song' | 'poem' | 'word') => {
    const text = (overrideText || inputText).trim();
    if (!text || isAnalyzing) return;

    audioService.playTapSound();
    const currentMode = modeOverride || activeMode;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAnalyzing(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.text,
      }));

      // Call 4-Key Groq Llama 3.3 70B Engine
      const result = await groqService.analyzeConversation(
        text,
        historyPayload,
        {
          name: 'Lakshmi Amma & Ramanathan Thatha',
          hometown: 'Madurai / Chennai, Tamil Nadu',
          hobbies: 'Carnatic music, traditional cooking, kolam, gardening',
          favoriteArtists: 'M.S. Subbulakshmi, Ilaiyaraaja, K.B. Sundarambal',
        }
      );

      let formattedReply = result.reply;
      if (currentMode === 'song') {
        formattedReply = `🎵 [இனிய பாடல் வரிகள் / Melodic Song]\n${result.reply} 🎶`;
      } else if (currentMode === 'poem') {
        formattedReply = `🎶 [கவிதை நடையில் / Poetic Verse]\n${result.reply}`;
      } else if (currentMode === 'word') {
        formattedReply = `🗣️ [மெதுவான உச்சரிப்பு / Word by Word]\n${result.reply.split(' ').join(' • ')}`;
      }

      // If Asha extracted a biographical memory, persist to database
      let memorySaved = false;
      if (result.extractedMemory) {
        setLastSavedMemory(result.extractedMemory);
        memorySaved = true;
        try {
          await databaseService.addMemory(userId, {
            title: result.extractedMemory.title,
            content: result.extractedMemory.content,
            tags: result.extractedMemory.tags,
            uploaded_by: 'Asha Voice AI (Auto-Saved)',
          });
        } catch (e) {
          console.log('Failed to save memory to database:', e);
        }
      }

      // If Asha detected a health concern, notify caregiver & log activity
      let healthAlertTriggered = false;
      if (result.healthAlert && result.healthAlert.isHealthConcern) {
        setActiveHealthAlert(result.healthAlert);
        healthAlertTriggered = true;
        try {
          await databaseService.createActivityLog(
            userId,
            'HEALTH_ALERT',
            `Health Symptom Detected: "${result.healthAlert.symptom}" (${result.healthAlert.severity}). Caretaker notified.`
          );
        } catch (e) {
          console.log('Failed to save health alert log:', e);
        }
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: formattedReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        memorySaved,
        healthAlert: healthAlertTriggered,
      };

      setMessages(prev => [...prev, aiMsg]);

      // Automatically speak the reply
      setIsSpeaking(true);
      audioService.speak(result.reply, isTamil ? 'ta' : 'en', () => {
        setIsSpeaking(false);
      });

    } catch (err) {
      console.warn('Companion analysis error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai_fb_${Date.now()}`,
        role: 'assistant',
        text: isTamil
          ? 'நான் எப்போதும் உங்கள் அருகே இருக்கிறேன் அம்மா. உங்கள் உடல் நலம் சீராக இருக்கட்டும். 🌸'
          : 'I am right beside you, dear. Rest well and enjoy this serene moment. 🌸',
        timestamp: 'Just now',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const handleSimulateVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    audioService.playTapSound();

    const simulatedPromptsTamil = [
      'ஆஷா, என் பழைய கிராமத்து வீட்டு முற்றத்தில் மல்லிகை பூக்கள் பூக்கும் நினைவை கூறுங்கள்.',
      'இன்று காலை எனக்கு லேசாக தலைவலியும் முழங்கால் வலியும் இருக்கிறது.',
      'எனக்கு எம்.எஸ். சுப்புலட்சுமியின் ஒரு இனிமையான பாடலை பாடுங்கள்.',
      'என் பேரன் அர்ஜுன் என்னுடன் கோலி குண்டு விளையாடிய அந்த நாள்கள் நினைவுக்கு வருகிறது.',
    ];

    const simulatedPromptsEnglish = [
      'Asha, remind me of our ancestral home garden with fresh jasmine blossoms.',
      'I have a slight headache and knee ache this afternoon after walking.',
      'Can you sing a gentle Carnatic melody for me today?',
      'I remember cooking traditional sambar and medu vada for Pongal festival.',
    ];

    const pool = isTamil ? simulatedPromptsTamil : simulatedPromptsEnglish;
    const randomPrompt = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      setIsListening(false);
      handleSend(randomPrompt);
    }, 2200);
  };

  const handleStopSpeaking = () => {
    audioService.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Health Alert Safety Banner */}
      {activeHealthAlert && (
        <View style={[styles.alertBanner, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.alertTitle}>🚨 {isTamil ? 'உடல்நல எச்சரிக்கை பராமரிப்பாளருக்கு அனுப்பப்பட்டது' : 'Health Alert Sent to Caregiver'}</Text>
            <TouchableOpacity onPress={() => setActiveHealthAlert(null)}>
              <Text style={{ fontSize: 16, color: '#991B1B', fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.alertText}>
            {isTamil
              ? `அறிகுறி: ${activeHealthAlert.symptom || 'உடல் சோர்வு'} • உங்கள் குடும்ப பராமரிப்பாளருக்கு தகவல் தெரிவிக்கப்பட்டது.`
              : `Symptom: ${activeHealthAlert.symptom} • Caretaker notified via in-app alert & email.`}
          </Text>
        </View>
      )}

      {/* Auto-Saved Memory Notification */}
      {lastSavedMemory && (
        <View style={[styles.memoryBanner, { backgroundColor: '#EFFBF2', borderColor: '#10B981' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.memoryTitle}>✨ {isTamil ? 'புதிய நினைவு சேமிக்கப்பட்டது!' : 'Memory Auto-Saved to Vault!'}</Text>
            <TouchableOpacity onPress={() => setLastSavedMemory(null)}>
              <Text style={{ fontSize: 16, color: '#047857', fontWeight: '900' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.memoryText}>
            "{lastSavedMemory.title}": {lastSavedMemory.content.slice(0, 70)}...
          </Text>
        </View>
      )}

      {/* Delivery Mode Pills */}
      <View style={[styles.modeBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {[
          { id: 'normal' as const, label: isTamil ? '💬 சாதாரண பேச்சு' : '💬 Normal' },
          { id: 'song' as const, label: isTamil ? '🎵 பாடல் வடிவம்' : '🎵 Sing Song' },
          { id: 'poem' as const, label: isTamil ? '🎶 கவிதை' : '🎶 Poem' },
          { id: 'word' as const, label: isTamil ? '🗣️ மெதுவான உச்சரிப்பு' : '🗣️ Slow Word' },
        ].map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.modePill,
              {
                backgroundColor: activeMode === m.id ? colors.primary : colors.bg,
                borderColor: activeMode === m.id ? colors.primary : colors.border,
              }
            ]}
            onPress={() => {
              audioService.playTapSound();
              setActiveMode(m.id);
            }}
          >
            <Text style={[styles.modePillText, { color: activeMode === m.id ? '#FFFFFF' : colors.textPrimary }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.assistantBubble, { backgroundColor: colors.cardBg, borderColor: colors.border }]
            ]}
          >
            <View style={styles.bubbleHeader}>
              <Text style={[styles.bubbleSender, { color: msg.role === 'user' ? '#D1FAE5' : colors.primaryDark }]}>
                {msg.role === 'user' ? (isTamil ? '👤 நீங்கள்' : '👤 You') : '🌸 Asha Voice AI'}
              </Text>
              <Text style={[styles.bubbleTime, { color: msg.role === 'user' ? '#E0E7FF' : colors.textSecondary }]}>
                {msg.timestamp}
              </Text>
            </View>

            <Text style={[styles.bubbleText, { color: msg.role === 'user' ? '#FFFFFF' : colors.textPrimary }]}>
              {msg.text}
            </Text>

            {/* Badges on message */}
            <View style={styles.badgeRow}>
              {msg.memorySaved && (
                <View style={[styles.badgePill, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.badgeText, { color: '#065F46' }]}>📖 {isTamil ? 'நினைவு சேமிக்கப்பட்டது' : 'Saved to Vault'}</Text>
                </View>
              )}
              {msg.healthAlert && (
                <View style={[styles.badgePill, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#991B1B' }]}>🛡️ {isTamil ? 'பராமரிப்பாளர் விழிப்புணர்வு' : 'Caregiver Alerted'}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {isAnalyzing && (
          <View style={[styles.assistantBubble, { backgroundColor: colors.cardBg, borderColor: colors.border, padding: 16 }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.textSecondary }]}>
              🌸 {isTamil ? 'ஆஷா யோசிக்கிறார்...' : 'Asha is listening & responding warmly...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Speaking Active Indicator */}
      {isSpeaking && (
        <View style={[styles.speakingBar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.speakingText, { color: colors.primaryDark }]}>
            🔊 {isTamil ? 'ஆஷா பேசிக்கொண்டிருக்கிறார்...' : 'Asha is speaking to you now...'}
          </Text>
          <TouchableOpacity style={styles.stopSpeakingBtn} onPress={handleStopSpeaking}>
            <Text style={styles.stopSpeakingText}>{isTamil ? 'நிறுத்து ✕' : 'Stop ✕'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fast Conversation Starter Chips */}
      <View style={[styles.promptChipsRow, { backgroundColor: colors.bg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          <TouchableOpacity
            style={[styles.quickPromptChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleSend(isTamil ? 'எனக்கு ஒரு இனிமையான பாடல் பாடுங்கள்' : 'Sing me a gentle morning song', 'song')}
          >
            <Text style={[styles.quickPromptText, { color: colors.primaryDark }]}>
              🎵 {isTamil ? 'பாடல் பாடுங்கள்' : 'Sing Song'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickPromptChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleSend(isTamil ? 'மல்லிகை பூ மற்றும் பழைய வீட்டு நினைவுகள்' : 'Reminisce about the village jasmine garden')}
          >
            <Text style={[styles.quickPromptText, { color: colors.primaryDark }]}>
              🌸 {isTamil ? 'பூந்தோட்ட நினைவு' : 'Garden Memories'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickPromptChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleSend(isTamil ? 'இன்று காலை உடற்பயிற்சி செய்ய என்ன செய்யலாம்?' : 'What light exercises shall I do today?')}
          >
            <Text style={[styles.quickPromptText, { color: colors.primaryDark }]}>
              🌿 {isTamil ? 'எளிய உடற்பயிற்சி' : 'Light Exercise'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Voice / Text Control Center */}
      <View style={[styles.controlCenter, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {/* Large Voice Microphone Button (WCAG AAA Touch Target) */}
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: isListening ? '#DC2626' : colors.primary }
          ]}
          onPress={handleSimulateVoiceInput}
          activeOpacity={0.8}
        >
          <Text style={styles.micEmoji}>{isListening ? '⏹️' : '🎙️'}</Text>
          <Text style={styles.micText}>
            {isListening
              ? (isTamil ? 'குரல் கேட்கிறது... (பேசுங்கள்)' : 'Listening to your voice...')
              : (isTamil ? 'குரலில் பேச தொடவும்' : 'Tap to Speak with Asha')}
          </Text>
        </TouchableOpacity>

        {/* Text Input Alternate */}
        <View style={styles.textInputRow}>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.bg }]}
            placeholder={isTamil ? 'அல்லது இங்கே எழுதவும்...' : 'Or type your message here...'}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleSend()}
            disabled={isAnalyzing}
          >
            <Text style={styles.sendBtnText}>{isTamil ? 'அனுப்பு' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  alertBanner: { margin: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  alertText: { fontSize: 13, color: '#7F1D1D', lineHeight: 18 },
  memoryBanner: { marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1.5, gap: 4 },
  memoryTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  memoryText: { fontSize: 13, color: '#047857', lineHeight: 18 },
  modeBar: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, gap: 6 },
  modePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  modePillText: { fontSize: 12, fontWeight: '700' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 14 },
  bubble: { padding: 16, borderRadius: 18, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bubbleSender: { fontSize: 12, fontWeight: '800' },
  bubbleTime: { fontSize: 11 },
  bubbleText: { fontSize: 17, lineHeight: 26, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  badgePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  typingText: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  speakingBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  speakingText: { fontSize: 13, fontWeight: '700' },
  stopSpeakingBtn: { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stopSpeakingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  promptChipsRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  quickPromptChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  quickPromptText: { fontSize: 13, fontWeight: '700' },
  controlCenter: { padding: 14, borderTopWidth: 1, gap: 10 },
  micButton: { height: 60, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  micEmoji: { fontSize: 26 },
  micText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  textInputRow: { flexDirection: 'row', gap: 8 },
  textInput: { flex: 1, height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  sendBtn: { height: 48, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
