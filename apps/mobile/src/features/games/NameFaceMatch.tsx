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

export const NameFaceMatch: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [cards, setCards] = useState<CanvasItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  const pairCount = Math.min(6, Math.max(3, 2 + difficulty));

  useEffect(() => {
    const rawFaces = imageService.getGameAssets('name-face-match');
    const selectedFaces = rawFaces.slice(0, pairCount);

    // Create 2 cards per face (one with photo avatar, one with photo avatar pair)
    const deck: CanvasItem[] = [];
    selectedFaces.forEach((f, idx) => {
      deck.push({
        id: `card-${idx}-a`,
        name: f.name,
        imageUrl: f.imageUrl,
        isFlipped: false,
        isMatched: false,
        tags: [f.id],
      });
      deck.push({
        id: `card-${idx}-b`,
        name: f.name,
        imageUrl: f.imageUrl,
        isFlipped: false,
        isMatched: false,
        tags: [f.id],
      });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => 0.5 - Math.random());
    setCards(shuffled);
    startTimeRef.current = Date.now();
  }, [difficulty]);

  const handleCardTap = (item: CanvasItem, index: number) => {
    if (flippedIndices.length >= 2 || item.isMatched || item.isFlipped) {
      return;
    }

    const nextFlipped = [...flippedIndices, index];
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const idx1 = nextFlipped[0];
      const idx2 = nextFlipped[1];
      const card1 = newCards[idx1];
      const card2 = newCards[idx2];
      const latency = Date.now() - startTimeRef.current;
      startTimeRef.current = Date.now();

      const isMatch = card1.tags?.[0] === card2.tags?.[0];

      if (isMatch) {
        audioService.playSuccessSound();
        onRecordAttempt(true, latency);
        attemptsRef.current.push({ correct: true, latency });

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === idx1 || i === idx2
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            )
          );
          setFlippedIndices([]);
          setMatchesCount((m) => {
            const nextM = m + 1;
            if (nextM === pairCount) {
              const totalFlips = attemptsRef.current.length;
              const accuracy = Math.round((pairCount / Math.max(pairCount, totalFlips)) * 100);
              onComplete(accuracy, attemptsRef.current);
            }
            return nextM;
          });
        }, 500);
      } else {
        audioService.playTapSound();
        onRecordAttempt(false, latency, 'mismatched_pair');
        attemptsRef.current.push({ correct: false, latency, error: 'mismatch' });

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === idx1 || i === idx2 ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="flip_pairs"
        items={cards}
        promptTitle="Name & Face Match"
        instructionText={`Flip cards to find matching friendly faces (${matchesCount}/${pairCount} pairs matched)`}
        onItemSelect={handleCardTap}
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
