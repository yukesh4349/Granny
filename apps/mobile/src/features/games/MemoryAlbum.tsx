import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { imageService } from '../../services/imageService';
import { audioService } from '../../services/audioService';

interface Props {
  difficulty: number;
  onComplete: (score: number, attempts: any[]) => void;
  onRecordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
}

interface AlbumPhoto {
  id: string;
  name: string;
  imageUrl: string;
  isPreviouslySeen: boolean;
}

export const MemoryAlbum: React.FC<Props> = ({
  difficulty,
  onComplete,
  onRecordAttempt,
}) => {
  const [phase, setPhase] = useState<'study' | 'test' | 'done'>('study');
  const [studyPhotos, setStudyPhotos] = useState<AlbumPhoto[]>([]);
  const [testPhotos, setTestPhotos] = useState<AlbumPhoto[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(6);
  const startTimeRef = useRef<number>(Date.now());
  const attemptsRef = useRef<any[]>([]);

  useEffect(() => {
    const rawPhotos = imageService.getGameAssets('memory-album');
    const seen = rawPhotos.filter((p) => p.tags?.includes('seen')).map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      isPreviouslySeen: true,
    }));
    const unseen = rawPhotos.filter((p) => p.tags?.includes('unseen')).map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      isPreviouslySeen: false,
    }));

    setStudyPhotos(seen);
    // Combine and shuffle for testing phase
    const mixed = [...seen, ...unseen].sort(() => 0.5 - Math.random());
    setTestPhotos(mixed);

    const studyTime = Math.max(4, 8 - difficulty);
    setCountdown(studyTime);
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'study') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('test');
        startTimeRef.current = Date.now();
      }
    }
  }, [phase, countdown]);

  const handleAnswer = (userSaysSeen: boolean) => {
    const currentPhoto = testPhotos[currentTestIndex];
    if (!currentPhoto) return;

    const latency = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();

    const isCorrect = userSaysSeen === currentPhoto.isPreviouslySeen;

    if (isCorrect) {
      audioService.playSuccessSound();
      onRecordAttempt(true, latency);
      attemptsRef.current.push({ correct: true, latency });
    } else {
      audioService.playTapSound();
      const errType = currentPhoto.isPreviouslySeen ? 'missed_recognition' : 'false_alarm';
      onRecordAttempt(false, latency, errType);
      attemptsRef.current.push({ correct: false, latency, error: errType });
    }

    if (currentTestIndex + 1 < testPhotos.length) {
      setCurrentTestIndex((i) => i + 1);
    } else {
      setPhase('done');
      const correctCount = attemptsRef.current.filter((a) => a.correct).length;
      const score = Math.round((correctCount / testPhotos.length) * 100);
      onComplete(score, attemptsRef.current);
    }
  };

  if (phase === 'study') {
    return (
      <View style={styles.container}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>📸 Look at These Cherished Photos</Text>
          <Text style={styles.subtitle}>
            Remember these photos. Recognition test starts in {countdown}s!
          </Text>
        </View>

        <View style={styles.studyRow}>
          {studyPhotos.map((photo) => (
            <View key={photo.id} style={styles.studyCard}>
              <Image source={{ uri: photo.imageUrl }} style={styles.photoImg} />
              <Text style={styles.photoTitle}>{photo.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>⏳ Ready in {countdown}s</Text>
        </View>
      </View>
    );
  }

  const activePhoto = testPhotos[currentTestIndex];

  return (
    <View style={styles.container}>
      <View style={styles.testCard}>
        <Text style={styles.testCounter}>
          Photo {currentTestIndex + 1} of {testPhotos.length}
        </Text>
        {activePhoto && (
          <>
            <Image source={{ uri: activePhoto.imageUrl }} style={styles.testPhoto} resizeMode="cover" />
            <Text style={styles.testName}>{activePhoto.name}</Text>
          </>
        )}
        <Text style={styles.questionText}>Have you seen this photo before?</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.choiceBtn, styles.yesBtn]}
            onPress={() => handleAnswer(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.choiceBtnText}>✓ Yes, Seen Before</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceBtn, styles.noBtn]}
            onPress={() => handleAnswer(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.choiceBtnText}>✕ No, New Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  cardHeader: {
    backgroundColor: '#FFFDF9',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8DED1',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 4,
  },
  subtitle: {
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
    width: 100,
  },
  photoImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 6,
  },
  photoTitle: {
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
  testCard: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 20,
    alignItems: 'center',
  },
  testCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A5222',
    marginBottom: 12,
  },
  testPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 12,
  },
  testName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#382B21',
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  yesBtn: {
    backgroundColor: '#27AE60',
  },
  noBtn: {
    backgroundColor: '#C0392B',
  },
  choiceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
