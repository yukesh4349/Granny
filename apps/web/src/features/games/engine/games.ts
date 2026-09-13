// ============================================================================
// All 10 Cognitive Games — Picture-Based Visual & Audio Modules
// ============================================================================
import {
  CognitiveGame, SessionState, GameItem, AttemptResult, SessionSummary,
  DifficultyParams, generateSessionId, shuffleArray, pickRandom, calculateSummary
} from './types';

// ─── Game 1: Remember My Home ─────────────────────────────────────────────────
// Spatial + visual memory: place objects in visual room scenes, recall positions

export interface VisualObject {
  name: string;
  emoji: string;
  category: string;
}

const HOME_OBJECTS: VisualObject[] = [
  { name: 'Brass Temple Keys', emoji: '🔑', category: 'Entrance & Puja' },
  { name: 'Reading Glasses', emoji: '👓', category: 'Study & Verandah' },
  { name: 'TV Remote', emoji: '📺', category: 'Living Room' },
  { name: 'Morning Medicine Box', emoji: '💊', category: 'Bedside' },
  { name: 'Filter Coffee Davarah', emoji: '☕', category: 'Kitchen & Courtyard' },
  { name: '1978 Wedding Photo Frame', emoji: '🖼️', category: 'Puja Room' },
  { name: 'Carved Walking Stick', emoji: '🦯', category: 'Verandah' },
  { name: 'Sacred Songbook', emoji: '📖', category: 'Puja Corner' },
  { name: 'Silk Angavastram Shawl', emoji: '🧣', category: 'Bedroom Wardrobe' },
  { name: 'Brass Wall Clock', emoji: '⏰', category: 'Living Room Wall' },
  { name: 'Silver Water Tumbler', emoji: '🥛', category: 'Dining Table' },
  { name: 'Brass Vilakku Diya', emoji: '🪔', category: 'Altar Corner' }
];

const HOME_POSITIONS = [
  'On the teak coffee table',
  'Inside the brass puja niche',
  'By the sunlit verandah window',
  'On the bedside drawer',
  'On the kitchen granite counter',
  'Near the wooden entrance door'
];

export const RememberMyHome: CognitiveGame = {
  key: 'remember_my_home',
  title: 'Remember My Home',
  description: 'Visual spatial memory: recall where familiar objects are kept in the house',
  icon: '🏠',
  primarySkills: ['spatial-memory', 'visual-memory'],
  color: '#FF8A65',

  startSession(userId, difficulty) {
    const count = Math.min(difficulty.itemCount, HOME_OBJECTS.length);
    const objects = pickRandom(HOME_OBJECTS, count);
    const positions = pickRandom(HOME_POSITIONS, count);

    const items: GameItem[] = objects.map((obj, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `Where was the ${obj.name} placed?`,
      choices: shuffleArray([...pickRandom(HOME_POSITIONS.filter(p => p !== positions[i]), difficulty.distractorCount), positions[i]]),
      correctAnswer: positions[i],
      metadata: {
        object: obj.name,
        emoji: obj.emoji,
        category: obj.category,
        position: positions[i],
        visualTitle: obj.name,
      },
    }));

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex,
      correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_position',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 2: Memory Market ────────────────────────────────────────────────────
// Working memory + attention: visual shopping bazaar basket

const MARKET_ITEMS = [
  { name: 'Madurai Jasmine', emoji: '🌺', category: 'Flower Stall' },
  { name: 'Alphonso Mangoes', emoji: '🥭', category: 'Fruit Stall' },
  { name: 'Country Cow Milk', emoji: '🥛', category: 'Dairy' },
  { name: 'Mysore Betel Leaves', emoji: '🍃', category: 'Puja Herbs' },
  { name: 'Golden Turmeric', emoji: '🟡', category: 'Spice Merchant' },
  { name: 'Traditional Murukku', emoji: '🥮', category: 'Sweet Shop' },
  { name: 'Filter Coffee Beans', emoji: '☕', category: 'Coffee Roastery' },
  { name: 'Ponni Rice', emoji: '🍚', category: 'Grain Merchant' },
  { name: 'Country Tomatoes', emoji: '🍅', category: 'Vegetable Stall' },
  { name: 'Red Onions', emoji: '🧅', category: 'Vegetable Stall' },
  { name: 'Pure Cow Ghee', emoji: '🧈', category: 'Dairy' },
  { name: 'Cardamom Pods', emoji: '🌿', category: 'Spice Merchant' }
];

export const MemoryMarket: CognitiveGame = {
  key: 'memory_market',
  title: 'Memory Market',
  description: 'Visual bazaar recall: remember the items in your morning shopping basket',
  icon: '🛒',
  primarySkills: ['working-memory', 'attention'],
  color: '#66BB6A',

  startSession(userId, difficulty) {
    const listSize = Math.min(difficulty.itemCount, MARKET_ITEMS.length);
    const shoppingList = pickRandom(MARKET_ITEMS, listSize);
    const distractors = pickRandom(
      MARKET_ITEMS.filter(i => !shoppingList.some(s => s.name === i.name)),
      difficulty.distractorCount
    );

    const items: GameItem[] = shoppingList.map((item, i) => {
      const choiceObjs = shuffleArray([item, ...pickRandom(distractors, Math.min(3, distractors.length))]);
      return {
        index: i,
        type: 'select' as const,
        prompt: `Find "${item.name}" from the morning bazaar stall`,
        choices: choiceObjs.map(c => `${c.emoji} ${c.name}`),
        correctAnswer: `${item.emoji} ${item.name}`,
        metadata: {
          itemName: item.name,
          emoji: item.emoji,
          category: item.category,
          shoppingList: shoppingList.map(s => `${s.emoji} ${s.name}`),
        },
      };
    });

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_item',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 3: Name & Face Match ────────────────────────────────────────────────
// Recognition + associative: photo & portrait matching

const CHARACTERS = [
  { name: 'Kamala', role: 'Sister', emoji: '👵', trait: 'wearing green Kanchipuram silk saree & jasmine' },
  { name: 'Rajan', role: 'Husband', emoji: '👴', trait: 'with kind silver beard and round spectacles' },
  { name: 'Priya', role: 'Daughter', emoji: '👩', trait: 'wearing royal blue salwar with gentle smile' },
  { name: 'Arjun', role: 'Grandson (11)', emoji: '👦', trait: 'holding cricket bat in yellow jersey' },
  { name: 'Meena', role: 'Niece', emoji: '👧', trait: 'wearing bright pattu pavadai with red bindi' },
  { name: 'Dr. Suresh', role: 'Family Doctor', emoji: '👨‍⚕️', trait: 'wearing stethoscope with cheerful greeting' },
  { name: 'Gopal', role: 'Elder Brother', emoji: '👨‍🦳', trait: 'holding traditional rosewood walking cane' },
  { name: 'Deepa', role: 'Granddaughter', emoji: '🧒', trait: 'singing Carnatic song holding small talam' },
];

export const NameFaceMatch: CognitiveGame = {
  key: 'name_face_match',
  title: 'Name & Face Match',
  description: 'Visual portrait recognition: identify family members from their portrait cues',
  icon: '👤',
  primarySkills: ['recognition', 'associative-memory'],
  color: '#42A5F5',

  startSession(userId, difficulty) {
    const chars = pickRandom(CHARACTERS, Math.min(difficulty.itemCount, CHARACTERS.length));
    const allNames = CHARACTERS.map(c => `${c.emoji} ${c.name} (${c.role})`);

    const items: GameItem[] = chars.map((char, i) => {
      const correctChoice = `${char.emoji} ${char.name} (${char.role})`;
      const otherChoices = pickRandom(allNames.filter(n => n !== correctChoice), difficulty.distractorCount);
      return {
        index: i,
        type: 'match' as const,
        prompt: `Who is the family member ${char.trait}?`,
        choices: shuffleArray([correctChoice, ...otherChoices]),
        correctAnswer: correctChoice,
        metadata: {
          name: char.name,
          role: char.role,
          emoji: char.emoji,
          trait: char.trait,
        },
      };
    });

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_name',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 4: Recipe Recall ────────────────────────────────────────────────────
// Sequential + executive: visual recipe card steps

export interface VisualRecipe {
  title: string;
  emoji: string;
  steps: { text: string; icon: string }[];
}

const RECIPES: VisualRecipe[] = [
  {
    title: 'Morning Filter Coffee',
    emoji: '☕',
    steps: [
      { text: 'Add roasted coffee powder to top brass filter', icon: '🫖' },
      { text: 'Pour freshly boiled water & wait for decoction', icon: '💧' },
      { text: 'Boil fresh creamy milk and dissolve sugar', icon: '🥛' },
      { text: 'Froth decoction and milk between davarah and tumbler', icon: '💫' },
    ]
  },
  {
    title: 'Festive Rava Kesari',
    emoji: '🍮',
    steps: [
      { text: 'Roast semolina in golden pure cow ghee', icon: '🧈' },
      { text: 'Boil water with crushed cardamom & saffron strands', icon: '🌸' },
      { text: 'Stir roasted rava into water without forming lumps', icon: '🥣' },
      { text: 'Fold in sugar and garnish with fried golden cashews', icon: '🥜' },
    ]
  },
  {
    title: 'Crispy Masala Dosa',
    emoji: '🥞',
    steps: [
      { text: 'Ferment rice and lentil batter overnight', icon: '🌾' },
      { text: 'Prepare golden spiced potato filling with curry leaves', icon: '🥔' },
      { text: 'Pour batter in concentric circles on cast-iron tawa', icon: '🍳' },
      { text: 'Fold over potato masala and serve with coconut chutney', icon: '🥥' },
    ]
  }
];

export const RecipeRecall: CognitiveGame = {
  key: 'recipe_recall',
  title: 'Recipe Recall',
  description: 'Sequential culinary memory: arrange traditional cooking steps in proper order',
  icon: '🍳',
  primarySkills: ['sequential-memory', 'executive-function'],
  color: '#FFA726',

  startSession(userId, difficulty) {
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const count = Math.min(difficulty.itemCount, recipe.steps.length);
    const selectedSteps = recipe.steps.slice(0, count);

    const items: GameItem[] = selectedSteps.map((step, idx) => ({
      index: idx,
      type: 'order' as const,
      prompt: `What is Step #${idx + 1} for preparing "${recipe.emoji} ${recipe.title}"?`,
      choices: shuffleArray(selectedSteps.map(s => `${s.icon} ${s.text}`)),
      correctAnswer: `${step.icon} ${step.text}`,
      metadata: {
        recipeTitle: recipe.title,
        recipeEmoji: recipe.emoji,
        stepNumber: idx + 1,
        allSteps: selectedSteps.map((s, i) => `${i + 1}. ${s.icon} ${s.text}`),
      },
    }));

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_order',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 5: Memory Journey ──────────────────────────────────────────────────
// Episodic + sequential: visual pilgrimage and heritage tour stops

const JOURNEY_STOPS = [
  { name: 'Meenakshi Amman Temple', emoji: '🛕', desc: 'Towering gopurams & morning bells' },
  { name: 'Madurai Flower Bazaar', emoji: '🌸', desc: 'Fresh jasmine garlands & fragrance' },
  { name: 'Heritage AIR Radio Studio', emoji: '📻', desc: 'Classical morning concerts' },
  { name: 'Lotus Pond Sanctuary', emoji: '🪷', desc: 'Quiet morning walk by water' },
  { name: 'Central Heritage Station', emoji: '🚂', desc: 'Family arriving from Mysore' },
  { name: 'Ancestral Verandah', emoji: '🏡', desc: 'Evening tea with family elders' }
];

export const MemoryJourney: CognitiveGame = {
  key: 'memory_journey',
  title: 'Memory Journey',
  description: 'Episodic sequential memory: remember memorable stops along the heritage route',
  icon: '🚶',
  primarySkills: ['episodic-memory', 'sequential-memory'],
  color: '#AB47BC',

  startSession(userId, difficulty) {
    const count = Math.min(difficulty.itemCount, JOURNEY_STOPS.length);
    const locations = pickRandom(JOURNEY_STOPS, count);

    const items: GameItem[] = locations.map((loc, i) => {
      const correctChoice = `${loc.emoji} ${loc.name}`;
      const otherChoices = pickRandom(
        JOURNEY_STOPS.filter(l => l.name !== loc.name).map(l => `${l.emoji} ${l.name}`),
        difficulty.distractorCount
      );
      return {
        index: i,
        type: 'recall' as const,
        prompt: `Where was Stop #${i + 1} on our morning journey?`,
        choices: shuffleArray([correctChoice, ...otherChoices]),
        correctAnswer: correctChoice,
        metadata: {
          stopNumber: i + 1,
          name: loc.name,
          emoji: loc.emoji,
          desc: loc.desc,
          route: locations.map((l, idx) => `Stop #${idx + 1}: ${l.emoji} ${l.name}`),
        },
      };
    });

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_location',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 6: Complete the Tune ───────────────────────────────────────────────
// Auditory + associative: complete traditional lyrics & radio melodies

const SONGS = [
  { title: 'Vellai Pookal (Peace Melody)', emoji: '🕊️', line: 'Kaatrin mozhiye ketkudha, Vellai ___ paadudha?', answer: 'Pookal', wrong: ['Malargal', 'Megangal', 'Paravaigal'] },
  { title: 'Kurai Ondrum Illai', emoji: '🪔', line: 'Kurai ondrum illai marai moorthi ___, kanna...', answer: 'Kanna', wrong: ['Govinda', 'Rama', 'Narayana'] },
  { title: 'Suprabhatam Melody', emoji: '🌅', line: 'Kausalya supraja Rama poorva sandhya ___', answer: 'Pravartathe', wrong: ['Namosthuthe', 'Jayathu', 'Vandhanam'] },
  { title: 'Chinnanchiru Kiliye', emoji: '🦜', line: 'Chinnanchiru kiliye, kannamma, selvak ___', answer: 'Kalanjiyame', wrong: ['Kuzhandhaye', 'Devadhaye', 'Oviyame'] },
];

export const CompleteTheTune: CognitiveGame = {
  key: 'complete_the_tune',
  title: 'Complete the Tune',
  description: 'Auditory & lyric recall: complete classic radio songs and devotional melodies',
  icon: '🎵',
  primarySkills: ['auditory-memory', 'associative-memory'],
  color: '#EC407A',

  startSession(userId, difficulty) {
    const songs = pickRandom(SONGS, Math.min(difficulty.itemCount, SONGS.length));

    const items: GameItem[] = songs.map((song, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `Complete the song: "${song.line}"`,
      choices: shuffleArray([song.answer, ...song.wrong.slice(0, difficulty.distractorCount)]),
      correctAnswer: song.answer,
      metadata: { songTitle: song.title, emoji: song.emoji, lyric: song.line },
    }));

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_word',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 7: Story Detective ─────────────────────────────────────────────────
// Auditory + comprehension: solve gentle family mystery clues

const STORIES = [
  {
    title: 'The Ancestral Brass Urli',
    emoji: '🏺',
    text: 'Yesterday, Lakshmi Amma placed fresh water and floating pink lotus petals into the ancestral brass urli on the verandah before the morning puja.',
    questions: [
      { q: 'Where was the brass urli kept?', a: 'On the front verandah', wrong: ['In the kitchen', 'In the bedroom', 'At the gate'] },
      { q: 'What flowers were floating in the water?', a: 'Pink lotus petals', wrong: ['Yellow roses', 'White jasmine', 'Red marigolds'] },
      { q: 'When was it prepared?', a: 'Before the morning puja', wrong: ['After evening tea', 'At night', 'During lunch'] },
    ]
  },
  {
    title: 'The Blue Ambassador Car Ride',
    emoji: '🚙',
    text: 'In 1982, the family drove to the Mysore Dasara festival in their royal blue Ambassador car. Grandson Arjun loved hearing the mechanical horn.',
    questions: [
      { q: 'What color was the family Ambassador car?', a: 'Royal Blue', wrong: ['Pearl White', 'Forest Green', 'Bright Red'] },
      { q: 'Where was the destination festival?', a: 'Mysore Dasara', wrong: ['Madurai Temple', 'Chennai Marina', 'Ooty Hills'] },
      { q: 'Who enjoyed the vintage mechanical horn?', a: 'Grandson Arjun', wrong: ['Doctor Suresh', 'Daughter Priya', 'Uncle Gopal'] },
    ]
  },
];

export const StoryDetective: CognitiveGame = {
  key: 'story_detective',
  title: 'Story Detective',
  description: 'Auditory & story comprehension: remember heartwarming narrative details',
  icon: '🔍',
  primarySkills: ['auditory-memory', 'comprehension'],
  color: '#5C6BC0',

  startSession(userId, difficulty) {
    const story = STORIES[Math.floor(Math.random() * STORIES.length)];
    const qCount = Math.min(difficulty.itemCount, story.questions.length);

    const items: GameItem[] = story.questions.slice(0, qCount).map((q, i) => ({
      index: i,
      type: 'select' as const,
      prompt: q.q,
      choices: shuffleArray([q.a, ...q.wrong.slice(0, difficulty.distractorCount)]),
      correctAnswer: q.a,
      metadata: { storyTitle: story.title, storyEmoji: story.emoji, storyText: story.text },
    }));

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_answer',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 8: Where Did I Keep It ─────────────────────────────────────────────
// Working + spatial: remember household object locations

const KEEP_ITEMS = [
  { item: 'Gold-rimmed Spectacles', emoji: '👓', location: 'On the verandah rocking chair', locEmoji: '🪑' },
  { item: 'Brass Key Ring', emoji: '🔑', location: 'On the entrance wooden peg', locEmoji: '🚪' },
  { item: 'Morning Pill Case', emoji: '💊', location: 'On the bedside nightstand', locEmoji: '🛏️' },
  { item: 'Handwritten Recipe Book', emoji: '📖', location: 'In the kitchen spice cupboard', locEmoji: '🍲' },
  { item: 'Rosewood Walking Cane', emoji: '🦯', location: 'By the front door umbrella stand', locEmoji: '🌂' },
  { item: 'Silver Prayer Beads', emoji: '📿', location: 'Inside the teak puja shelf', locEmoji: '🪔' }
];

export const WhereDidIKeepIt: CognitiveGame = {
  key: 'where_did_i_keep_it',
  title: 'Where Did I Keep It?',
  description: 'Spatial room memory: recall where you placed daily essentials around the home',
  icon: '🔑',
  primarySkills: ['working-memory', 'spatial-memory'],
  color: '#26A69A',

  startSession(userId, difficulty) {
    const count = Math.min(difficulty.itemCount, KEEP_ITEMS.length);
    const selected = pickRandom(KEEP_ITEMS, count);

    const items: GameItem[] = selected.map((obj, i) => {
      const correctChoice = `${obj.locEmoji} ${obj.location}`;
      const otherChoices = pickRandom(
        KEEP_ITEMS.filter(k => k.item !== obj.item).map(k => `${k.locEmoji} ${k.location}`),
        difficulty.distractorCount
      );
      return {
        index: i,
        type: 'recall' as const,
        prompt: `Where did you keep your ${obj.emoji} ${obj.item}?`,
        choices: shuffleArray([correctChoice, ...otherChoices]),
        correctAnswer: correctChoice,
        metadata: {
          item: obj.item,
          emoji: obj.emoji,
          location: obj.location,
          locEmoji: obj.locEmoji,
        },
      };
    });

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_location',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 9: Memory Garden ───────────────────────────────────────────────────
// Visual + spatial botanical garden planting

const GARDEN_PLANTS = [
  { name: 'Fragrant Madurai Jasmine', emoji: '🌺', spot: 'By the sunlit entrance arch', spotEmoji: '⛩️' },
  { name: 'Sacred Red Hibiscus', emoji: '🌺', spot: 'In the central puja bed', spotEmoji: '🪷' },
  { name: 'Golden Marigold Garland', emoji: '🌼', spot: 'Along the garden stone pathway', spotEmoji: '🪨' },
  { name: 'Holy Basil (Tulsi Vrindavan)', emoji: '🌿', spot: 'In the sacred courtyard planter', spotEmoji: '🏡' },
  { name: 'Night Queen Jasmine', emoji: '🌸', spot: 'Near the bedroom verandah wall', spotEmoji: '🧱' },
  { name: 'Pink Sacred Lotus', emoji: '🪷', spot: 'In the brass courtyard water urli', spotEmoji: '🏺' }
];

export const MemoryGarden: CognitiveGame = {
  key: 'memory_garden',
  title: 'Memory Garden',
  description: 'Botanical visual memory: remember what flowers you planted in which garden bed',
  icon: '🌺',
  primarySkills: ['visual-memory', 'spatial-memory', 'long-term-memory'],
  color: '#4CAF50',

  startSession(userId, difficulty) {
    const count = Math.min(difficulty.itemCount, GARDEN_PLANTS.length);
    const selected = pickRandom(GARDEN_PLANTS, count);

    const items: GameItem[] = selected.map((plant, i) => {
      const correctChoice = `${plant.spotEmoji} ${plant.spot}`;
      const otherChoices = pickRandom(
        GARDEN_PLANTS.filter(p => p.name !== plant.name).map(p => `${p.spotEmoji} ${p.spot}`),
        difficulty.distractorCount
      );
      return {
        index: i,
        type: 'recall' as const,
        prompt: `Where did you plant the ${plant.emoji} ${plant.name}?`,
        choices: shuffleArray([correctChoice, ...otherChoices]),
        correctAnswer: correctChoice,
        metadata: {
          plant: plant.name,
          emoji: plant.emoji,
          spot: plant.spot,
          spotEmoji: plant.spotEmoji,
        },
      };
    });

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_spot',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 10: Memory Album ───────────────────────────────────────────────────
// Recognition + episodic photo memories

const ALBUM_MEMORIES = [
  { scene: '1975 Temple Wedding Day', emoji: '💒', detail: 'The bride wore traditional crimson Kanchipuram silk', year: '1975' },
  { scene: 'First Family Bicycle Ride', emoji: '🚲', detail: 'Rajan taught son Arun to balance on the lane', year: '1980' },
  { scene: 'Trip to Mysore Dasara Palace', emoji: '🏰', detail: 'Thousands of golden lamps illuminated the night', year: '1984' },
  { scene: 'Granddaughter Priya Birth Celebration', emoji: '👶', detail: 'Everyone shared fresh ghee Mysore Pak sweets', year: '1995' },
  { scene: 'Diwali Morning on the Verandah', emoji: '🪔', detail: 'Grandfather distributed family blessings in silk angavastram', year: '2001' },
  { scene: 'Silver Jubilee Family Reunion', emoji: '🎉', detail: 'Four generations gathered for a traditional feast on banana leaves', year: '2010' },
];

export const MemoryAlbum: CognitiveGame = {
  key: 'memory_album',
  title: 'Memory Album',
  description: 'Visual vintage album: remember heartwarming details from special family photographs',
  icon: '📸',
  primarySkills: ['recognition', 'episodic-memory'],
  color: '#78909C',

  startSession(userId, difficulty) {
    const count = Math.min(difficulty.itemCount, ALBUM_MEMORIES.length);
    const selected = pickRandom(ALBUM_MEMORIES, count);

    const items: GameItem[] = selected.map((item, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `What was the cherished detail in the photograph "${item.emoji} ${item.scene}"?`,
      choices: shuffleArray([
        item.detail,
        ...pickRandom(ALBUM_MEMORIES.filter(a => a.detail !== item.detail).map(a => a.detail), difficulty.distractorCount),
      ]),
      correctAnswer: item.detail,
      metadata: {
        scene: item.scene,
        emoji: item.emoji,
        year: item.year,
        detail: item.detail,
      },
    }));

    return {
      sessionId: generateSessionId(),
      userId, gameKey: this.key,
      difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [],
    };
  },

  getNextItem(session) {
    if (session.currentItemIndex >= session.items.length) return null;
    return session.items[session.currentItemIndex];
  },

  submitAttempt(session, response) {
    const item = session.items[session.currentItemIndex];
    const correct = response.toLowerCase().trim() === (item.correctAnswer as string).toLowerCase().trim();
    const result: AttemptResult = {
      itemIndex: session.currentItemIndex, correct, latencyMs: 0, response,
      errorType: correct ? undefined : 'wrong_detail',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game Registry ───────────────────────────────────────────────────────────

export const ALL_GAMES: CognitiveGame[] = [
  RememberMyHome,
  MemoryMarket,
  NameFaceMatch,
  RecipeRecall,
  MemoryJourney,
  CompleteTheTune,
  StoryDetective,
  WhereDidIKeepIt,
  MemoryGarden,
  MemoryAlbum,
];

export function getGameByKey(key: string): CognitiveGame | undefined {
  return ALL_GAMES.find(g => g.key === key);
}
