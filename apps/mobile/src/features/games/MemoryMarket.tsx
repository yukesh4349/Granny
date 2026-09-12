import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { GameCanvas, CanvasItem } from '../../components/game/GameCanvas';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

export const MemoryMarket: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'study' | 'shop' | 'done'>('study');
  const [targetItems, setTargetItems] = useState<CanvasItem[]>([]);
  const [marketGrid, setMarketGrid] = useState<CanvasItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number>(6);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawAssets = imageService.getGameAssets('memory-market');
    const targetCount = Math.min(5, 2 + Math.floor(difficulty / 1.5));
    const shuffled = [...rawAssets].sort(() => 0.5 - Math.random());

    const targets = shuffled.slice(0, targetCount).map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
    }));

    // Grid contains all targets + distractors up to 6-9 items
    const gridCount = Math.min(9, Math.max(6, targetCount + 3));
    const grid = [...shuffled.slice(0, gridCount)].sort(() => 0.5 - Math.random()).map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      isSelected: false,
    }));

    setTargetItems(targets);
    setMarketGrid(grid);

    const studyTime = Math.max(4, 9 - difficulty);
    setCountdown(studyTime);
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'study') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('shop');
        startTimeRef.current = Date.now();
      }
    }
  }, [phase, countdown]);

  const handleGridItemSelect = (item: CanvasItem, index: number) => {
    if (phase !== 'shop') return;
    const latency = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();

    const isAlreadySelected = selectedIds.includes(item.id);
    const newSelected = isAlreadySelected
      ? selectedIds.filter((id) => id !== item.id)
      : [...selectedIds, item.id];

    setSelectedIds(newSelected);

    // Update canvas selection state
    setMarketGrid((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, isSelected: !isAlreadySelected } : g))
    );

    const isTarget = targetItems.some((t) => t.id === item.id);
    if (!isAlreadySelected) {
      if (isTarget) {
        audioService.playSuccessSound();
        onRecordAttempt(true, latency);
        attemptsRef.current.push({ correct: true, latency });
      } else {
        audioService.playTapSound();
        onRecordAttempt(false, latency, 'distractor_selected');
        attemptsRef.current.push({ correct: false, latency, error: 'distractor' });
      }
    }
  };

  const handleFinishShopping = () => {
    setPhase('done');
    const targetIds = targetItems.map((t) => t.id);
    const correctSelected = selectedIds.filter((id) => targetIds.includes(id)).length;
    const incorrectSelected = selectedIds.filter((id) => !targetIds.includes(id)).length;

    const baseScore = Math.max(
      0,
      Math.round(((correctSelected - incorrectSelected * 0.5) / targetItems.length) * 100)
    );
    onComplete(baseScore, attemptsRef.current);
  };

  if (phase === 'study') {
    return (
      <View style={styles.container}>
        <View style={styles.promptCard}>
          <Text style={styles.promptTitle}>🛒 Memorize Your Grocery List</Text>
          <Text style={styles.promptSub}>
            Remember these {targetItems.length} fresh grocery items. Market opens in {countdown}s!
          </Text>
        </View>

        <View style={styles.studyRow}>
          {targetItems.map((item) => (
            <View key={item.id} style={styles.studyCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.studyImage} />
              <Text style={styles.studyName}>{item.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>⏳ Ready in {countdown}s</Text>
        </View>
      </View>
    );
  }

  if (phase === 'shop') {
    return (
      <View style={styles.container}>
        <GameCanvas
          mode="image_grid"
          items={marketGrid}
          promptTitle="Collect Your Groceries"
          instructionText={`Tap to select the items from your list (${selectedIds.length}/${targetItems.length} collected)`}
          gridColumns={3}
          onItemSelect={handleGridItemSelect}
          renderCustomFooter={() => (
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleFinishShopping}
              activeOpacity={0.8}
            >
              <Text style={styles.finishBtnText}>Check Out Basket ({selectedIds.length})</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.doneTitle}>🎉 Shopping Complete!</Text>
      <Text style={styles.doneSub}>Your memory basket was filled successfully.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  promptCard: {
    backgroundColor: '#FFF9F0',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ECDCC8',
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  promptSub: {
    fontSize: 15,
    color: '#6E5C4E',
    textAlign: 'center',
  },
  studyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  studyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 10,
    alignItems: 'center',
    width: 105,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  studyImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 6,
  },
  studyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    textAlign: 'center',
  },
  countdownBadge: {
    backgroundColor: '#FAF0E4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DECABA',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9C5B23',
  },
  finishBtn: {
    backgroundColor: '#2D8A4E',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  doneSub: {
    fontSize: 16,
    color: '#655648',
  },
});
