// ============================================================================
// Mobile Voice Companion Screen
// ============================================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { THEME } from '../../constants/theme';
import { mobileApi, MobileChatMessage } from '../../services/api';

interface Props {
  highContrast?: boolean;
}

export default function CompanionScreen({ highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const [messages, setMessages] = useState<MobileChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Good day! I am Granny, your memory companion. How are you feeling today?',
      emotion: 'calm',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [distressAlert, setDistressAlert] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'normal' | 'song' | 'poem' | 'word'>('normal');

  const handleSendMessage = async (textToSend?: string, modeOverride?: 'normal' | 'song' | 'poem' | 'word') => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const currentMode = modeOverride || deliveryMode;

    const userMsg: MobileChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const res = await mobileApi.converse('user-mobile', text);

    if (res.distressFlag) {
      setDistressAlert('Caregiver notified of distress indicator.');
    }

    let formattedReply = res.reply;
    if (currentMode === 'song') {
      formattedReply = `🎵 [Singing Melody] ${res.reply} 🎶`;
    } else if (currentMode === 'poem') {
      formattedReply = `🎶 [Poetic Rhyme]\n${res.reply}`;
    } else if (currentMode === 'word') {
      formattedReply = `🗣️ [Word-by-Word] ${res.reply.split(' ').join(' • ')}`;
    }

    const aiMsg: MobileChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: formattedReply,
      emotion: res.emotion,
      distress: res.distressFlag,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate speech-to-text voice input after 2 seconds
      setTimeout(() => {
        setIsListening(false);
        handleSendMessage("Good morning Granny, can you sing a sweet melody for me?", 'song');
      }, 2000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Distress Banner */}
      {distressAlert && (
        <View style={[styles.distressBanner, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[styles.distressText, { color: colors.accent }]}>
            🛡️ {distressAlert}
          </Text>
        </View>
      )}

      {/* Voice Mode Selector Banner */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, backgroundColor: colors.cardBg }}>
        {[
          { mode: 'normal', label: '💬 Normal' },
          { mode: 'song', label: '🎵 Sing Song' },
          { mode: 'poem', label: '🎶 Poem' },
          { mode: 'word', label: '🗣️ Word' },
        ].map(m => (
          <TouchableOpacity
            key={m.mode}
            onPress={() => setDeliveryMode(m.mode as any)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: deliveryMode === m.mode ? colors.primaryLight : colors.bg,
              borderWidth: 1,
              borderColor: deliveryMode === m.mode ? colors.primary : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: deliveryMode === m.mode ? colors.primary : colors.textSecondary }}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat Messages */}
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === 'user'
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.assistantBubble, { backgroundColor: colors.cardBg, borderColor: colors.border }],
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: msg.sender === 'user' ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Quick Prompt Pills */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          onPress={() => handleSendMessage("Granny, sing me a morning lullaby", 'song')}
        >
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>🎵 Sing Song</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          onPress={() => handleSendMessage("Granny, recite a peaceful poem", 'poem')}
        >
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>🎶 Recite Poem</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.border }}
          onPress={() => handleSendMessage("Say our schedule slowly word by word", 'word')}
        >
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>🗣️ Word-by-Word</Text>
        </TouchableOpacity>
      </View>

      {/* Voice Waveform Indicator */}
      {isListening && (
        <View style={[styles.listeningBar, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.listeningText, { color: colors.accent }]}>
            🎙️ Granny is listening to your voice... (Simulating: "Sing a sweet melody")
          </Text>
        </View>
      )}

      {/* Voice Control Bar */}
      <View style={[styles.controls, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: isListening ? colors.accent : colors.primary },
          ]}
          onPress={toggleMic}
        >
          <Text style={styles.micButtonText}>{isListening ? '⏹️ Stop' : '🎙️ Tap to Speak'}</Text>
        </TouchableOpacity>

        <View style={styles.textInputRow}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.bg, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Or type a message here..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleSendMessage()}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  distressBanner: {
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  distressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
    gap: 16,
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 20,
    lineHeight: 28,
  },
  listeningBar: {
    padding: 12,
    alignItems: 'center',
  },
  listeningText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  micButton: {
    minHeight: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  textInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 18,
  },
  sendBtn: {
    minHeight: 48,
    minWidth: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
