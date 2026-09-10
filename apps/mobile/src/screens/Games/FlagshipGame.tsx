// ============================================================================
// Flagship Game: Where Did I Keep It (Mobile Optimized)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { THEME } from '../../constants/theme';

interface Props {
  onBack: () => void;
  highContrast?: boolean;
}

interface PlacedItem {
  name: string;
  emoji: string;
  room: string;
}

const ROOMS = ['Living Room Table', 'Kitchen Counter', 'Bedside Drawer', 'Reading Chair'];
const ITEMS = [
  { name: 'Reading Glasses', emoji: '👓' },
  { name: 'House Keys', emoji: '🔑' },
  { name: 'Medicine Box', emoji: '💊' },
  { name: 'Prayer Book', emoji: '📖' },
];

export default function FlagshipGame({ onBack, highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;

  const [phase, setPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [countdown, setCountdown] = useState(6);
  const [targetItem, setTargetItem] = useState<PlacedItem>(
    { name: 'Reading Glasses', emoji: '👓', room: 'Living Room Table' }
  );
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    let timer: any;
    if (phase === 'memorize' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (phase === 'memorize' && countdown === 0) {
      setPhase('recall');
    }
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const handleSelectRoom = (room: string) => {
    setSelectedRoom(room);
    const correct = room === targetItem.room;
    setIsCorrect(correct);
    setPhase('result');
  };

  const handleRestart = () => {
    const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
    setTargetItem({ ...randomItem, room: randomRoom });
    setSelectedRoom(null);
    setIsCorrect(null);
    setCountdown(6);
    setPhase('memorize');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={onBack}
        >
          <Text style={[styles.backBtnText, { color: colors.textPrimary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Where Did I Keep It?</Text>
      </View>

      {/* Memorize Phase */}
      {phase === 'memorize' && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.badge, { backgroundColor: colors.primaryLight, color: colors.primary }]}>
            Memorize this location ({countdown}s)
          </Text>
          <Text style={styles.emoji}>{targetItem.emoji}</Text>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
            Your {targetItem.name}
          </Text>
          <Text style={[styles.instruction, { color: colors.textSecondary }]}>is kept in the:</Text>
          <Text style={[styles.roomHighlight, { color: colors.accent }]}>
            {targetItem.room}
          </Text>
        </View>
      )}

      {/* Recall Phase */}
      {phase === 'recall' && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.badge, { backgroundColor: colors.accentLight, color: colors.accent }]}>
            Where did you keep it?
          </Text>
          <Text style={styles.emoji}>{targetItem.emoji}</Text>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
            Where are your {targetItem.name}?
          </Text>
          
          <View style={styles.optionsList}>
            {ROOMS.map((room) => (
              <TouchableOpacity
                key={room}
                style={[styles.optionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={() => handleSelectRoom(room)}
              >
                <Text style={[styles.optionText, { color: colors.primary }]}>
                  {room}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Result Phase */}
      {phase === 'result' && (
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '💙'}</Text>
          <Text style={[styles.resultTitle, { color: isCorrect ? colors.success : colors.textPrimary }]}>
            {isCorrect ? 'Wonderful! That is correct!' : 'Good try!'}
          </Text>
          <Text style={[styles.resultDesc, { color: colors.textSecondary }]}>
            {isCorrect
              ? `You remembered that your ${targetItem.name} were in the ${targetItem.room}!`
              : `Your ${targetItem.name} were in the ${targetItem.room}. Next time will be even easier!`}
          </Text>

          <TouchableOpacity
            style={[styles.playAgainBtn, { backgroundColor: colors.primary }]}
            onPress={handleRestart}
          >
            <Text style={styles.playAgainText}>Play Another Round</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backBtn: {
    minHeight: 48,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  badge: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  emoji: {
    fontSize: 64,
    marginVertical: 12,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 18,
    marginBottom: 4,
  },
  roomHighlight: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 6,
  },
  optionsList: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  optionBtn: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resultEmoji: {
    fontSize: 72,
    marginVertical: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  playAgainBtn: {
    minHeight: 56,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
