import { create } from 'zustand';
import { ChatMessage } from '../types';
import { companionService } from '../services/companionService';
import { useMemoryStore } from './memoryStore';

interface CompanionState {
  messages: ChatMessage[];
  isListening: boolean;
  isSpeaking: boolean;
  isGenerating: boolean;
  distressAlertActive: boolean;
  activeEmotion: 'warm' | 'comforting' | 'joyful' | 'attentive';
  
  sendMessage: (text: string) => Promise<void>;
  setIsListening: (val: boolean) => void;
  dismissDistressAlert: () => void;
  clearHistory: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    text: "Good morning, Grandma Rose! It is so lovely to see you today. How is the sunshine treating you this morning?",
    emotion: 'warm',
    created_at: new Date().toISOString(),
  },
];

export const useCompanionStore = create<CompanionState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isListening: false,
  isSpeaking: false,
  isGenerating: false,
  distressAlertActive: false,
  activeEmotion: 'warm',

  setIsListening: (val) => set({ isListening: val }),
  dismissDistressAlert: () => set({ distressAlertActive: false }),
  clearHistory: () => set({ messages: INITIAL_MESSAGES }),

  sendMessage: async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText.trim(),
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isGenerating: true,
    }));

    const memorySnippets = useMemoryStore.getState().getMemoriesForPrompt();
    const history = get().messages;

    try {
      const response = await companionService.generateResponse(
        userText,
        history,
        memorySnippets
      );

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        emotion: response.emotion,
        distress_detected: response.distressDetected,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isGenerating: false,
        isSpeaking: true,
        distressAlertActive: response.distressDetected || state.distressAlertActive,
        activeEmotion: response.emotion,
      }));

      // Speak response aloud
      companionService.speakReply(response.reply, () => {
        set({ isSpeaking: false });
      });
    } catch (e) {
      console.error('Companion chat error:', e);
      set({ isGenerating: false });
    }
  },
}));
