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

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

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

    const aiMsg: MobileChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: res.reply,
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
        handleSendMessage("I am having some tea and looking at our family photos.");
      }, 2500);
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

      {/* Voice Waveform Indicator */}
      {isListening && (
        <View style={[styles.listeningBar, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.listeningText, { color: colors.accent }]}>
            🎙️ Granny is listening to your voice... Speak anytime
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
