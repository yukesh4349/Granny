import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useReminderStore } from '../src/store/reminderStore';
import { audioService } from '../src/services/audioService';

export default function RemindersScreen() {
  const { reminders, confirmReminder } = useReminderStore();

  const handleConfirm = (id: string, title: string) => {
    audioService.playSuccessSound();
    confirmReminder(id);
    audioService.speak(`Well done! You confirmed: ${title}.`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MEDICATION': return '💊';
      case 'WATER': return '💧';
      case 'MEAL': return '🍲';
      case 'CALL_FAMILY': return '📞';
      default: return '⏰';
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Care & Reminders</Text>
        <Text style={styles.headerSub}>
          Tap "Confirm Done" when you have taken your medicine or completed a routine.
        </Text>
      </View>

      <View style={styles.remindersList}>
        {reminders.map((rem) => {
          const isDone = Boolean(rem.last_confirmed_at);
          return (
            <View
              key={rem.id}
              style={[styles.reminderCard, isDone && styles.reminderCardDone]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Text style={styles.typeIcon}>{getTypeIcon(rem.type)}</Text>
                </View>
                <View style={styles.titleWrap}>
                  <Text style={styles.timeBadge}>{rem.time_of_day}</Text>
                  <Text style={[styles.reminderTitle, isDone && styles.titleDone]}>
                    {rem.title}
                  </Text>
                </View>
              </View>

              {rem.description ? (
                <Text style={styles.descriptionText}>{rem.description}</Text>
              ) : null}

              <View style={styles.cardActions}>
                {isDone ? (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneText}>✓ Completed Today</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirm(rem.id, rem.title)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>✓ Confirm Done</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.listenBtn}
                  onPress={() => {
                    audioService.playTapSound();
                    audioService.speak(
                      `Reminder for ${rem.time_of_day}: ${rem.title}. ${rem.description || ''}`
                    );
                  }}
                >
                  <Text style={styles.listenBtnText}>🔊 Read</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
  remindersList: {
    gap: 16,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E8DED1',
    padding: 18,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  reminderCardDone: {
    borderColor: '#BBE2C6',
    backgroundColor: '#F7FCF8',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5ECE0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 24,
  },
  titleWrap: {
    flex: 1,
  },
  timeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5222',
    marginBottom: 2,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  titleDone: {
    color: '#667769',
    textDecorationLine: 'line-through',
  },
  descriptionText: {
    fontSize: 14,
    color: '#605244',
    lineHeight: 20,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flex: 1,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  doneBadge: {
    backgroundColor: '#EAF8EE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#98DBA8',
  },
  doneText: {
    color: '#1E652E',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listenBtn: {
    backgroundColor: '#F3EDE2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  listenBtnText: {
    color: '#4A3B2C',
    fontWeight: '700',
    fontSize: 13,
  },
});
