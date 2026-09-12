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

export const MemoryGarden: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [bgUrl, setBgUrl] = useState<string>('');
  const [gardenItems, setGardenItems] = useState<CanvasItem[]>([]);
  const [placedCount, setPlacedCount] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawAssets = imageService.getGameAssets('memory-garden');
    const bg = rawAssets.find((a) => a.tags?.includes('background'))?.imageUrl || '';
    const plants = rawAssets.filter((a) => !a.tags?.includes('background'));

    setBgUrl(bg);
    setGardenItems(
      plants.map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        xPercent: p.xPercent,
        yPercent: p.yPercent,
      }))
    );
    setPlacedCount(plants.filter((p) => p.xPercent !== undefined).length);
    startTimeRef.current = Date.now();
  }, [difficulty]);

  const handlePlantPlaced = (item: CanvasItem, xPct: number, yPct: number) => {
    const latency = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();

    audioService.playSuccessSound();
    onRecordAttempt(true, latency);
    attemptsRef.current.push({ correct: true, latency });

    const updated = gardenItems.map((g) =>
      g.id === item.id ? { ...g, xPercent: xPct, yPercent: yPct } : g
    );
    setGardenItems(updated);
    setPlacedCount((c) => c + 1);
  };

  const handleFinishGarden = () => {
    onComplete(100, attemptsRef.current);
  };

  return (
    <View style={styles.container}>
      <GameCanvas
        mode="scene_placement"
        backgroundImageUrl={bgUrl}
        items={gardenItems}
        promptTitle="🌸 Your Peaceful Memory Garden"
        instructionText="Select a flower or plant from the tray and tap where you want to plant it:"
        onSceneItemPlaced={handlePlantPlaced}
        renderCustomFooter={() => (
          <TouchableOpacity style={styles.saveBtn} onPress={handleFinishGarden} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save & Bloom Garden 🌿</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
