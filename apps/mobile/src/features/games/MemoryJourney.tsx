import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { GameCanvas, CanvasItem } from '../../components/game/GameCanvas';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

export const MemoryJourney: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'journey_view' | 'reorder' | 'done'>('journey_view');
  const [journeySteps, setJourneySteps] = useState<CanvasItem[]>([]);
  const [reorderList, setReorderList] = useState<CanvasItem[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<CanvasItem[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawSpots = imageService.getGameAssets('memory-journey');
    const count = Math.min(5, 3 + Math.floor(difficulty / 2));
    const slice = rawSpots.slice(0, count).map((s) => ({
      id: s.id,
      name: s.name,
      imageUrl: s.imageUrl,
      orderIndex: s.orderIndex,
    }));

    setJourneySteps(slice);
    setReorderList([...slice].sort(() => 0.5 - Math.random()));
    setCurrentSlideIndex(0);
  }, [difficulty]);

  // Slideshow auto-advance
  useEffect(() => {
    if (phase === 'journey_view' && journeySteps.length > 0) {
      const timer = setTimeout(() => {
        if (currentSlideIndex + 1 < journeySteps.length) {
          setCurrentSlideIndex((idx) => idx + 1);
        } else {
          setPhase('reorder');
          startTimeRef.current = Date.now();
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentSlideIndex, journeySteps]);

  const handleReorderSelect = (item: CanvasItem) => {
    const latency = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();

    if (selectedSequence.some((s) => s.id === item.id)) return;

    const nextOrder = selectedSequence.length + 1;
    const isStepCorrect = item.orderIndex === nextOrder;

    if (isStepCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      onRecordAttempt(false, latency, 'wrong_journey_order');
      attemptsRef.current.push({ correct: false, latency, error: 'order_error' });
    }

    const nextSeq = [...selectedSequence, { ...item, orderIndex: nextOrder }];
    setSelectedSequence(nextSeq);
    setReorderList((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, isSelected: true, orderIndex: nextOrder } : p))
    );

    if (nextSeq.length === journeySteps.length) {
      setTimeout(() => {
        const correctCount = attemptsRef.current.filter((a) => a.correct).length;
        const score = Math.round((correctCount / journeySteps.length) * 100);
        onComplete(score, attemptsRef.current);
      }, 600);
    }
  };

  if (phase === 'journey_view') {
    const currentSpot = journeySteps[currentSlideIndex];
    if (!currentSpot) return null;

    return (
      <View style={styles.container}>
        <View style={styles.slideCard}>
          <Text style={styles.slideHeader}>
            Scenic Journey: Stop {currentSlideIndex + 1} of {journeySteps.length}
          </Text>
          <Image source={{ uri: currentSpot.imageUrl }} style={styles.slideImage} resizeMode="cover" />
          <Text style={styles.slideTitle}>{currentSpot.name}</Text>
          <Text style={styles.slideHint}>Remember the order of the landmarks you visit!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="sequence_reorder"
        items={reorderList}
        promptTitle="Recreate Your Scenic Journey"
        instructionText={`Tap each landmark in the order you visited (${selectedSequence.length}/${journeySteps.length})`}
        onItemSelect={handleReorderSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  slideCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 16,
    alignItems: 'center',
  },
  slideHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A5222',
    marginBottom: 10,
  },
  slideImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  slideHint: {
    fontSize: 14,
    color: '#706050',
  },
});
