import { create } from 'zustand';
import { Reminder, ReminderType } from '../types';

interface ReminderState {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (id: string) => void;
  confirmReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
}

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    user_id: 'usr-elder-001',
    title: 'Morning Heart Medication',
    description: '1 tablet with a glass of water after breakfast',
    type: 'MEDICATION',
    time_of_day: '08:30 AM',
    is_active: true,
  },
  {
    id: 'rem-2',
    user_id: 'usr-elder-001',
    title: 'Hydration Break',
    description: 'Drink a glass of warm water or herbal tea',
    type: 'WATER',
    time_of_day: '11:00 AM',
    is_active: true,
  },
  {
    id: 'rem-3',
    user_id: 'usr-elder-001',
    title: 'Call Grandson Leo',
    description: 'Weekly video catch-up after school',
    type: 'CALL_FAMILY',
    time_of_day: '04:30 PM',
    is_active: true,
  },
  {
    id: 'rem-4',
    user_id: 'usr-elder-001',
    title: 'Evening Calcium Supplement',
    description: 'Take with dinner',
    type: 'MEDICATION',
    time_of_day: '07:30 PM',
    is_active: true,
  },
];

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: INITIAL_REMINDERS,
  addReminder: (reminder) => {
    const newRem: Reminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
    };
    set((state) => ({ reminders: [...state.reminders, newRem] }));
  },
  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      ),
    }));
  },
  confirmReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, last_confirmed_at: new Date().toISOString() } : r
      ),
    }));
  },
  deleteReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));
  },
}));
