import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameCanvas, CanvasItem } from '../../components/game/GameCanvas';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

export const WhereDidIKeepIt: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'study' | 'spot' | 'done'>('study');
  const [bgImage, setBgImage] = useState<string>('');
  const [targetItem, setTargetItem] = useState<CanvasItem | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawAssets = imageService.getGameAssets('where-did-i-keep-it');
    const bg = rawAssets.find((a) => a.tags?.includes('background'))?.imageUrl || '';
    const items = rawAssets.filter((a) => !a.tags?.includes('background'));
    const chosen = items[Math.floor(Math.random() * items.length)] || items[0];

    setBgImage(bg);
    setTargetItem({
      id: chosen.id,
      name: chosen.name,
      imageUrl: chosen.imageUrl,
      xPercent: chosen.xPercent || 50,
      yPercent: chosen.yPercent || 50,
    });

    const studyTime = Math.max(3, 7 - difficulty);
    setCountdown(studyTime);
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'study') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('spot');
        startTimeRef.current = Date.now();
      }
    }
  }, [phase, countdown]);

  const handleHotspotTap = (xPct: number, yPct: number) => {
    if (phase !== 'spot' || !targetItem) return;

    const latency = Date.now() - startTimeRef.current;
    const targetX = targetItem.xPercent || 50;
    const targetY = targetItem.yPercent || 50;

    const distance = Math.sqrt(Math.pow(xPct - targetX, 2) + Math.pow(yPct - targetY, 2));
    const isCorrect = distance <= 24;

    if (isCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      onRecordAttempt(false, latency, 'spatial_hotspot_offset');
      attemptsRef.current.push({ correct: false, latency, error: 'offset' });
    }

    setPhase('done');
    setTimeout(() => {
      const score = isCorrect ? 100 : Math.max(30, Math.round(100 - distance * 2));
      onComplete(score, attemptsRef.current);
    }, 600);
  };

  if (phase === 'study' && targetItem) {
    return (
      <View style={styles.container}>
        <GameCanvas
          mode="scene_placement"
          backgroundImageUrl={bgImage}
          items={[targetItem]}
          promptTitle={`Memorize Where You Put Your ${targetItem.name}`}
          instructionText={`Look at where your ${targetItem.name} is stored. Spotting starts in ${countdown}s...`}
        />
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>⏳ {countdown}s remaining</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="hotspot_spot"
        backgroundImageUrl={bgImage}
        items={[]}
        promptTitle={`Where did you keep your ${targetItem?.name || 'item'}?`}
        instructionText="Tap the exact spot in the drawer/nightstand where you placed it:"
        onHotspotTap={handleHotspotTap}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  timerBox: {
    marginTop: 12,
    backgroundColor: '#FAF0E4',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DECABA',
  },
  timerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A5222',
  },
});
