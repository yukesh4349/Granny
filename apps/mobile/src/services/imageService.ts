// Granny Visual Image Asset Service
// Multi-provider: Pexels API (primary), Pixabay (secondary), DiceBear (avatars), Pollinations.ai (scenes)
// Includes curated fallback sets so all 10 games work flawlessly out-of-the-box.

import { GameKey } from '../types';

export interface GameImageItem {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
  xPercent?: number; // for coordinate / hotspot games
  yPercent?: number;
  orderIndex?: number; // for sequence games
}

// Curated high-resolution, elder-friendly image database
const CURATED_ASSET_REGISTRY: Record<GameKey, GameImageItem[]> = {
  'remember-my-home': [
    {
      id: 'home-bg-1',
      name: 'Cozy Living Room',
      imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1000&auto=format&fit=crop&q=80',
      tags: ['background', 'living_room'],
    },
    {
      id: 'home-obj-1',
      name: 'Reading Glasses',
      imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&auto=format&fit=crop&q=80',
      tags: ['sticker', 'glasses'],
      xPercent: 28,
      yPercent: 62,
    },
    {
      id: 'home-obj-2',
      name: 'Tea Cup',
      imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
      tags: ['sticker', 'tea'],
      xPercent: 72,
      yPercent: 55,
    },
    {
      id: 'home-obj-3',
      name: 'House Key',
      imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      tags: ['sticker', 'keys'],
      xPercent: 50,
      yPercent: 78,
    },
    {
      id: 'home-obj-4',
      name: 'Wall Clock',
      imageUrl: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400&auto=format&fit=crop&q=80',
      tags: ['sticker', 'clock'],
      xPercent: 65,
      yPercent: 22,
    },
    {
      id: 'home-obj-5',
      name: 'Potted Fern',
      imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&auto=format&fit=crop&q=80',
      tags: ['sticker', 'plant'],
      xPercent: 18,
      yPercent: 42,
    },
  ],

  'memory-market': [
    {
      id: 'market-1',
      name: 'Red Apples',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
      tags: ['fruit', 'fresh'],
    },
    {
      id: 'market-2',
      name: 'Fresh Bread',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
      tags: ['bakery', 'grain'],
    },
    {
      id: 'market-3',
      name: 'Ripe Bananas',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
      tags: ['fruit', 'sweet'],
    },
    {
      id: 'market-4',
      name: 'Fresh Milk',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80',
      tags: ['dairy', 'drink'],
    },
    {
      id: 'market-5',
      name: 'Organic Carrots',
      imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=500&auto=format&fit=crop&q=80',
      tags: ['vegetable'],
    },
    {
      id: 'market-6',
      name: 'Farm Fresh Eggs',
      imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80',
      tags: ['dairy', 'breakfast'],
    },
    {
      id: 'market-7',
      name: 'Green Broccoli',
      imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=500&auto=format&fit=crop&q=80',
      tags: ['vegetable'],
    },
    {
      id: 'market-8',
      name: 'Sweet Oranges',
      imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&auto=format&fit=crop&q=80',
      tags: ['fruit', 'citrus'],
    },
    {
      id: 'market-9',
      name: 'Pure Honey',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80',
      tags: ['sweet', 'pantry'],
    },
  ],

  'name-face-match': [
    {
      id: 'face-1',
      name: 'Aunt Clara',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Clara&backgroundColor=b6e3f4,ffd5dc,d1d4f9',
      tags: ['family', 'avatar'],
    },
    {
      id: 'face-2',
      name: 'Uncle Robert',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Robert&backgroundColor=c0aede,d1d4f9,ffd5dc',
      tags: ['family', 'avatar'],
    },
    {
      id: 'face-3',
      name: 'Grandson Leo',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Leo&backgroundColor=ffdfbf,ffd5dc',
      tags: ['family', 'avatar'],
    },
    {
      id: 'face-4',
      name: 'Dr. Sarah',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&backgroundColor=b6e3f4,c0aede',
      tags: ['friend', 'avatar'],
    },
    {
      id: 'face-5',
      name: 'Neighbor Frank',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Frank&backgroundColor=d1d4f9,ffdfbf',
      tags: ['neighbor', 'avatar'],
    },
    {
      id: 'face-6',
      name: 'Nurse Maya',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Maya&backgroundColor=ffd5dc,b6e3f4',
      tags: ['nurse', 'avatar'],
    },
  ],

  'recipe-recall': [
    {
      id: 'recipe-step-1',
      name: '1. Chop Fresh Vegetables',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      orderIndex: 1,
    },
    {
      id: 'recipe-step-2',
      name: '2. Simmer Soup in Pot',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
      orderIndex: 2,
    },
    {
      id: 'recipe-step-3',
      name: '3. Add Aromatic Spices',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      orderIndex: 3,
    },
    {
      id: 'recipe-step-4',
      name: '4. Garnish with Green Herbs',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
      orderIndex: 4,
    },
    {
      id: 'recipe-step-5',
      name: '5. Serve Warm Delicious Bowl',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80',
      orderIndex: 5,
    },
  ],

  'memory-journey': [
    {
      id: 'journey-1',
      name: 'Tranquil Lotus Temple',
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80',
      orderIndex: 1,
    },
    {
      id: 'journey-2',
      name: 'Vibrant Flower Bazaar',
      imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
      orderIndex: 2,
    },
    {
      id: 'journey-3',
      name: 'Sunny Botanical Park',
      imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format&fit=crop&q=80',
      orderIndex: 3,
    },
    {
      id: 'journey-4',
      name: 'Riverside Wooden Gazebo',
      imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
      orderIndex: 4,
    },
    {
      id: 'journey-5',
      name: 'Sunset Harbor Promenade',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      orderIndex: 5,
    },
  ],

  'complete-the-tune': [
    {
      id: 'tune-1',
      name: 'Classic Vinyl Melody',
      imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      tags: ['jazz', 'instrumental'],
    },
    {
      id: 'tune-2',
      name: 'Peaceful Acoustic Guitar',
      imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80',
      tags: ['folk', 'acoustic'],
    },
    {
      id: 'tune-3',
      name: 'Gentle Grand Piano Sonata',
      imageUrl: 'https://images.unsplash.com/photo-1520523839898-507127053c37?w=600&auto=format&fit=crop&q=80',
      tags: ['classical', 'piano'],
    },
    {
      id: 'tune-4',
      name: 'Golden Era Radio Hits',
      imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
      tags: ['retro', 'nostalgia'],
    },
  ],

  'story-detective': [
    {
      id: 'story-clue-1',
      name: 'Golden Pocket Watch',
      imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
      tags: ['correct_clue'],
    },
    {
      id: 'story-clue-2',
      name: 'Vintage Blue Teapot',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      tags: ['distractor'],
    },
    {
      id: 'story-clue-3',
      name: 'Leatherbound Journal',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      tags: ['distractor'],
    },
    {
      id: 'story-clue-4',
      name: 'Silver Reading Magnifier',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      tags: ['distractor'],
    },
  ],

  'where-did-i-keep-it': [
    {
      id: 'drawer-bg-1',
      name: 'Wooden Nightstand Drawer',
      imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1000&auto=format&fit=crop&q=80',
      tags: ['background'],
    },
    {
      id: 'drawer-item-1',
      name: 'Family Locket',
      imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80',
      xPercent: 42,
      yPercent: 48,
    },
    {
      id: 'drawer-item-2',
      name: 'Silver Pen',
      imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80',
      xPercent: 70,
      yPercent: 35,
    },
    {
      id: 'drawer-item-3',
      name: 'Car Keys',
      imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      xPercent: 25,
      yPercent: 70,
    },
  ],

  'memory-garden': [
    {
      id: 'garden-bg-1',
      name: 'Sunny Green Lawn',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80',
      tags: ['background'],
    },
    {
      id: 'plant-1',
      name: 'Pink Rose Bush',
      imageUrl: 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=400&auto=format&fit=crop&q=80',
      tags: ['flower'],
      xPercent: 20,
      yPercent: 60,
    },
    {
      id: 'plant-2',
      name: 'Bright Sunflower',
      imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&auto=format&fit=crop&q=80',
      tags: ['flower'],
      xPercent: 50,
      yPercent: 50,
    },
    {
      id: 'plant-3',
      name: 'Lavender Sprig',
      imageUrl: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=400&auto=format&fit=crop&q=80',
      tags: ['flower'],
      xPercent: 80,
      yPercent: 65,
    },
    {
      id: 'plant-4',
      name: 'Wooden Birdhouse',
      imageUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=400&auto=format&fit=crop&q=80',
      tags: ['decor'],
      xPercent: 75,
      yPercent: 25,
    },
  ],

  'memory-album': [
    {
      id: 'album-1',
      name: 'Family Garden Picnic',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
      tags: ['seen'],
    },
    {
      id: 'album-2',
      name: 'Golden Retriever Pup',
      imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80',
      tags: ['seen'],
    },
    {
      id: 'album-3',
      name: 'Fresh Baked Apple Pie',
      imageUrl: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600&auto=format&fit=crop&q=80',
      tags: ['seen'],
    },
    {
      id: 'album-4',
      name: 'Vintage Train Station',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      tags: ['unseen'],
    },
    {
      id: 'album-5',
      name: 'Snowy Mountain Lodge',
      imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&auto=format&fit=crop&q=80',
      tags: ['unseen'],
    },
    {
      id: 'album-6',
      name: 'Autumn Oak Tree',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      tags: ['unseen'],
    },
  ],
};

export class ImageService {
  private pexelsApiKey: string = '';
  private pixabayApiKey: string = '';

  constructor(pexelsKey = '', pixabayKey = '') {
    this.pexelsApiKey = pexelsKey || process.env.EXPO_PUBLIC_PEXELS_API_KEY || '';
    this.pixabayApiKey = pixabayKey || process.env.EXPO_PUBLIC_PIXABAY_API_KEY || '';
  }

  // Get curated items for any game with optional difficulty slicing
  getGameAssets(gameKey: GameKey, count?: number): GameImageItem[] {
    const assets = CURATED_ASSET_REGISTRY[gameKey] || [];
    if (!count) return assets;
    return assets.slice(0, count);
  }

  // Generate DiceBear Avatar URL (Free, consistent, no key needed)
  getDiceBearAvatar(seed: string, style: 'avataaars' | 'bottts' | 'adventurer' = 'avataaars'): string {
    return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,ffd5dc,d1d4f9,c0aede`;
  }

  // Generate Pollinations.ai themed illustration URL (Free, no key needed)
  getPollinationsSceneUrl(prompt: string, width = 800, height = 600): string {
    const cleanPrompt = `${prompt}, warm soft lighting, peaceful watercolor illustration, high quality, elder friendly`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true`;
  }

  // Live Pexels Search (with automatic fallback to curated catalog)
  async searchPexels(query: string, perPage = 6): Promise<GameImageItem[]> {
    if (!this.pexelsApiKey) {
      return this.searchCurated(query, perPage);
    }

    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`, {
        headers: { Authorization: this.pexelsApiKey },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos && data.photos.length > 0) {
          return data.photos.map((p: any) => ({
            id: `pexels-${p.id}`,
            name: p.alt || query,
            imageUrl: p.src.medium || p.src.large,
            thumbnailUrl: p.src.small,
            tags: [query],
          }));
        }
      }
    } catch (e) {
      console.warn('Pexels API fetch error, using curated fallback:', e);
    }

    return this.searchCurated(query, perPage);
  }

  // Curated keyword fallback search
  private searchCurated(query: string, limit = 6): GameImageItem[] {
    const all = Object.values(CURATED_ASSET_REGISTRY).flat();
    const q = query.toLowerCase();
    const matched = all.filter(item => 
      item.name.toLowerCase().includes(q) || item.tags?.some(t => t.toLowerCase().includes(q))
    );
    return (matched.length > 0 ? matched : all).slice(0, limit);
  }
}

export const imageService = new ImageService();
