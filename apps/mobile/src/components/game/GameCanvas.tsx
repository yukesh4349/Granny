import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { audioService } from '../../services/audioService';

export type GameCanvasMode =
  | 'image_grid'
  | 'scene_placement'
  | 'flip_pairs'
  | 'hotspot_spot'
  | 'sequence_reorder';

export interface CanvasItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  xPercent?: number; // 0 - 100%
  yPercent?: number; // 0 - 100%
  isFlipped?: boolean;
  isMatched?: boolean;
  isSelected?: boolean;
  orderIndex?: number;
  tags?: string[];
}

interface GameCanvasProps {
  mode: GameCanvasMode;
  backgroundImageUrl?: string;
  items: CanvasItem[];
  promptTitle: string;
  instructionText?: string;
  gridColumns?: number;
  onItemSelect?: (item: CanvasItem, index: number) => void;
  onHotspotTap?: (xPercent: number, yPercent: number) => void;
  onSequenceOrderChange?: (reorderedItems: CanvasItem[]) => void;
  onSceneItemPlaced?: (item: CanvasItem, xPercent: number, yPercent: number) => void;
  renderCustomFooter?: () => React.ReactNode;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  backgroundImageUrl,
  items,
  promptTitle,
  instructionText,
  gridColumns = 3,
  onItemSelect,
  onHotspotTap,
  onSequenceOrderChange,
  onSceneItemPlaced,
  renderCustomFooter,
}) => {
  const [selectedPlacementItem, setSelectedPlacementItem] = useState<CanvasItem | null>(null);

  const handleSceneBgPress = (e: any) => {
    audioService.playTapSound();
    const { locationX, locationY } = e.nativeEvent;
    // Estimate relative percent coordinates on container
    const width = e.nativeEvent.target?.clientWidth || 340;
    const height = e.nativeEvent.target?.clientHeight || 240;
    const xPct = Math.max(5, Math.min(95, Math.round((locationX / width) * 100)));
    const yPct = Math.max(5, Math.min(95, Math.round((locationY / height) * 100)));

    if (mode === 'hotspot_spot' && onHotspotTap) {
      onHotspotTap(xPct, yPct);
    } else if (mode === 'scene_placement' && selectedPlacementItem && onSceneItemPlaced) {
      onSceneItemPlaced(selectedPlacementItem, xPct, yPct);
      setSelectedPlacementItem(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Prompt */}
      <View style={styles.headerBox}>
        <Text style={styles.promptTitle}>{promptTitle}</Text>
        {instructionText ? (
          <Text style={styles.instructionText}>{instructionText}</Text>
        ) : null}
      </View>

      {/* Mode 1: Image Grid (Market, Album, etc.) */}
      {mode === 'image_grid' && (
        <View style={styles.gridContainer}>
          {items.map((item, index) => {
            const isSelected = item.isSelected;
            return (
              <TouchableOpacity
                key={item.id || `grid-${index}`}
                activeOpacity={0.8}
                style={[
                  styles.gridCard,
                  gridColumns === 2 ? styles.col2 : styles.col3,
                  isSelected && styles.gridCardSelected,
                ]}
                onPress={() => {
                  audioService.playTapSound();
                  onItemSelect && onItemSelect(item, index);
                }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridImage as any}
                  resizeMode="cover"
                />
                <View style={styles.gridItemLabel}>
                  <Text style={styles.gridItemText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Mode 2: Scene Placement (Remember My Home, Garden) */}
      {mode === 'scene_placement' && (
        <View style={styles.sceneWrapper}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleSceneBgPress}
            style={styles.sceneBgContainer}
          >
            {backgroundImageUrl ? (
              <Image
                source={{ uri: backgroundImageUrl }}
                style={styles.sceneBgImage as any}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.sceneBgImage as any, styles.defaultBg]} />
            )}

            {/* Placed Stickers on Scene */}
            {items
              .filter((it) => it.xPercent !== undefined && it.yPercent !== undefined)
              .map((placed) => (
                <View
                  key={placed.id}
                  style={[
                    styles.placedSticker,
                    {
                      left: `${placed.xPercent}%`,
                      top: `${placed.yPercent}%`,
                    },
                  ]}
                >
                  <Image source={{ uri: placed.imageUrl }} style={styles.stickerImg as any} />
                  <View style={styles.stickerLabel}>
                    <Text style={styles.stickerLabelText}>{placed.name}</Text>
                  </View>
                </View>
              ))}
          </TouchableOpacity>

          {/* Stickers Tray to pick and place */}
          <View style={styles.trayContainer}>
            <Text style={styles.trayHeader}>Tap a sticker, then tap where to place it:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trayScroll}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.trayItem,
                    selectedPlacementItem?.id === item.id && styles.trayItemSelected,
                  ]}
                  onPress={() => {
                    audioService.playTapSound();
                    setSelectedPlacementItem(item);
                  }}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.trayImage as any} />
                  <Text style={styles.trayText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Mode 3: Flip Pairs (Name & Face Match) */}
      {mode === 'flip_pairs' && (
        <View style={styles.flipGrid}>
          {items.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <TouchableOpacity
                key={card.id || `card-${idx}`}
                activeOpacity={0.8}
                style={[
                  styles.flipCard,
                  card.isMatched && styles.flipCardMatched,
                  !isRevealed && styles.flipCardBack,
                ]}
                onPress={() => {
                  if (!card.isMatched) {
                    audioService.playTapSound();
                    onItemSelect && onItemSelect(card, idx);
                  }
                }}
              >
                {isRevealed ? (
                  <View style={styles.flipCardContent}>
                    <Image source={{ uri: card.imageUrl }} style={styles.flipImage as any} />
                    <Text style={styles.flipLabel} numberOfLines={1}>
                      {card.name}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardHiddenPattern}>
                    <Text style={styles.cardHiddenIcon}>🌸</Text>
                    <Text style={styles.cardHiddenSub}>Tap to Turn</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Mode 4: Hotspot Spotting (Where Did I Keep It?) */}
      {mode === 'hotspot_spot' && (
        <View style={styles.hotspotContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSceneBgPress}
            style={styles.hotspotBg}
          >
            {backgroundImageUrl && (
              <Image
                source={{ uri: backgroundImageUrl }}
                style={styles.sceneBgImage as any}
                resizeMode="cover"
              />
            )}
            {/* Visual Markers */}
            {items
              .filter((it) => it.isSelected)
              .map((it) => (
                <View
                  key={it.id}
                  style={[
                    styles.hotspotPin,
                    { left: `${it.xPercent}%`, top: `${it.yPercent}%` },
                  ]}
                >
                  <Text style={styles.hotspotPinIcon}>📍</Text>
                </View>
              ))}
          </TouchableOpacity>
        </View>
      )}

      {/* Mode 5: Sequence Reorder (Recipe Recall, Memory Journey) */}
      {mode === 'sequence_reorder' && (
        <View style={styles.sequenceContainer}>
          <Text style={styles.sequenceHint}>
            Tap steps in correct sequential order from 1 to {items.length}:
          </Text>
          <View style={styles.sequenceGrid}>
            {items.map((step, idx) => (
              <TouchableOpacity
                key={step.id || `seq-${idx}`}
                activeOpacity={0.85}
                style={[
                  styles.sequenceCard,
                  step.isSelected && styles.sequenceCardSelected,
                ]}
                onPress={() => {
                  audioService.playTapSound();
                  onItemSelect && onItemSelect(step, idx);
                }}
              >
                <Image source={{ uri: step.imageUrl }} style={styles.sequenceImage as any} />
                <View style={styles.sequenceCardBody}>
                  {step.orderIndex !== undefined && step.isSelected && (
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>Step {step.orderIndex}</Text>
                    </View>
                  )}
                  <Text style={styles.sequenceTitle} numberOfLines={2}>
                    {step.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Optional Custom Controls / Next Button Footer */}
      {renderCustomFooter ? (
        <View style={styles.footerBox}>{renderCustomFooter()}</View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EFE6D8',
  },
  headerBox: {
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  promptTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B5E52',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Mode 1: Image Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E8DFD0',
    overflow: 'hidden',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  col2: {
    width: '48%',
  },
  col3: {
    width: '31%',
    minWidth: 95,
  },
  gridCardSelected: {
    borderColor: '#2D8A4E',
    borderWidth: 3,
    backgroundColor: '#EAF8EE',
  },
  gridImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F0ECE4',
  },
  gridItemLabel: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#332720',
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: '#2D8A4E',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Mode 2: Scene Placement
  sceneWrapper: {
    width: '100%',
    gap: 12,
  },
  sceneBgContainer: {
    width: '100%',
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#DDD2C0',
  },
  sceneBgImage: {
    width: '100%',
    height: '100%',
  },
  defaultBg: {
    backgroundColor: '#D9E8D8',
  },
  placedSticker: {
    position: 'absolute',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    alignItems: 'center',
  },
  stickerImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  stickerLabel: {
    backgroundColor: 'rgba(44, 24, 16, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  stickerLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  trayContainer: {
    backgroundColor: '#F5EFE6',
    padding: 10,
    borderRadius: 16,
  },
  trayHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A4A3A',
    marginBottom: 8,
  },
  trayScroll: {
    flexDirection: 'row',
  },
  trayItem: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0D6C6',
    alignItems: 'center',
    marginRight: 10,
    width: 80,
  },
  trayItemSelected: {
    borderColor: '#C05A18',
    backgroundColor: '#FFF4EB',
  },
  trayImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginBottom: 4,
  },
  trayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C1810',
    textAlign: 'center',
  },
  // Mode 3: Flip Pairs
  flipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  flipCard: {
    width: '29%',
    minWidth: 90,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D4C6B2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipCardMatched: {
    borderColor: '#2D8A4E',
    backgroundColor: '#E7F6EC',
    opacity: 0.85,
  },
  flipCardBack: {
    backgroundColor: '#EFE5D5',
    borderColor: '#CBBBA3',
  },
  flipCardContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  flipImage: {
    width: 65,
    height: 65,
    borderRadius: 32,
    marginBottom: 6,
  },
  flipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2C1810',
    textAlign: 'center',
  },
  cardHiddenPattern: {
    alignItems: 'center',
  },
  cardHiddenIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardHiddenSub: {
    fontSize: 11,
    color: '#7D6F5E',
    fontWeight: '600',
  },
  // Mode 4: Hotspots
  hotspotContainer: {
    width: '100%',
  },
  hotspotBg: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#CBBBA3',
  },
  hotspotPin: {
    position: 'absolute',
    transform: [{ translateX: -15 }, { translateY: -30 }],
  },
  hotspotPinIcon: {
    fontSize: 28,
  },
  // Mode 5: Sequence Reorder
  sequenceContainer: {
    width: '100%',
    gap: 10,
  },
  sequenceHint: {
    fontSize: 14,
    color: '#655648',
    fontWeight: '600',
    marginBottom: 4,
  },
  sequenceGrid: {
    gap: 10,
  },
  sequenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E4DACB',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sequenceCardSelected: {
    borderColor: '#2D8A4E',
    backgroundColor: '#EFF9F2',
  },
  sequenceImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  sequenceCardBody: {
    flex: 1,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2D8A4E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sequenceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
  },
  footerBox: {
    marginTop: 16,
    width: '100%',
  },
});
