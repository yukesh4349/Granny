import { create } from 'zustand';
import { User, ElderProfile, UserRole } from '../types';

interface UserState {
  currentUser: User;
  elderProfile: ElderProfile;
  activeRole: UserRole;
  setRole: (role: UserRole) => void;
  updateCognitiveLevel: (level: number) => void;
  incrementStreak: () => void;
}

const DEFAULT_ELDER_USER: User = {
  id: 'usr-elder-001',
  email: 'granny.rose@example.com',
  name: 'Grandma Rose',
  role: 'ELDER',
  language: 'en',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/png?seed=Rose&backgroundColor=ffd5dc',
  family_group_id: 'fam-group-777',
  caregiver_consent: true,
};

const DEFAULT_ELDER_PROFILE: ElderProfile = {
  user_id: 'usr-elder-001',
  cognitive_level: 2,
  interests: ['Gardening', 'Classical Tunes', 'Baking Pies', 'Family Photos'],
  cultural_tags: ['General', 'Vintage 1960s'],
  daily_streak: 4,
  emergency_contact_phone: '+1 (555) 234-5678',
  notes_for_ai: 'Loves hearing about grandson Leo and watering roses in the morning.',
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: DEFAULT_ELDER_USER,
  elderProfile: DEFAULT_ELDER_PROFILE,
  activeRole: 'ELDER',
  setRole: (role) => set((state) => ({
    activeRole: role,
    currentUser: {
      ...state.currentUser,
      role: role,
      name: role === 'ELDER' ? 'Grandma Rose' : 'Caregiver Sarah',
    },
  })),
  updateCognitiveLevel: (level) => set((state) => ({
    elderProfile: {
      ...state.elderProfile,
      cognitive_level: Math.max(1, Math.min(5, level)),
    },
  })),
  incrementStreak: () => set((state) => ({
    elderProfile: {
      ...state.elderProfile,
      daily_streak: state.elderProfile.daily_streak + 1,
    },
  })),
}));
