// ============================================================================
// Groq AI Cloud Service with 4 API Keys Pool & Dynamic Generation
// - 4 API Key Intelligent Pool (Rotation, Rate-limit Fallback, Slot Status)
// - Dynamic Non-Repeating Game Question Generation tailored to Elder Profile
// - Conversation Memory Extraction & Critical Health Alert Detection
// ============================================================================

import type { GameItem } from '../features/games/engine/types';

export interface GroqKeySlot {
  index: number;
  key: string;
  name: string;
  status: 'active' | 'rate_limited' | 'error' | 'unconfigured' | 'ready';
  lastUsed?: string;
  latencyMs?: number;
}

export interface ExtractedMemory {
  title: string;
  content: string;
  tags: string[];
  category: 'Childhood' | 'Family' | 'Food' | 'Place' | 'Hobby' | 'Preference' | 'General';
}

export interface HealthAlertDetection {
  isHealthConcern: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  symptom: string;
  transcriptExcerpt: string;
  recommendation: string;
  notifyCaregiver: boolean;
}

export interface AshaAnalysisResult {
  reply: string;
  extractedMemory: ExtractedMemory | null;
  healthAlert: HealthAlertDetection | null;
  modelUsed: string;
  keyIndexUsed: number;
}

// ─── Default Keys & Environment Initialization ────────────────────────────────
// Loaded securely from environment variables (.env)
const ENV_GROQ_1 = import.meta.env.VITE_GROQ_API_KEY_1 || import.meta.env.EXPO_PUBLIC_GROQ_API_KEY_1 || '';
const ENV_GROQ_2 = import.meta.env.VITE_GROQ_API_KEY_2 || import.meta.env.EXPO_PUBLIC_GROQ_API_KEY_2 || '';
const ENV_GROQ_3 = import.meta.env.VITE_GROQ_API_KEY_3 || import.meta.env.EXPO_PUBLIC_GROQ_API_KEY_3 || '';
const ENV_GROQ_4 = import.meta.env.VITE_GROQ_API_KEY_4 || import.meta.env.EXPO_PUBLIC_GROQ_API_KEY_4 || '';


const ENV_KEYS = [ENV_GROQ_1, ENV_GROQ_2, ENV_GROQ_3, ENV_GROQ_4];

const STORAGE_KEYS_POOL = 'granny_groq_keys_pool';
const STORAGE_ASKED_QUESTIONS = 'granny_asked_questions_hashes';

// Curated high-res cultural images for dynamic games
const CULTURAL_IMAGES: Record<string, string[]> = {
  games: [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  ],
  temple_village: [
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bbaa?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=600&auto=format&fit=crop&q=80',
  ],
  food_kitchen: [
    'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80',
  ],
  cinema_music: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  ],
  family: [
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
  ]
};

class GroqService {
  private currentKeyIndex = 0;
  private keyPool: string[] = [...ENV_KEYS];

  constructor() {
    // Always start with env keys. Clear any stale localStorage that has empty slots.
    this.keyPool = [...ENV_KEYS];
    this.mergeStoredKeys();
    // Persist merged result so future loads are consistent
    localStorage.setItem(STORAGE_KEYS_POOL, JSON.stringify(this.keyPool));
  }

  /** Merge any user-saved keys with env defaults (env keys take priority if stored slot is empty) */
  private mergeStoredKeys() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS_POOL);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 4) {
          this.keyPool = parsed.map((storedKey, i) => {
            // Prefer stored key only if it's a valid gsk_ key AND different from env
            const envKey = ENV_KEYS[i];
            const candidate = storedKey?.trim();
            return (candidate && candidate.startsWith('gsk_')) ? candidate : envKey;
          });
        }
      }
    } catch (e) {
      console.warn('Could not read stored Groq keys:', e);
      this.keyPool = [...ENV_KEYS];
    }
  }

  /** Get all 4 Groq key slots with status */
  getKeySlots(): GroqKeySlot[] {
    return this.keyPool.map((key, index) => {
      const hasKey = Boolean(key && key.trim().startsWith('gsk_'));
      return {
        index,
        key: hasKey ? key : '',
        name: `Groq API Key #${index + 1}${index === 0 ? ' (Primary)' : ''}`,
        status: hasKey ? (index === this.currentKeyIndex ? 'active' : 'ready') : 'unconfigured',
      };
    });
  }

  /** Update all 4 Groq keys (user override from settings) */
  saveKeys(keys: string[]) {
    const formatted = keys.map((k, i) => (k?.trim().startsWith('gsk_') ? k.trim() : ENV_KEYS[i] || ''));
    this.keyPool = formatted;
    localStorage.setItem(STORAGE_KEYS_POOL, JSON.stringify(formatted));
  }

  /** Test a specific Groq key to verify connectivity */
  async testKey(key: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!key || !key.trim()) {
      return { success: false, latencyMs: 0, message: 'Key is empty' };
    }
    const start = performance.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Say "OK" in 1 word.' }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Math.round(performance.now() - start);
      if (res.ok) {
        return { success: true, latencyMs, message: `Connected! Latency: ${latencyMs}ms` };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, latencyMs, message: err?.error?.message || `HTTP ${res.status}` };
      }
    } catch (e: any) {
      return { success: false, latencyMs: Math.round(performance.now() - start), message: e?.message || 'Network error' };
    }
  }

  /** Execute a Groq completion with 4-key pool round-robin & instant fallback */
  private async callGroq(
    systemPrompt: string,
    userPrompt: string,
    options: { temperature?: number; max_tokens?: number; response_format?: { type: 'json_object' } } = {}
  ): Promise<{ text: string; keyIndexUsed: number; model: string }> {
    // Keys are managed in constructor — no reload needed here

    // Find all valid configured keys
    const validIndices = this.keyPool
      .map((k, i) => (k && k.trim().length > 10 ? i : -1))
      .filter(i => i >= 0);

    if (validIndices.length === 0) {
      throw new Error('No Groq API keys configured. Please add a Groq API key in Settings.');
    }

    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let lastError: any = null;

    // Try starting from current index, rotate across pool
    for (let attempt = 0; attempt < validIndices.length; attempt++) {
      const activeIdx = validIndices[(this.currentKeyIndex + attempt) % validIndices.length];
      const apiKey = this.keyPool[activeIdx];

      for (const model of models) {
        try {
          const body: any = {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: options.temperature ?? 0.6,
            max_tokens: options.max_tokens ?? 800,
          };

          if (options.response_format) {
            body.response_format = options.response_format;
          }

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (res.status === 429) {
            console.warn(`Groq Key #${activeIdx + 1} hit rate limit (429), rotating to next key slot...`);
            break; // Try next key
          }

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || '';
            // Advance round-robin index for next call
            this.currentKeyIndex = (activeIdx + 1) % this.keyPool.length;
            return { text, keyIndexUsed: activeIdx, model };
          } else {
            const err = await res.json().catch(() => ({}));
            lastError = new Error(err?.error?.message || `HTTP ${res.status}`);
          }
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    throw lastError || new Error('All Groq API keys in the pool failed.');
  }

  // ─── Question Deduplication History ──────────────────────────────────────────
  private getAskedHashes(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_ASKED_QUESTIONS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private recordAskedQuestions(questions: string[]) {
    try {
      const existing = this.getAskedHashes();
      questions.forEach(q => {
        const hash = q.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
        existing.add(hash);
      });
      // Keep last 500 questions in memory
      const arr = Array.from(existing).slice(-500);
      localStorage.setItem(STORAGE_ASKED_QUESTIONS, JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to record question hash:', e);
    }
  }

  /**
   * Dynamically generate 100% novel, non-repeating game items tailored to the elderly user
   * Combines elder profile, Caretaker memories, hometown, and game theme
   */
  async generateDynamicGameItems(
    gameKey: string,
    gameTitle: string,
    elderProfile: { name: string; hometown?: string; memories?: any[]; notes?: string; language?: string },
    count: number = 4
  ): Promise<GameItem[]> {
    const lang = elderProfile.language || 'en';
    const askedSet = this.getAskedHashes();

    const memoriesText = elderProfile.memories && elderProfile.memories.length > 0
      ? elderProfile.memories.map(m => `- ${m.title}: ${m.content}`).join('\n')
      : 'Madurai temple wedding in 1975, childhood village bullock cart rides, filter coffee, Carnatic music, terrace gardening.';

    const systemPrompt = `You are the master cognitive game designer for "Granny", an app for elderly Indian grandparents (தாத்தா & பாட்டி).
Generate ${count + 2} completely UNIQUE, high-warmth, nostalgic cognitive questions for the game "${gameTitle}" (${gameKey}).

CRITICAL REQUIREMENTS:
1. Cultural resonance: Tamil Nadu / South Indian heritage, vintage 1960s-1990s nostalgia, traditional games, kitchen aromas, old cinema, temple bells, festivals (Pongal, Deepavali), family life.
2. Customize gently using the elder's details:
- Elder Name: ${elderProfile.name}
- Family Memories & Notes: ${memoriesText}
3. Language: ${lang === 'ta' ? 'Write the questions and choices in pure, warm Tamil (தமிழ்)' : 'Write in warm, clear English with occasional friendly Tamil cultural terms'}.
4. Provide exactly 4 options per question: 1 correct answer and 3 distinct, plausible, respectful distractors.
5. Provide a contextual emoji and short memory hook for each.
6. Return ONLY valid JSON with this exact schema:
{
  "items": [
    {
      "question": "string",
      "correctAnswer": "string",
      "distractors": ["string", "string", "string"],
      "objectName": "string",
      "emoji": "string",
      "imageCategory": "games" | "temple_village" | "food_kitchen" | "cinema_music" | "family",
      "explanation": "string"
    }
  ]
}`;

    const userPrompt = `Generate ${count + 2} fresh, never-before-seen questions for ${gameTitle}. Make sure every question is novel, heartwarming, and enjoyable for ${elderProfile.name}.`;

    try {
      const response = await this.callGroq(systemPrompt, userPrompt, {
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 1200,
      });

      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Filter out any already asked questions
        const novelItems = parsed.items.filter((item: any) => {
          const hash = (item.question || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
          return !askedSet.has(hash);
        });

        const selected = (novelItems.length >= count ? novelItems : parsed.items).slice(0, count);

        // Record questions to prevent repeats
        this.recordAskedQuestions(selected.map((i: any) => i.question));

        return selected.map((item: any, idx: number) => {
          const category = item.imageCategory || 'games';
          const imgList = CULTURAL_IMAGES[category] || CULTURAL_IMAGES.games;
          const imageUrl = imgList[idx % imgList.length];

          // Shuffle choices
          const allChoices = [item.correctAnswer, ...(item.distractors || [])].sort(() => Math.random() - 0.5);

          return {
            index: idx,
            type: 'recall',
            prompt: item.question,
            choices: allChoices,
            correctAnswer: item.correctAnswer,
            metadata: {
              object: item.objectName || item.question.slice(0, 30),
              emoji: item.emoji || '🌸',
              correctAnswer: item.correctAnswer,
              imageUrl,
              explanation: item.explanation,
              aiGenerated: true,
            },
          };
        });
      }
    } catch (e) {
      console.warn('Groq dynamic question generation error, using smart fallback pool:', e);
    }

    // Fallback: Return varied items and mark them asked
    return this.getFallbackNovelGameItems(gameKey, count, lang);
  }

  /**
   * Smart fallback generator with variety & anti-repetition tracking
   */
  private getFallbackNovelGameItems(gameKey: string, count: number, lang: string): GameItem[] {
    const askedSet = this.getAskedHashes();

    const samplePool: Record<string, any[]> = {
      nondi: [
        { q: lang === 'ta' ? 'நொண்டியில் கட்டம் 1ல் கல் விழுந்ததும் எந்தக் காலில் தாவி நிற்க வேண்டும்?' : 'In Nondi (Hopscotch), when your pebble lands in Square 1, how do you jump?', a: lang === 'ta' ? 'ஒற்றை வலது கால் தாளம்' : 'Single Right Foot Balance', d: [lang === 'ta' ? 'இரண்டு கால்களும் ஒரே நேரத்தில்' : 'Both Feet Flat', lang === 'ta' ? 'பின்னோக்கி குதித்தல்' : 'Backwards Hop', lang === 'ta' ? 'கைகளால் சமநிலை' : 'Double Hand Support'], e: '🦶' },
        { q: lang === 'ta' ? 'நடுவண் கட்டம் 4ஐத் தாண்டிய பின் இரட்டை இறக்கைகள் எந்தக் கட்டங்கள்?' : 'Which squares form the double wings after passing the central pivot?', a: lang === 'ta' ? 'கட்டம் 5 மற்றும் 6' : 'Squares 5 and 6', d: [lang === 'ta' ? 'கட்டம் 1 மற்றும் 2' : 'Squares 1 and 2', lang === 'ta' ? 'கட்டம் 7 மற்றும் 8' : 'Squares 7 and 8', lang === 'ta' ? 'கட்டம் 3 மட்டும்' : 'Square 3 only'], e: '🦵' },
        { q: lang === 'ta' ? 'உச்சி "பழம்" (கட்டம் 8) அடைந்ததும் எல்லைக் கோட்டைத் தொடாமல் என்ன செய்ய வேண்டும்?' : 'What must you execute at the top peak (Square 8) without touching lines?', a: lang === 'ta' ? '180° சுழற்சி தாவல்' : '180° Turnaround Jump', d: [lang === 'ta' ? 'வெளியேறி அமர்தல்' : 'Step outside grid', lang === 'ta' ? 'கல்லை உதைத்தல்' : 'Kick pebble away', lang === 'ta' ? 'விளையாட்டை முடித்தல்' : 'Stop instantly'], e: '🎯' },
        { q: lang === 'ta' ? 'பாரம்பரிய நொண்டிக் கோடு வரைய அக்காலத்தில் எதைப் பயன்படுத்தினர்?' : 'What traditional material was used to draw the Nondi grid in the village courtyard?', a: lang === 'ta' ? 'செங்கல் பொடி அல்லது சாக்பீஸ்' : 'Red Brick Powder or Chalk', d: [lang === 'ta' ? 'எண்ணெய் வண்ணம்' : 'Oil Paint', lang === 'ta' ? 'பிளாஸ்டிக் டேப்' : 'Plastic Tape', lang === 'ta' ? 'கருப்பு மை' : 'Black Ink'], e: '🧱' },
      ],
      default: [
        { q: lang === 'ta' ? 'திருவிழா காலங்களில் வாசலில் போடப்படும் மாக்கோலத்தின் சிறப்பு என்ன?' : 'What is the auspicious significance of rice-flour Kolam at the front entrance?', a: lang === 'ta' ? 'எறும்புகளுக்கும் சிற்றுயிர்களுக்கும் உணவளிக்கும் தர்மம்' : 'Welcoming prosperity & feeding tiny birds/ants', d: [lang === 'ta' ? 'அலங்காரம் மட்டுமே' : 'Only for decoration', lang === 'ta' ? 'தூசியைத் தடுக்க' : 'To block dust', lang === 'ta' ? 'வண்ண விளக்குகளுக்குப் பதிலாக' : 'Instead of lights'], e: '🌸' },
        { q: lang === 'ta' ? 'பாரம்பரியக் கூட்டுக்கு வாசம் சேர்க்கும் பித்தளைத் தாளிப்பு கரண்டி பெயர் என்ன?' : 'Which traditional brass vessel is used to temper fragrant mustard and curry leaves?', a: lang === 'ta' ? 'தாளிப்புக் கரண்டி (Tadka Pan)' : 'Brass Tadka Pan', d: [lang === 'ta' ? 'இட்லி பாத்திரம்' : 'Idli Cooker', lang === 'ta' ? 'அடை தவா' : 'Adai Tawa', lang === 'ta' ? 'காபி பில்டர்' : 'Coffee Filter'], e: '🍳' },
        { q: lang === 'ta' ? 'கும்பகோணம் டிகிரி காபியின் நறுமணத்திற்கு முக்கிய காரணம் என்ன?' : 'What gives authentic Kumbakonam Degree Coffee its rich aroma?', a: lang === 'ta' ? 'தூய பசும்பால் மற்றும் முதல் டிகாஷன்' : 'Pure rich cow milk and first fresh decoction', d: [lang === 'ta' ? 'அதிக சர்க்கரை' : 'Heavy refined sugar', lang === 'ta' ? 'குளிர்ந்த நீர்' : 'Cold chilled water', lang === 'ta' ? 'தேயிலை பொடி' : 'Tea powder mix'], e: '☕' },
        { q: lang === 'ta' ? 'மாலை நேரத்தில் வராண்டாவில் பாட்டி பாடும் இனிமையான தாலாட்டுப் பாடல் எது?' : 'Which timeless lullaby was sung by Grandma on the breezy porch swing?', a: lang === 'ta' ? 'ஆராரோ ஆரிரரோ கண்ணே' : 'Aararo Aariraro Traditional Lullaby', d: [lang === 'ta' ? 'வேகமான பாப் பாடல்' : 'Fast Pop Song', lang === 'ta' ? 'மேற்கத்திய இசை' : 'Western Rock', lang === 'ta' ? 'மவுன விரதம்' : 'Silence'], e: '🎶' },
      ]
    };

    const pool = samplePool[gameKey] || samplePool.default;
    const novel = pool.filter(item => {
      const hash = item.q.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
      return !askedSet.has(hash);
    });

    const chosen = (novel.length >= count ? novel : pool).slice(0, count);
    this.recordAskedQuestions(chosen.map(c => c.q));

    return chosen.map((item, idx) => ({
      index: idx,
      type: 'recall',
      prompt: item.q,
      choices: [item.a, ...item.d].sort(() => Math.random() - 0.5),
      correctAnswer: item.a,
      metadata: {
        object: item.q.slice(0, 25),
        emoji: item.e,
        correctAnswer: item.a,
        imageUrl: CULTURAL_IMAGES.games[idx % CULTURAL_IMAGES.games.length],
      },
    }));
  }

  // ─── Asha Dual-Output Analyzer: Empathetic Chat + Memory Extraction + Health Alerts ──
  async analyzeElderMessage(
    userMessage: string,
    elderProfile: { name: string; hometown?: string; healthNotes?: string; caregiverEmail?: string; language?: string },
    history: { role: 'user' | 'assistant'; text: string }[] = []
  ): Promise<AshaAnalysisResult> {
    const lang = elderProfile.language || 'en';

    // 1. Fast regex health check for immediate critical safety
    const criticalHealthRegex = /(chest pain|cannot breathe|can't breathe|fell down|fallen|severe pain|dizzy|fainting|bleeding|forgot medicine|heart racing|scared|lost|மயக்கம்|நெஞ்சு வலி|கீழே விழுந்து|மூச்சு விட முடியல|மருந்து மறந்தது)/i;
    const hasCriticalMention = criticalHealthRegex.test(userMessage);

    const systemPrompt = `You are "Asha", an extraordinarily warm, affectionate, culturally respectful Indian voice and chat companion for an elderly person (தாத்தா / பாட்டி named ${elderProfile.name}).

Your tasks:
1. "reply": Speak in 2-3 warm, soothing, empathetic sentences in ${lang === 'ta' ? 'Tamil (தமிழ்)' : 'English'}. Be affectionate and reassuring.
2. "extractedMemory": If the elder mentions any personal fact, favorite food, family member, past story, hometown memory, or daily preference, extract it as an object with title, content, tags, and category. If nothing new, return null.
3. "healthAlert": Analyze if the elder expressed any physical pain, dizziness, fall, missed medicine, shortness of breath, anxiety, extreme loneliness, or health issue. If so, create an alert object with severity ('LOW', 'MEDIUM', 'HIGH', 'URGENT'), symptom summary, transcript excerpt, and whether to notify the caregiver. If completely normal conversation, return null.

Return ONLY valid JSON matching this schema:
{
  "reply": "string",
  "extractedMemory": {
    "title": "string",
    "content": "string",
    "tags": ["string"],
    "category": "Childhood" | "Family" | "Food" | "Place" | "Hobby" | "Preference" | "General"
  } | null,
  "healthAlert": {
    "isHealthConcern": boolean,
    "severity": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "symptom": "string",
    "transcriptExcerpt": "string",
    "recommendation": "string",
    "notifyCaregiver": boolean
  } | null
}`;

    const conversationSnippet = history.slice(-4).map(h => `${h.role}: ${h.text}`).join('\n');
    const userPrompt = `Previous context:\n${conversationSnippet}\n\nElder says: "${userMessage}"`;

    try {
      const response = await this.callGroq(systemPrompt, userPrompt, {
        temperature: 0.5,
        response_format: { type: 'json_object' },
        max_tokens: 600,
      });

      const parsed = JSON.parse(response.text);

      // Enforce critical health alert if regex caught it even if LLM missed
      let healthAlert = parsed.healthAlert;
      if (hasCriticalMention && (!healthAlert || !healthAlert.isHealthConcern)) {
        healthAlert = {
          isHealthConcern: true,
          severity: 'HIGH',
          symptom: 'Elder reported immediate physical symptom or distress in conversation.',
          transcriptExcerpt: userMessage,
          recommendation: 'Check on elder immediately via phone or visit. Verify vital signs and medication.',
          notifyCaregiver: true,
        };
      }

      return {
        reply: parsed.reply || (lang === 'ta' ? 'நான் உங்களுடன் இருக்கிறேன் தாத்தா/பாட்டி. சொல்லுங்கள், நான் கேட்கிறேன்.' : "I'm right here with you, dear. I am listening with all my heart."),
        extractedMemory: parsed.extractedMemory || null,
        healthAlert: healthAlert && healthAlert.isHealthConcern ? healthAlert : null,
        modelUsed: response.model,
        keyIndexUsed: response.keyIndexUsed,
      };
    } catch (e) {
      console.warn('Groq conversation analysis error, falling back to rule-based engine:', e);

      // Fallback
      let healthAlert: HealthAlertDetection | null = null;
      if (hasCriticalMention) {
        healthAlert = {
          isHealthConcern: true,
          severity: 'HIGH',
          symptom: 'Elder reported health symptom/distress during conversation.',
          transcriptExcerpt: userMessage,
          recommendation: 'Please contact elder promptly to confirm their health status.',
          notifyCaregiver: true,
        };
      }

      return {
        reply: lang === 'ta'
          ? 'நான் உங்கள் பேச்சைக் கனிவோடு கேட்கிறேன். நீங்கள் சொல்வது என் மனதிற்கு மகிழ்ச்சி தருகிறது தாத்தா/பாட்டி.'
          : "I am listening to you with so much warmth and care. You are always cherished here.",
        extractedMemory: null,
        healthAlert,
        modelUsed: 'local_safety_fallback',
        keyIndexUsed: this.currentKeyIndex,
      };
    }
  }
}

export const groqService = new GroqService();
