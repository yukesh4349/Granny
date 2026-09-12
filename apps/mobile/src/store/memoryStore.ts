import { create } from 'zustand';
import { Memory, MemoryType } from '../types';

interface MemoryState {
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'created_at'>) => void;
  toggleFavorite: (id: string) => void;
  deleteMemory: (id: string) => void;
  getMemoriesForPrompt: () => string[];
}

const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    user_id: 'usr-elder-001',
    type: 'FAMILY',
    title: 'Grandson Leo’s 7th Birthday',
    content: 'Leo blew out all 7 blue candles on his train cake and gave Grandma a big tight hug.',
    image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
    tags: ['family', 'Leo', 'birthday'],
    is_favorite: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'mem-2',
    user_id: 'usr-elder-001',
    type: 'ROUTINE',
    title: 'Morning Rose Garden Tea',
    content: 'Enjoys brewing Earl Grey tea at 8:30 AM and sitting near the porch looking at blooming pink roses.',
    image_url: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&auto=format&fit=crop&q=80',
    tags: ['garden', 'tea', 'morning'],
    is_favorite: true,
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
  {
    id: 'mem-3',
    user_id: 'usr-elder-001',
    type: 'STORY',
    title: 'Secret Apple Cinnamon Pie Recipe',
    content: 'Always adds a pinch of nutmeg and two drops of vanilla extract into the sliced Granny Smith apples.',
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80',
    tags: ['baking', 'recipe', 'family'],
    is_favorite: false,
    created_at: new Date(Date.now() - 3600000 * 24 * 21).toISOString(),
  },
];

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: INITIAL_MEMORIES,
  addMemory: (memory) => {
    const newEntry: Memory = {
      ...memory,
      id: `mem-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ memories: [newEntry, ...state.memories] }));
  },
  toggleFavorite: (id) => {
    set((state) => ({
      memories: state.memories.map((m) =>
        m.id === id ? { ...m, is_favorite: !m.is_favorite } : m
      ),
    }));
  },
  deleteMemory: (id) => {
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },
  getMemoriesForPrompt: () => {
    return get().memories.map((m) => `[${m.title}] ${m.content}`);
  },
}));
