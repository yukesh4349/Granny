import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore, ALL_GAMES } from '../../src/store/gameStore';
import { useUserStore } from '../../src/store/userStore';
import { audioService } from '../../src/services/audioService';

export default function GamesCatalogScreen() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { getDifficultyForGame } = useGameStore();

  const getGameEmoji = (key: string) => {
    switch (key) {
      case 'remember-my-home': return '🏡';
      case 'memory-market': return '🛒';
      case 'name-face-match': return '👥';
      case 'recipe-recall': return '🍳';
      case 'memory-journey': return '🧭';
      case 'complete-the-tune': return '🎵';
      case 'story-detective': return '📖';
      case 'where-did-i-keep-it': return '🔍';
      case 'memory-garden': return '🌸';
      case 'memory-album': return '📸';
      default: return '🧩';
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>10 Visual Cognitive Games</Text>
        <Text style={styles.headerSub}>
          Real photographs & engaging image interactions designed specifically for elder brain vitality.
        </Text>
      </View>

      <View style={styles.gamesList}>
        {ALL_GAMES.map((game, index) => {
          const diff = getDifficultyForGame(currentUser.id, game.key);
          return (
            <TouchableOpacity
              key={game.key}
              style={styles.gameCard}
              onPress={() => {
                audioService.playTapSound();
                router.push(`/games/${game.key}`);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.gameIconBox}>
                  <Text style={styles.gameIcon}>{getGameEmoji(game.key)}</Text>
                </View>
                <View style={styles.gameHeaderInfo}>
                  <Text style={styles.gameNumber}>Game {index + 1} of 10</Text>
                  <Text style={styles.gameTitle}>{game.name}</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Level {diff.level}</Text>
                </View>
              </View>

              <Text style={styles.gameDesc}>{game.description}</Text>

              <View style={styles.cardBottom}>
                <View style={styles.skillsRow}>
                  {game.primary_skills.map((skill, sIdx) => (
                    <View key={sIdx} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.playBtn}>
                  <Text style={styles.playBtnText}>Play Now ➔</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 15,
    color: '#655648',
    lineHeight: 22,
  },
  gamesList: {
    gap: 16,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 18,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F7EFE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameIcon: {
    fontSize: 24,
  },
  gameHeaderInfo: {
    flex: 1,
  },
  gameNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5222',
    textTransform: 'uppercase',
  },
  gameTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2C1810',
  },
  levelBadge: {
    backgroundColor: '#EAF8EE',
    borderWidth: 1.5,
    borderColor: '#98DBA8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#1E652E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameDesc: {
    fontSize: 14,
    color: '#655648',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    marginRight: 10,
  },
  skillPill: {
    backgroundColor: '#F3EDE2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  skillPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C4E40',
  },
  playBtn: {
    backgroundColor: '#2C1810',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
