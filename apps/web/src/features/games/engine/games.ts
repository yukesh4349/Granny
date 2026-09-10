// ============================================================================
// All 10 Cognitive Games — Content modules implementing CognitiveGame
// ============================================================================
import {
  CognitiveGame, SessionState, GameItem, AttemptResult, SessionSummary,
  DifficultyParams, generateSessionId, shuffleArray, pickRandom, calculateSummary
} from './types';

// ─── Game 1: Remember My Home ─────────────────────────────────────────────────
// Spatial + visual memory: place objects in a room, hide them, recall positions

const HOME_OBJECTS = [
  'Keys', 'Glasses', 'Remote Control', 'Medicine Box', 'Tea Cup',
  'Photo Frame', 'Walking Stick', 'Prayer Book', 'Shawl', 'Clock',
  'Water Bottle', 'Phone', 'Newspaper', 'Flower Vase', 'Lamp'
];
const HOME_POSITIONS = [
  'On the table', 'On the sofa', 'In the drawer', 'Near the window',
  'On the shelf', 'By the door', 'Next to the bed', 'On the kitchen counter'
];

export const RememberMyHome: CognitiveGame = {
  key: 'remember_my_home',
  title: 'Remember My Home',
  description: 'Remember where everyday objects are placed in your home',
  icon: '🏠',
  primarySkills: ['spatial-memory', 'visual-memory'],
  color: '#FF8A65',

  startSession(userId, difficulty) {
    const count = difficulty.itemCount;
    const objects = pickRandom(HOME_OBJECTS, count);
    const positions = pickRandom(HOME_POSITIONS, count);

    const items: GameItem[] = objects.map((obj, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `Where was the ${obj} placed?`,
      choices: shuffleArray([...pickRandom(HOME_POSITIONS.filter(p => p !== positions[i]), difficulty.distractorCount), positions[i]]),
      correctAnswer: positions[i],
      metadata: { object: obj, position: positions[i] },
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
// Working memory + attention: remember a shopping list, find items

const MARKET_ITEMS = [
  'Rice', 'Milk', 'Bread', 'Eggs', 'Sugar', 'Tea', 'Vegetables',
  'Fruits', 'Oil', 'Salt', 'Butter', 'Yogurt', 'Onions', 'Tomatoes',
  'Potatoes', 'Bananas', 'Apples', 'Biscuits'
];

export const MemoryMarket: CognitiveGame = {
  key: 'memory_market',
  title: 'Memory Market',
  description: 'Remember your shopping list and find items in the market',
  icon: '🛒',
  primarySkills: ['working-memory', 'attention'],
  color: '#66BB6A',

  startSession(userId, difficulty) {
    const listSize = difficulty.itemCount;
    const shoppingList = pickRandom(MARKET_ITEMS, listSize);
    const distractors = pickRandom(
      MARKET_ITEMS.filter(i => !shoppingList.includes(i)),
      difficulty.distractorCount
    );

    const items: GameItem[] = shoppingList.map((item, i) => ({
      index: i,
      type: 'select' as const,
      prompt: `Find "${item}" from the market stall`,
      choices: shuffleArray([item, ...pickRandom(distractors, Math.min(3, distractors.length))]),
      correctAnswer: item,
      metadata: { shoppingList },
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
      errorType: correct ? undefined : 'wrong_item',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 3: Name & Face Match ────────────────────────────────────────────────
// Recognition + associative: match names to faces

const CHARACTERS = [
  { name: 'Kamala', trait: 'wears green sari' },
  { name: 'Rajan', trait: 'has white beard' },
  { name: 'Meena', trait: 'wears red bindi' },
  { name: 'Suresh', trait: 'wears spectacles' },
  { name: 'Lakshmi', trait: 'has silver hair' },
  { name: 'Gopal', trait: 'carries walking stick' },
  { name: 'Priya', trait: 'wears blue dupatta' },
  { name: 'Anand', trait: 'has kind smile' },
];

export const NameFaceMatch: CognitiveGame = {
  key: 'name_face_match',
  title: 'Name & Face Match',
  description: 'Remember names and match them to the right person',
  icon: '👤',
  primarySkills: ['recognition', 'associative-memory'],
  color: '#42A5F5',

  startSession(userId, difficulty) {
    const chars = pickRandom(CHARACTERS, difficulty.itemCount);
    const allNames = CHARACTERS.map(c => c.name);

    const items: GameItem[] = chars.map((char, i) => ({
      index: i,
      type: 'match' as const,
      prompt: `Who is the person who ${char.trait}?`,
      choices: shuffleArray([char.name, ...pickRandom(allNames.filter(n => n !== char.name), difficulty.distractorCount)]),
      correctAnswer: char.name,
      metadata: char,
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
      errorType: correct ? undefined : 'wrong_name',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 4: Recipe Recall ────────────────────────────────────────────────────
// Sequential + executive: reorder recipe steps

const RECIPES: Record<string, string[]> = {
  'Tea': ['Boil water', 'Add tea leaves', 'Add milk', 'Add sugar', 'Strain into cup'],
  'Rice': ['Wash rice', 'Boil water', 'Add rice to water', 'Cook until soft', 'Drain excess water'],
  'Dosa': ['Soak rice and lentils', 'Grind into batter', 'Heat the griddle', 'Pour batter in circles', 'Cook until crispy'],
  'Chapati': ['Knead the dough', 'Make small balls', 'Roll into circles', 'Heat the pan', 'Cook both sides'],
};

export const RecipeRecall: CognitiveGame = {
  key: 'recipe_recall',
  title: 'Recipe Recall',
  description: 'Put the recipe steps in the right order',
  icon: '🍳',
  primarySkills: ['sequential-memory', 'executive-function'],
  color: '#FFA726',

  startSession(userId, difficulty) {
    const recipeNames = Object.keys(RECIPES);
    const recipeName = recipeNames[Math.floor(Math.random() * recipeNames.length)];
    const steps = RECIPES[recipeName];
    const count = Math.min(difficulty.itemCount, steps.length);
    const selectedSteps = steps.slice(0, count);

    const items: GameItem[] = [{
      index: 0,
      type: 'order' as const,
      prompt: `Put the steps for making ${recipeName} in the correct order:`,
      choices: shuffleArray([...selectedSteps]),
      correctAnswer: selectedSteps,
      metadata: { recipe: recipeName },
    }];

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
    const correctOrder = item.correctAnswer as string[];
    const userOrder = response.split(',').map(s => s.trim());
    const correct = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
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
// Episodic + sequential: remember locations visited in order

const JOURNEY_LOCATIONS = [
  'Temple', 'Market', 'Park', 'Library', 'Hospital',
  'School', 'Bus Stop', 'Lake', 'Garden', 'Post Office',
  'Bank', 'Restaurant', 'Cinema Hall'
];

export const MemoryJourney: CognitiveGame = {
  key: 'memory_journey',
  title: 'Memory Journey',
  description: 'Remember the places you visited on your journey',
  icon: '🚶',
  primarySkills: ['episodic-memory', 'sequential-memory'],
  color: '#AB47BC',

  startSession(userId, difficulty) {
    const locations = pickRandom(JOURNEY_LOCATIONS, difficulty.itemCount);

    const items: GameItem[] = locations.map((loc, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `What was stop #${i + 1} on your journey?`,
      choices: shuffleArray([loc, ...pickRandom(JOURNEY_LOCATIONS.filter(l => l !== loc), difficulty.distractorCount)]),
      correctAnswer: loc,
      metadata: { stopNumber: i + 1, route: locations },
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
      errorType: correct ? undefined : 'wrong_location',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 6: Complete the Tune ───────────────────────────────────────────────
// Auditory + associative: identify or complete a song

const SONGS = [
  { title: 'Twinkle Twinkle', line: 'Twinkle, twinkle, little ___', answer: 'star' },
  { title: 'Happy Birthday', line: 'Happy birthday to ___', answer: 'you' },
  { title: 'Old MacDonald', line: 'Old MacDonald had a ___', answer: 'farm' },
  { title: 'Row Row Row', line: 'Row, row, row your ___', answer: 'boat' },
  { title: 'Jack and Jill', line: 'Jack and Jill went up the ___', answer: 'hill' },
  { title: 'Mary Had a', line: 'Mary had a little ___', answer: 'lamb' },
];

export const CompleteTheTune: CognitiveGame = {
  key: 'complete_the_tune',
  title: 'Complete the Tune',
  description: 'Complete the missing word in famous songs',
  icon: '🎵',
  primarySkills: ['auditory-memory', 'associative-memory'],
  color: '#EC407A',

  startSession(userId, difficulty) {
    const songs = pickRandom(SONGS, difficulty.itemCount);

    const items: GameItem[] = songs.map((song, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: song.line,
      choices: shuffleArray([song.answer, ...pickRandom(SONGS.filter(s => s.answer !== song.answer).map(s => s.answer), difficulty.distractorCount)]),
      correctAnswer: song.answer,
      metadata: { songTitle: song.title },
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
// Auditory + comprehension: listen to a story, answer questions

const STORIES = [
  {
    text: 'Kamala went to the market yesterday. She bought vegetables and rice. On her way back, she met her old friend Meena at the bus stop.',
    questions: [
      { q: 'Where did Kamala go?', a: 'Market', wrong: ['Temple', 'Park', 'School'] },
      { q: 'What did she buy?', a: 'Vegetables and rice', wrong: ['Milk and bread', 'Fruits', 'Clothes'] },
      { q: 'Who did she meet?', a: 'Meena', wrong: ['Priya', 'Lakshmi', 'Suresh'] },
    ]
  },
  {
    text: 'Last Sunday, Rajan took his grandchildren to the park. They played on the swings and ate ice cream. They came home before sunset.',
    questions: [
      { q: 'When did they go to the park?', a: 'Last Sunday', wrong: ['Monday', 'Yesterday', 'Last week'] },
      { q: 'What did they eat?', a: 'Ice cream', wrong: ['Biscuits', 'Cake', 'Fruits'] },
      { q: 'When did they come home?', a: 'Before sunset', wrong: ['After dinner', 'At night', 'At noon'] },
    ]
  },
];

export const StoryDetective: CognitiveGame = {
  key: 'story_detective',
  title: 'Story Detective',
  description: 'Listen to a short story and answer questions about it',
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
      metadata: { storyText: story.text },
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
// Working + spatial: remember where everyday objects are placed

const EVERYDAY_OBJECTS = [
  'Spectacles', 'House Keys', 'Wallet', 'Medicine Box', 'TV Remote',
  'Phone', 'Prayer Beads', 'Hearing Aid', 'Comb', 'Torch'
];
const KEEP_LOCATIONS = [
  'Bedroom drawer', 'Kitchen shelf', 'Hall table', 'Sofa cushion',
  'Bathroom counter', 'Dining table', 'Bedside table', 'Window sill',
  'Main door hook', 'Cupboard top'
];

export const WhereDidIKeepIt: CognitiveGame = {
  key: 'where_did_i_keep_it',
  title: 'Where Did I Keep It?',
  description: 'Remember where you placed everyday objects around the house',
  icon: '🔑',
  primarySkills: ['working-memory', 'spatial-memory'],
  color: '#26A69A',

  startSession(userId, difficulty) {
    const objects = pickRandom(EVERYDAY_OBJECTS, difficulty.itemCount);
    const locations = pickRandom(KEEP_LOCATIONS, difficulty.itemCount);

    const items: GameItem[] = objects.map((obj, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `Where did you keep your ${obj}?`,
      choices: shuffleArray([locations[i], ...pickRandom(KEEP_LOCATIONS.filter(l => l !== locations[i]), difficulty.distractorCount)]),
      correctAnswer: locations[i],
      metadata: { object: obj, location: locations[i] },
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
      errorType: correct ? undefined : 'wrong_location',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 9: Memory Garden ───────────────────────────────────────────────────
// Visual + spatial + long-term: remember what's planted where

const GARDEN_PLANTS = [
  'Rose', 'Jasmine', 'Tulsi', 'Marigold', 'Hibiscus',
  'Lily', 'Sunflower', 'Mango Tree', 'Coconut Palm', 'Curry Leaves',
  'Tomato', 'Chilli', 'Mint'
];
const GARDEN_SPOTS = [
  'Front gate', 'Left corner', 'Center bed', 'Right corner',
  'Back wall', 'Near the tap', 'By the fence', 'Beside the path'
];

export const MemoryGarden: CognitiveGame = {
  key: 'memory_garden',
  title: 'Memory Garden',
  description: 'Remember what you planted and where in your garden',
  icon: '🌺',
  primarySkills: ['visual-memory', 'spatial-memory', 'long-term-memory'],
  color: '#4CAF50',

  startSession(userId, difficulty) {
    const plants = pickRandom(GARDEN_PLANTS, difficulty.itemCount);
    const spots = pickRandom(GARDEN_SPOTS, difficulty.itemCount);

    const items: GameItem[] = plants.map((plant, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `Where did you plant the ${plant}?`,
      choices: shuffleArray([spots[i], ...pickRandom(GARDEN_SPOTS.filter(s => s !== spots[i]), difficulty.distractorCount)]),
      correctAnswer: spots[i],
      metadata: { plant, spot: spots[i] },
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
      errorType: correct ? undefined : 'wrong_spot',
    };
    session.attempts.push(result);
    session.currentItemIndex++;
    return result;
  },

  endSession(session) { return calculateSummary(session); },
};


// ─── Game 10: Memory Album ───────────────────────────────────────────────────
// Recognition + episodic: identify seen vs unseen images, recall details

const ALBUM_ITEMS = [
  { scene: 'Family gathering at Diwali', detail: 'Everyone wore new clothes' },
  { scene: 'Trip to the beach', detail: 'Children built sandcastles' },
  { scene: 'Birthday celebration', detail: 'There was a chocolate cake' },
  { scene: 'Wedding ceremony', detail: 'The bride wore a red sari' },
  { scene: 'Temple visit', detail: 'They offered flowers and fruits' },
  { scene: 'Picnic at the park', detail: 'They sat under a big banyan tree' },
  { scene: 'School annual day', detail: 'Grandchild won a prize' },
  { scene: 'Morning walk', detail: 'Met the neighbor and talked about the weather' },
];

export const MemoryAlbum: CognitiveGame = {
  key: 'memory_album',
  title: 'Memory Album',
  description: 'Remember details from special moments in your life',
  icon: '📸',
  primarySkills: ['recognition', 'episodic-memory'],
  color: '#78909C',

  startSession(userId, difficulty) {
    const selected = pickRandom(ALBUM_ITEMS, difficulty.itemCount);

    const items: GameItem[] = selected.map((item, i) => ({
      index: i,
      type: 'recall' as const,
      prompt: `What was special about the "${item.scene}"?`,
      choices: shuffleArray([
        item.detail,
        ...pickRandom(ALBUM_ITEMS.filter(a => a.detail !== item.detail).map(a => a.detail), difficulty.distractorCount),
      ]),
      correctAnswer: item.detail,
      metadata: item,
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
