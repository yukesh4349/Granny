import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useCompanionStore } from '../src/store/companionStore';
import { useUserStore } from '../src/store/userStore';
import { audioService } from '../src/services/audioService';

export default function CompanionScreen() {
  const { currentUser } = useUserStore();
  const {
    messages,
    isListening,
    isSpeaking,
    isGenerating,
    distressAlertActive,
    sendMessage,
    setIsListening,
    dismissDistressAlert,
  } = useCompanionStore();

  const [inputVal, setInputVal] = useState<string>('');
  const scrollRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Scroll to bottom when messages update
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  // Web Speech Recognition setup
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            sendMessage(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleMicToggle = () => {
    audioService.playTapSound();
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Web speech error:', e);
        }
      } else {
        // Fallback for native/mock environment: prompt sample voice text
        setTimeout(() => {
          setIsListening(false);
          sendMessage("How are my roses in the garden doing today?");
        }, 1800);
      }
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    audioService.playTapSound();
    const txt = inputVal.trim();
    setInputVal('');
    sendMessage(txt);
  };

  const quickPrompts = [
    "Tell me about my grandson Leo",
    "What is a peaceful morning thought?",
    "Remind me of my apple pie recipe",
    "I'm feeling a bit confused today",
  ];

  return (
    <View style={styles.screen}>
      {/* Distress Alert Banner */}
      {distressAlertActive && (
        <View style={styles.distressBanner}>
          <View style={styles.distressIconBox}>
            <Text style={styles.distressIcon}>🛡️</Text>
          </View>
          <View style={styles.distressTextWrap}>
            <Text style={styles.distressTitle}>Safety Guardrail Triggered</Text>
            <Text style={styles.distressSub}>
              We are keeping you safe and calm. Your caregiver has received an instant notification.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={dismissDistressAlert}
          >
            <Text style={styles.dismissText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages List */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContainer}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.assistantBubble,
                msg.distress_detected && styles.distressBubble,
              ]}
            >
              {!isUser && (
                <View style={styles.speakerRow}>
                  <Text style={styles.speakerLabel}>🌿 Granny's Companion</Text>
                  {isSpeaking && (
                    <TouchableOpacity
                      onPress={() => audioService.stopSpeaking()}
                      style={styles.speakingIndicator}
                    >
                      <Text style={styles.speakingText}>🔊 Speaking...</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  isUser ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          );
        })}

        {isGenerating && (
          <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#2C1810" />
            <Text style={styles.loadingText}>Listening lovingly...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompt Suggestions */}
      <View style={styles.quickPromptsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickPrompts.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => {
                audioService.playTapSound();
                sendMessage(q);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Interactive Voice Mic & Text Input Area */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={handleMicToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.micIcon}>{isListening ? '⏹' : '🎙️'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Speak or type a gentle message..."
          placeholderTextColor="#8C7D6F"
          value={inputVal}
          onChangeText={setInputVal}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>➔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  distressBanner: {
    backgroundColor: '#FDEDEC',
    borderBottomWidth: 2,
    borderColor: '#E74C3C',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  distressIconBox: {
    marginRight: 10,
  },
  distressIcon: {
    fontSize: 24,
  },
  distressTextWrap: {
    flex: 1,
  },
  distressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C0392B',
  },
  distressSub: {
    fontSize: 12,
    color: '#7F1D1D',
  },
  dismissBtn: {
    backgroundColor: '#C0392B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  dismissText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 22,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2C1810',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8DED1',
    borderBottomLeftRadius: 6,
  },
  distressBubble: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFF9F9',
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  speakerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#346B3C',
  },
  speakingIndicator: {
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speakingText: {
    fontSize: 10,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 17,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantMessageText: {
    color: '#2C1810',
    fontWeight: '500',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#655648',
    fontStyle: 'italic',
  },
  quickPromptsWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  promptChip: {
    backgroundColor: '#F3EDE2',
    borderWidth: 1.5,
    borderColor: '#DFD2C1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3B2C',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#E8DED1',
    gap: 10,
  },
  micButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E67E22',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  micButtonActive: {
    backgroundColor: '#E74C3C',
    transform: [{ scale: 1.08 }],
  },
  micIcon: {
    fontSize: 22,
  },
  textInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FAF7F2',
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#2C1810',
    borderWidth: 1.5,
    borderColor: '#E0D4C5',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C1810',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
