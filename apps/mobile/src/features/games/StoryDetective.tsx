import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { GameCanvas, CanvasItem } from '../../components/game/GameCanvas';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

export const StoryDetective: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'listen' | 'solve' | 'done'>('listen');
  const [clues, setClues] = useState<CanvasItem[]>([]);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  const storyText =
    "On a bright Sunday afternoon, grandfather opened the old oak desk in his library. Inside the velvet drawer, he discovered a shining golden pocket watch that had belonged to his father.";
  const sceneIllustration = imageService.getPollinationsSceneUrl(
    'elderly man finding a vintage golden pocket watch in antique oak desk, warm watercolor'
  );

  useEffect(() => {
    const rawClues = imageService.getGameAssets('story-detective');
    const shuffled = [...rawClues].sort(() => 0.5 - Math.random());
    setClues(shuffled);

    // Start story narration
    startNarration();
  }, [difficulty]);

  const startNarration = () => {
    setIsNarrating(true);
    audioService.speak(storyText, () => {
      setIsNarrating(false);
      setPhase('solve');
      startTimeRef.current = Date.now();
    });
  };

  const handleClueSelect = (item: CanvasItem) => {
    if (phase !== 'solve') return;

    const latency = Date.now() - startTimeRef.current;
    const isCorrect = item.tags?.includes('correct_clue') || item.name.includes('Pocket Watch');

    if (isCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      onRecordAttempt(false, latency, 'incorrect_story_clue');
      attemptsRef.current.push({ correct: false, latency, error: 'story_comprehension_miss' });
    }

    setPhase('done');
    setTimeout(() => {
      const score = isCorrect ? 100 : 50;
      onComplete(score, attemptsRef.current);
    }, 600);
  };

  if (phase === 'listen') {
    return (
      <View style={styles.container}>
        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>📖 Listen to the Illustrated Tale</Text>
          <Image source={{ uri: sceneIllustration }} style={styles.storyImage} resizeMode="cover" />
          <Text style={styles.storyTranscript}>"{storyText}"</Text>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => {
              audioService.stopSpeaking();
              setPhase('solve');
              startTimeRef.current = Date.now();
            }}
          >
            <Text style={styles.skipBtnText}>I am Ready to Answer ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="image_grid"
        items={clues}
        promptTitle="What did Grandfather discover?"
        instructionText="Tap the real photo of the item mentioned in the story:"
        gridColumns={2}
        onItemSelect={handleClueSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  storyCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 18,
    alignItems: 'center',
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 12,
  },
  storyImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 14,
  },
  storyTranscript: {
    fontSize: 16,
    color: '#4A3B2C',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  skipBtn: {
    backgroundColor: '#346B3C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  skipBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
