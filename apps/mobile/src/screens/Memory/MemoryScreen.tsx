// ============================================================================
// MemoryScreen.tsx — Nostalgia Vault for Granny Mobile
// Elder view of family photos, stories, and voice memories
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { THEME } from '../../constants/theme';
import { databaseService } from '../../services/supabaseService';

interface Props {
  userId: string;
  language?: string;
  highContrast?: boolean;
}

export default function MemoryScreen({ userId, language = 'en', highContrast }: Props) {
  const colors = highContrast ? THEME.highContrastColors : THEME.colors;
  const ta = language === 'ta';
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PHOTO' | 'STORY'>('ALL');

  useEffect(() => {
    loadMemories();
  }, [userId]);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getMemories(userId);
      setMemories(data);
    } catch (e) {
      console.warn('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async () => {
    if (!newTitle.trim()) {
      Alert.alert(ta ? 'தலைப்பு தேவை' : 'Title Required', ta ? 'நினைவின் தலைப்பை உள்ளிடவும்' : 'Please enter a title for this memory.');
      return;
    }
    try {
      const newMem = await databaseService.addMemory(userId, {
        title: newTitle.trim(),
        content: newContent.trim() || newTitle.trim(),
        uploaded_by: 'Me',
      });
      setMemories(prev => [newMem, ...prev]);
      setNewTitle('');
      setNewContent('');
      setShowAddModal(false);
    } catch (e) {
      Alert.alert(ta ? 'பிழை' : 'Error', ta ? 'நினைவை சேமிக்க முடியவில்லை' : 'Could not save memory.');
    }
  };

  const filtered = filter === 'ALL' ? memories : memories.filter(m => m.type === filter);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {ta ? 'நினைவுகளை ஏற்றுகிறது...' : 'Loading your memories...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            📸 {ta ? 'குடும்ப நினைவுகள்' : 'Family Memories'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {ta ? 'உங்கள் இனிய பொக்கிஷ நினைவுகள்' : 'Your precious life moments & family stories'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ {ta ? 'சேர்' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={[styles.filterRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {(['ALL', 'PHOTO', 'STORY'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#FFF' : colors.textSecondary }]}>
              {f === 'ALL' ? (ta ? 'அனைத்தும்' : 'All') : f === 'PHOTO' ? (ta ? 'படங்கள்' : 'Photos') : (ta ? 'கதைகள்' : 'Stories')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              {ta ? 'இன்னும் நினைவுகள் சேர்க்கப்படவில்லை' : 'No memories yet'}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {ta ? 'உங்கள் பராமரிப்பாளர் குடும்ப புகைப்படங்கள் சேர்ப்பார்' : 'Your caregiver will add family photos & stories here'}
            </Text>
          </View>
        ) : (
          filtered.map(mem => (
            <TouchableOpacity
              key={mem.id}
              style={[styles.memCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => setSelectedMemory(mem)}
              activeOpacity={0.85}
            >
              {mem.image_url ? (
                <Image
                  source={{ uri: mem.image_url }}
                  style={styles.memImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.memImagePlaceholder, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.memImageEmoji}>📖</Text>
                </View>
              )}
              <View style={styles.memInfo}>
                <View style={[styles.memTypePill, { backgroundColor: mem.type === 'PHOTO' ? colors.primaryLight : colors.secondaryLight }]}>
                  <Text style={[styles.memTypeText, { color: mem.type === 'PHOTO' ? colors.primary : colors.secondaryDark }]}>
                    {mem.type === 'PHOTO' ? '📸 Photo' : '📖 Story'}
                  </Text>
                </View>
                <Text style={[styles.memTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {mem.title}
                </Text>
                <Text style={[styles.memContent, { color: colors.textSecondary }]} numberOfLines={2}>
                  {mem.content}
                </Text>
                <View style={styles.memMeta}>
                  {mem.uploaded_by && (
                    <Text style={[styles.memBy, { color: colors.textSecondary }]}>
                      👤 {mem.uploaded_by}
                    </Text>
                  )}
                  {mem.tags?.length > 0 && (
                    <Text style={[styles.memTags, { color: colors.primary }]}>
                      🏷️ {(Array.isArray(mem.tags) ? mem.tags : [mem.tags]).join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Memory Detail Modal */}
      <Modal visible={!!selectedMemory} animationType="slide" presentationStyle="pageSheet">
        {selectedMemory && (
          <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedMemory(null)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseTxt, { color: colors.primary }]}>
                  ← {ta ? 'பின்செல்' : 'Back'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {selectedMemory.title}
              </Text>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedMemory.image_url && (
                <Image
                  source={{ uri: selectedMemory.image_url }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.modalContent}>
                <Text style={[styles.modalMemTitle, { color: colors.textPrimary }]}>
                  {selectedMemory.title}
                </Text>
                <Text style={[styles.modalMemContent, { color: colors.textSecondary }]}>
                  {selectedMemory.content}
                </Text>
                {selectedMemory.uploaded_by && (
                  <Text style={[styles.modalMeta, { color: colors.textSecondary }]}>
                    👤 {ta ? 'சேர்த்தவர்' : 'Shared by'}: {selectedMemory.uploaded_by}
                  </Text>
                )}
                {selectedMemory.created_at && (
                  <Text style={[styles.modalMeta, { color: colors.textSecondary }]}>
                    📅 {selectedMemory.created_at}
                  </Text>
                )}
                {selectedMemory.tags?.length > 0 && (
                  <View style={styles.tagsRow}>
                    {(Array.isArray(selectedMemory.tags) ? selectedMemory.tags : [selectedMemory.tags]).map((tag: string) => (
                      <View key={tag} style={[styles.tagChip, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>🏷️ {tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Add Memory Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
              <Text style={[styles.modalCloseTxt, { color: colors.error }]}>
                {ta ? 'ரத்து' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {ta ? 'புதிய நினைவு சேர்க்க' : 'Add New Memory'}
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.addForm}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {ta ? 'தலைப்பு' : 'Title'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={ta ? 'நினைவின் தலைப்பு...' : 'Memory title...'}
                placeholderTextColor={colors.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                {ta ? 'கதை / விவரம்' : 'Story / Description'}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={ta ? 'இந்த நினைவைப் பற்றி சொல்லுங்கள்...' : 'Tell us about this memory...'}
                placeholderTextColor={colors.textSecondary}
                value={newContent}
                onChangeText={setNewContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddMemory}
              >
                <Text style={styles.saveBtnText}>{ta ? 'நினைவை சேமி' : 'Save Memory'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: 1 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  filterText: { fontSize: 14, fontWeight: '700' },
  scroll: { padding: 16, gap: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  memCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  memImage: { width: '100%', height: 200 },
  memImagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  memImageEmoji: { fontSize: 48 },
  memInfo: { padding: 16 },
  memTypePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  memTypeText: { fontSize: 12, fontWeight: '700' },
  memTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, lineHeight: 24 },
  memContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  memMeta: { gap: 4 },
  memBy: { fontSize: 13 },
  memTags: { fontSize: 13, fontWeight: '600' },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  modalCloseBtn: { minWidth: 60 },
  modalCloseTxt: { fontSize: 16, fontWeight: '700' },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  modalScroll: { paddingBottom: 40 },
  modalImage: { width: '100%', height: 280 },
  modalContent: { padding: 20 },
  modalMemTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  modalMemContent: { fontSize: 16, lineHeight: 26, marginBottom: 16 },
  modalMeta: { fontSize: 14, marginBottom: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { fontSize: 13, fontWeight: '600' },
  // Add form
  addForm: { padding: 20 },
  fieldLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: { height: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#FFFFFF' },
  textArea: { minHeight: 120, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF' },
  saveBtn: { marginTop: 24, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
