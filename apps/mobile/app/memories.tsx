import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useMemoryStore } from '../src/store/memoryStore';
import { audioService } from '../src/services/audioService';

export default function MemoriesScreen() {
  const { memories, toggleFavorite } = useMemoryStore();

  const handleReadMemory = (text: string) => {
    audioService.playTapSound();
    audioService.speak(text);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cherished Family Memories</Text>
        <Text style={styles.headerSub}>
          Tap any memory to have Granny read the heartwarming story aloud to you.
        </Text>
      </View>

      <View style={styles.memoryList}>
        {memories.map((mem) => (
          <View key={mem.id} style={styles.memoryCard}>
            {mem.image_url ? (
              <Image source={{ uri: mem.image_url }} style={styles.memoryImage} resizeMode="cover" />
            ) : null}

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.memoryTitle}>{mem.title}</Text>
                <TouchableOpacity
                  onPress={() => {
                    audioService.playTapSound();
                    toggleFavorite(mem.id);
                  }}
                  style={styles.favBtn}
                >
                  <Text style={styles.favIcon}>{mem.is_favorite ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.memoryContent}>{mem.content}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.tagRow}>
                  {mem.tags.map((tag, tIdx) => (
                    <View key={tIdx} style={styles.tagBadge}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.speakBtn}
                  onPress={() => handleReadMemory(`${mem.title}. ${mem.content}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.speakBtnText}>🔊 Read Aloud</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  container: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 15,
    color: '#655648',
    lineHeight: 22,
  },
  memoryList: {
    gap: 18,
  },
  memoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E8DED1',
    overflow: 'hidden',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  memoryImage: {
    width: '100%',
    height: 220,
  },
  cardBody: {
    padding: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2C1810',
    flex: 1,
    marginRight: 8,
  },
  favBtn: {
    padding: 4,
  },
  favIcon: {
    fontSize: 22,
  },
  memoryContent: {
    fontSize: 16,
    color: '#4A3B2C',
    lineHeight: 24,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: '#F3EDE2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6B5B4B',
    fontWeight: '600',
  },
  speakBtn: {
    backgroundColor: '#346B3C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  speakBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
