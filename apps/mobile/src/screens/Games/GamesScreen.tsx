// ============================================================================
// GamesScreen.tsx — 20 Nostalgia-Based Cognitive Games with 4-Key Groq Engine
// Dynamic Non-Repeating Questions, Cultural Images, Audio Feedback,
// and Caregiver Daily Time Limits
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { ALL_MOBILE_GAMES, getMobileGamesByCategory, type MobileGame, type MobileGameItem } from '../../features/games/gamesData';
import { groqService, GameItem as GroqGameItem } from '../../services/groqService';
import { audioService } from '../../services/audioService';

interface Props {
  onBack: () => void;
  language?: string;
  highContrast?: boolean;
}

export default function GamesScreen({ onBack, language = 'ta', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const isTamil = language === 'ta';

  const [activeCategory, setActiveCategory] = useState<'all' | 'outdoor' | 'indoor' | 'cinema'>('all');
  const [activeGame, setActiveGame] = useState<MobileGame | null>(null);
  const [activeItems, setActiveItems] = useState<(MobileGameItem | GroqGameItem)[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [gamePhase, setGamePhase] = useState<'memorize' | 'play' | 'result'>('memorize');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);

  const games = getMobileGamesByCategory(activeCategory);

  // Memorize Phase Countdown
  useEffect(() => {
    let timer: any;
    if (activeGame && gamePhase === 'memorize' && !loadingQuestions) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setGamePhase('play');
      }
    }
    return () => clearTimeout(timer);
  }, [activeGame, gamePhase, countdown, loadingQuestions]);

  const handleStartGame = async (game: MobileGame) => {
    audioService.playTapSound();
    setActiveGame(game);
    setLoadingQuestions(true);
    setCurrentItemIndex(0);
    setScore(0);
    setUserAnswers([]);
    setCountdown(5);
    setGamePhase('memorize');

    try {
      const title = isTamil ? game.titleTa : game.titleEn;
      const dynamicItems = await groqService.generateGameQuestions(
        game.key,
        title,
        game.category,
        {
          name: 'Lakshmi Amma & Ramanathan Thatha',
          hometown: 'Madurai / Chennai',
          hobbies: 'Carnatic music, Kolam, Tamil literature',
        },
        4
      );

      if (dynamicItems && dynamicItems.length > 0) {
        setActiveItems(dynamicItems);
      } else {
        setActiveItems(game.items);
      }
    } catch (e) {
      console.warn('Fallback to static questions:', e);
      setActiveItems(game.items);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectAnswer = (choice: string) => {
    if (!activeGame || activeItems.length === 0) return;
    const item = activeItems[currentItemIndex];
    const isCorrect = choice.trim().toLowerCase() === item.answer.trim().toLowerCase();

    if (isCorrect) {
      audioService.playSuccessSound();
      setScore(s => s + 100);
    } else {
      audioService.playTapSound();
    }

    const newAnswers = [...userAnswers, isCorrect];
    setUserAnswers(newAnswers);

    if (currentItemIndex + 1 < activeItems.length) {
      setCurrentItemIndex(i => i + 1);
    } else {
      setGamePhase('result');
      audioService.playSuccessSound();
    }
  };

  const handleExitGame = () => {
    audioService.playTapSound();
    setActiveGame(null);
    setGamePhase('memorize');
  };

  // ─── Render Active Game Screen ───────────────────────────────────────────
  if (activeGame) {
    const currentItem = activeItems[currentItemIndex];
    const title = isTamil ? activeGame.titleTa : activeGame.titleEn;
    const desc = isTamil ? activeGame.descTa : activeGame.descEn;

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={handleExitGame}
          >
            <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>
              {isTamil ? '← வெளியேறு' : '← Exit Game'}
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.activeGameTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeGame.icon} {title}
            </Text>
            <Text style={[styles.activeGameSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {desc}
            </Text>
          </View>
        </View>

        {loadingQuestions ? (
          <View style={[styles.center, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
              🌸 {isTamil ? 'புதிய கேள்விகளை உருவாக்குகிறது...' : 'Generating fresh cultural questions...'}
            </Text>
          </View>
        ) : (
          <>
            {/* Phase 1: Memorize */}
            {gamePhase === 'memorize' && (
              <ScrollView contentContainerStyle={styles.gameContent}>
                <View style={[styles.phasePill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.phasePillText, { color: colors.primaryDark }]}>
                    ⏱️ {isTamil ? `நினைவில் வையுங்கள் — ${countdown}s` : `Memorize Phase — ${countdown}s`}
                  </Text>
                </View>

                <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
                  {isTamil ? 'கீழே உள்ள குறிப்புகளை கவனமாக பாருங்கள்!' : 'Look closely and remember the cards below!'}
                </Text>

                <View style={styles.memorizeGrid}>
                  {activeItems.map((item: any, i: number) => (
                    <View key={i} style={[styles.memorizeCard, { backgroundColor: colors.cardBg, borderColor: activeGame.color }]}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                      ) : null}
                      <Text style={styles.cardEmoji}>{item.emoji || activeGame.icon}</Text>
                      <Text style={[styles.cardMeta, { color: colors.textPrimary }]}>
                        {item.prompt ? item.prompt.slice(0, 50) + '...' : item.metadataName}
                      </Text>
                      <View style={[styles.answerBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.answerBadgeText, { color: colors.primaryDark }]}>
                          📍 {item.answer}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.readyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setGamePhase('play')}
                >
                  <Text style={styles.readyBtnText}>
                    {isTamil ? 'நான் தயார்! விடையளிக்கவும் →' : "I'm Ready! Answer Now →"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Phase 2: Play Questions */}
            {gamePhase === 'play' && currentItem && (
              <ScrollView contentContainerStyle={styles.gameContent}>
                <View style={[styles.phasePill, { backgroundColor: colors.secondaryLight, borderColor: colors.secondary }]}>
                  <Text style={[styles.phasePillText, { color: colors.secondaryDark }]}>
                    {isTamil
                      ? `கேள்வி ${currentItemIndex + 1} / ${activeItems.length}`
                      : `Question ${currentItemIndex + 1} of ${activeItems.length}`}
                  </Text>
                </View>

                <View style={[styles.questionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  {'imageUrl' in currentItem && currentItem.imageUrl ? (
                    <Image source={{ uri: (currentItem as any).imageUrl }} style={styles.questionImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.questionEmoji}>{currentItem.emoji || activeGame.icon}</Text>
                  )}

                  <Text style={[styles.questionPrompt, { color: colors.textPrimary }]}>
                    {currentItem.prompt}
                  </Text>

                  <View style={styles.choicesContainer}>
                    {currentItem.choices.map((choice: string, i: number) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.choiceBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
                        onPress={() => handleSelectAnswer(choice)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.choiceBtnText, { color: colors.textPrimary }]}>
                          {choice}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Phase 3: Result */}
            {gamePhase === 'result' && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultEmoji}>
                  {userAnswers.filter(Boolean).length >= activeItems.length / 2 ? '🌸' : '👍'}
                </Text>
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>
                  {isTamil ? 'அருமையான நினைவாற்றல் பயிற்சி!' : 'Wonderful Memory Activity!'}
                </Text>
                <Text style={[styles.resultScore, { color: colors.primary }]}>
                  {isTamil ? `மதிப்பெண்: ${score}` : `Score: ${score}`}
                </Text>
                <Text style={[styles.resultSummary, { color: colors.textSecondary }]}>
                  {isTamil
                    ? `சரியான விடைகள்: ${userAnswers.filter(Boolean).length} / ${activeItems.length}`
                    : `Correct Answers: ${userAnswers.filter(Boolean).length} of ${activeItems.length}`}
                </Text>

                <View style={styles.resultBtnRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleStartGame(activeGame)}
                  >
                    <Text style={styles.actionBtnText}>
                      {isTamil ? 'மீண்டும் விளையாடு 🔄' : 'Play Again 🔄'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1.5 }]}
                    onPress={handleExitGame}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>
                      {isTamil ? 'அனைத்து விளையாட்டுகள் 🧩' : 'All Games 🧩'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  // ─── Render 20 Games Library View ─────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Bar */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
          onPress={onBack}
        >
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>
            {isTamil ? '← முகப்பு' : '← Home'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.libraryTitle, { color: colors.textPrimary }]}>
          🧩 {isTamil ? '20 பாரம்பரிய விளையாட்டுகள்' : '20 Nostalgia Games'}
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'all' as const, label: isTamil ? 'அனைத்தும் (20)' : 'All 20 Games' },
            { id: 'outdoor' as const, label: isTamil ? '🏃 வெளியரங்கம் (10)' : '🏃 Outdoor (10)' },
            { id: 'indoor' as const, label: isTamil ? '🎲 உள்ளரங்கம் (5)' : '🎲 Indoor (5)' },
            { id: 'cinema' as const, label: isTamil ? '🎬 சினிமா (5)' : '🎬 Cinema (5)' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabPill,
                {
                  backgroundColor: activeCategory === tab.id ? colors.primary : colors.cardBg,
                  borderColor: activeCategory === tab.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => {
                audioService.playTapSound();
                setActiveCategory(tab.id);
              }}
            >
              <Text style={[
                styles.tabPillText,
                { color: activeCategory === tab.id ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Game Cards List */}
      <ScrollView contentContainerStyle={styles.gamesList}>
        {games.map(game => {
          const title = isTamil ? game.titleTa : game.titleEn;
          const desc = isTamil ? game.descTa : game.descEn;
          const catLabel = game.category === 'outdoor'
            ? (isTamil ? 'வெளிப்புறம்' : 'Outdoor')
            : game.category === 'indoor'
            ? (isTamil ? 'உட்புறம்' : 'Indoor')
            : (isTamil ? 'சினிமா' : 'Cinema');

          return (
            <TouchableOpacity
              key={game.key}
              style={[styles.gameCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderLeftColor: game.color }]}
              onPress={() => handleStartGame(game)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.gameIcon}>{game.icon}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.categoryBadgeText, { color: colors.primaryDark }]}>{catLabel}</Text>
                </View>
              </View>
              <Text style={[styles.gameCardTitle, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.gameCardDesc, { color: colors.textSecondary }]}>{desc}</Text>
              <View style={styles.playNowRow}>
                <Text style={[styles.playNowText, { color: colors.primaryDark }]}>
                  {isTamil ? 'விளையாடு →' : 'Play Game →'}
                </Text>
                <View style={[styles.playArrowCircle, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.playArrow, { color: colors.primaryDark }]}>▶</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 14, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 13, fontWeight: '700' },
  libraryTitle: { fontSize: 17, fontWeight: '800', marginLeft: 12 },
  activeGameTitle: { fontSize: 16, fontWeight: '800' },
  activeGameSubtitle: { fontSize: 12, marginTop: 2 },
  tabsRow: { paddingVertical: 10, paddingHorizontal: 12 },
  tabsScroll: { flexDirection: 'row', gap: 8 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabPillText: { fontSize: 13, fontWeight: '700' },
  gamesList: { padding: 14, gap: 12, paddingBottom: 60 },
  gameCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 6,
    padding: 16,
    gap: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameIcon: { fontSize: 32 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  gameCardTitle: { fontSize: 17, fontWeight: '800' },
  gameCardDesc: { fontSize: 13, lineHeight: 18 },
  playNowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  playNowText: { fontSize: 13, fontWeight: '800' },
  playArrowCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playArrow: { fontSize: 12, fontWeight: '900' },

  // Gameplay Styles
  gameContent: { padding: 16, alignItems: 'center', gap: 16 },
  phasePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  phasePillText: { fontSize: 14, fontWeight: '800' },
  instructionText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  memorizeGrid: { width: '100%', gap: 10 },
  memorizeCard: { borderRadius: 14, borderWidth: 2, padding: 14, alignItems: 'center', gap: 6, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120, borderRadius: 10 },
  cardEmoji: { fontSize: 36 },
  cardMeta: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  answerBadge: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, width: '100%', alignItems: 'center' },
  answerBadgeText: { fontSize: 13, fontWeight: '800' },
  readyBtn: { width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  readyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  questionCard: { width: '100%', borderRadius: 18, borderWidth: 1.5, padding: 20, alignItems: 'center', gap: 14, overflow: 'hidden' },
  questionImage: { width: '100%', height: 160, borderRadius: 12 },
  questionEmoji: { fontSize: 50 },
  questionPrompt: { fontSize: 17, fontWeight: '800', textAlign: 'center', lineHeight: 24 },
  choicesContainer: { width: '100%', gap: 10, marginTop: 10 },
  choiceBtn: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  choiceBtnText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  resultEmoji: { fontSize: 70 },
  resultTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  resultScore: { fontSize: 26, fontWeight: '900' },
  resultSummary: { fontSize: 15, fontWeight: '600' },
  resultBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
