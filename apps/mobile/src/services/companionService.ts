// Granny AI Companion Service
// Multimodal Voice/Text Companion with Groq (Llama 3.3 70B) & Gemini fallback,
// pre-LLM distress phrase de-escalation safety guardrail, and pgvector/local memory integration.

import { ChatMessage } from '../types';
import { audioService } from './audioService';

const DISTRESS_PATTERNS = [
  /i am lost/i,
  /where am i/i,
  /who are you/i,
  /i am scared/i,
  /i'm frightened/i,
  /help me/i,
  /i fell/i,
  /i can't breathe/i,
  /severe pain/i,
  /someone is in my house/i,
  /i don't know where i am/i,
  /want to go home/i,
];

const DE_ESCALATION_SCRIPTS = [
  "You are safe right now, dear. Take a slow, gentle breath. Everything is okay, and I am right here with you. I'm letting your family know so they can check in on you shortly.",
  "You are safe in a peaceful room, surrounded by care. Let's take a deep breath together. I'm right here beside you, and your loved ones are being notified.",
  "It's completely okay to feel this way. You are safe. Rest your shoulders and breathe gently. I am staying right here with you.",
];

export interface CompanionResponse {
  reply: string;
  distressDetected: boolean;
  emotion: 'warm' | 'comforting' | 'joyful' | 'attentive';
  provider: string;
}

export class CompanionService {
  private groqApiKey: string;
  private geminiApiKey: string;

  constructor() {
    this.groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  }

  // Check safety guardrail
  isDistressPhrase(message: string): boolean {
    return DISTRESS_PATTERNS.some((p) => p.test(message));
  }

  // Generate companion response
  async generateResponse(
    userMessage: string,
    history: ChatMessage[] = [],
    elderMemories: string[] = []
  ): Promise<CompanionResponse> {
    // 1. Distress Safety Check
    if (this.isDistressPhrase(userMessage)) {
      const calmingScript =
        DE_ESCALATION_SCRIPTS[Math.floor(Math.random() * DE_ESCALATION_SCRIPTS.length)];
      return {
        reply: calmingScript,
        distressDetected: true,
        emotion: 'comforting',
        provider: 'safety_guardrail',
      };
    }

    // 2. Build Elder-Specific Persona & Memory Context
    const memoriesSnippet =
      elderMemories.length > 0
        ? `\nKey facts & happy memories about this elder:\n${elderMemories.map((m) => `- ${m}`).join('\n')}`
        : '';

    const systemPrompt = `You are "Granny's Companion", an extraordinarily warm, kind, respectful, and attentive companion for an elderly person.
- Speak in brief, warm, easy-to-understand sentences (2-3 sentences max).
- Speak with gentle cheerfulness, comfort, and nostalgic warmth.
- Never provide formal medical diagnosis or advice.
- Celebrate small moments, reminisce gently about happy memories, family, gardening, music, and wholesome meals.${memoriesSnippet}`;

    // 3. Primary: Groq API (Ultra-fast LLM)
    if (this.groqApiKey) {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
      for (const modelName of groqModels) {
        try {
          const payload = {
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h) => ({ role: h.role, content: h.text })),
              { role: 'user', content: userMessage },
            ],
            temperature: 0.6,
            max_tokens: 200,
          };

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            let rawReply = data.choices?.[0]?.message?.content?.trim();
            // Remove internal reasoning tags if present
            rawReply = rawReply?.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            if (rawReply) {
              return {
                reply: rawReply,
                distressDetected: false,
                emotion: 'warm',
                provider: `groq (${modelName})`,
              };
            }
          }
        } catch (err) {
          console.warn(`Groq request failed with ${modelName}:`, err);
        }
      }
    }

    // 4. Secondary Fallback: Google Gemini API
    if (this.geminiApiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    ...history.slice(-4).map((h) => ({ text: `${h.role}: ${h.text}` })),
                    { text: `User: ${userMessage}` },
                  ],
                },
              ],
              generationConfig: { maxOutputTokens: 200, temperature: 0.6 },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            return {
              reply,
              distressDetected: false,
              emotion: 'warm',
              provider: 'gemini',
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API fallback failed:', err);
      }
    }

    // 5. High-quality offline conversational persona fallback
    const offlinePersonaResponses = [
      "It is always such a joy to hear from you today! You bring such a warm smile to my heart.",
      "That is wonderful to talk about. Tell me, did you get a chance to enjoy a warm cup of tea this morning?",
      "I am right here with you, listening closely. How is your garden doing today?",
      "That sounds so delightful! Remind me to remind you about having a sip of fresh water today too.",
      "You have such a kind voice. I am so glad we are spending this sunny moment together!",
    ];

    const fallbackReply =
      offlinePersonaResponses[Math.floor(Math.random() * offlinePersonaResponses.length)];

    return {
      reply: fallbackReply,
      distressDetected: false,
      emotion: 'warm',
      provider: 'offline_persona',
    };
  }

  // Text-To-Speech
  speakReply(text: string, onFinish?: () => void) {
    audioService.speak(text, onFinish);
  }

  stopSpeaking() {
    audioService.stopSpeaking();
  }
}

export const companionService = new CompanionService();
