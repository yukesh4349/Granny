// ============================================================================
// 20 Nostalgia-Based Cognitive Games Data for React Native
// ============================================================================

export interface MobileGameItem {
  prompt: string;
  answer: string;
  choices: string[];
  emoji: string;
  metadataName: string;
}

export interface MobileGame {
  key: string;
  titleEn: string;
  titleTa: string;
  descEn: string;
  descTa: string;
  icon: string;
  color: string;
  category: 'outdoor' | 'indoor' | 'cinema';
  items: MobileGameItem[];
}

export const ALL_MOBILE_GAMES: MobileGame[] = [
  // ─── Group A: Outdoor / Traditional Games (1–10) ──────────────────────────
  {
    key: 'nondi',
    titleEn: 'Nondi (Hopscotch)',
    titleTa: 'நொண்டி (Hopscotch)',
    descEn: 'Sequential working memory & hopscotch grid recall',
    descTa: 'எண் கட்ட வரிசை நினைவாற்றல் மற்றும் ஒற்றைக்கால் தாண்டுதல்',
    icon: '🦶',
    color: '#43A047',
    category: 'outdoor',
    items: [
      { prompt: 'You tossed the pebble into Square 1. Which foot balances first?', answer: 'Single Right Foot Jump', choices: ['Single Right Foot Jump', 'Both Feet Flat', 'Backwards Hop', 'Double Hand Balance'], emoji: '🦶', metadataName: 'Square 1 Base' },
      { prompt: 'At Squares 2 and 3 (Twin Wings), how must your feet land?', answer: 'Straddle Both Feet Simultaneously', choices: ['Straddle Both Feet Simultaneously', 'Single Toe Hop', 'Left Foot Only', 'Sit on Pebble'], emoji: '🦵', metadataName: 'Twin Wings (2 & 3)' },
      { prompt: 'Which square comes directly after passing the twin wings?', answer: 'Square 4 Single Box', choices: ['Square 4 Single Box', 'Square 7 Hilltop', 'Square 1 Return', 'Square 8 Home'], emoji: '🎯', metadataName: 'Square 4 Pivot' },
      { prompt: 'What do you do when reaching the peak "Pazham" (Square 8)?', answer: '180° Turnaround Jump without touching lines', choices: ['180° Turnaround Jump without touching lines', 'Step Outside Grid', 'Kick the Pebble Away', 'End the Game'], emoji: '🍎', metadataName: 'Peak Pazham' },
    ]
  },
  {
    key: 'kanche',
    titleEn: 'Kanche (Marbles)',
    titleTa: 'கோலி குண்டு (Kanche)',
    descEn: 'Visual marble positions & spatial location memory',
    descTa: 'வண்ணக் கோலிகளின் வட்ட நிலைகள் மற்றும் காட்சி நினைவாற்றல்',
    icon: '⚪',
    color: '#1E88E5',
    category: 'outdoor',
    items: [
      { prompt: 'Where was the Ruby Red Marble positioned inside the circle?', answer: 'Top-Right Ring Corner', choices: ['Top-Right Ring Corner', 'Center Target Pit', 'Bottom-Left Edge', 'Outside Ring Line'], emoji: '🔴', metadataName: 'Ruby Red Marble' },
      { prompt: 'Which marble was resting directly in the center target pit?', answer: 'Emerald Green Cat-Eye', choices: ['Emerald Green Cat-Eye', 'Clear Crystal Marble', 'Amber Striped Marble', 'Blue Ocean Marble'], emoji: '🟢', metadataName: 'Center Pit Marble' },
      { prompt: 'Where did the Royal Blue Marble roll before being hidden?', answer: 'Bottom-Left Boundary', choices: ['Bottom-Left Boundary', 'Top-Right Corner', 'Center Circle', 'Behind Strike Line'], emoji: '🔵', metadataName: 'Royal Blue Marble' },
    ]
  },
  {
    key: 'gilli_danda',
    titleEn: 'Gilli Danda',
    titleTa: 'கிட்டிப்புல் (Gilli Danda)',
    descEn: 'Trajectory coordination, speed prediction & rule memory',
    descTa: 'திசை கணிப்பு, தட்டு வீச்சு மற்றும் மரபு அளவீடு',
    icon: '🏏',
    color: '#E65100',
    category: 'outdoor',
    items: [
      { prompt: 'When the tip of the tapered Gilli is tapped upward, what is the next action?', answer: 'Strike mid-air with full Danda swing', choices: ['Strike mid-air with full Danda swing', 'Catch with bare hand', 'Let it fall into pit', 'Kick with barefoot'], emoji: '🏏', metadataName: 'Gilli Tap' },
      { prompt: 'In traditional rules, how is the winning score measured from the pit?', answer: 'Counted in whole Danda stick lengths', choices: ['Counted in whole Danda stick lengths', 'Measured in hand spans', 'Counted in footsteps', 'Measured by clock minutes'], emoji: '📏', metadataName: 'Danda Measure' },
    ]
  },
  {
    key: 'uriyadi',
    titleEn: 'Uriyadi (Pot Breaking)',
    titleTa: 'உறியடி திருவிழா (Uriyadi)',
    descEn: 'Timing precision, reaction calibration & festive pot strike',
    descTa: 'ஆடும் பானை நேரக்கணிப்பு மற்றும் திருவிழா உறியடி நினைவுகள்',
    icon: '🏺',
    color: '#8E24AA',
    category: 'outdoor',
    items: [
      { prompt: 'When the clay pot is lowered to forehead height, what is the right moment to strike?', answer: 'Strike immediately as rope pauses', choices: ['Strike immediately as rope pauses', 'Wait until it touches ground', 'Strike while looking backwards', 'Run away from rope'], emoji: '🏺', metadataName: 'Pot Timing' },
      { prompt: 'What traditional reward is filled inside the Gokulashtami Uriyadi pot?', answer: 'Coins, Curd & Turmeric Water', choices: ['Coins, Curd & Turmeric Water', 'Dry Sand', 'Plastic Marbles', 'Ice Cubes'], emoji: '🪙', metadataName: 'Pot Contents' },
    ]
  },
  {
    key: 'tyre_oattam',
    titleEn: 'Tyre Oattam (Tyre Racing)',
    titleTa: 'டயர் ஓட்டம் (Tyre Racing)',
    descEn: 'Spatial route navigation & village lane maze planning',
    descTa: 'தெரு வழித்தட நினைவாற்றல் மற்றும் டயர் திருப்பங்கள்',
    icon: '🛞',
    color: '#00897B',
    category: 'outdoor',
    items: [
      { prompt: 'To steer the rolling bicycle tyre safely past the street corner well, how do you tap it?', answer: 'Rhythmically guide left wall with stick', choices: ['Rhythmically guide left wall with stick', 'Push backwards with two hands', 'Drop stick and kick tyre', 'Turn around completely'], emoji: '🛞', metadataName: 'Tyre Steering' },
      { prompt: 'Where is the finish line of the traditional village evening tyre race?', answer: 'The Banyan Tree Tea Stall', choices: ['The Banyan Tree Tea Stall', 'Inside the River Canal', 'Behind Closed Gates', 'Under Kitchen Shelf'], emoji: '🌳', metadataName: 'Village Route' },
    ]
  },
  {
    key: 'pattam_viduthal',
    titleEn: 'Pattam Viduthal (Kite Flying)',
    titleTa: 'பட்டம் விடுதல் (Kite Flying)',
    descEn: 'Wind direction awareness, path planning & sky steering',
    descTa: 'காற்றின் திசை, மாடி வழித்தடம் மற்றும் நூல் கட்டுப்பாடு',
    icon: '🪁',
    color: '#039BE5',
    category: 'outdoor',
    items: [
      { prompt: 'The eastern breeze (Keezhkatru) is blowing towards the temple gopuram. Which path keeps kite aloft?', answer: 'Release thread smoothly facing wind', choices: ['Release thread smoothly facing wind', 'Pull thread abruptly down', 'Run inside stairwell', 'Cut thread immediately'], emoji: '🪁', metadataName: 'Breeze Direction' },
      { prompt: 'What is the traditional wooden spool called that holds the kite thread?', answer: 'Manja Lattai / Spool (லட்டை)', choices: ['Manja Lattai / Spool (லட்டை)', 'Brass Ghadam', 'Clay Pot', 'Bamboo Stick'], emoji: '🧵', metadataName: 'Thread Spool' },
    ]
  },
  {
    key: 'street_cricket',
    titleEn: 'Street Cricket',
    titleTa: 'தெரு கிரிக்கெட் (Street Cricket)',
    descEn: 'Gully cricket rules, scoring calculation & match logic',
    descTa: 'ஒரு துள்ளல் அவுட் விதிகள், ரன் கணக்கீடு மற்றும் நினைவாற்றல்',
    icon: '🏏',
    color: '#3949AB',
    category: 'outdoor',
    items: [
      { prompt: 'In classic gully rules, if the ball hits neighbor window directly, what is the verdict?', answer: 'Out + Batsman retrieves ball', choices: ['Out + Batsman retrieves ball', 'Six Runs Awarded', 'Free Hit Next Ball', 'Two Runs Stolen'], emoji: '🪟', metadataName: 'Window Rule' },
      { prompt: 'One-tip one-hand catch was made near the electric pole. What is the umpire decision?', answer: 'Declared OUT', choices: ['Declared OUT', 'Not Out (Drop)', 'Four Runs', 'Dead Ball'], emoji: '⚡', metadataName: 'One-Tip Catch' },
    ]
  },
  {
    key: 'kabaddi',
    titleEn: 'Kabaddi',
    titleTa: 'சடுகுடு / கபடி (Kabaddi)',
    descEn: 'Position tracking, tactical defense & continuous cant memory',
    descTa: 'ஆட்டக்காரர் நிலைகள் மற்றும் மூச்சு விடா கபடி உத்திகள்',
    icon: '🤼',
    color: '#D81B60',
    category: 'outdoor',
    items: [
      { prompt: 'What continuous cant mantra must the raider chant without inhaling?', answer: 'Kabaddi... Kabaddi... or Sadugudu...', choices: ['Kabaddi... Kabaddi... or Sadugudu...', 'Fast 1-2-3 count', 'Whistle rhythm', 'Silent breath holding'], emoji: '🗣️', metadataName: 'Cant Chant' },
      { prompt: 'Which defender position guards the extreme corner line in classic 7-man defense?', answer: 'Corner Defender (மூலை பிடிப்பாளர்)', choices: ['Corner Defender (மூலை பிடிப்பாளர்)', 'Center Cover', 'Main Umpire', 'Scorer on Bench'], emoji: '🛡️', metadataName: 'Corner Guard' },
    ]
  },
  {
    key: 'kho_kho',
    titleEn: 'Kokko / Kho-Kho',
    titleTa: 'கோ-கோ (Kho-Kho)',
    descEn: 'Sequential order memory, chaser direction & fast recall',
    descTa: 'விரட்டுபவர் திசைகள் மற்றும் தொடர் வரிசை நினைவாற்றல்',
    icon: '🏃',
    color: '#FB8C00',
    category: 'outdoor',
    items: [
      { prompt: 'Eight seated chasers sit in a central line facing in which pattern?', answer: 'Alternate opposite directions', choices: ['Alternate opposite directions', 'All facing same direction', 'Facing skywards', 'Forming complete circle'], emoji: '↔️', metadataName: 'Chaser Grid' },
      { prompt: 'When the active chaser taps your back and shouts "KHO!", what must you do?', answer: 'Spring forward into the opposite lane', choices: ['Spring forward into the opposite lane', 'Sit down quietly', 'Turn 360 degrees in spot', 'Wave hands at referee'], emoji: '⚡', metadataName: 'Kho Call' },
    ]
  },
  {
    key: 'skipping_rope',
    titleEn: 'Skipping Rope',
    titleTa: 'கயிறு தாண்டுதல் (Skipping Rope)',
    descEn: 'Auditory rhythm matching, jump counting & coordination',
    descTa: 'இசை தாளம், எண்ணிக்கை பாட்டு மற்றும் உடல் ஒருங்கிணைப்பு',
    icon: '🪢',
    color: '#00ACC1',
    category: 'outdoor',
    items: [
      { prompt: 'Remember the classic rhythm song: "வாழைப்பழம் பழுக்குது...". What comes next?', answer: 'வட்ட வட்ட நிலா பாக்குது!', choices: ['வட்ட வட்ட நிலா பாக்குது!', 'பள்ளிக்கு மணி அடிக்குது!', 'மழை பெய்து தூறுது!', 'காக்கா பறந்து போகுது!'], emoji: '🍌', metadataName: 'Rhythm Song' },
      { prompt: 'When two friends turn the long jute rope, where is the ideal spot to jump in?', answer: 'Dead center at lowest rope arc', choices: ['Dead center at lowest rope arc', 'Right against helper wrist', 'Outside the rope circle', 'Behind the rope turners'], emoji: '🪢', metadataName: 'Rope Timing' },
    ]
  },

  // ─── Group B: Indoor / Traditional Games (11–15) ──────────────────────────
  {
    key: 'pallanguzhi',
    titleEn: 'Pallanguzhi',
    titleTa: 'பல்லாங்குழி (Pallanguzhi)',
    descEn: 'Tamarind seed counting logic & Pasu cup collection strategy',
    descTa: 'புளியங்கொட்டை பகிர்வு, பசு குழி சேகரிப்பு மற்றும் கணக்கு',
    icon: '🪵',
    color: '#5D4037',
    category: 'indoor',
    items: [
      { prompt: 'How many total carved pits does a classic wooden Pallanguzhi board have?', answer: '14 Pits (2 rows of 7 pits)', choices: ['14 Pits (2 rows of 7 pits)', '10 Pits (2 rows of 5 pits)', '18 Pits in triangular grid', '8 Circular Bowls'], emoji: '🪵', metadataName: 'Board Pits' },
      { prompt: 'When a pit accumulates exactly 4 tamarind seeds during sowing, what is it called?', answer: 'Pasu (பசு) — Player captures it!', choices: ['Pasu (பசு) — Player captures it!', 'Kasi (காசி)', 'Kollu (கொள்)', 'Empty Cup'], emoji: '🐮', metadataName: 'Pasu Capture' },
    ]
  },
  {
    key: 'thaayam',
    titleEn: 'Thaayam (Dice Board)',
    titleTa: 'தாயம் / தாயக்கட்டம் (Thaayam)',
    descEn: 'Brass dice probability, safe mountain squares & route planning',
    descTa: 'பித்தளை தாயக்கட்டை வீச்சு, மலை பாதுகாப்பு மற்றும் வியூகம்',
    icon: '🎲',
    color: '#F4511E',
    category: 'indoor',
    items: [
      { prompt: 'What brass dice roll is required to open a piece from home yard into play?', answer: 'Roll of 1 (Thaayam / தாயம்)', choices: ['Roll of 1 (Thaayam / தாயம்)', 'Roll of 5', 'Roll of 12', 'Roll of 3'], emoji: '🎲', metadataName: 'Entry Roll' },
      { prompt: 'What happens when your coin lands on a square marked with a cross (X - மலை)?', answer: 'Safe haven — Enemy cannot cut your coin', choices: ['Safe haven — Enemy cannot cut your coin', 'Must return to home yard', 'Lose your turn for 2 rounds', 'Give coin to opponent'], emoji: '🏔️', metadataName: 'Safe Mountain' },
    ]
  },
  {
    key: 'paramapadham',
    titleEn: 'Paramapadham (Snakes & Ladders)',
    titleTa: 'பரமபதம் (Snakes & Ladders)',
    descEn: 'Virtue ladder climbs, snake trap avoidance & goal calculation',
    descTa: 'தர்ம ஏணி ஏற்றம், பாம்பு வலை தவிர்த்தல் மற்றும் மோட்ச கணக்கு',
    icon: '🪜',
    color: '#7CB342',
    category: 'indoor',
    items: [
      { prompt: 'In the sacred Vaikunta Ekadasi board, what does climbing a ladder represent?', answer: 'Virtuous deeds (புண்ணிய நற்செயல்கள்)', choices: ['Virtuous deeds (புண்ணிய நற்செயல்கள்)', 'Greed and Pride', 'Material Wealth', 'Fast Running'], emoji: '🪜', metadataName: 'Ladder Meaning' },
      { prompt: 'Landing on the mouth of the giant multi-headed serpent leads down to where?', answer: 'Bottom pit to learn humility', choices: ['Bottom pit to learn humility', 'Directly to winning heaven', 'Next safe ladder square', 'Game victory immediately'], emoji: '🐍', metadataName: 'Snake Descent' },
    ]
  },
  {
    key: 'seettu_vilayattu',
    titleEn: 'Playing Cards (Seettu Vilayattu)',
    titleTa: 'சீட்டு விளையாட்டு (Playing Cards)',
    descEn: 'Pure sequences, trump card values & hidden card match',
    descTa: 'தூய வரிசைகள், துருப்பு சீட்டுகள் மற்றும் ஜோடி நினைவாற்றல்',
    icon: '🃏',
    color: '#C2185B',
    category: 'indoor',
    items: [
      { prompt: 'In classic 13-card rummy, which sequence must be formed without any Joker?', answer: 'Pure Life Sequence (சுத்த வரிசை)', choices: ['Pure Life Sequence (சுத்த வரிசை)', 'Second Life Set', 'Four of a Kind', 'Double Joker Run'], emoji: '🃏', metadataName: 'Pure Sequence' },
      { prompt: 'Which of these combinations forms a valid 3-card pure run?', answer: '7♠ - 8♠ - 9♠ of Spades', choices: ['7♠ - 8♠ - 9♠ of Spades', '7♠ - 8♦ - 9♣ of mixed suits', 'King - Ace - 3', 'Two Queens & 1 Jack'], emoji: '♠️', metadataName: 'Card Run' },
    ]
  },
  {
    key: 'carrom',
    titleEn: 'Carrom',
    titleTa: 'கேரம் போர்டு (Carrom)',
    descEn: 'Red queen angle geometry, bank rebounds & cover planning',
    descTa: 'சிவப்பு ராணி காசு, கோணக் கணிப்பு மற்றும் கவர் உத்தி',
    icon: '🎯',
    color: '#6D4C41',
    category: 'indoor',
    items: [
      { prompt: 'After pocketing the Red Queen (சிகப்பு ராணி), what must the player pocket on next stroke?', answer: 'A Cover Coin of player color', choices: ['A Cover Coin of player color', 'Opponent white coin', 'No shot needed, victory', 'Striker into corner'], emoji: '👑', metadataName: 'Red Queen Rule' },
      { prompt: 'What fine powder is sprinkled across wooden carrom board for smooth glide?', answer: 'Boric fine carrom powder', choices: ['Boric fine carrom powder', 'Sea sand', 'Rice flour', 'Sugar crystals'], emoji: '✨', metadataName: 'Board Powder' },
    ]
  },

  // ─── Group C: Tamil Cinema & Media Nostalgia Games (16–20) ────────────────
  {
    key: 'movie_poster_memory',
    titleEn: 'Old Tamil Movie Poster Memory',
    titleTa: 'பழைய சினிமா போஸ்டர்',
    descEn: 'Vintage poster details, star costumes & classic cinema recall',
    descTa: 'பொற்கால சினிமா போஸ்டர் விவரங்கள் மற்றும் திரை நினைவுகள்',
    icon: '🎞️',
    color: '#D32F2F',
    category: 'cinema',
    items: [
      { prompt: 'In the iconic 1964 "Karnan" vintage poster, what weapon is Sivaji Ganesan holding?', answer: 'Golden Divine Bow (தங்க வில்)', choices: ['Golden Divine Bow (தங்க வில்)', 'Silver Sword', 'Brass Trident', 'Wooden Staff'], emoji: '🏹', metadataName: 'Karnan Poster' },
      { prompt: 'Which legendary pair starred on the hand-painted poster of "Anbe Vaa" (1966)?', answer: 'M.G. Ramachandran & B. Saroja Devi', choices: ['M.G. Ramachandran & B. Saroja Devi', 'Sivaji Ganesan & Padmini', 'Gemini Ganesan & Savitri', 'Muthuraman & Jayalalithaa'], emoji: '🎬', metadataName: 'Anbe Vaa Duo' },
    ]
  },
  {
    key: 'ilaiyaraaja_melody',
    titleEn: 'Ilaiyaraaja Song Memory',
    titleTa: 'இளையராஜா இசை நினைவுகள்',
    descEn: 'Auditory melody recall, singer identification & lyric completion',
    descTa: 'இசைஞானி பாடல்கள், பாடகர் அடையாளம் மற்றும் பாடல் வரிகள்',
    icon: '🎵',
    color: '#512DA8',
    category: 'cinema',
    items: [
      { prompt: 'Complete the everlasting lyric: "தென்றல் வந்து தீண்டும் போது என்ன வண்ணமோ..."', answer: 'மனசுல... என்ன எண்ணமோ!', choices: ['மனசுல... என்ன எண்ணமோ!', 'கண்ணுல... என்ன காட்சியோ!', 'வானிலே... என்ன நிலவோ!', 'வீட்டிலே... என்ன ஒளியோ!'], emoji: '🍃', metadataName: 'Thendral Vanthu' },
      { prompt: 'Who sang the divine devotional composition "Janani Janani Jagam Nee Agam Nee"?', answer: 'Maestro Ilaiyaraaja himself', choices: ['Maestro Ilaiyaraaja himself', 'S.P. Balasubrahmanyam', 'K.J. Yesudas', 'T.M. Soundararajan'], emoji: '🪷', metadataName: 'Janani Janani' },
    ]
  },
  {
    key: 'actor_actress_match',
    titleEn: 'Identify Old Tamil Actor/Actress',
    titleTa: 'பழைய திரை நட்சத்திரங்கள்',
    descEn: 'Legendary cinema icons, dialogue matching & nostalgic faces',
    descTa: 'சிவாஜி, எம்.ஜி.ஆர், சாவித்திரி, பத்மினி மற்றும் வசனங்கள்',
    icon: '🌟',
    color: '#00796B',
    category: 'cinema',
    items: [
      { prompt: 'Which actress was fondly revered with the title "Nadigaiyar Thilagam"?', answer: 'Savitri (சாவித்திரி)', choices: ['Savitri (சாவித்திரி)', 'Padmini', 'Manorama', 'K.R. Vijaya'], emoji: '👑', metadataName: 'Nadigaiyar Thilagam' },
      { prompt: 'Who delivered the monumental dialogue: "வீரபாண்டிய கட்டபொம்மன் — வரி, வட்டி, திரை, கிஸ்தி..."?', answer: 'Nadigar Thilagam Sivaji Ganesan', choices: ['Nadigar Thilagam Sivaji Ganesan', 'M.N. Nambiar', 'S.S. Rajendran', 'Major Sundarrajan'], emoji: '🦁', metadataName: 'Kattabomman Dialogue' },
    ]
  },
  {
    key: 'cinema_ticket_counter',
    titleEn: 'Cinema Ticket Counter',
    titleTa: 'சினிமா தியேட்டர் டிக்கெட் கவுண்டர்',
    descEn: 'Single-screen theatre seats, ticket arithmetic & housefull rules',
    descTa: 'பால்கனி & ஃபர்ஸ்ட் கிளாஸ் இருக்கை கணக்கீடு மற்றும் டிக்கெட் நினைவுகள்',
    icon: '🎟️',
    color: '#303F9F',
    category: 'cinema',
    items: [
      { prompt: 'Balcony ticket was Rs. 3.50 and First Class was Rs. 2.00. How much for 2 Balcony tickets?', answer: 'Rs. 7.00', choices: ['Rs. 7.00', 'Rs. 5.50', 'Rs. 10.00', 'Rs. 6.00'], emoji: '🎟️', metadataName: 'Ticket Arithmetic' },
      { prompt: 'What wooden board hung outside Shanti or Devi theatre when all seats were sold?', answer: 'HOUSEFULL (அனைத்து காட்சிகளும் நிறைவு)', choices: ['HOUSEFULL (அனைத்து காட்சிகளும் நிறைவு)', 'HALF EMPTY', 'RESERVED ONLY', 'DISCOUNT OPEN'], emoji: '🚪', metadataName: 'Housefull Sign' },
    ]
  },
  {
    key: 'oliyum_oliyum',
    titleEn: 'Oliyum Oliyum / Doordarshan Memory',
    titleTa: 'ஒளியும் ஒலியும் & தூர்தர்ஷன்',
    descEn: 'Friday 7:30 PM song show, signature tunes & news reader memories',
    descTa: 'வெள்ளி இரவு ஒளியும் ஒலியும், செய்தி வாசிப்பு மற்றும் ஞாயிறு திரைப்படம்',
    icon: '📺',
    color: '#C2185B',
    category: 'cinema',
    items: [
      { prompt: 'On which evening did whole families gather around Black & White TV for "Oliyum Oliyum"?', answer: 'Friday Evening 7:30 PM', choices: ['Friday Evening 7:30 PM', 'Monday Morning 9:00 AM', 'Wednesday Midnight', 'Tuesday Noon'], emoji: '📺', metadataName: 'Oliyum Oliyum Time' },
      { prompt: 'Who was the beloved gentle Tamil Doordarshan news reader with clear Tamil diction?', answer: 'Shobana Ravi / Varadarajan', choices: ['Shobana Ravi / Varadarajan', 'Radio Mirchi RJ', 'Movie Hero', 'Sports Commentator'], emoji: '📰', metadataName: 'News Reader' },
    ]
  }
];

export function getMobileGamesByCategory(cat: 'all' | 'outdoor' | 'indoor' | 'cinema'): MobileGame[] {
  if (cat === 'all') return ALL_MOBILE_GAMES;
  return ALL_MOBILE_GAMES.filter(g => g.category === cat);
}
