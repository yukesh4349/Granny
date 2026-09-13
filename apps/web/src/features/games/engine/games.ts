// ============================================================================
// 20 Nostalgia-Based Cognitive Games — Complete Library
// Categorized into Outdoor Traditional, Indoor Traditional, and Cinema Nostalgia
// ============================================================================
import {
  CognitiveGame, SessionState, GameItem, AttemptResult, SessionSummary,
  DifficultyParams, generateSessionId, shuffleArray, pickRandom, calculateSummary
} from './types';

// ============================================================================
// GROUP A: OUTDOOR / TRADITIONAL GAMES (1–10)
// ============================================================================

// ─── 1. Nondi (Hopscotch) ───────────────────────────────────────────────────
const NONDI_DATA = [
  { step: 'Square 1: The Base Entrance (கட்டம் 1 - தரை)', emoji: '🦶', question: 'You tossed the pebble into Square 1. Which foot balances first?', answer: 'Single Right Foot Jump', distractors: ['Both Feet Flat', 'Backwards Hop', 'Double Hand Balance'] },
  { step: 'Square 2 & 3: Twin Wings (கட்டம் 2 & 3 - இறக்கைகள்)', emoji: '🦵', question: 'At Squares 2 and 3, how must your feet land?', answer: 'Straddle Both Feet Simultaneously', distractors: ['Single Toe Hop', 'Left Foot Only', 'Sit on Pebble'] },
  { step: 'Square 4: Center Pivot (கட்டம் 4 - நடு மையம்)', emoji: '🎯', question: 'Which square comes directly after passing the twin wings?', answer: 'Square 4 Single Box', distractors: ['Square 7 Hilltop', 'Square 1 Return', 'Square 8 Home'] },
  { step: 'Square 7 & 8: The Golden Mountain / Fruit (பழம் / மலை)', emoji: '🍎', question: 'What do you do when reaching the peak "Pazham" (Square 8)?', answer: '180° Turnaround Jump without touching lines', distractors: ['Step Outside Grid', 'Kick the Pebble Away', 'End the Game'] }
];

export const NondiGame: CognitiveGame = {
  key: 'nondi',
  title: 'Nondi (Hopscotch)',
  description: 'Sequential working memory & spatial hopscotch pattern recall',
  icon: '🦶',
  primarySkills: ['working-memory', 'attention', 'spatial-memory'],
  color: '#43A047',
  startSession(userId, difficulty) {
    const items: GameItem[] = NONDI_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.step, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 2. Kanche (Marbles / கோலி குண்டு) ──────────────────────────────────────
const KANCHE_DATA = [
  { name: 'Ruby Red Tiger Marble (சிவப்பு கோலி)', emoji: '🔴', pos: 'Top-Right Ring Corner', question: 'Where was the Ruby Red Marble positioned inside the circle?', answer: 'Top-Right Ring Corner', distractors: ['Center Target Pit', 'Bottom-Left Edge', 'Outside Ring Line'] },
  { name: 'Emerald Green Cat-Eye (பச்சை கோலி)', emoji: '🟢', pos: 'Dead Center Target Spot', question: 'Which marble was resting directly in the center target pit?', answer: 'Emerald Green Cat-Eye', distractors: ['Clear Crystal Marble', 'Amber Striped Marble', 'Blue Ocean Marble'] },
  { name: 'Royal Blue Swirl (நீல கோலி)', emoji: '🔵', pos: 'Bottom-Left Boundary', question: 'Where did the Royal Blue Marble roll before being hidden?', answer: 'Bottom-Left Boundary', distractors: ['Top-Right Corner', 'Center Circle', 'Behind the Strike Line'] },
  { name: 'Golden Amber Marble (மஞ்சள் கோலி)', emoji: '🟡', pos: 'Near the Player Strike Line', question: 'Which marble was placed closest to the thumb striker line?', answer: 'Golden Amber Marble', distractors: ['Ruby Red Marble', 'Emerald Green Marble', 'Black Pearl Marble'] }
];

export const KancheGame: CognitiveGame = {
  key: 'kanche',
  title: 'Kanche (Marbles)',
  description: 'Visual position recall & spatial location memory of colorful marbles',
  icon: '⚪',
  primarySkills: ['visual-memory', 'spatial-memory'],
  color: '#1E88E5',
  startSession(userId, difficulty) {
    const items: GameItem[] = KANCHE_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.name, emoji: d.emoji, correctAnswer: d.pos }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 3. Gilli Danda (கிட்டிப்புல்) ──────────────────────────────────────────
const GILLI_DATA = [
  { title: 'The Angled Tap Strike (சிறு தட்டு)', emoji: '🏏', question: 'When the tip of the tapered Gilli is tapped upward, what is the next action?', answer: 'Strike mid-air with full Danda swing', distractors: ['Catch with bare hand', 'Let it fall into pit', 'Kick with barefoot'] },
  { title: 'Distance Measure Count (தண்டா அளவீடு)', emoji: '📏', question: 'In traditional rules, how is the winning score measured from the pit?', answer: 'Counted in whole Danda (stick) lengths', distractors: ['Measured in hand spans', 'Counted in footsteps', 'Measured by clock minutes'] },
  { title: 'High Lofted Flight over Courtyard', emoji: '🌳', question: 'A solid lofted strike flew over the mango tree. Where will it land?', answer: 'Far Open Field beyond the tree', distractors: ['Inside the starter pit', 'Near the batsman feet', 'On the umpire shoulder'] }
];

export const GilliDandaGame: CognitiveGame = {
  key: 'gilli_danda',
  title: 'Gilli Danda',
  description: 'Trajectory coordination, speed prediction & rule memory',
  icon: '🏏',
  primarySkills: ['processing-speed', 'attention'],
  color: '#8D6E63',
  startSession(userId, difficulty) {
    const items: GameItem[] = GILLI_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.title, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 4. Uriyadi (உறியடி திருவிழா) ──────────────────────────────────────────
const URIYADI_DATA = [
  { pot: 'Turmeric & Saffron Mud Pot (மஞ்சள் குங்கும பானை)', emoji: '🍯', question: 'The decorated pot is hoisted high and swinging left-to-right. When do you strike?', answer: 'Exact bottom center of the swing arch', distractors: ['When water is splashed in eyes', 'When pot is pulled to ceiling', 'After the drum stops'] },
  { pot: 'Curd & Sweet Butter Pot (வெண்ணெய் பானை)', emoji: '🧈', question: 'What traditional treats spill down when the Uri pot breaks open?', answer: 'Fresh butter, curd & flower petals', distractors: ['Dry red chillies', 'Hot sambar', 'Iron coins'] },
  { pot: 'Temple Chariot Uriyadi (கோவில் உறியடி)', emoji: '🪘', question: 'Which rhythm instrument signals the tempo for the striker?', answer: 'Urumi Melam & Thavil beat', distractors: ['Flute lullaby', 'Telephone ring', 'Car horn'] }
];

export const UriyadiGame: CognitiveGame = {
  key: 'uriyadi',
  title: 'Uriyadi',
  description: 'Timing precision, reaction calibration & festive memory',
  icon: '🍯',
  primarySkills: ['reaction-time', 'attention'],
  color: '#FFA000',
  startSession(userId, difficulty) {
    const items: GameItem[] = URIYADI_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.pot, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 5. Tyre Oattam (Tyre Racing / டயர் ஓட்டம்) ───────────────────────────
const TYRE_DATA = [
  { scene: 'Village Banyan Tree Turn (ஆலமரம் திருப்பம்)', emoji: '🛞', question: 'You guided your cycle tyre past the temple tank. Which turn came next?', answer: 'Sharp Left past the Big Banyan Tree', distractors: ['Dead-end Mud Wall', 'Right into Cow Shed', 'Reverse back to Start'] },
  { scene: 'Potter Street Obstacle (குயவர் தெரு)', emoji: '🪴', question: 'To keep the tyre rolling straight, how do you tap it with the stick?', answer: 'Gentle rhythmic taps on the upper tread', distractors: ['Stop tyre completely', 'Hit ground with stick', 'Throw stick into wheel'] },
  { scene: 'Finish Line at Village Tea Stall (டீ கடை எல்லை)', emoji: '🏁', question: 'Which landmark marked the grand finish line of the street race?', answer: 'Nair Tea Stall Bench', distractors: ['High School Library', 'Railway Station Platform', 'Bus Depot Gate'] }
];

export const TyreOattamGame: CognitiveGame = {
  key: 'tyre_oattam',
  title: 'Tyre Oattam (Tyre Racing)',
  description: 'Spatial route navigation, landmark memory & motor planning',
  icon: '🛞',
  primarySkills: ['spatial-memory', 'planning'],
  color: '#37474F',
  startSession(userId, difficulty) {
    const items: GameItem[] = TYRE_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.scene, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 6. Pattam Viduthal (Kite Flying / பட்டம் விடுதல்) ─────────────────────
const PATTAM_DATA = [
  { kite: 'Rooftop East Wind (கீழ்க்காற்று)', emoji: '🪁', question: 'The strong East breeze is blowing. How do you launch the diamond kite?', answer: 'Face into the wind and release with gentle tugs', distractors: ['Run backwards blindly', 'Tie kite to terrace pillar', 'Drop spool on floor'] },
  { kite: 'Manja Thread Control (நூல் கட்டுப்பாடு)', emoji: '🧵', question: 'When another kite crosses your flight line, what is the master move?', answer: 'Give steady slack (vittu vidudhal) then sharp pull', distractors: ['Cut own thread', 'Drop the wooden spool', 'Close eyes and wait'] },
  { kite: 'Avoiding Terrace Trees (மரங்களைத் தவிர்த்தல்)', emoji: '🌴', question: 'A tall coconut palm is to the North. Which direction should you steer?', answer: 'Steer South towards open skyline', distractors: ['Dive directly into palm fronds', 'Let thread tangle in cables', 'Release kite spool'] }
];

export const PattamViduthalGame: CognitiveGame = {
  key: 'pattam_viduthal',
  title: 'Pattam Viduthal (Kite Flying)',
  description: 'Wind direction awareness, path planning & spatial orientation',
  icon: '🪁',
  primarySkills: ['spatial-memory', 'reasoning'],
  color: '#00ACC1',
  startSession(userId, difficulty) {
    const items: GameItem[] = PATTAM_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.kite, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 7. Street Cricket (தெரு கிரிக்கெட்) ──────────────────────────────────
const CRICKET_DATA = [
  { rule: 'One-Bounce Hand Catch (ஒரு துள்ளல் கேட்ச்)', emoji: '🏏', question: 'In local gully cricket rules, catching the ball after 1 bounce with one hand is:', answer: 'OUT (Declared Batsman Dismissed)', distractors: ['Six Runs Added', 'Free Hit Next Ball', 'Dead Ball Reset'] },
  { rule: 'Direct Window Glass Hit (கண்ணாடி உடைத்தால்)', emoji: '🪟', question: 'If the tennis ball directly shatters neighbour’s window glass, what is the rule?', answer: 'OUT + Batsman must retrieve the ball', distractors: ['Four Runs Awarded', 'Man of the Match', 'New Ball Free'] },
  { rule: 'Match Winning Calculation (வெற்றி கணக்கு)', emoji: '🔢', question: 'Last over: 7 runs needed in 2 balls. Batsman hits a 4. How many needed on the last ball?', answer: '3 Runs to Win', distractors: ['5 Runs', '1 Run', '8 Runs'] }
];

export const StreetCricketGame: CognitiveGame = {
  key: 'street_cricket',
  title: 'Street Cricket',
  description: 'Local rules memory, situational logic & quick mental calculation',
  icon: '🏏',
  primarySkills: ['working-memory', 'mental-calculation'],
  color: '#2E7D32',
  startSession(userId, difficulty) {
    const items: GameItem[] = CRICKET_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.rule, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 8. Kabaddi (சடுகுடு / கபடி) ──────────────────────────────────────────
const KABADDI_DATA = [
  { play: 'The Continuous Chant (கபடி மூச்சு விடா உத்தி)', emoji: '🤼', question: 'What sacred rule must a raider maintain continuously in opponent court?', answer: 'Unbroken "Kabaddi" vocal chant in one breath', distractors: ['Whistling with fingers', 'Calling player names', 'Silent stealth walk'] },
  { play: 'Bonus Line Crossing (போனஸ் கோடு)', emoji: '👣', question: 'To score a bonus point, what must the raider’s feet do?', answer: 'One foot past bonus line with trailing foot in air', distractors: ['Both feet outside lobby', 'Touch the referee desk', 'Sit on mid-line'] },
  { play: 'Chain Tackle Defense (சங்கிலி பிடி)', emoji: '⛓️', question: 'When the raider reaches deep into Right Corner, how do defenders trap him?', answer: 'Right Corner and In lock hands in an ankle chain', distractors: ['Run away to gallery', 'Push raider into audience', 'Wave hands in air'] }
];

export const KabaddiGame: CognitiveGame = {
  key: 'kabaddi',
  title: 'Kabaddi',
  description: 'Position tracking, tactical memory & movement decision making',
  icon: '🤼',
  primarySkills: ['movement-memory', 'decision-making'],
  color: '#D84315',
  startSession(userId, difficulty) {
    const items: GameItem[] = KABADDI_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.play, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 9. Kokko / Kho-Kho (கோ-கோ) ──────────────────────────────────────────
const KHOKHO_DATA = [
  { pos: 'Alternating Facing Order (எதிர் திசை அமர்வு)', emoji: '🏃', question: 'In Kho-Kho, how do adjacent seated chasers face along the central line?', answer: 'In alternating opposite directions', distractors: ['All facing North', 'All facing the runner', 'Sitting in circle'] },
  { pos: 'The Pole Turn Drive (கம்பம் சுழற்சி)', emoji: '🚩', question: 'When an active chaser runs around the wooden pole, what becomes valid?', answer: 'Can switch running direction legally', distractors: ['Must sit down immediately', 'Runner is automatically out', 'Game is paused for tea'] },
  { pos: 'Giving the Kho (கோ தொடுதல்)', emoji: '👋', question: 'How must a chaser pass the turn to a seated teammate?', answer: 'Tap back firmly and say "KHO!" loudly', distractors: ['Whisper in ear', 'Kick foot lightly', 'Signal with handkerchief'] }
];

export const KhoKhoGame: CognitiveGame = {
  key: 'kho_kho',
  title: 'Kokko / Kho-Kho',
  description: 'Sequential order memory, directional tracking & fast recall',
  icon: '🏃',
  primarySkills: ['sequential-memory', 'working-memory'],
  color: '#5E35B1',
  startSession(userId, difficulty) {
    const items: GameItem[] = KHOKHO_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.pos, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 10. Skipping Rope (கயிறு தாண்டுதல்) ──────────────────────────────────
const SKIPPING_DATA = [
  { rhythm: 'Slow Morning Warmup (காலை மித தாளம்)', emoji: '🪢', question: 'The rope turns smoothly at 1 turn per second. When do both feet leave the ground?', answer: 'Just as the rope sweeps past eye level towards toes', distractors: ['When rope is at top peak', 'After rope touches ankles', 'Keep feet glued to floor'] },
  { rhythm: 'Twin Rope Double-Dutch (இரட்டை கயிறு)', emoji: '⚡', question: 'With two ropes turning inward in counter-rhythm, what must the jumper match?', answer: 'Alternate step-hops to the dual rhythm beat', distractors: ['Stand still in middle', 'Jump only once per minute', 'Close eyes and squat'] },
  { rhythm: 'The Counting Rhyme (நூறு எண்ணிக்கை பாட்டு)', emoji: '🎵', question: 'Traditional rhyme: "Aanai varum pinne...". What happens on the count of 10?', answer: 'Perform a high cross-jump without pause', distractors: ['Drop rope and run', 'Switch off music', 'Sit on bench'] }
];

export const SkippingRopeGame: CognitiveGame = {
  key: 'skipping_rope',
  title: 'Skipping Rope',
  description: 'Auditory rhythm matching, timing coordination & sustained attention',
  icon: '🪢',
  primarySkills: ['processing-speed', 'attention'],
  color: '#E91E63',
  startSession(userId, difficulty) {
    const items: GameItem[] = SKIPPING_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.rhythm, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};


// ============================================================================
// GROUP B: INDOOR / TRADITIONAL GAMES (11–15)
// ============================================================================

// ─── 11. Pallanguzhi (பல்லாங்குழி) ─────────────────────────────────────────
const PALLANGUZHI_DATA = [
  { pit: 'Tamarind Seeds Distribution (புளியங்கொட்டை பகிர்வு)', emoji: '🪵', question: 'In traditional Pallanguzhi, each of the 14 wooden pits begins with how many seeds?', answer: '5 Tamarind Seeds (or Cowrie Shells)', distractors: ['12 Seeds', '1 Seed only', '20 Seeds'] },
  { pit: 'Winning the Pasu Cup (பசு குழி சேகரிப்பு)', emoji: '🐄', question: 'When exactly 4 seeds accumulate in any pit during your turn, what happens?', answer: 'You capture them immediately as "Pasu" (Prize)', distractors: ['They are removed from board', 'Give them to opponent', 'Double the seed count'] },
  { pit: 'The Empty Pit Sweep (தடவு குழி வெற்றி)', emoji: '🏆', question: 'When your hand becomes empty and the next pit is empty, what do you collect?', answer: 'All seeds in the pit immediately following the empty pit', distractors: ['Nothing, turn is lost', 'All seeds on board', 'Opponent store box'] }
];

export const PallanguzhiGame: CognitiveGame = {
  key: 'pallanguzhi',
  title: 'Pallanguzhi',
  description: 'Counting logic, working memory & seed distribution strategy',
  icon: '🪵',
  primarySkills: ['working-memory', 'counting-reasoning'],
  color: '#795548',
  startSession(userId, difficulty) {
    const items: GameItem[] = PALLANGUZHI_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.pit, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 12. Thaayam (தாயக்கட்டம் / தாயம்) ─────────────────────────────────────
const THAAYAM_DATA = [
  { dice: 'Opening Roll of Dayam (தாயம் 1)', emoji: '🎲', question: 'What specific brass dice roll is strictly required to enter a coin from home into the board?', answer: 'Dayam (Roll of 1)', distractors: ['Roll of 4', 'Roll of 2', 'Roll of 3'] },
  { dice: 'Safe Mountain Squares (மலை / கோட்டை மனை)', emoji: '🏰', question: 'On squares marked with an "X" (Malai), what is the inviolable rule?', answer: 'Coins are immune and cannot be cut by opponents', distractors: ['Coins must jump off board', 'Opponent gets double turns', 'Coins become queens'] },
  { dice: 'Bonus Throw on 12 (பன்னிரண்டு போடுதல்)', emoji: '✨', question: 'Rolling a 12 (or Dayam 1) gives the player which extra benefit?', answer: 'Move 12 squares + roll the brass dice again', distractors: ['Pass turn immediately', 'Remove one coin from play', 'Switch boards'] }
];

export const ThaayamGame: CognitiveGame = {
  key: 'thaayam',
  title: 'Thaayam',
  description: 'Strategic reasoning, probability calculation & safe-house planning',
  icon: '🎲',
  primarySkills: ['reasoning', 'decision-making'],
  color: '#C2185B',
  startSession(userId, difficulty) {
    const items: GameItem[] = THAAYAM_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.dice, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 13. Paramapadham (பரமபதம் / Snakes & Ladders) ─────────────────────────
const PARAMAPADHAM_DATA = [
  { board: 'The Virtue Ladder at Square 14 (தர்ம ஏணி)', emoji: '🪜', question: 'Your counter lands on Square 14 (Dharma Ladder). Where does it climb?', answer: 'Ascends directly to Square 48 (Heavenly Garden)', distractors: ['Slides down to Square 2', 'Stays at Square 14', 'Returns to start'] },
  { board: 'The Pride Snake at Square 84 (அகந்தை பாம்பு)', emoji: '🐍', question: 'Landing on Square 84 (Snake of Pride) swallows your counter down to where?', answer: 'Slides all the way down to Square 28', distractors: ['Climbs to Square 100', 'Stays on Square 84', 'Wins the game'] },
  { board: 'Reaching Vaikuntha Peak 100 (வைகுந்த மோக்ஷம்)', emoji: '👑', question: 'Your counter is at Square 97. What exact dice roll reaches Square 100?', answer: 'Exact roll of 3', distractors: ['Roll of 6', 'Roll of 1', 'Roll of 5'] }
];

export const ParamapadhamGame: CognitiveGame = {
  key: 'paramapadham',
  title: 'Paramapadham (Snakes & Ladders)',
  description: 'Spatial risk assessment, number calculation & goal visualization',
  icon: '🪜',
  primarySkills: ['spatial-memory', 'problem-solving'],
  color: '#00897B',
  startSession(userId, difficulty) {
    const items: GameItem[] = PARAMAPADHAM_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.board, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 14. Seettu Vilayattu (Playing Cards / சீட்டு விளையாட்டு) ──────────────
const SEETTU_DATA = [
  { card: 'Pure Sequence Recall (தூய வரிசை)', emoji: '🃏', question: 'In traditional 13-card Rummy, which sequence is a 100% Pure Run?', answer: '♠ 7, ♠ 8, ♠ 9 (Same Suit in Order)', distractors: ['♥ 7, ♠ 7, ♦ 7 (Set)', '♣ 2, ♣ 4, ♣ 6 (Alternating)', '♥ K, ♠ Q, ♦ J (Mixed)'] },
  { card: 'The Trump Card Suit (துருப்பு சீட்டு)', emoji: '🂡', question: 'In the game of 28 (இருபத்தெட்டு), which card holds the highest individual value (3 points)?', answer: 'The Jack (குலாம்)', distractors: ['The King (ராஜா)', 'The 2 Card', 'The Ace (ஆஸ்)'] },
  { card: 'Memory Pair Match (ஜோடி சீட்டு)', emoji: '🎴', question: 'Two King cards were turned face-down on positions 1 and 4. Which card matches Position 1?', answer: 'The Red King of Diamonds at Position 4', distractors: ['Black 2 of Spades at Position 2', 'Queen of Hearts at Position 3', 'Jack of Clubs at Position 5'] }
];

export const SeettuVilayattuGame: CognitiveGame = {
  key: 'seettu_vilayattu',
  title: 'Playing Cards (Seettu Vilayattu)',
  description: 'Card sequence tracking, pattern recognition & working memory',
  icon: '🃏',
  primarySkills: ['visual-memory', 'pattern-recognition'],
  color: '#3949AB',
  startSession(userId, difficulty) {
    const items: GameItem[] = SEETTU_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.card, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 15. Carrom (கேரம் போர்டு) ─────────────────────────────────────────────
const CARROM_DATA = [
  { shot: 'The Red Queen Pocketing (சிவப்பு ராணி காசு)', emoji: '🎯', question: 'When pocketing the Red Queen (3 points), what must be pocketed on the immediate next shot?', answer: 'A Cover Coin (Any color carrom man)', distractors: ['The Striker itself', 'Opponent King', 'No second shot needed'] },
  { shot: 'Bank Rebound Angle (மறுமுனை அடி)', emoji: '📐', question: 'A white coin is glued against the opposite wooden frame. What striker angle releases it?', answer: '45° Bank Cut into the nearest corner pocket', distractors: ['Direct straight smash', 'Reverse back onto baseline', 'Soft tap away from board'] },
  { shot: 'Penalty Foul Rule (பெனால்டி ஃபவுல்)', emoji: '🚫', question: 'If the striker accidentally slips directly into a corner pocket (Foul), what is the penalty?', answer: 'Return one previously pocketed coin to center circle (Due)', distractors: ['Lose the entire game', 'Give striker to opponent', 'Wipe board with powder'] }
];

export const CarromGame: CognitiveGame = {
  key: 'carrom',
  title: 'Carrom',
  description: 'Visuospatial geometry, angle memory & strategic shot planning',
  icon: '🎯',
  primarySkills: ['visuospatial', 'attention'],
  color: '#D32F2F',
  startSession(userId, difficulty) {
    const items: GameItem[] = CARROM_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.shot, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};


// ============================================================================
// GROUP C: TAMIL CINEMA & MEDIA NOSTALGIA GAMES (16–20)
// ============================================================================

// ─── 16. Old Tamil Movie Poster Memory (பழைய சினிமா போஸ்டர்) ───────────────
const MOVIE_POSTER_DATA = [
  { movie: 'Veerapandiya Kattabomman (1959)', emoji: '🎬', question: 'In the legendary 1959 poster of "Veerapandiya Kattabomman", who stands with majestic royal posture?', answer: 'Nadigar Thilagam Sivaji Ganesan', distractors: ['MGR', 'Gemini Ganesan', 'Nagesh'] },
  { movie: 'Enga Veettu Pillai (1965)', emoji: '🎞️', question: 'In the iconic 1965 poster "Enga Veettu Pillai", MGR starred in what memorable dual roles?', answer: 'Twin brothers: Brave Villager & Gentle Rich Son (Ramu & Ilango)', distractors: ['King & Minister', 'Police & Detective', 'Doctor & Pilot'] },
  { movie: 'Thillana Mohanambal (1968)', emoji: '💃', question: 'The vintage poster of "Thillana Mohanambal" featured Sivaji Ganesan playing what instrument opposite Padmini?', answer: 'Nadaswaram (நாதஸ்வர கலைஞர் சிக்குல் சண்முகசுந்தரம்)', distractors: ['Violin', 'Veena', 'Mridangam'] },
  { movie: 'Baashha (1995)', emoji: '🛺', question: 'In the legendary 1995 poster, superstar Rajinikanth sits proudly in front of which iconic vehicle?', answer: 'Auto Rickshaw (Manikkam Basha)', distractors: ['Royal Enfield Bullet', 'Vintage Rolls Royce', 'Ambassador Car'] }
];

export const MoviePosterMemoryGame: CognitiveGame = {
  key: 'movie_poster_memory',
  title: 'Old Tamil Movie Poster Memory',
  description: 'Visual poster recall, iconic film details & nostalgic long-term recognition',
  icon: '🎬',
  primarySkills: ['long-term-memory', 'visual-recognition'],
  color: '#F57C00',
  startSession(userId, difficulty) {
    const items: GameItem[] = MOVIE_POSTER_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.movie, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 17. Ilaiyaraaja Song Memory (இளையராஜா இசை நினைவுகள்) ──────────────────
const ILAIYARAAJA_DATA = [
  { song: 'Thenpandi Cheemayile (நாயகன்)', emoji: '🎵', question: 'Complete the soulful melody: "Thenpandi cheemayile therodum veethiyile... ____"', answer: '...Naan thaan da un magan ena kettal enna solven', distractors: ['...Poojaikku vandha malare', '...Kanne un mugam paarpaen', '...Raasathi unna kaanadha nenju'] },
  { song: 'Kanmani Anbodu Kaadhalan (குணா)', emoji: '💌', question: 'In "Kanmani Anbodu", Kamal Haasan famously opens the song with which dialogue line?', answer: '"Kanmani Anbodu Kaadhalan Naan Ezhudhum Kadidhame..."', distractors: ['"Vandhenda Paalkaran..."', '"Hello Doctor..."', '"Naan oru thadava sonna..."'] },
  { song: 'Chinna Chinna Vanna Kuyil (மௌன ராகம்)', emoji: '🐦', question: 'Who sang the evergreen morning melody "Chinna Chinna Vanna Kuyil" composed by Maestro Ilaiyaraaja?', answer: 'S. Janaki (எஸ். ஜானகி)', distractors: ['K.S. Chithra', 'P. Susheela', 'S.P. Sailaja'] },
  { song: 'Senthazham Poovil (முள்ளும் மலரும்)', emoji: '🌸', question: 'Which legendary singer voiced the gentle evening classical song "Senthazham Poovil"?', answer: 'K.J. Yesudas (கே.ஜே. யேசுதாஸ்)', distractors: ['T.M. Soundararajan', 'S.P. Balasubrahmanyam', 'Malaysia Vasudevan'] }
];

export const IlaiyaraajaMelodyGame: CognitiveGame = {
  key: 'ilaiyaraaja_melody',
  title: 'Ilaiyaraaja Song Memory',
  description: 'Auditory melody recall, classic lyrics completion & semantic music memory',
  icon: '🎵',
  primarySkills: ['auditory-memory', 'language-recall'],
  color: '#7B1FA2',
  startSession(userId, difficulty) {
    const items: GameItem[] = ILAIYARAAJA_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.song, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 18. Identify Old Tamil Actor/Actress (பழைய திரை நட்சத்திரங்கள்) ────────
const ACTORS_DATA = [
  { star: 'Nadigar Thilagam Sivaji Ganesan', emoji: '🌟', question: 'Which legendary actor gave the immortal court dialogue: "Yaarukku theriyum... Veerapandiya Kattabomman"?', answer: 'Sivaji Ganesan (சிவாஜி கணேசன்)', distractors: ['Gemini Ganesan', 'Jaishankar', 'M.K. Radha'] },
  { star: 'Nadigaier Thilagam Savitri', emoji: '👑', question: 'Which beloved queen of Indian cinema touched millions with her unforgettable performance in "Pasamalar" and "Mayabazar"?', answer: 'Savitri (சாவித்திரி)', distractors: ['K.R. Vijaya', 'B. Saroja Devi', 'Jayalalithaa'] },
  { star: 'Kalaivanar N.S. Krishnan & T.A. Mathuram', emoji: '🎭', question: 'Who was revered as Tamil cinema’s early philosopher-comedian couple in black & white classics?', answer: 'Kalaivanar N.S. Krishnan & T.A. Mathuram', distractors: ['Nagesh & Manorama', 'Goundamani & Senthil', 'Cho Ramaswamy & Vennira Aadai Moorthy'] },
  { star: 'Aachi Manorama', emoji: '👵', question: 'Which Guinness World Record legend starred in over 1,000 films as the warm family grandmother/mother of Tamil cinema?', answer: 'Aachi Manorama (மனோரமா)', distractors: ['Sowcar Janaki', 'Gandhimathi', 'M.N. Rajam'] }
];

export const ActorActressMatchGame: CognitiveGame = {
  key: 'actor_actress_match',
  title: 'Identify Old Tamil Actor/Actress',
  description: 'Iconic cinema faces, autobiographical movie memory & semantic recall',
  icon: '🌟',
  primarySkills: ['semantic-memory', 'facial-recognition'],
  color: '#C62828',
  startSession(userId, difficulty) {
    const items: GameItem[] = ACTORS_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.star, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 19. Cinema Ticket Counter (சினிமா தியேட்டர் டிக்கெட் கவுண்டர்) ───────────
const CINEMA_TICKET_DATA = [
  { theatre: 'Shanti Theatre Mount Road (சாந்தி தியேட்டர்)', emoji: '🎟️', question: 'In 1975, Shanti Theatre’s prime Balcony seating was famous for which special feature?', answer: 'Plush velvet seats & cool 70mm air-conditioned view', distractors: ['Standing room on balcony', 'Open roof stargazing', 'Plastic fold chairs'] },
  { theatre: 'Family Booking Calculation (டிக்கெட் கணக்கு)', emoji: '💺', question: 'Grandpa buys 4 First-Class tickets at ₹2.50 each. He pays with a ₹20 note. What is the change?', answer: '₹10.00 exact change', distractors: ['₹5.00 change', '₹15.00 change', '₹2.50 change'] },
  { theatre: 'The "Housefull" Board (ஹவுஸ்ஃபுல் பலகை)', emoji: '🛑', question: 'When the wooden red board "HOUSEFULL" was hung on the iron grill gate, what did moviegoers do?', answer: 'Wait for the 10:00 PM Night Show or buy tomorrow’s Advance Booking', distractors: ['Break down the gate', 'Cancel the movie', 'Demand a refund'] }
];

export const CinemaTicketCounterGame: CognitiveGame = {
  key: 'cinema_ticket_counter',
  title: 'Cinema Ticket Counter',
  description: 'Seating rules logic, ticket arithmetic & working memory allocation',
  icon: '🎟️',
  primarySkills: ['working-memory', 'logic'],
  color: '#AD1457',
  startSession(userId, difficulty) {
    const items: GameItem[] = CINEMA_TICKET_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.theatre, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};

// ─── 20. Oliyum Oliyum / Doordarshan Memory (ஒளியும் ஒலியும் நினைவுகள்) ─────
const OLIYUM_OLIYUM_DATA = [
  { show: 'Friday Night Oliyum Oliyum (வெள்ளிக்கிழமை ஒளியும் ஒலியும்)', emoji: '📺', question: 'Every Friday at 7:30 PM, the entire street gathered in front of the TV for which beloved programme?', answer: '"Oliyum Oliyum" — 5 hit Tamil film song clips', distractors: ['Morning Stock Market News', 'Late Night Cricket Highlights', 'Radio Weather Forecast'] },
  { show: 'Doordarshan Swirling Logo (தூர்தர்ஷன் லோகோ இசை)', emoji: '🌀', question: 'Which classical instrument played the iconic swirling signature tune of Doordarshan Kendra Chennai?', answer: 'Sitara & Shehnai orchestral symphony composed by Pandit Ravi Shankar', distractors: ['Electric Guitar Solo', 'Synthesizer Pop Beat', 'Drum Roll'] },
  { show: 'Evening Tamil News Reader (சோபனா ரவி செய்தி வாசிப்பு)', emoji: '📰', question: 'Whose calm, dignified voice welcomed viewers with "Vanakkam... Seithigal Vaasippadhu..."?', answer: 'Shobana Ravi (சோபனா ரவி)', distractors: ['SPB', 'Cho Ramaswamy', 'Vaali'] },
  { show: 'Sunday Evening Regional Film (ஞாயிறு மாலை திரைப்படம்)', emoji: '🍿', question: 'At 4:30 PM every Sunday, DD1 broadcasted what weekly family ritual?', answer: 'The Regional Tamil Feature Film Classic', distractors: ['English Cartoon Show', 'Cooking Demonstration', 'Aerobics Class'] }
];

export const OliyumOliyumGame: CognitiveGame = {
  key: 'oliyum_oliyum',
  title: 'Oliyum Oliyum / Doordarshan Memory',
  description: 'Golden era media memory, cued episodic retrieval & broadcast recall',
  icon: '📺',
  primarySkills: ['episodic-memory', 'cued-retrieval'],
  color: '#0277BD',
  startSession(userId, difficulty) {
    const items: GameItem[] = OLIYUM_OLIYUM_DATA.map((d, i) => ({
      index: i, type: 'recall',
      prompt: d.question,
      choices: shuffleArray([d.answer, ...d.distractors]),
      correctAnswer: d.answer,
      metadata: { object: d.show, emoji: d.emoji, correctAnswer: d.answer }
    }));
    return { sessionId: generateSessionId(), userId, gameKey: this.key, difficulty, currentItemIndex: 0, items, startedAt: new Date(), attempts: [] };
  },
  getNextItem(s) { return s.currentItemIndex < s.items.length ? s.items[s.currentItemIndex] : null; },
  submitAttempt(s, resp) {
    const item = s.items[s.currentItemIndex];
    const correct = resp.trim().toLowerCase() === (item.correctAnswer as string).trim().toLowerCase();
    const result: AttemptResult = { itemIndex: s.currentItemIndex, correct, latencyMs: 0, response: resp };
    s.attempts.push(result);
    s.currentItemIndex++;
    return result;
  },
  endSession(s) { return calculateSummary(s); }
};


// ============================================================================
// MASTER LIST: ALL 20 NOSTALGIA-BASED COGNITIVE GAMES
// ============================================================================
export const ALL_GAMES: CognitiveGame[] = [
  // A. Outdoor / Traditional Games
  NondiGame,
  KancheGame,
  GilliDandaGame,
  UriyadiGame,
  TyreOattamGame,
  PattamViduthalGame,
  StreetCricketGame,
  KabaddiGame,
  KhoKhoGame,
  SkippingRopeGame,

  // B. Indoor / Traditional Games
  PallanguzhiGame,
  ThaayamGame,
  ParamapadhamGame,
  SeettuVilayattuGame,
  CarromGame,

  // C. Tamil Cinema & Media Nostalgia Games
  MoviePosterMemoryGame,
  IlaiyaraajaMelodyGame,
  ActorActressMatchGame,
  CinemaTicketCounterGame,
  OliyumOliyumGame,
];

export function getGameByKey(key: string): CognitiveGame | undefined {
  return ALL_GAMES.find(g => g.key === key || g.key.replace(/_/g, '-') === key.replace(/_/g, '-'));
}

export function getGamesByCategory(category: 'outdoor' | 'indoor' | 'cinema'): CognitiveGame[] {
  if (category === 'outdoor') return ALL_GAMES.slice(0, 10);
  if (category === 'indoor') return ALL_GAMES.slice(10, 15);
  return ALL_GAMES.slice(15, 20);
}
