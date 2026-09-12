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

export const CompleteTheTune: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [albumChoices, setAlbumChoices] = useState<CanvasItem[]>([]);
  const [targetAlbum, setTargetAlbum] = useState<CanvasItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawTunes = imageService.getGameAssets('complete-the-tune');
    const shuffled = [...rawTunes].sort(() => 0.5 - Math.random()).slice(0, 3);
    const target = shuffled[0];

    setTargetAlbum(target);
    setAlbumChoices(
      shuffled.sort(() => 0.5 - Math.random()).map((t) => ({
        id: t.id,
        name: t.name,
        imageUrl: t.imageUrl,
        tags: t.tags,
      }))
    );

    // Auto play melody
    playMelodySnippet();
  }, [difficulty]);

  const playMelodySnippet = () => {
    setIsPlaying(true);
    audioService.playMelodicTune(difficulty);
    setTimeout(() => {
      setIsPlaying(false);
      startTimeRef.current = Date.now();
    }, 2200);
  };

  const handleAlbumSelect = (item: CanvasItem) => {
    if (!targetAlbum) return;

    const latency = Date.now() - startTimeRef.current;
    const isCorrect = item.id === targetAlbum.id;

    if (isCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      onRecordAttempt(false, latency, 'wrong_album_match');
      attemptsRef.current.push({ correct: false, latency, error: 'mismatch' });
    }

    setTimeout(() => {
      const score = isCorrect ? 100 : 40;
      onComplete(score, attemptsRef.current);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.audioPlayBtn, isPlaying && styles.audioPlayBtnActive]}
        onPress={playMelodySnippet}
        activeOpacity={0.8}
      >
        <Text style={styles.audioPlayIcon}>{isPlaying ? '🎵 Playing...' : '▶ Replay Melody'}</Text>
      </TouchableOpacity>

      <GameCanvas
        mode="image_grid"
        items={albumChoices}
        promptTitle="Match the Melodic Tune"
        instructionText="Listen to the soothing melody and select the matching vinyl album cover below:"
        gridColumns={3}
        onItemSelect={handleAlbumSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  audioPlayBtn: {
    backgroundColor: '#E67E22',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  audioPlayBtnActive: {
    backgroundColor: '#27AE60',
  },
  audioPlayIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
