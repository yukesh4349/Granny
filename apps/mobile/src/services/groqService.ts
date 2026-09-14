// ============================================================================
// Groq AI Cloud Service for Granny Mobile — 4 API Key Pool
// Port of web groqService.ts adapted for React Native / Expo
// ============================================================================

import { storage } from './storageService';
import { ALL_MOBILE_GAMES } from '../features/games/gamesData';

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

export interface GameItem {
  prompt: string;
  answer: string;
  choices: string[];
  emoji?: string;
  imageUrl?: string;
  explanation?: string;
}

const ENV_KEYS = [
  process.env.EXPO_PUBLIC_GROQ_API_KEY_1 || '',
  process.env.EXPO_PUBLIC_GROQ_API_KEY_2 || '',
  process.env.EXPO_PUBLIC_GROQ_API_KEY_3 || '',
  process.env.EXPO_PUBLIC_GROQ_API_KEY_4 || '',
];

const STORAGE_KEYS_POOL = 'granny_groq_keys_pool';
const STORAGE_ASKED_QUESTIONS = 'granny_asked_questions_hashes';

// Cultural images for dynamic games
const CULTURAL_IMAGES: Record<string, string[]> = {
  games: [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&auto=format&fit=crop&q=80',
  ],
  temple_village: [
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bbaa?w=600&auto=format&fit=crop&q=80',
  ],
  food_kitchen: [
    'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
  ],
  cinema_music: [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  ],
};

const MOBILE_GAME_TOPIC_RULES: Record<string, string> = {
  nondi: 'Hopscotch rules, boxes 1 to 8, single right foot balance, twin wings (squares 2 & 3), center pivot (square 4), peak "Pazham" (square 8), 180° turnaround jump, throwing pebble without touching lines.',
  kanche: 'Traditional Indian marbles (Goli Gundugal), ruby red / emerald green cat-eye / crystal marbles, center target pit in circle, thumb flicking release technique, ring boundaries.',
  gilli_danda: 'Traditional Gilli Danda (Kitti Pul), wooden danda stick, small tapered gilli, popping the gilli into the air, striking distance measured in danda lengths.',
  uriyadi: 'Festival pot-breaking game (Uriyadi), clay pot filled with curd/butter/turmeric water/coins, hanging rope, blindfolded player with long bamboo stick.',
  tyre_oattam: 'Rolling tyre with stick or wire guide, steering side taps, balancing speed and turning around village corners.',
  pattam_viduthal: 'Traditional kite flying (Pattam Viduthal), wooden thread spool (lattai), paper and tail balancing against wind, thread tension.',
  street_cricket: 'Galli / Street Tennis Ball Cricket, "One Tip One Hand" catching rule, neighbour boundary rules, brick wickets, gully fielding.',
  kabaddi: 'Traditional Kabaddi / Chadukudu, raider chanting "Kabaddi" in single breath, crossing Baulk line, tagging defenders, center midline.',
  kho_kho: 'Traditional Kho-Kho, 8 chasers sitting in center strip facing alternating opposite directions, tapping teammate back shouting "KHO!".',
  skipping_rope: 'Traditional jumping rope / Thala Koodu, soft landing on balls of feet, rhythmic jumping songs.',
  pallanguzhi: 'Traditional Pallanguzhi 14-pit wooden board (7 per side), cowrie shells / tamarind seeds, counter-clockwise sowing, "Pasu" (4 seeds), empty pit rules.',
  thaayam: 'Traditional Dayakattai / Thaayam board game, brass/bronze dice, rolling "Thaayam" (1) to enter pawns, outer and inner tracks, reaching center palace.',
  paramapadham: 'Traditional Paramapadham (Snakes and Ladders / Vaikunta Ekadasi), ladders as virtues, snakes as vices, Square 100 as Vaikunta Moksha.',
  seettu_vilayattu: 'Traditional 52-card Rummy and card games, 4 suits, pure sequence, sets, runs, joker rules.',
  carrom: 'Traditional Carrom board, white coins (1 pt), black coins (2 pts), red Queen (3 pts + cover coin), striker flick technique, boric powder.',
  movie_poster_memory: 'Vintage Tamil classic cinema posters & iconic movies (Karnan, Padagotti, Server Sundaram, Veerapandiya Kattabomman), vintage costumes.',
  ilaiyaraaja_melody: 'Maestro Ilaiyaraaja 1980s melodies, song lyrics, instruments (flute, violin, veena), singer pairings (SPB, S. Janaki, K.J. Yesudas, Chithra).',
  actor_actress_match: 'Classic Tamil legendary actors and actresses ("Nadigaiyar Thilagam" Savitri, "Nadigar Thilagam" Sivaji Ganesan, "Makkal Thilagam" MGR, "Aachi" Manorama).',
  cinema_ticket_counter: 'Classic single-screen cinema halls, Balcony vs First Class vs Floor seating, wooden "HOUSEFULL" signboards, interval snacks.',
  oliyum_oliyum: 'Doordarshan Kendra Chennai 1980s-90s TV memories, Friday 7:30 PM "Oliyum Oliyum" top songs, Sunday 4:30 PM movie, newsreaders (Shobana Ravi, Varadarajan).',
};

class GroqService {
  private currentKeyIndex = 0;
  private keyPool: string[] = [...ENV_KEYS];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    this.keyPool = [...ENV_KEYS];
    await this.mergeStoredKeys();
    await storage.setJSON(STORAGE_KEYS_POOL, this.keyPool);
    this.initialized = true;
  }

  private async mergeStoredKeys() {
    try {
      const stored = await storage.getJSON<string[]>(STORAGE_KEYS_POOL, []);
      if (Array.isArray(stored) && stored.length === 4) {
        this.keyPool = stored.map((storedKey, i) => {
          const envKey = ENV_KEYS[i];
          const candidate = storedKey?.trim();
          return (candidate && candidate.startsWith('gsk_')) ? candidate : envKey;
        });
      }
    } catch (e) {
      console.warn('Could not read stored Groq keys:', e);
      this.keyPool = [...ENV_KEYS];
    }
  }

  getKeySlots(): GroqKeySlot[] {
    return this.keyPool.map((key, index) => {
      const hasKey = Boolean(key && key.trim().startsWith('gsk_'));
      return {
        index,
        key: hasKey ? key.trim() : '',
        name: `Groq Key ${index + 1}`,
        status: hasKey ? 'ready' : 'unconfigured',
      };
    });
  }

  async saveKeys(keys: string[]) {
    const merged = ENV_KEYS.map((envKey, i) => {
      const userKey = (keys[i] || '').trim();
      return userKey.startsWith('gsk_') ? userKey : envKey;
    });
    this.keyPool = merged;
    await storage.setJSON(STORAGE_KEYS_POOL, merged);
  }

  private getNextKey(): { key: string; index: number } | null {
    const validKeys = this.keyPool
      .map((k, i) => ({ key: k?.trim(), index: i }))
      .filter(({ key }) => key && key.startsWith('gsk_'));
    if (!validKeys.length) return null;
    const slot = validKeys[this.currentKeyIndex % validKeys.length];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % validKeys.length;
    return slot;
  }

  private async hashString(str: string): Promise<string> {
    // Simple hash for question deduplication (no crypto on mobile)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async getAskedHashes(): Promise<Set<string>> {
    const arr = await storage.getJSON<string[]>(STORAGE_ASKED_QUESTIONS, []);
    return new Set(arr);
  }

  private async markQuestionAsked(questionText: string): Promise<void> {
    const hashes = await this.getAskedHashes();
    const hash = await this.hashString(questionText.toLowerCase().trim());
    hashes.add(hash);
    // Keep only last 500 hashes
    const arr = [...hashes].slice(-500);
    await storage.setJSON(STORAGE_ASKED_QUESTIONS, arr);
  }

  private async isQuestionAlreadyAsked(questionText: string): Promise<boolean> {
    const hashes = await this.getAskedHashes();
    const hash = await this.hashString(questionText.toLowerCase().trim());
    return hashes.has(hash);
  }

  async testKey(key: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    if (!key || !key.trim().startsWith('gsk_')) {
      return { success: false, latencyMs: 0, message: 'Invalid API key format' };
    }
    const start = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { success: true, latencyMs, message: `Connected! Latency: ${latencyMs}ms` };
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, latencyMs, message: err?.error?.message || `HTTP ${res.status}` };
      }
    } catch (e: any) {
      return { success: false, latencyMs: Date.now() - start, message: e?.message || 'Network error' };
    }
  }

  private async callGroq(
    messages: any[],
    preferredModel?: string
  ): Promise<{ content: string; keyIndex: number; model: string } | null> {
    await this.initialize();
    const models = preferredModel
      ? [preferredModel, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
      : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llama3-70b-8192'];

    const validKeys = this.keyPool
      .map((k, i) => ({ key: k?.trim(), index: i }))
      .filter(({ key }) => key && key.startsWith('gsk_'));

    if (!validKeys.length) {
      console.warn('No valid Groq keys found in pool');
      return null;
    }

    for (let attempt = 0; attempt < validKeys.length; attempt++) {
      const slot = validKeys[(this.currentKeyIndex + attempt) % validKeys.length];
      for (const model of models) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${slot.key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages,
              max_tokens: 800,
              temperature: 0.7,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content || '';
            this.currentKeyIndex = (slot.index + 1) % validKeys.length;
            return {
              content,
              keyIndex: slot.index,
              model,
            };
          } else if (res.status === 429) {
            console.warn(`Groq key ${slot.index + 1} rate limited (429), rotating...`);
            break; // rotate to next key
          }
        } catch (e) {
          clearTimeout(timeout);
          console.warn(`Groq call failed on key ${slot.index + 1} model ${model}:`, e);
        }
      }
    }
    return null;
  }

  // ─── Asha AI Companion ──────────────────────────────────────────────────────
  async analyzeConversation(
    userMessage: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[],
    elderProfile?: { name?: string; hobbies?: string; hometown?: string; favoriteArtists?: string }
  ): Promise<AshaAnalysisResult> {
    const elderContext = elderProfile
      ? `Elder: ${elderProfile.name || 'Dear Elder'}. Hometown: ${elderProfile.hometown || 'Tamil Nadu'}. Hobbies: ${elderProfile.hobbies || 'music, gardening'}. Favorite artists: ${elderProfile.favoriteArtists || 'M.S. Subbulakshmi, Ilaiyaraaja'}.`
      : '';

    const systemPrompt = `You are Asha, an extraordinarily warm and kind AI companion for elderly people in Tamil Nadu, India.
- Speak warmly in simple, caring English or Tamil as needed (2-3 sentences).
- Celebrate memories, music, food, family, and gardening.
- Do NOT give medical diagnoses. If health concerns arise, be gentle.
- ${elderContext}
After your warm reply, add a JSON analysis block on a new line:
ANALYSIS_JSON:{"extractedMemory":{"hasMemory":boolean,"title":"short title","content":"what they shared","tags":["tag1"],"category":"Family|Childhood|Food|Place|Hobby|Preference|General"},"healthAlert":{"isHealthConcern":boolean,"severity":"LOW|MEDIUM|HIGH|URGENT","symptom":"symptom or empty","transcriptExcerpt":"quote","recommendation":"what to do","notifyCaregiver":boolean}}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ];

    const result = await this.callGroq(messages);

    if (!result) {
      return {
        reply: "I'm right here with you, dear. Tell me, what lovely memory shall we talk about today? 🌸",
        extractedMemory: null,
        healthAlert: null,
        modelUsed: 'fallback',
        keyIndexUsed: 0,
      };
    }

    // Parse the analysis block
    const raw = result.content;
    let reply = raw;
    let extractedMemory: ExtractedMemory | null = null;
    let healthAlert: HealthAlertDetection | null = null;

    const analysisMarker = 'ANALYSIS_JSON:';
    const markerIdx = raw.indexOf(analysisMarker);
    if (markerIdx !== -1) {
      reply = raw.substring(0, markerIdx).trim();
      try {
        const jsonStr = raw.substring(markerIdx + analysisMarker.length).trim();
        const analysis = JSON.parse(jsonStr);

        if (analysis.extractedMemory?.hasMemory) {
          extractedMemory = {
            title: analysis.extractedMemory.title || 'Shared Memory',
            content: analysis.extractedMemory.content || userMessage,
            tags: analysis.extractedMemory.tags || [],
            category: analysis.extractedMemory.category || 'General',
          };
        }

        if (analysis.healthAlert?.isHealthConcern) {
          healthAlert = {
            isHealthConcern: true,
            severity: analysis.healthAlert.severity || 'LOW',
            symptom: analysis.healthAlert.symptom || '',
            transcriptExcerpt: analysis.healthAlert.transcriptExcerpt || userMessage,
            recommendation: analysis.healthAlert.recommendation || '',
            notifyCaregiver: analysis.healthAlert.notifyCaregiver || false,
          };
        }
      } catch (e) {
        console.warn('Failed to parse Asha analysis JSON:', e);
      }
    }

    return {
      reply: reply || "I'm so happy we're talking today! 🌸",
      extractedMemory,
      healthAlert,
      modelUsed: result.model,
      keyIndexUsed: result.keyIndex,
    };
  }

  // ─── Dynamic Game Question Generation ───────────────────────────────────────
  async generateGameQuestions(
    gameKey: string,
    gameTitle: string,
    category: 'outdoor' | 'indoor' | 'cinema',
    elderProfile?: { hobbies?: string; hometown?: string; name?: string },
    count = 5
  ): Promise<GameItem[]> {
    await this.initialize();

    const normalizedKey = (gameKey || '').toLowerCase().replace(/-/g, '_');
    const topicRule = MOBILE_GAME_TOPIC_RULES[normalizedKey] || `Rules, terms, and gameplay mechanics of ${gameTitle}`;

    const systemPrompt = `You are a memory quiz master creating questions for an elderly Tamil person playing the specific traditional game: "${gameTitle}" (key: ${gameKey}).

GAME TOPIC RULES & DETAILS FOR "${gameTitle}":
${topicRule}

STRICT RULE: Every single question MUST be strictly, directly, and specifically about the rules, mechanics, squares/steps, board positions, throwing/hopping/striking moves, and terms of THE GAME "${gameTitle}" (${gameKey}).
Do NOT generate questions about any other games, other sports, food, or generic trivia.
Generate exactly ${count} unique, nostalgic, culturally authentic multiple-choice questions specifically for "${gameTitle}".
Respond ONLY with a valid JSON array:
[{"prompt":"question text specifically about ${gameTitle}","answer":"correct answer","choices":["choice 1","choice 2","choice 3","choice 4"],"emoji":"single emoji","explanation":"brief warm explanation"}]
Rules:
- All 4 choices must be plausible options for "${gameTitle}"
- Answer must be one of the choices
- Keep questions warm, clear, and achievable`;

    const messages = [{ role: 'user', content: systemPrompt }];
    const result = await this.callGroq(messages);

    if (!result) return this.getFallbackItems(gameKey, count);

    try {
      // Extract JSON array from response
      const raw = result.content;
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start === -1 || end === -1) return this.getFallbackItems(gameKey, count);

      const jsonStr = raw.substring(start, end + 1);
      const parsed: GameItem[] = JSON.parse(jsonStr);

      // Filter already-asked questions
      const fresh: GameItem[] = [];
      for (const item of parsed) {
        const alreadyAsked = await this.isQuestionAlreadyAsked(item.prompt);
        if (!alreadyAsked) fresh.push(item);
      }

      const finalItems = fresh.length > 0 ? fresh : parsed;

      // Mark all as asked
      for (const item of finalItems) {
        await this.markQuestionAsked(item.prompt);
      }

      // Add cultural images
      const imagePool = category === 'cinema' ? CULTURAL_IMAGES.cinema_music : CULTURAL_IMAGES.games;
      return finalItems.map((item, i) => ({
        ...item,
        imageUrl: imagePool[i % imagePool.length],
      }));

    } catch (e) {
      console.warn('Failed to parse generated game questions:', e);
      return this.getFallbackItems(gameKey, count);
    }
  }

  private getFallbackItems(gameKey: string, count: number): GameItem[] {
    // Find matching game from authentic 20-game database
    const matchingGame = ALL_MOBILE_GAMES.find(g => g.key.toLowerCase() === gameKey.toLowerCase());
    if (matchingGame && matchingGame.items && matchingGame.items.length > 0) {
      return matchingGame.items.slice(0, count).map(it => ({
        prompt: it.prompt,
        answer: it.answer,
        choices: it.choices,
        emoji: it.emoji,
      }));
    }

    // Default fallback
    return [
      { prompt: 'In Nondi (hopscotch), what is the traditional name for the final peak square?', answer: 'Pazham (Peak)', choices: ['Pazham (Peak)', 'Veedu (Home)', 'Thotti (Garden)', 'Maram (Tree)'], emoji: '🦶' },
      { prompt: 'In Nondi, after tossing the pebble into Square 1, how do you jump?', answer: 'Single Right Foot Jump', choices: ['Single Right Foot Jump', 'Both Feet Flat', 'Backwards Hop', 'Double Hand Balance'], emoji: '🦶' }
    ].slice(0, count);
  }

  async clearQuestionHistory(): Promise<void> {
    await storage.removeItem(STORAGE_ASKED_QUESTIONS);
  }
}

export const groqService = new GroqService();
