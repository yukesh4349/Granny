import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameCanvas, CanvasItem } from '../../components/game/GameCanvas';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

export const RememberMyHome: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [bgUrl, setBgUrl] = useState<string>('');
  const [targetRecallItem, setTargetRecallItem] = useState<CanvasItem | null>(null);
  const [timerCount, setTimerCount] = useState<number>(6);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    // Assets based on difficulty level (2 to 5 stickers)
    const rawAssets = imageService.getGameAssets('remember-my-home');
    const bg = rawAssets.find((a) => a.tags?.includes('background'))?.imageUrl || '';
    const stickers = rawAssets
      .filter((a) => a.tags?.includes('sticker'))
      .slice(0, Math.min(5, 2 + difficulty));

    setBgUrl(bg);
    setItems(
      stickers.map((s) => ({
        id: s.id,
        name: s.name,
        imageUrl: s.imageUrl,
        xPercent: s.xPercent,
        yPercent: s.yPercent,
      }))
    );

    // Memorization countdown
    const initialSeconds = Math.max(4, 9 - difficulty);
    setTimerCount(initialSeconds);
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'memorize') {
      if (timerCount > 0) {
        const t = setTimeout(() => setTimerCount((c) => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        // Switch to recall phase
        setPhase('recall');
        if (items.length > 0) {
          setTargetRecallItem(items[0]);
        }
        startTimeRef.current = Date.now();
      }
    }
  }, [phase, timerCount, items]);

  const handleHotspotTap = (xPct: number, yPct: number) => {
    if (phase !== 'recall' || !targetRecallItem) return;

    const latency = Date.now() - startTimeRef.current;
    const correctX = targetRecallItem.xPercent || 50;
    const correctY = targetRecallItem.yPercent || 50;

    // Radius tolerance: 22% distance
    const dist = Math.sqrt(Math.pow(xPct - correctX, 2) + Math.pow(yPct - correctY, 2));
    const isCorrect = dist <= 22;

    audioService.playTapSound();
    if (isCorrect) audioService.playSuccessSound();

    onRecordAttempt(isCorrect, latency, isCorrect ? undefined : 'spatial_miss');
    attemptsRef.current.push({ correct: isCorrect, latency });

    // Move to next item or finish
    const currentIndex = items.findIndex((i) => i.id === targetRecallItem.id);
    if (currentIndex + 1 < items.length) {
      setTargetRecallItem(items[currentIndex + 1]);
      startTimeRef.current = Date.now();
    } else {
      setPhase('result');
      const correctCount = attemptsRef.current.filter((a) => a.correct).length;
      const score = Math.round((correctCount / items.length) * 100);
      onComplete(score, attemptsRef.current);
    }
  };

  if (phase === 'memorize') {
    return (
      <View style={styles.container}>
        <GameCanvas
          mode="scene_placement"
          backgroundImageUrl={bgUrl}
          items={items}
          promptTitle="Remember the Room Layout"
          instructionText={`Look carefully at where each item is placed. Recall starts in ${timerCount}s...`}
        />
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>⏳ Memorizing: {timerCount}s</Text>
        </View>
      </View>
    );
  }

  if (phase === 'recall') {
    return (
      <View style={styles.container}>
        <GameCanvas
          mode="hotspot_spot"
          backgroundImageUrl={bgUrl}
          items={[]}
          promptTitle={`Where was the ${targetRecallItem?.name || 'Item'}?`}
          instructionText="Tap the spot on the room image where you saw this item placed earlier."
          onHotspotTap={handleHotspotTap}
        />
        {targetRecallItem && (
          <View style={styles.targetReminder}>
            <Text style={styles.targetLabel}>Looking for:</Text>
            <Text style={styles.targetItemName}>{targetRecallItem.name}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultTitle}>🌟 Great Memory!</Text>
      <Text style={styles.resultSub}>You practiced spatial recall of your living room.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  timerPill: {
    backgroundColor: '#FAF0E4',
    borderColor: '#D4C3AC',
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A5222',
  },
  targetReminder: {
    marginTop: 12,
    backgroundColor: '#EBF5EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#97CF9F',
  },
  targetLabel: {
    fontSize: 13,
    color: '#346B3C',
    fontWeight: '600',
  },
  targetItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E5828',
  },
  resultBox: {
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  resultSub: {
    fontSize: 16,
    color: '#655648',
    textAlign: 'center',
  },
});
