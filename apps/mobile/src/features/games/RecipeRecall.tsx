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

export const RecipeRecall: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [steps, setSteps] = useState<CanvasItem[]>([]);
  const [selectedSequence, setSelectedSequence] = useState<CanvasItem[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawSteps = imageService.getGameAssets('recipe-recall');
    const count = Math.min(5, 3 + Math.floor(difficulty / 2));
    const selected = rawSteps.slice(0, count);

    // Shuffle for user interaction
    const shuffled = [...selected].sort(() => 0.5 - Math.random()).map((s) => ({
      id: s.id,
      name: s.name.replace(/^\d+\.\s*/, ''), // remove leading numbering for recall
      imageUrl: s.imageUrl,
      orderIndex: s.orderIndex,
      isSelected: false,
    }));

    setSteps(shuffled);
    startTimeRef.current = Date.now();
  }, [difficulty]);

  const handleStepSelect = (item: CanvasItem, index: number) => {
    const latency = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();

    if (selectedSequence.some((s) => s.id === item.id)) {
      // Deselect
      const filtered = selectedSequence.filter((s) => s.id !== item.id);
      setSelectedSequence(filtered);
      setSteps((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isSelected: false } : s))
      );
      return;
    }

    const nextOrder = selectedSequence.length + 1;
    const isStepCorrect = item.orderIndex === nextOrder;

    if (isStepCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      onRecordAttempt(false, latency, 'wrong_step_order');
      attemptsRef.current.push({ correct: false, latency, error: 'out_of_order' });
    }

    const nextSeq = [...selectedSequence, { ...item, orderIndex: nextOrder }];
    setSelectedSequence(nextSeq);
    setSteps((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, isSelected: true, orderIndex: nextOrder } : s))
    );

    // If all steps ordered
    if (nextSeq.length === steps.length) {
      setTimeout(() => {
        const correctCount = nextSeq.filter(
          (s) => s.orderIndex === (steps.find((st) => st.id === s.id)?.orderIndex || 0)
        ).length;
        const score = Math.round((correctCount / steps.length) * 100);
        onComplete(score, attemptsRef.current);
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="sequence_reorder"
        items={steps}
        promptTitle="Sequence the Chef's Recipe"
        instructionText={`Tap each cooking step in order from start to finish (${selectedSequence.length}/${steps.length})`}
        onItemSelect={handleStepSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
});
