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

const GAME_TOPIC_RULES: Record<string, string> = {
  nondi: 'Hopscotch rules, boxes 1 to 8, single right foot balance, twin wings (squares 2 & 3), center pivot (square 4), peak "Pazham" (square 8), 180° turnaround jump, throwing pebble without touching lines, drawing chalk/brick grid.',
  kanche: 'Traditional Indian marbles (Goli Gundugal), ruby red / emerald green cat-eye / crystal marbles, center target pit in circle, thumb flicking release technique, ring boundaries and striking rules.',
  gilli_danda: 'Traditional Gilli Danda (Kitti Pul), wooden danda stick, small tapered gilli, popping the gilli into the air, striking distance measured in danda lengths, fielding catches.',
  uriyadi: 'Festival pot-breaking game (Uriyadi), clay pot filled with curd/butter/turmeric water/coins, hanging rope pulled up and down, blindfolded player with long bamboo stick.',
  tyre_oattam: 'Rolling bicycle/scooter tyre with stick or bent wire guide, steering side taps, balancing speed and turning around village corners.',
  pattam_viduthal: 'Traditional kite flying (Pattam Viduthal), wooden thread spool (lattai), paper and tail balancing against wind, thread tension and rooftop flying.',
  street_cricket: 'Galli / Street Tennis Ball Cricket, "One Tip One Hand" catching rule, neighbour window/compound wall boundary rules, brick/wall wickets, gully fielding.',
  kabaddi: 'Traditional Kabaddi / Chadukudu, raider chanting "Kabaddi" in single breath, crossing Baulk line, tagging defenders, anti-struggle to cross center midline.',
  kho_kho: 'Traditional Kho-Kho, 8 chasers sitting in center strip facing alternating opposite directions, tapping teammate back shouting "KHO!", single-direction chasing.',
  skipping_rope: 'Traditional jumping rope / Thala Koodu, soft landing on balls of feet, rhythmic jumping songs, double dutch teamwork.',
  pallanguzhi: 'Traditional Pallanguzhi 14-pit wooden board (7 per side), cowrie shells / tamarind seeds (5 per pit), counter-clockwise sowing, "Pasu" (4 seeds in pit), claiming seeds from empty pit sequence.',
  thaayam: 'Traditional Dayakattai / Thaayam board game, brass/bronze dice, rolling "Thaayam" (1) to enter pawns, outer and inner tracks, capturing opponent pieces, reaching center palace.',
  paramapadham: 'Traditional Paramapadham (Snakes and Ladders / Vaikunta Ekadasi), ladders as virtues (climbing up), snakes as vices (sliding down), Square 100 as Vaikunta Moksha / liberation.',
  seettu_vilayattu: 'Traditional 52-card Rummy and card games, 4 suits (Spades, Hearts, Diamonds, Clubs), pure sequence, sets, runs, joker rules.',
  carrom: 'Traditional Carrom board, white coins (1 pt), black coins (2 pts), red Queen (3 pts + cover coin), striker flick technique, boric powder for smooth sliding.',
  movie_poster_memory: 'Vintage Tamil classic cinema posters & iconic movies (Karnan, Padagotti, Server Sundaram, Veerapandiya Kattabomman, Rickshawkaran), vintage costumes, title fonts.',
  ilaiyaraaja_melody: 'Maestro Ilaiyaraaja 1980s melodies, song lyrics, instruments (flute, violin, veena), singer pairings (SPB, S. Janaki, K.J. Yesudas, Chithra, Malaysia Vasudevan).',
  actor_actress_match: 'Classic Tamil legendary actors and actresses ("Nadigaiyar Thilagam" Savitri, "Nadigar Thilagam" Sivaji Ganesan, "Makkal Thilagam" MGR, "Aachi" Manorama, Rajinikanth, Kamal Haasan).',
  cinema_ticket_counter: 'Classic single-screen cinema halls, Balcony vs First Class vs Floor seating, wooden "HOUSEFULL" signboards, interval samosa and rose milk, show opening bells.',
  oliyum_oliyum: 'Doordarshan Kendra Chennai 1980s-90s TV memories, Friday 7:30 PM "Oliyum Oliyum" top songs, Sunday 4:30 PM movie, newsreaders (Shobana Ravi, Varadarajan), TV antenna adjustment.',
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
          model: 'groq/compound-mini',
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

    const models = [
      'groq/compound-mini',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'groq/compound',
      'openai/gpt-oss-120b'
    ];
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
   * Dynamically generate 100% novel, non-repeating game items tailored strictly to the chosen game
   */
  async generateDynamicGameItems(
    gameKey: string,
    gameTitle: string,
    elderProfile: { name: string; hometown?: string; memories?: any[]; notes?: string; language?: string },
    count: number = 4
  ): Promise<GameItem[]> {
    const lang = elderProfile.language || 'en';
    const askedSet = this.getAskedHashes();

    const normalizedKey = (gameKey || '').toLowerCase().replace(/-/g, '_');
    const gameRuleGuide = GAME_TOPIC_RULES[normalizedKey] || `Rules, terms, steps, and nostalgic gameplay strictly of ${gameTitle}`;

    const systemPrompt = `You are the master cognitive game designer for "Granny", an app for elderly Indian grandparents (தாத்தா & பாட்டி).
Generate ${count + 2} completely UNIQUE multiple-choice memory questions STRICTLY AND EXCLUSIVELY for the specific game "${gameTitle}" (${gameKey}).

GAME TOPIC RULES & DETAILS FOR "${gameTitle}":
${gameRuleGuide}

CRITICAL RULES:
1. STRICT TOPIC FOCUS: Every single question and choice MUST be 100% directly about "${gameTitle}" (${gameKey}) and its specific rules/mechanics outlined above.
2. ZERO OFF-TOPIC QUESTIONS: Do NOT ask general questions about food, weddings, other sports, or unrelated topics. ONLY ask questions testing knowledge and memories of "${gameTitle}".
3. Language: ${lang === 'ta' ? 'Write the questions and choices in pure, warm Tamil (தமிழ்)' : 'Write in warm, clear English with occasional friendly Tamil cultural terms'}.
4. Provide exactly 4 options per question: 1 correct answer and 3 distinct, plausible, respectful distractors strictly related to "${gameTitle}".
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
      "imageCategory": "games",
      "explanation": "string"
    }
  ]
}`;

    const userPrompt = `Generate ${count + 2} fresh questions strictly about the traditional game "${gameTitle}" (${gameKey}) for an elderly player named ${elderProfile.name}. Language: ${lang}.`;

    try {
      const response = await this.callGroq(systemPrompt, userPrompt, {
        temperature: 0.6,
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
        { q: lang === 'ta' ? 'நடுவண் கட்டம் 4ஐத் தாண்டிய பின் இரட்டை இறக்கைகள் எந்தக் கட்டங்கள்?' : 'Which squares form the double wings after passing the central pivot in Nondi?', a: lang === 'ta' ? 'கட்டம் 5 மற்றும் 6' : 'Squares 5 and 6', d: [lang === 'ta' ? 'கட்டம் 1 மற்றும் 2' : 'Squares 1 and 2', lang === 'ta' ? 'கட்டம் 7 மற்றும் 8' : 'Squares 7 and 8', lang === 'ta' ? 'கட்டம் 3 மட்டும்' : 'Square 3 only'], e: '🦵' },
        { q: lang === 'ta' ? 'நொண்டியில் உச்சி "பழம்" (கட்டம் 8) அடைந்ததும் எல்லைக் கோட்டைத் தொடாமல் என்ன செய்ய வேண்டும்?' : 'In Nondi, what must you execute at the top peak "Pazham" (Square 8) without touching lines?', a: lang === 'ta' ? '180° சுழற்சி தாவல்' : '180° Turnaround Jump', d: [lang === 'ta' ? 'வெளியேறி அமர்தல்' : 'Step outside grid', lang === 'ta' ? 'கல்லை உதைத்தல்' : 'Kick pebble away', lang === 'ta' ? 'விளையாட்டை முடித்தல்' : 'Stop instantly'], e: '🎯' },
        { q: lang === 'ta' ? 'பாரம்பரிய நொண்டிக் கோடு வரைய அக்காலத்தில் எதைப் பயன்படுத்தினர்?' : 'What traditional material was used to draw the Nondi grid in the village courtyard?', a: lang === 'ta' ? 'செங்கல் பொடி அல்லது சாக்பீஸ்' : 'Red Brick Powder or Chalk', d: [lang === 'ta' ? 'எண்ணெய் வண்ணம்' : 'Oil Paint', lang === 'ta' ? 'பிளாஸ்டிக் டேப்' : 'Plastic Tape', lang === 'ta' ? 'கருப்பு மை' : 'Black Ink'], e: '🧱' },
      ],
      kanche: [
        { q: lang === 'ta' ? 'கோலி குண்டு விளையாட்டில் வட்டத்தின் நடுவில் வைக்கப்படும் முக்கிய கோலி எது?' : 'In Kanche, which target marble rests in the center pit?', a: lang === 'ta' ? 'பச்சை நிற பூனைக்கண் கோலி' : 'Emerald Green Cat-Eye Marble', d: [lang === 'ta' ? 'வெள்ளை கோலி' : 'White Marble', lang === 'ta' ? 'கருப்பு கோலி' : 'Black Marble', lang === 'ta' ? 'மஞ்சள் கோலி' : 'Yellow Marble'], e: '🟢' },
        { q: lang === 'ta' ? 'கோலியை குறிபார்த்து விரலால் சுண்டும் முறைக்கு என்ன பெயர்?' : 'What is the traditional thumb flicking technique called in Kanche?', a: lang === 'ta' ? 'கட்டை விரல் சுண்டு வித்தை' : 'Thumb Release Flick', d: [lang === 'ta' ? 'கால் உதை' : 'Foot Kick', lang === 'ta' ? 'கை தட்டு' : 'Hand Clap', lang === 'ta' ? 'கம்பால் அடித்தல்' : 'Stick Strike'], e: '🎯' },
      ],
      gilli_danda: [
        { q: lang === 'ta' ? 'கிட்டிப்புல் விளையாட்டில் சிறிய மரத்துண்டை மேலே எழும்ப வைக்க என்ன செய்ய வேண்டும்?' : 'In Gilli Danda, how do you pop the small gilli into the air?', a: lang === 'ta' ? 'தாண்டாவால் முனையை லேசாகத் தட்ட வேண்டும்' : 'Tap tapered tip with the Danda stick', d: [lang === 'ta' ? 'கையால் எறிய வேண்டும்' : 'Throw with hand', lang === 'ta' ? 'காலால் மிதிக்க வேண்டும்' : 'Step with foot', lang === 'ta' ? 'மணலில் புதைக்க வேண்டும்' : 'Bury in sand'], e: '🏏' },
        { q: lang === 'ta' ? 'கிட்டிப்புல் தூரத்தை அக்காலத்தில் எதனால் அளந்தனர்?' : 'How was the hitting distance measured in traditional Gilli Danda?', a: lang === 'ta' ? 'தாண்டா மரக்குச்சியின் நீளத்தால்' : 'Length of Danda Stick', d: [lang === 'ta' ? 'கடிகார மணியால்' : 'Clock Hours', lang === 'ta' ? 'கிலோகிராம் எடையால்' : 'Kilograms', lang === 'ta' ? 'ரூபாய் நோட்டால்' : 'Currency Notes'], e: '📏' },
      ],
      uriyadi: [
        { q: lang === 'ta' ? 'உறியடி திருவிழாவில் பானையில் என்னென்ன பொருட்கள் நிரப்பப்படும்?' : 'In Uriyadi, what traditional items are placed inside the clay pot?', a: lang === 'ta' ? 'தயிர், வெண்ணெய், மஞ்சள் நீர் மற்றும் நாணயங்கள்' : 'Curd, butter, turmeric water and coins', d: [lang === 'ta' ? 'மணல் மற்றும் கல்' : 'Sand and stones', lang === 'ta' ? 'எண்ணெய் மட்டும்' : 'Only oil', lang === 'ta' ? 'வெற்று பானை' : 'Empty pot'], e: '🏺' },
        { q: lang === 'ta' ? 'உறியடி விளையாட்டின் போது கண் கட்டப்பட்டு எந்தக் கருவியால் பானையை உடைப்பார்கள்?' : 'With eyes blindfolded, what instrument is used to strike the pot in Uriyadi?', a: lang === 'ta' ? 'நீண்ட மூங்கில் கம்பு' : 'Long Bamboo Stick', d: [lang === 'ta' ? 'இரும்பு கம்பி' : 'Iron Rod', lang === 'ta' ? 'மரப்பந்து' : 'Wooden Ball', lang === 'ta' ? 'கைவிரல்கள்' : 'Fingers'], e: '🎋' },
      ],
      tyre_oattam: [
        { q: lang === 'ta' ? 'டயர் ஓட்டம் விளையாட்டில் பழைய டயரை வேகமாக உருட்ட எதைப் பயன்படுத்துவார்கள்?' : 'In Tyre Oattam, what do children use to guide and accelerate the rolling tyre?', a: lang === 'ta' ? 'சிறிய மரக்குச்சி அல்லது கம்பிக்கோடு' : 'Small stick or wire guide', d: [lang === 'ta' ? 'கயிறு' : 'Rope', lang === 'ta' ? 'கால் உதை' : 'Kicking with foot', lang === 'ta' ? 'நீர் பீய்ச்சி' : 'Water spray'], e: '🛞' },
        { q: lang === 'ta' ? 'டயர் சக்கரத்தை சமநிலையில் திருப்ப என்ன செய்ய வேண்டும்?' : 'How do you steer the rolling tyre smoothly without letting it fall?', a: lang === 'ta' ? 'பக்கவாட்டில் லேசாக தட்டுதல்' : 'Gentle side taps with stick', d: [lang === 'ta' ? 'டயரை நிறுத்துதல்' : 'Stop tyre completely', lang === 'ta' ? 'மேலே ஏறி நிற்றல்' : 'Stand on top', lang === 'ta' ? 'கல்லால் எறிதல்' : 'Throw stone at it'], e: '🏃' },
      ],
      pattam_viduthal: [
        { q: lang === 'ta' ? 'பட்டம் உயரே பறக்க நூலை எந்தப் பொருளில் சுற்றி வைத்திருப்பார்கள்?' : 'Around which spool is the kite thread traditionally wound in Pattam Viduthal?', a: lang === 'ta' ? 'மர நூல் கண்டில் (ராட்டினம்)' : 'Wooden Thread Spool (Lattai)', d: [lang === 'ta' ? 'துணிப் பை' : 'Cloth bag', lang === 'ta' ? 'கண்ணாடி பாட்டில்' : 'Glass bottle', lang === 'ta' ? 'பூப்பந்து' : 'Flower ball'], e: '🪁' },
      ],
      street_cricket: [
        { q: lang === 'ta' ? 'தெரு கிரிக்கெட்டில் "ஒரு துளி ஒரு கை" (One Tip One Hand) விதியின் பொருள் என்ன?' : 'In Street Cricket, what does the rule "One Tip One Hand" mean?', a: lang === 'ta' ? 'ஒரு முறை தரையில் பட்டு எழும்பிய பந்தை ஒற்றைக்கையால் பிடித்தால் அவுட்' : 'Caught with one hand after single bounce is OUT', d: [lang === 'ta' ? 'இரண்டு கைகளால் பிடித்தால் அவுட்' : 'Two handed catch after bounce', lang === 'ta' ? 'நோ பால்' : 'No ball declared', lang === 'ta' ? 'ஆறு ரன்கள்' : 'Six runs awarded'], e: '🏏' },
      ],
      kabaddi: [
        { q: lang === 'ta' ? 'கபடியில் எதிரணி எல்லைக்குள் நுழையும் ரைடர் தொடர்ந்து என்ன சொல்ல வேண்டும்?' : 'In Kabaddi, what chant must the raider continuously utter in a single breath?', a: lang === 'ta' ? '"கபடி கபடி" அல்லது "சடுகுடு"' : '"Kabaddi Kabaddi" or "Chadukudu"', d: [lang === 'ta' ? '"வெற்றி வெற்றி"' : '"Vetri Vetri"', lang === 'ta' ? '"ஓடு ஓடு"' : '"Odu Odu"', lang === 'ta' ? '"பிடி பிடி"' : '"Pidi Pidi"'], e: '🤼' },
      ],
      kho_kho: [
        { q: lang === 'ta' ? 'கோ-கோ விளையாட்டில் அமர்ந்திருக்கும் வீரரை விரட்ட எழுப்பும்போது என்ன சொல்ல வேண்டும்?' : 'In Kho-Kho, what word is spoken when tapping a sitting teammate on the back?', a: lang === 'ta' ? '"கோ!" (KHO!)' : '"KHO!"', d: [lang === 'ta' ? '"ஓடு!"' : '"Run!"', lang === 'ta' ? '"பிடி!"' : '"Catch!"', lang === 'ta' ? '"வா!"' : '"Come!"'], e: '🏃' },
      ],
      skipping_rope: [
        { q: lang === 'ta' ? 'கயிறு தாண்டும்போது பாதங்கள் எவ்வாறு நிலத்தில் பட வேண்டும்?' : 'How should your feet lightly land on the ground while skipping rope?', a: lang === 'ta' ? 'முன்கால் விரல்களின் மென்மையான தாளத்தில்' : 'Soft landing on balls of feet', d: [lang === 'ta' ? 'குதிக்கால்களில் பலமாக' : 'Hard landing on heels', lang === 'ta' ? 'முழங்கால்களை மடித்து உட்கார்ந்து' : 'Deep squat on knees', lang === 'ta' ? 'ஒற்றை விரலில்' : 'On single toe'], e: '👟' },
      ],
      pallanguzhi: [
        { q: lang === 'ta' ? 'பாரம்பரிய பல்லாங்குழி பலகையில் மொத்தம் எத்தனை குழிகள் இருக்கும்?' : 'How many total pits (cups) are carved into a traditional Pallanguzhi board?', a: lang === 'ta' ? '14 குழிகள் (பக்கத்திற்கு 7)' : '14 pits (7 on each side)', d: [lang === 'ta' ? '10 குழிகள்' : '10 pits', lang === 'ta' ? '16 குழிகள்' : '16 pits', lang === 'ta' ? '12 குழிகள்' : '12 pits'], e: '🐚' },
        { q: lang === 'ta' ? 'பல்லாங்குழியில் காய்களாக பாரம்பரியமாக எவற்றைப் பயன்படுத்துவார்கள்?' : 'What natural counters are traditionally used to play Pallanguzhi?', a: lang === 'ta' ? 'சோழிகள் அல்லது புளியங்கொட்டைகள்' : 'Cowrie shells or Tamarind seeds', d: [lang === 'ta' ? 'பிளாஸ்டிக் மணிகள்' : 'Plastic beads', lang === 'ta' ? 'இரும்பு ஆணிகள்' : 'Iron nails', lang === 'ta' ? 'நெல்மணிகள்' : 'Paddy grains'], e: '🌰' },
      ],
      thaayam: [
        { q: lang === 'ta' ? 'தாயக்கட்டை விளையாட்டில் ஆட்டத்தைத் தொடங்க காயை களத்தில் இறக்க என்ன எண் விழ வேண்டும்?' : 'In Thaayam (Dayakattai), what roll is required to enter a pawn onto the board?', a: lang === 'ta' ? 'தாயம் (எண் 1)' : 'Thaayam (Roll 1)', d: [lang === 'ta' ? 'எண் 5' : 'Roll 5', lang === 'ta' ? 'எண் 6' : 'Roll 6', lang === 'ta' ? 'எண் 12' : 'Roll 12'], e: '🎲' },
        { q: lang === 'ta' ? 'தாயக்கட்டைகள் பாரம்பரியமாக எதனால் செய்யப்பட்டிருக்கும்?' : 'What material are traditional Dayakattai dice carved from?', a: lang === 'ta' ? 'பித்தளை அல்லது வெண்கலம்' : 'Brass or Bell-metal bronze', d: [lang === 'ta' ? 'பிளாஸ்டிக்' : 'Plastic', lang === 'ta' ? 'கண்ணாடி' : 'Glass', lang === 'ta' ? 'காகிதம்' : 'Paper'], e: '✨' },
      ],
      paramapadham: [
        { q: lang === 'ta' ? 'பரமபதம் விளையாட்டில் உங்களை மேலே விரைவாக ஏற்றிச் செல்வது எது?' : 'In Paramapadham (Snakes & Ladders), what helps you climb up quickly?', a: lang === 'ta' ? 'ஏணி (Ladder / நற்பண்புகள்)' : 'Ladder (Virtues)', d: [lang === 'ta' ? 'பாம்பு' : 'Snake', lang === 'ta' ? 'குழி' : 'Pit', lang === 'ta' ? 'முள்' : 'Thorn'], e: '🪜' },
      ],
      seettu_vilayattu: [
        { q: lang === 'ta' ? 'பாரம்பரிய 52 சீட்டுக்கட்டில் எத்தனை வண்ண வகைகள் (Suits) உள்ளன?' : 'In a standard pack of playing cards, how many suits are there?', a: lang === 'ta' ? '4 வகைகள் (ஸ்பேட், ஹார்ட், டைமண்ட், கிளப்)' : '4 Suits (Spade, Heart, Diamond, Club)', d: [lang === 'ta' ? '2 வகைகள்' : '2 Suits', lang === 'ta' ? '6 வகைகள்' : '6 Suits', lang === 'ta' ? '8 வகைகள்' : '8 Suits'], e: '🃏' },
      ],
      carrom: [
        { q: lang === 'ta' ? 'கேரம் போர்டில் சிவப்பு நிற காய்க்கு என்ன பெயர் மற்றும் அதன் மதிப்பு என்ன?' : 'What is the red carrom piece called and what is its special value?', a: lang === 'ta' ? 'ராணி (Queen) — 3 புள்ளிகள் + கவரிங் காய்' : 'Queen — 3 points + cover coin', d: [lang === 'ta' ? 'ராஜா — 10 புள்ளிகள்' : 'King — 10 points', lang === 'ta' ? 'வெள்ளை காய் — 1 புள்ளி' : 'White coin — 1 point', lang === 'ta' ? 'கருப்பு காய் — 2 புள்ளிகள்' : 'Black coin — 2 points'], e: '🔴' },
      ],
      movie_poster_memory: [
        { q: lang === 'ta' ? 'மக்கள் திலகம் எம்.ஜி.ஆர் நடித்த புகழ்பெற்ற "படகோட்டி" படத்தில் இடம் பெற்ற மீனவப் பாடல் எது?' : 'Which famous fisherman melody is featured in MGR’s classic "Padagotti"?', a: lang === 'ta' ? '"தொட்ட இடமெல்லாம் பொன்னாகும்..."' : '"Thotta Idamellam Ponnagum"', d: [lang === 'ta' ? '"ஆடலுடன் பாடலை கேட்டு..."' : '"Aadaludan Paadalai"', lang === 'ta' ? '"நிலவே என்னிடம் நெருங்காதே..."' : '"Nilave Ennidam"', lang === 'ta' ? '"அடி என்னடி உலகம்..."' : '"Adi Ennadi Ulagam"'], e: '🎬' },
      ],
      ilaiyaraaja_melody: [
        { q: lang === 'ta' ? '"தென்றல் வந்து தீண்டும் போது என்ன வண்ணமோ..." என்ற பாடல் எந்தப் படத்தில் இடம் பெற்றது?' : 'In which movie does the timeless melody "Thendral Vandhu Theendumbodhu" feature?', a: lang === 'ta' ? 'அவதாரம் (Avatharam)' : 'Avatharam', d: [lang === 'ta' ? 'நாயகன்' : 'Nayakan', lang === 'ta' ? 'தளபதி' : 'Thalapathi', lang === 'ta' ? 'சிந்து பைரவி' : 'Sindhu Bhairavi'], e: '🎵' },
      ],
      actor_actress_match: [
        { q: lang === 'ta' ? '"நடிகையர் திலகம்" என்று அன்போடு போற்றப்பட்ட பழம்பெரும் தமிழ் நடிகை யார்?' : 'Which legendary Tamil actress was reverently crowned "Nadigaiyar Thilagam"?', a: lang === 'ta' ? 'சாவித்திரி (Savitri)' : 'Savitri', d: [lang === 'ta' ? 'பத்மினி' : 'Padmini', lang === 'ta' ? 'கே.ஆர். விஜயா' : 'K.R. Vijaya', lang === 'ta' ? 'மனோரமா' : 'Manorama'], e: '👑' },
      ],
      cinema_ticket_counter: [
        { q: lang === 'ta' ? 'அக்காலத்தில் திரையரங்குகளில் அனைத்து இருக்கைகளும் விற்றுத் தீர்ந்ததும் தொங்கவிடப்படும் பலகை எது?' : 'What wooden sign was hung outside single-screen theatres when all seats were sold?', a: lang === 'ta' ? 'HOUSEFULL (முழுக்க நிரம்பியது)' : 'HOUSEFULL', d: [lang === 'ta' ? 'விடுமுறை' : 'Holiday', lang === 'ta' ? 'டிக்கெட் உண்டு' : 'Tickets Available', lang === 'ta' ? 'தள்ளுபடி' : 'Discount Open'], e: '🎟️' },
      ],
      oliyum_oliyum: [
        { q: lang === 'ta' ? 'தூர்தர்ஷனில் "ஒளியும் ஒலியும்" வாரத்தில் எந்த கிழமை இரவு 7:30 மணிக்கு ஒளிபரப்பானது?' : 'On which weekday evening at 7:30 PM was "Oliyum Oliyum" telecast on Doordarshan?', a: lang === 'ta' ? 'வெள்ளிக்கிழமை (Friday)' : 'Friday Evening', d: [lang === 'ta' ? 'ஞாயிற்றுக்கிழமை' : 'Sunday', lang === 'ta' ? 'திங்கட்கிழமை' : 'Monday', lang === 'ta' ? 'புதன்கிழமை' : 'Wednesday'], e: '📺' },
      ],
      default: [
        { q: lang === 'ta' ? 'நமது கிராமத்து பாரம்பரிய விளையாட்டு நினைவுகளில் உங்களுக்கு மிகவும் பிடித்த தருணம் எது?' : 'Which memory from your childhood traditional games brings the warmest smile?', a: lang === 'ta' ? 'மாலையில் நண்பர்களுடன் தெருவில் ஆடிய தருணம்' : 'Evening laughter with friends in the village street', d: [lang === 'ta' ? 'தனியாக அமர்ந்திருந்தது' : 'Sitting alone', lang === 'ta' ? 'மழை பெய்தது' : 'Rainy downtime', lang === 'ta' ? 'புத்தகம் படித்தது' : 'Reading silence'], e: '🌸' },
      ]
    };

    const pool = samplePool[gameKey] || samplePool[gameKey.replace(/-/g, '_')] || samplePool.default;
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
