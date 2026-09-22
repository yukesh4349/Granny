import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadPersistedState, persistAuth, clearAuth, persistPreferences } from '../store/appStore';
import { supabaseAuth, databaseService, type MedicalReport, type FamilyContact, type CareNote, type ReminderItem, type CaretakerNotification, type GameVideo } from '../services/supabase';
import { groqService, type GroqKeySlot, type ExtractedMemory, type HealthAlertDetection } from '../services/groqService';
import {
  playMedicineAlertChime, playIncomingCallRingtone, playTempleBellChime, playSuccessChime,
  playSosSiren, stopSosSiren
} from '../utils/audioChime';
import { t } from '../i18n';
import { ALL_GAMES, getGameByKey } from '../features/games/engine/games';
import type { SessionState, DifficultyParams, GameItem } from '../features/games/engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
  phone?: string;
  email?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  emotion?: string;
  timestamp: Date;
  extractedMemory?: ExtractedMemory | null;
  healthAlert?: HealthAlertDetection | null;
}

export type Page =
  | 'landing'
  | 'auth'
  | 'home'
  | 'companion'
  | 'family'
  | 'games'
  | 'play'
  | 'health'
  | 'memory'
  | 'theatre'
  | 'settings'
  | 'dashboard'
  | 'caretaker_alarms'
  | 'caretaker_medical'
  | 'caretaker_memories'
  | 'caretaker_contacts'
  | 'caretaker_guide'
  | 'caretaker_link';

// ─── Context Type ─────────────────────────────────────────────────────────────
interface AppContextType {
  // Core state
  user: User | null;
  token: string | null;
  language: string;
  fontSize: number;
  highContrast: boolean;
  page: Page;
  isCaretaker: boolean;

  // Auth
  authMode: 'login' | 'register';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register'>>;
  authForm: { name: string; phone: string; email: string; password: string; role: string };
  setAuthForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; password: string; role: string }>>;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  isAuthLoading: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleLogout: () => void;
  handleDemoLogin: (role?: 'ELDER' | 'CAREGIVER') => void;
  handleSwitchRole: () => void;

  // Navigation
  navigateTo: (page: Page) => void;

  // Language & Preferences
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  setHighContrast: React.Dispatch<React.SetStateAction<boolean>>;
  toggleLanguage: () => void;
  toggleContrast: () => void;

  // Chat
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isThinking: boolean;
  sendMessage: (text?: string) => void;
  chatBottomRef: React.RefObject<HTMLDivElement>;

  // Games
  currentGameKey: string | null;
  setCurrentGameKey: React.Dispatch<React.SetStateAction<string | null>>;
  gameSession: SessionState | null;
  gamePhase: 'memorize' | 'play' | 'result';
  setGamePhase: React.Dispatch<React.SetStateAction<'memorize' | 'play' | 'result'>>;
  gameTimer: number;
  gameCategoryFilter: 'all' | 'outdoor' | 'indoor' | 'cinema';
  setGameCategoryFilter: React.Dispatch<React.SetStateAction<'all' | 'outdoor' | 'indoor' | 'cinema'>>;
  isGeneratingGame: boolean;
  gameVideos: GameVideo[];
  currentGameVideo: GameVideo | null;
  memorizeDuration: number;
  setMemorizeDuration: React.Dispatch<React.SetStateAction<number>>;
  gameDailyLimitMinutes: number;
  setGameDailyLimitMinutes: React.Dispatch<React.SetStateAction<number>>;
  gameTodayMinutes: number;
  gameTimeLimitReached: boolean;
  startGame: (gameKey: string) => void;
  handleGameAnswer: (answer: string) => void;
  finishGame: () => void;

  // Theatre
  theatreStep: number;
  setTheatreStep: React.Dispatch<React.SetStateAction<number>>;
  theatreFeedback: string | null;
  setTheatreFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  activeMicroDose: { title: string; prompt: string; task: string } | null;
  setActiveMicroDose: React.Dispatch<React.SetStateAction<{ title: string; prompt: string; task: string } | null>>;

  // Voice
  isListening: boolean;
  toggleListening: () => void;
  ttsEnabled: boolean;
  setTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;

  // SOS
  sosActive: boolean;
  handleSOS: () => void;

  // Ecosystem Data
  elderLinkCode: string;
  codeCopied: boolean;
  handleCopyLinkCode: () => void;
  linkedElder: { id: string; name: string };
  linkInputCode: string;
  setLinkInputCode: React.Dispatch<React.SetStateAction<string>>;
  linkFeedback: string;
  handleLinkElderAccount: () => void;
  medicalReports: MedicalReport[];
  setMedicalReports: React.Dispatch<React.SetStateAction<MedicalReport[]>>;
  familyContacts: FamilyContact[];
  setFamilyContacts: React.Dispatch<React.SetStateAction<FamilyContact[]>>;
  careNotes: CareNote | null;
  setCareNotes: React.Dispatch<React.SetStateAction<CareNote | null>>;
  reminders: ReminderItem[];
  setReminders: React.Dispatch<React.SetStateAction<ReminderItem[]>>;
  memoriesList: any[];
  setMemoriesList: React.Dispatch<React.SetStateAction<any[]>>;
  caretakerNotifications: CaretakerNotification[];
  activeHealthAlertBanner: CaretakerNotification | null;
  setActiveHealthAlertBanner: React.Dispatch<React.SetStateAction<CaretakerNotification | null>>;
  activeMemoryTab: 'all' | 'photos' | 'videos';
  setActiveMemoryTab: React.Dispatch<React.SetStateAction<'all' | 'photos' | 'videos'>>;

  // Caretaker Form Modals
  showAlarmModal: boolean;
  setShowAlarmModal: React.Dispatch<React.SetStateAction<boolean>>;
  newAlarm: { title: string; time_of_day: string; type: string; description: string };
  setNewAlarm: React.Dispatch<React.SetStateAction<{ title: string; time_of_day: string; type: string; description: string }>>;
  showReportModal: boolean;
  setShowReportModal: React.Dispatch<React.SetStateAction<boolean>>;
  newReport: { title: string; doctor_name: string; report_date: string; category: string; summary: string; notes: string };
  setNewReport: React.Dispatch<React.SetStateAction<{ title: string; doctor_name: string; report_date: string; category: string; summary: string; notes: string }>>;
  showContactModal: boolean;
  setShowContactModal: React.Dispatch<React.SetStateAction<boolean>>;
  newContact: { name: string; relationship: string; phone: string; avatar_emoji: string; is_emergency_contact: boolean };
  setNewContact: React.Dispatch<React.SetStateAction<{ name: string; relationship: string; phone: string; avatar_emoji: string; is_emergency_contact: boolean }>>;
  showMemoryModal: boolean;
  setShowMemoryModal: React.Dispatch<React.SetStateAction<boolean>>;
  newMemory: { title: string; content: string; image_url: string; tags: string };
  setNewMemory: React.Dispatch<React.SetStateAction<{ title: string; content: string; image_url: string; tags: string }>>;
  handleCreateReport: () => void;
  handleCreateAlarm: () => void;
  handleCreateContact: () => void;
  handleCreateMemory: () => void;
  handleToggleReminder: (id: string) => void;

  // Activity
  activityLog: { page: string; start: number; durationMs?: number }[];

  // Audio test
  activeMedicationAlert: { id: string; title: string; time: string; description?: string; type?: string } | null;
  setActiveMedicationAlert: React.Dispatch<React.SetStateAction<{ id: string; title: string; time: string; description?: string; type?: string } | null>>;
  activeIncomingCall: { name: string; relationship: string; avatar: string; phone: string } | null;
  setActiveIncomingCall: React.Dispatch<React.SetStateAction<{ name: string; relationship: string; avatar: string; phone: string } | null>>;
  triggerTestMedicineAlarm: () => void;
  triggerTestFamilyCall: (contact?: FamilyContact) => void;

  // Groq
  groqKeySlots: GroqKeySlot[];
  groqKeyInputs: string[];
  setGroqKeyInputs: React.Dispatch<React.SetStateAction<string[]>>;
  groqTestingSlot: number | null;
  groqFeedback: string | null;
  showGroqKeys: boolean[];
  setShowGroqKeys: React.Dispatch<React.SetStateAction<boolean[]>>;
  handleSaveGroqKeys: () => void;
  handleTestGroqKey: (slotIdx: number) => void;

  // Data refresh helper
  refreshElderData: (elderId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  // ─── Core State ───────────────────────────────────────────────────────────
  const [page, setPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState('en');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null!);

  // Game state
  const [currentGameKey, setCurrentGameKey] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<SessionState | null>(null);
  const [gamePhase, setGamePhase] = useState<'memorize' | 'play' | 'result'>('memorize');
  const [gameTimer, setGameTimer] = useState(0);
  const [memorizeDuration, setMemorizeDuration] = useState<number>(15);
  const [gameCategoryFilter, setGameCategoryFilter] = useState<'all' | 'outdoor' | 'indoor' | 'cinema'>('all');
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [gameVideos, setGameVideos] = useState<GameVideo[]>([]);
  const [currentGameVideo, setCurrentGameVideo] = useState<GameVideo | null>(null);
  const [activeMemoryTab, setActiveMemoryTab] = useState<'all' | 'photos' | 'videos'>('all');

  // Theatre
  const [theatreStep, setTheatreStep] = useState(0);
  const [theatreFeedback, setTheatreFeedback] = useState<string | null>(null);
  const [activeMicroDose, setActiveMicroDose] = useState<{ title: string; prompt: string; task: string } | null>(null);

  // Listening
  const [isListening, setIsListening] = useState(false);

  // Auth form
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '', role: 'ELDER' });
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Audio alerts
  const [activeMedicationAlert, setActiveMedicationAlert] = useState<{
    id: string; title: string; time: string; description?: string; type?: string;
  } | null>(null);
  const [activeIncomingCall, setActiveIncomingCall] = useState<{
    name: string; relationship: string; avatar: string; phone: string;
  } | null>(null);

  // Groq keys
  const [groqKeySlots, setGroqKeySlots] = useState<GroqKeySlot[]>([]);
  const [groqKeyInputs, setGroqKeyInputs] = useState<string[]>([
    import.meta.env.VITE_GROQ_API_KEY_1 || '',
    import.meta.env.VITE_GROQ_API_KEY_2 || '',
    import.meta.env.VITE_GROQ_API_KEY_3 || '',
    import.meta.env.VITE_GROQ_API_KEY_4 || '',
  ]);
  const [groqTestingSlot, setGroqTestingSlot] = useState<number | null>(null);
  const [groqFeedback, setGroqFeedback] = useState<string | null>(null);
  const [showGroqKeys, setShowGroqKeys] = useState<boolean[]>([false, false, false, false]);

  // SOS
  const [sosActive, setSosActive] = useState(false);
  const sosBroadcastRef = useRef<BroadcastChannel | null>(null);

  // Activity
  const [activityLog, setActivityLog] = useState<{ page: string; start: number; durationMs?: number }[]>([]);
  const activityStartRef = useRef<number>(Date.now());

  // Game time limit
  const [gameDailyLimitMinutes, setGameDailyLimitMinutes] = useState<number>(0);
  const [gameTodayMinutes, setGameTodayMinutes] = useState<number>(0);
  const [gameTimeLimitReached, setGameTimeLimitReached] = useState(false);
  const gameSessionStartRef = useRef<number | null>(null);

  // TTS
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Ecosystem data
  const [elderLinkCode, setElderLinkCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkedElder, setLinkedElder] = useState<{ id: string; name: string }>({
    id: 'demo_elder',
    name: 'Lakshmi Amma & Ramanathan Thatha',
  });
  const [linkInputCode, setLinkInputCode] = useState('');
  const [linkFeedback, setLinkFeedback] = useState('');

  // Data collections
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>([]);
  const [careNotes, setCareNotes] = useState<CareNote | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [memoriesList, setMemoriesList] = useState<any[]>([]);
  const [caretakerNotifications, setCaretakerNotifications] = useState<CaretakerNotification[]>([]);
  const [activeHealthAlertBanner, setActiveHealthAlertBanner] = useState<CaretakerNotification | null>(null);

  // Caretaker form modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '', doctor_name: '', report_date: new Date().toISOString().split('T')[0],
    category: 'Prescription' as any, summary: '', notes: ''
  });
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [newAlarm, setNewAlarm] = useState({
    title: '', time_of_day: '08:00 AM', type: 'MEDICATION' as any, description: ''
  });
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '', relationship: 'Son', phone: '', avatar_emoji: '👨‍💼', is_emergency_contact: false
  });
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    title: '', content: '', image_url: '', tags: 'Family, Wedding'
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [isNotFound, setIsNotFound] = useState(false);

  const isCaretaker = user?.role === 'CAREGIVER';

  // ─── Route Management ───────────────────────────────────────────────────────
  const ELDER_PAGES: Page[] = ['home', 'companion', 'family', 'games', 'play', 'health', 'memory', 'theatre', 'settings'];
  const CAREGIVER_PAGES: Page[] = ['dashboard', 'caretaker_alarms', 'caretaker_medical', 'caretaker_memories', 'caretaker_contacts', 'caretaker_guide', 'caretaker_link', 'settings'];

  const pageToPathMap: Record<Page, string> = {
    landing: '/',
    auth: '/login',
    home: '/home',
    companion: '/companion',
    family: '/family',
    games: '/games',
    play: '/games/play',
    health: '/health',
    memory: '/memory',
    theatre: '/theatre',
    settings: '/settings',
    dashboard: '/dashboard',
    caretaker_alarms: '/caretaker/alarms',
    caretaker_medical: '/caretaker/medical',
    caretaker_memories: '/caretaker/memories',
    caretaker_contacts: '/caretaker/contacts',
    caretaker_guide: '/caretaker/guide',
    caretaker_link: '/caretaker/link',
  };

  const pathToPageMap: Record<string, Page> = {
    '/': 'landing',
    '/login': 'auth',
    '/register': 'auth',
    '/auth': 'auth',
    '/home': 'home',
    '/companion': 'companion',
    '/family': 'family',
    '/games': 'games',
    '/games/play': 'play',
    '/health': 'health',
    '/memory': 'memory',
    '/theatre': 'theatre',
    '/settings': 'settings',
    '/dashboard': 'dashboard',
    '/caretaker/alarms': 'caretaker_alarms',
    '/caretaker/medical': 'caretaker_medical',
    '/caretaker/memories': 'caretaker_memories',
    '/caretaker/contacts': 'caretaker_contacts',
    '/caretaker/guide': 'caretaker_guide',
    '/caretaker/link': 'caretaker_link',
  };

  const navigateTo = useCallback((newPage: Page) => {
    let target = newPage;
    if (user?.role === 'CAREGIVER' && !CAREGIVER_PAGES.includes(target) && target !== 'landing' && target !== 'auth') {
      target = 'dashboard';
    } else if (user?.role === 'ELDER' && !ELDER_PAGES.includes(target) && target !== 'landing' && target !== 'auth') {
      target = 'home';
    }
    setPage(target);
    setIsNotFound(false);
    const targetPath = pageToPathMap[target] || '/';
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, location.pathname, navigate]);

  // Synchronize route on location change
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/games/') && path !== '/games/play') {
      const key = path.replace('/games/', '');
      if (key) {
        setCurrentGameKey(key);
        setPage('play');
        setIsNotFound(false);
        return;
      }
    }

    const matchedPage = pathToPageMap[path];
    if (matchedPage) {
      if (path === '/register') {
        setAuthMode('register');
      } else if (path === '/login') {
        setAuthMode('login');
      }
      setPage(matchedPage);
      setIsNotFound(false);
    } else {
      setIsNotFound(true);
    }
  }, [location.pathname]);

  // ─── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.auth?.isAuthenticated && persisted.auth.user && persisted.auth.token) {
      const u = persisted.auth.user as User;
      setUser(u);
      setToken(persisted.auth.token);

      if (u.role === 'CAREGIVER') {
        const savedLinked = localStorage.getItem(`granny_active_linked_elder_${u.id}`);
        if (savedLinked) {
          try {
            setLinkedElder(JSON.parse(savedLinked));
          } catch {}
        } else {
          const linksKey = `caregiver_links_${u.id}`;
          const links = JSON.parse(localStorage.getItem(linksKey) || '[]');
          if (links.length > 0 && links[0].elderId) {
            setLinkedElder({ id: links[0].elderId, name: links[0].elderName || 'Connected Elder' });
          }
        }
      }
    }
    if (persisted.fontSize) setFontSize(persisted.fontSize);
    if (persisted.highContrast) setHighContrast(persisted.highContrast);
    if (persisted.language) setLanguage(persisted.language);

    const slots = groqService.getKeySlots();
    setGroqKeySlots(slots);
    const envKeys = [
      import.meta.env.VITE_GROQ_API_KEY_1 || '',
      import.meta.env.VITE_GROQ_API_KEY_2 || '',
      import.meta.env.VITE_GROQ_API_KEY_3 || '',
      import.meta.env.VITE_GROQ_API_KEY_4 || '',
    ];
    const mergedKeys = slots.map((s, i) => s.key || envKeys[i] || '');
    setGroqKeyInputs(mergedKeys);
    if (envKeys.some(k => k)) groqService.saveKeys(envKeys);

    const storedLimit = localStorage.getItem('granny_game_daily_limit_minutes');
    if (storedLimit) setGameDailyLimitMinutes(parseInt(storedLimit, 10));
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`granny_game_today_minutes_${today}`);
    if (stored) setGameTodayMinutes(parseFloat(stored));

    databaseService.getGameVideos().then(setGameVideos);
  }, []);

  // ─── Data Refresh Helper ────────────────────────────────────────────────────
  const refreshElderData = useCallback((elderId: string) => {
    if (!elderId) return;
    databaseService.getOrGenerateLinkCode(elderId).then(setElderLinkCode);
    databaseService.getMedicalReports(elderId).then(setMedicalReports);
    databaseService.getFamilyContacts(elderId).then(setFamilyContacts);
    databaseService.getCareNotes(elderId).then(setCareNotes);
    databaseService.getReminders(elderId).then(setReminders);
    databaseService.getMemories(elderId).then(setMemoriesList);
    databaseService.getCaretakerNotifications(elderId).then(setCaretakerNotifications);
  }, []);

  // ─── Load Ecosystem Data & Real-Time Sync (BroadcastChannel + Storage Events) ──
  useEffect(() => {
    if (!user) return;
    const targetElderId = user.role === 'ELDER' ? user.id : linkedElder.id;
    refreshElderData(targetElderId);

    const handleSync = () => {
      refreshElderData(targetElderId);
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('granny_data_sync');
      bc.onmessage = (event) => {
        if (!event.data?.elderId || event.data.elderId === targetElderId) {
          refreshElderData(targetElderId);
        }
      };
    } catch {}

    window.addEventListener('granny_data_sync', handleSync);
    window.addEventListener('storage', handleSync);

    const syncInterval = setInterval(() => {
      refreshElderData(targetElderId);
    }, 10000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('granny_data_sync', handleSync);
      window.removeEventListener('storage', handleSync);
      clearInterval(syncInterval);
    };
  }, [user, linkedElder.id, refreshElderData]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (page === 'companion' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, page]);

  // ─── Background Medicine Clock & Alarm Chime ──────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'ELDER') return;
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const isPM = currentHours >= 12;
      const formattedHours = ((currentHours + 11) % 12 + 1).toString().padStart(2, '0');
      const formattedMinutes = currentMinutes.toString().padStart(2, '0');
      const currentTimeString = `${formattedHours}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
      const matched = reminders.find(r => r.is_active && !r.confirmed && r.time_of_day.trim().toUpperCase() === currentTimeString);
      if (matched && !activeMedicationAlert) {
        setActiveMedicationAlert({
          id: matched.id,
          title: matched.title,
          time: matched.time_of_day,
          description: matched.description || (matched.type === 'MEDICATION' ? 'Please take your scheduled medicine with warm water.' : 'Gentle daily reminder.'),
          type: matched.type,
        });
        playMedicineAlertChime();
      }
    }, 15000);
    return () => clearInterval(checkInterval);
  }, [user, reminders, activeMedicationAlert]);

  // ─── SOS BroadcastChannel ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const elderId = user.role === 'ELDER' ? user.id : linkedElder.id;
    const channelName = `granny_sos_${elderId}`;
    const bc = new BroadcastChannel(channelName);
    sosBroadcastRef.current = bc;
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'SOS_ACTIVATE') {
        setSosActive(true);
        playSosSiren();
      } else if (ev.data?.type === 'SOS_STOP') {
        setSosActive(false);
        stopSosSiren();
      }
    };
    return () => { bc.close(); sosBroadcastRef.current = null; };
  }, [user, linkedElder.id]);

  // ─── Activity Tracker ─────────────────────────────────────────────────────
  useEffect(() => {
    activityStartRef.current = Date.now();
    return () => {
      const duration = Date.now() - activityStartRef.current;
      if (duration > 2000) {
        setActivityLog(prev => [
          { page, start: activityStartRef.current, durationMs: duration },
          ...prev.slice(0, 99),
        ]);
        if (page === 'play') {
          const minutes = duration / 60000;
          setGameTodayMinutes(prev => {
            const newVal = prev + minutes;
            const today = new Date().toDateString();
            localStorage.setItem(`granny_game_today_minutes_${today}`, String(newVal));
            return newVal;
          });
        }
      }
    };
  }, [page]);

  // ─── Game Time Limit ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gameDailyLimitMinutes > 0 && gameTodayMinutes >= gameDailyLimitMinutes) {
      setGameTimeLimitReached(true);
    } else {
      setGameTimeLimitReached(false);
    }
  }, [gameDailyLimitMinutes, gameTodayMinutes]);

  // ─── Auth Handlers ────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const inputIdentifier = (authForm.email || authForm.phone || authForm.name || '').trim();

    if (authMode === 'register') {
      if (!authForm.name.trim()) {
        setAuthError(language === 'ta' ? 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்' : 'Please enter your name or username');
        return;
      }
      if (!inputIdentifier) {
        setAuthError(language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter email, phone or username');
        return;
      }
      if (!authForm.password || authForm.password.length < 4) {
        setAuthError(language === 'ta' ? 'கடவுச்சொல் குறைந்தது 4 எழுத்துகள் இருக்க வேண்டும்' : 'Password must be at least 4 characters');
        return;
      }
    } else {
      if (!inputIdentifier) {
        setAuthError(language === 'ta' ? 'பயனர் பெயர், மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter your username, email or phone number');
        return;
      }
      if (!authForm.password) {
        setAuthError(language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your password');
        return;
      }
    }

    setIsAuthLoading(true);
    try {
      let result;
      if (authMode === 'register') {
        const cleanName = authForm.name.trim();
        const cleanUser = cleanName.toLowerCase().replace(/\s+/g, '');
        const emailToUse = authForm.email.trim() || (authForm.phone.trim() ? `${authForm.phone.replace(/[^0-9]/g, '')}@granny.app` : `${cleanUser}@granny.app`);
        result = await supabaseAuth.signUp({
          name: cleanName,
          email: emailToUse,
          phone: authForm.phone.trim() || undefined,
          password: authForm.password,
          role: authForm.role as 'ELDER' | 'CAREGIVER',
          language,
        });
      } else {
        result = await supabaseAuth.signIn({
          email: inputIdentifier.includes('@') ? inputIdentifier : undefined,
          phone: !inputIdentifier.includes('@') && /^\+?[0-9\s-]{7,15}$/.test(inputIdentifier) ? inputIdentifier : undefined,
          username: inputIdentifier,
          password: authForm.password,
        });
      }

      if (result && result.user) {
        setUser(result.user);
        setToken(result.accessToken);
        persistAuth(result.user, result.accessToken);
        navigateTo(result.user.role === 'CAREGIVER' ? 'dashboard' : 'home');
      }
    } catch (err: any) {
      setAuthError(err.message || (language === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. விவரங்களை சரிபார்க்கவும்.' : 'Login failed. Please check your details or password.'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    supabaseAuth.signOut(token || undefined).catch(() => {});
    setUser(null);
    setToken(null);
    clearAuth();
    navigateTo('landing');
    setMessages([]);
    setConversationId(null);
  };

  const handleDemoLogin = (demoRole: 'ELDER' | 'CAREGIVER' = 'ELDER') => {
    const demoUser: User = {
      id: demoRole === 'ELDER' ? 'demo_elder' : 'demo_caregiver',
      name: demoRole === 'ELDER'
        ? (language === 'ta' ? 'லட்சுமி அம்மா & ராமநாதன் தாத்தா' : 'Lakshmi Amma & Ramanathan Thatha')
        : (language === 'ta' ? 'அருண் (மகன் & பராமரிப்பாளர்)' : 'Arun (Son & Caregiver)'),
      role: demoRole,
      language: language,
    };
    setUser(demoUser);
    setToken('demo_token');
    persistAuth(demoUser, 'demo_token');
    navigateTo(demoRole === 'CAREGIVER' ? 'dashboard' : 'home');
  };

  const handleSwitchRole = () => {
    if (!user) return;
    const newRole = user.role === 'ELDER' ? 'CAREGIVER' : 'ELDER';
    const newId = newRole === 'ELDER'
      ? (linkedElder.id || 'demo_elder')
      : (user.id === 'demo_elder' ? 'demo_caregiver' : user.id);
    const updatedUser: User = {
      ...user,
      id: newId,
      role: newRole,
      name: newRole === 'CAREGIVER'
        ? (language === 'ta' ? 'அருண் (மகன் & பராமரிப்பாளர்)' : 'Arun (Son & Caregiver)')
        : (language === 'ta' ? 'லட்சுமி அம்மா & ராமநாதன் தாத்தா' : 'Lakshmi Amma & Ramanathan Thatha'),
    };
    setUser(updatedUser);
    persistAuth(updatedUser, token || 'demo_token');
    navigateTo(newRole === 'CAREGIVER' ? 'dashboard' : 'home');
  };

  // ─── Language & Preferences ───────────────────────────────────────────────
  const toggleLanguage = useCallback(() => {
    const next = language === 'ta' ? 'en' : 'ta';
    setLanguage(next);
    persistPreferences({ language: next });
  }, [language]);

  const toggleContrast = useCallback(() => {
    const next = !highContrast;
    setHighContrast(next);
    persistPreferences({ highContrast: next });
  }, [highContrast]);

  // ─── Caretaker Actions ───────────────────────────────────────────────────
  const handleLinkElderAccount = async () => {
    if (!linkInputCode.trim()) {
      setLinkFeedback(language === 'ta' ? 'தயவுசெய்து குறியீட்டை உள்ளிடவும்' : 'Please enter the link code first.');
      return;
    }
    setLinkFeedback(language === 'ta' ? 'இணைக்கிறோம்...' : 'Connecting...');
    try {
      const caregiverId = user?.id || 'demo_caregiver';
      const res = await databaseService.linkCaregiverToElder(caregiverId, linkInputCode);
      const newLinked = { id: res.elderId, name: res.elderName };
      setLinkedElder(newLinked);
      localStorage.setItem(`granny_active_linked_elder_${caregiverId}`, JSON.stringify(newLinked));
      setLinkFeedback(language === 'ta' ? `✅ வெற்றிகரமாக இணைக்கப்பட்டது: ${res.elderName}` : `✅ Successfully linked to: ${res.elderName}`);
      setLinkInputCode('');
      refreshElderData(res.elderId);
    } catch (err: any) {
      setLinkFeedback(`❌ ${err.message || 'Linking failed. Please check the code and try again.'}`);
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.title) return;
    const added = await databaseService.addMedicalReport({
      elder_id: linkedElder.id,
      ...newReport,
    });
    setMedicalReports(prev => [added, ...prev]);
    setShowReportModal(false);
    setNewReport({ title: '', doctor_name: '', report_date: new Date().toISOString().split('T')[0], category: 'Prescription', summary: '', notes: '' });
  };

  const handleCreateAlarm = async () => {
    if (!newAlarm.title) return;
    const added = await databaseService.addReminder({
      elder_id: linkedElder.id,
      title: newAlarm.title,
      time_of_day: newAlarm.time_of_day,
      type: newAlarm.type,
      description: newAlarm.description,
      is_active: true,
      confirmed: false,
    });
    setReminders(prev => [...prev, added]);
    setShowAlarmModal(false);
    setNewAlarm({ title: '', time_of_day: '08:00 AM', type: 'MEDICATION', description: '' });
  };

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.phone) return;
    const added = await databaseService.addFamilyContact({
      elder_id: linkedElder.id,
      ...newContact,
    });
    setFamilyContacts(prev => [...prev, added]);
    setShowContactModal(false);
    setNewContact({ name: '', relationship: 'Son', phone: '', avatar_emoji: '👨‍💼', is_emergency_contact: false });
  };

  const handleCreateMemory = async () => {
    if (!newMemory.title) return;
    const added = await databaseService.addMemory(linkedElder.id, {
      title: newMemory.title,
      content: newMemory.content,
      image_url: newMemory.image_url || undefined,
      tags: newMemory.tags.split(',').map(s => s.trim()),
      uploaded_by: user?.name || 'Caregiver',
    });
    setMemoriesList(prev => [added, ...prev]);
    setShowMemoryModal(false);
    setNewMemory({ title: '', content: '', image_url: '', tags: 'Family, Wedding' });
  };

  const handleToggleReminder = async (remId: string) => {
    const targetElderId = user?.role === 'ELDER' ? user.id : linkedElder.id;
    const updated = await databaseService.toggleReminder(targetElderId, remId);
    setReminders(updated);
  };

  const handleCopyLinkCode = () => {
    navigator.clipboard.writeText(elderLinkCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 3000);
  };

  // ─── Groq Keys ───────────────────────────────────────────────────────────
  const handleSaveGroqKeys = () => {
    groqService.saveKeys(groqKeyInputs);
    const slots = groqService.getKeySlots();
    setGroqKeySlots(slots);
    setGroqFeedback(language === 'ta' ? '✅ 4 Groq API சாவிகள் வெற்றிகரமாகச் சேமிக்கப்பட்டன!' : '✅ 4 Groq API keys successfully saved to pool!');
    setTimeout(() => setGroqFeedback(null), 4000);
  };

  const handleTestGroqKey = async (slotIdx: number) => {
    setGroqTestingSlot(slotIdx);
    setGroqFeedback(null);
    const keyToTest = groqKeyInputs[slotIdx];
    const res = await groqService.testKey(keyToTest);
    setGroqTestingSlot(null);
    if (res.success) {
      setGroqFeedback(`✅ Slot #${slotIdx + 1}: ${res.message}`);
    } else {
      setGroqFeedback(`❌ Slot #${slotIdx + 1} Error: ${res.message}`);
    }
  };

  // ─── Chat Handler ─────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msgText = text || chatInput;
    if (!msgText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    try {
      const elderProfile = {
        name: user?.name || 'Elderly Loved One',
        language,
        healthNotes: careNotes?.condition_details,
        caregiverEmail: user?.email || 'caregiver@granny.app',
      };
      const historyFormatted = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        text: m.text,
      }));
      const result = await groqService.analyzeElderMessage(msgText, elderProfile, historyFormatted);

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        sender: 'assistant',
        text: result.reply,
        timestamp: new Date(),
        extractedMemory: result.extractedMemory,
        healthAlert: result.healthAlert,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (ttsEnabled && user?.role === 'ELDER' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(result.reply);
          utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
          utterance.rate = 0.85;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;
          ttsRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        } catch {}
      }

      if (result.extractedMemory) {
        await databaseService.saveElderPersonalFact(user?.id || 'demo_elder', {
          title: result.extractedMemory.title,
          content: result.extractedMemory.content,
          tags: result.extractedMemory.tags,
          category: result.extractedMemory.category,
        });
        databaseService.getMemories(user?.id || 'demo_elder').then(setMemoriesList);
      }

      if (result.healthAlert && result.healthAlert.isHealthConcern) {
        const notif = await databaseService.addCaretakerNotification(user?.id || 'demo_elder', {
          elder_id: user?.id || 'demo_elder',
          elder_name: user?.name || 'Lakshmi Amma',
          type: 'HEALTH_ALERT',
          severity: result.healthAlert.severity,
          title: `${result.healthAlert.severity} Health Concern Detected`,
          message: result.healthAlert.symptom,
          transcript_excerpt: result.healthAlert.transcriptExcerpt,
          recommendation: result.healthAlert.recommendation,
          email_sent: true,
          recipient_email: 'caregiver@granny.app',
          is_read: false,
        });
        setActiveHealthAlertBanner(notif);
        databaseService.getCaretakerNotifications(user?.id || 'demo_elder').then(setCaretakerNotifications);
      }
    } catch (e) {
      console.warn('Chat analysis error:', e);
      const fallbackMsg: ChatMessage = {
        id: `msg_${Date.now()}_fb`,
        sender: 'assistant',
        text: language === 'ta'
          ? "வணக்கம் தாத்தா & பாட்டி, நான் உங்களுடன் அன்பாகப் பேச எப்போதும் தயாராக இருக்கிறேன். உங்கள் உடல் நலம் எப்படி இருக்கிறது?"
          : "Hello dear Grandpa & Grandma, I'm right here with you. How are you feeling today?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
    setIsThinking(false);
  };

  // ─── SOS Handler ──────────────────────────────────────────────────────────
  const handleSOS = () => {
    const elderId = user?.role === 'ELDER' ? user.id : linkedElder.id;
    const channelName = `granny_sos_${elderId}`;
    if (!sosActive) {
      setSosActive(true);
      playSosSiren();
      try {
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({ type: 'SOS_ACTIVATE', elderId, triggeredBy: user?.name });
        bc.close();
      } catch {}
      databaseService.addCaretakerNotification(elderId, {
        elder_id: elderId,
        elder_name: user?.name || 'Elder',
        type: 'DISTRESS',
        severity: 'URGENT',
        title: '🚨 EMERGENCY SOS ACTIVATED',
        message: `SOS emergency button pressed by ${user?.name || 'Elder'} at ${new Date().toLocaleTimeString()}.`,
        transcript_excerpt: '',
        recommendation: 'Call the elder immediately and check on them.',
        email_sent: true,
        recipient_email: 'caregiver@granny.app',
        is_read: false,
      }).then(notif => {
        setActiveHealthAlertBanner(notif);
        databaseService.getCaretakerNotifications(elderId).then(setCaretakerNotifications);
      }).catch(() => {});
    } else {
      setSosActive(false);
      stopSosSiren();
      try {
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({ type: 'SOS_STOP', elderId });
        bc.close();
      } catch {}
    }
  };

  // ─── Game Engine ──────────────────────────────────────────────────────────
  const startGame = async (gameKey: string) => {
    if (gameDailyLimitMinutes > 0 && gameTodayMinutes >= gameDailyLimitMinutes) {
      setGameTimeLimitReached(true);
      return;
    }
    const game = getGameByKey(gameKey);
    if (!game) return;
    gameSessionStartRef.current = Date.now();
    setIsGeneratingGame(true);
    setCurrentGameKey(gameKey);
    databaseService.getGameVideoByKey(gameKey).then(v => {
      setCurrentGameVideo(v || null);
    });
    navigateTo('play');

    try {
      const elderProfile = {
        name: user?.name || 'Grandpa & Grandma',
        language,
        memories: memoriesList,
        notes: careNotes?.condition_details,
      };
      const dynamicItems = await groqService.generateDynamicGameItems(gameKey, game.title, elderProfile, 4);
      const delay = memorizeDuration || 15;
      const difficulty: DifficultyParams = {
        difficulty: 3, itemCount: dynamicItems.length, delaySeconds: delay, distractorCount: 3,
      };
      const session: SessionState = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId: user?.id || 'guest',
        gameKey,
        difficulty,
        currentItemIndex: 0,
        items: dynamicItems,
        startedAt: new Date(),
        attempts: [],
      };
      setGameSession(session);
      setGamePhase('memorize');
      setGameTimer(delay);

      const interval = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGamePhase('play');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      console.warn('Game launch fallback:', e);
      const delay = memorizeDuration || 15;
      const session = game.startSession(user?.id || 'guest', { difficulty: 3, itemCount: 4, delaySeconds: delay, distractorCount: 3 });
      setGameSession(session);
      setGamePhase('memorize');
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const handleGameAnswer = (answer: string) => {
    if (!gameSession || !currentGameKey) return;
    const currentItem = gameSession.items[gameSession.currentItemIndex];
    if (!currentItem) return;
    const isCorrect = answer.trim().toLowerCase() === (currentItem.correctAnswer as string).trim().toLowerCase();
    if (isCorrect) playSuccessChime();

    gameSession.attempts.push({
      itemIndex: gameSession.currentItemIndex,
      correct: isCorrect,
      latencyMs: 0,
      response: answer,
    });
    gameSession.currentItemIndex++;
    setGameSession({ ...gameSession });

    if (gameSession.currentItemIndex >= gameSession.items.length) {
      setGamePhase('result');
    }
  };

  const finishGame = () => {
    if (gameSessionStartRef.current) {
      const sessionMinutes = (Date.now() - gameSessionStartRef.current) / 60000;
      setGameTodayMinutes(prev => {
        const newVal = prev + sessionMinutes;
        const today = new Date().toDateString();
        localStorage.setItem(`granny_game_today_minutes_${today}`, String(newVal));
        return newVal;
      });
      gameSessionStartRef.current = null;
    }
    setGameSession(null);
    setCurrentGameKey(null);
    setGamePhase('memorize');
    navigateTo('games');
  };

  // ─── Voice Recognition ────────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ta' ? 'உங்கள் உலாவி குரல் உள்ளீட்டை ஆதரிக்கவில்லை.' : 'Speech recognition is not supported in this browser. Please type your message.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (page !== 'companion') navigateTo('companion');
          sendMessage(transcript);
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, language, page, navigateTo]);

  // ─── Test Triggers ────────────────────────────────────────────────────────
  const triggerTestMedicineAlarm = () => {
    setActiveMedicationAlert({
      id: 'test_alarm_1',
      title: 'Morning Blood Pressure Medicine (Telmisartan 40mg)',
      time: '08:00 AM',
      description: 'Take 1 tablet with warm water after light idli/dosa breakfast.',
      type: 'MEDICATION',
    });
    playMedicineAlertChime();
  };

  const triggerTestFamilyCall = (contact?: FamilyContact) => {
    const c = contact || (familyContacts[0] || {
      name: 'Arun (Son & Caregiver)',
      relationship: 'Son',
      avatar_emoji: '👨‍💼',
      phone: '+91 98401 23456',
    });
    setActiveIncomingCall({
      name: c.name,
      relationship: c.relationship,
      avatar: c.avatar_emoji || '👨‍💼',
      phone: c.phone,
    });
    playIncomingCallRingtone();
  };

  // ─── Context Value ────────────────────────────────────────────────────────
  const value: AppContextType = {
    user, token, language, fontSize, highContrast, page, isCaretaker: isCaretaker || false,
    authMode, setAuthMode, authForm, setAuthForm, authError, setAuthError, isAuthLoading, showPassword, setShowPassword,
    handleAuthSubmit, handleLogout, handleDemoLogin, handleSwitchRole,
    navigateTo, setLanguage, setFontSize, setHighContrast, toggleLanguage, toggleContrast,
    messages, chatInput, setChatInput, isThinking, sendMessage, chatBottomRef,
    currentGameKey, setCurrentGameKey, gameSession, gamePhase, setGamePhase, gameTimer,
    gameCategoryFilter, setGameCategoryFilter, isGeneratingGame, gameVideos, currentGameVideo,
    memorizeDuration, setMemorizeDuration, gameDailyLimitMinutes, setGameDailyLimitMinutes,
    gameTodayMinutes, gameTimeLimitReached, startGame, handleGameAnswer, finishGame,
    theatreStep, setTheatreStep, theatreFeedback, setTheatreFeedback, activeMicroDose, setActiveMicroDose,
    isListening, toggleListening, ttsEnabled, setTtsEnabled,
    sosActive, handleSOS,
    elderLinkCode, codeCopied, handleCopyLinkCode, linkedElder, linkInputCode, setLinkInputCode, linkFeedback, handleLinkElderAccount,
    medicalReports, setMedicalReports, familyContacts, setFamilyContacts, careNotes, setCareNotes,
    reminders, setReminders, memoriesList, setMemoriesList, caretakerNotifications,
    activeHealthAlertBanner, setActiveHealthAlertBanner, activeMemoryTab, setActiveMemoryTab,
    showAlarmModal, setShowAlarmModal, newAlarm, setNewAlarm,
    showReportModal, setShowReportModal, newReport, setNewReport,
    showContactModal, setShowContactModal, newContact, setNewContact,
    showMemoryModal, setShowMemoryModal, newMemory, setNewMemory,
    handleCreateReport, handleCreateAlarm, handleCreateContact, handleCreateMemory, handleToggleReminder,
    activityLog,
    activeMedicationAlert, setActiveMedicationAlert, activeIncomingCall, setActiveIncomingCall,
    triggerTestMedicineAlarm, triggerTestFamilyCall,
    groqKeySlots, groqKeyInputs, setGroqKeyInputs, groqTestingSlot, groqFeedback,
    showGroqKeys, setShowGroqKeys, handleSaveGroqKeys, handleTestGroqKey,
    refreshElderData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
