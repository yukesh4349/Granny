import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGameStore, ALL_GAMES } from '../../src/store/gameStore';
import { useUserStore } from '../../src/store/userStore';
import { GameKey } from '../../src/types';
import { audioService } from '../../src/services/audioService';

// Import all 10 visual games
import { RememberMyHome } from '../../src/features/games/RememberMyHome';
import { MemoryMarket } from '../../src/features/games/MemoryMarket';
import { NameFaceMatch } from '../../src/features/games/NameFaceMatch';
import { RecipeRecall } from '../../src/features/games/RecipeRecall';
import { MemoryJourney } from '../../src/features/games/MemoryJourney';
import { CompleteTheTune } from '../../src/features/games/CompleteTheTune';
import { StoryDetective } from '../../src/features/games/StoryDetective';
import { WhereDidIKeepIt } from '../../src/features/games/WhereDidIKeepIt';
import { MemoryGarden } from '../../src/features/games/MemoryGarden';
import { MemoryAlbum } from '../../src/features/games/MemoryAlbum';

export default function GamePlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const gameKey = id as GameKey;

  const { currentUser } = useUserStore();
  const { startGameSession, recordAttempt, finishGameSession, getDifficultyForGame } =
    useGameStore();

  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [completedAttempts, setCompletedAttempts] = useState<any[]>([]);
  const [currentDiff, setCurrentDiff] = useState(
    getDifficultyForGame(currentUser.id, gameKey)
  );

  const gameMeta = ALL_GAMES.find((g) => g.key === gameKey) || ALL_GAMES[0];

  useEffect(() => {
    if (gameKey) {
      startGameSession(currentUser.id, gameKey, currentDiff.level);
    }
  }, [gameKey]);

  const handleComplete = (score: number, attempts: any[]) => {
    audioService.playSuccessSound();
    setSessionScore(score);
    setCompletedAttempts(attempts);
    finishGameSession(score);

    // Recompute adaptive difficulty for next session
    const nextDiff = getDifficultyForGame(currentUser.id, gameKey);
    setCurrentDiff(nextDiff);
  };

  const handleRecordAttempt = (correct: boolean, latencyMs: number, errorType?: string) => {
    recordAttempt(correct, latencyMs, errorType);
  };

  const renderGameComponent = () => {
    const props = {
      difficulty: currentDiff.level,
      onComplete: handleComplete,
      onRecordAttempt: handleRecordAttempt,
    };

    switch (gameKey) {
      case 'remember-my-home':
        return <RememberMyHome {...props} />;
      case 'memory-market':
        return <MemoryMarket {...props} />;
      case 'name-face-match':
        return <NameFaceMatch {...props} />;
      case 'recipe-recall':
        return <RecipeRecall {...props} />;
      case 'memory-journey':
        return <MemoryJourney {...props} />;
      case 'complete-the-tune':
        return <CompleteTheTune {...props} />;
      case 'story-detective':
        return <StoryDetective {...props} />;
      case 'where-did-i-keep-it':
        return <WhereDidIKeepIt {...props} />;
      case 'memory-garden':
        return <MemoryGarden {...props} />;
      case 'memory-album':
        return <MemoryAlbum {...props} />;
      default:
        return <MemoryMarket {...props} />;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {/* Session Header Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.gameTitle}>{gameMeta.name}</Text>
          <Text style={styles.skillsTag}>{gameMeta.primary_skills.join(' • ')}</Text>
        </View>
        <View style={styles.difficultyBadge}>
          <Text style={styles.diffLabel}>Difficulty</Text>
          <Text style={styles.diffLevel}>Level {currentDiff.level}/5</Text>
        </View>
      </View>

      {/* Game Host or Completion View */}
      {sessionScore === null ? (
        <View style={styles.gameHost}>{renderGameComponent()}</View>
      ) : (
        <View style={styles.victoryCard}>
          <Text style={styles.victoryTrophy}>🎉</Text>
          <Text style={styles.victoryTitle}>Session Completed!</Text>
          <Text style={styles.victorySub}>
            Wonderful cognitive practice today, {currentUser.name}!
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{sessionScore}%</Text>
              <Text style={styles.statLabel}>Accuracy Score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{currentDiff.averageLatencyMs}ms</Text>
              <Text style={styles.statLabel}>Avg Latency</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>Level {currentDiff.level}</Text>
              <Text style={styles.statLabel}>Next Adaptive Level</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.replayBtn}
              onPress={() => {
                audioService.playTapSound();
                setSessionScore(null);
                setCompletedAttempts([]);
                startGameSession(currentUser.id, gameKey, currentDiff.level);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.replayBtnText}>Play Again ↺</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                audioService.playTapSound();
                router.push('/games');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.backBtnText}>All Games ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLeft: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  skillsTag: {
    fontSize: 12,
    color: '#706050',
    fontWeight: '600',
    marginTop: 2,
  },
  difficultyBadge: {
    backgroundColor: '#FAF0E4',
    borderWidth: 1.5,
    borderColor: '#E0CCB8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A5222',
    textTransform: 'uppercase',
  },
  diffLevel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2C1810',
  },
  gameHost: {
    width: '100%',
  },
  victoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#98DBA8',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#2C1810',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  victoryTrophy: {
    fontSize: 54,
    marginBottom: 8,
  },
  victoryTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E652E',
    marginBottom: 6,
  },
  victorySub: {
    fontSize: 15,
    color: '#5C4E40',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  statLabel: {
    fontSize: 11,
    color: '#7A6B5C',
    textAlign: 'center',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  replayBtn: {
    flex: 1,
    backgroundColor: '#2C1810',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  replayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#346B3C',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
