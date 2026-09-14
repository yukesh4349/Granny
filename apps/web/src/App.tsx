import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadPersistedState, persistAuth, clearAuth, persistPreferences } from './store/appStore';
import { authApi, remindersApi, memoryApi, gamesApi } from './services/api';
import {
  supabaseAuth, databaseService,
  type MedicalReport, type FamilyContact, type CareNote, type ReminderItem, type CaretakerNotification
} from './services/supabase';
import { groqService, type GroqKeySlot, type ExtractedMemory, type HealthAlertDetection } from './services/groqService';
import {
  playMedicineAlertChime, playIncomingCallRingtone, playTempleBellChime, playSuccessChime,
  playSosSiren, stopSosSiren
} from './utils/audioChime';
import { t } from './i18n';
import { ALL_GAMES, getGameByKey } from './features/games/engine/games';
import AppShell from './components/navigation/AppShell';
import LandingPage from './pages/LandingPage';
import type { SessionState, DifficultyParams, GameItem } from './features/games/engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
  phone?: string;
  email?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  emotion?: string;
  timestamp: Date;
  extractedMemory?: ExtractedMemory | null;
  healthAlert?: HealthAlertDetection | null;
}

type Page =
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
  // Caretaker dedicated views
  | 'dashboard'
  | 'caretaker_alarms'
  | 'caretaker_medical'
  | 'caretaker_memories'
  | 'caretaker_contacts'
  | 'caretaker_guide'
  | 'caretaker_link';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Game state
  const [currentGameKey, setCurrentGameKey] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<SessionState | null>(null);
  const [gamePhase, setGamePhase] = useState<'memorize' | 'play' | 'result'>('memorize');
  const [gameTimer, setGameTimer] = useState(0);
  const [memorizeDuration, setMemorizeDuration] = useState<number>(15);
  const [gameCategoryFilter, setGameCategoryFilter] = useState<'all' | 'outdoor' | 'indoor' | 'cinema'>('all');
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);

  // Theatre & Micro-Intervention State
  const [theatreStep, setTheatreStep] = useState(0);
  const [theatreFeedback, setTheatreFeedback] = useState<string | null>(null);
  const [activeMicroDose, setActiveMicroDose] = useState<{ title: string; prompt: string; task: string } | null>(null);

  // Listening state
  const [isListening, setIsListening] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '', role: 'ELDER' });
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ─── Real-Time Audio Alarms & Call Overlay State ──────────────────────────
  const [activeMedicationAlert, setActiveMedicationAlert] = useState<{
    id: string; title: string; time: string; description?: string; type?: string;
  } | null>(null);
  const [activeIncomingCall, setActiveIncomingCall] = useState<{
    name: string; relationship: string; avatar: string; phone: string;
  } | null>(null);

  // ─── Groq 4 Key Slots Pool State ──────────────────────────────────────────
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

  // ─── SOS Emergency State ───────────────────────────────────────────────────
  const [sosActive, setSosActive] = useState(false);
  const sosBroadcastRef = useRef<BroadcastChannel | null>(null);

  // ─── Activity Tracking State ───────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<{ page: string; start: number; durationMs?: number }[]>([]);
  const activityStartRef = useRef<number>(Date.now());

  // ─── Game Time Limit State (set by Caretaker) ─────────────────────────────
  const [gameDailyLimitMinutes, setGameDailyLimitMinutes] = useState<number>(0); // 0 = unlimited
  const [gameTodayMinutes, setGameTodayMinutes] = useState<number>(0);
  const [gameTimeLimitReached, setGameTimeLimitReached] = useState(false);
  const gameSessionStartRef = useRef<number | null>(null);

  // ─── TTS (Text-to-Speech) State ───────────────────────────────────────────
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ─── Ecosystem Data State (Linked Elders, Reports, Reminders, Contacts) ───
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

  // Caretaker Form Modals
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

  // ─── Route Management ───────────────────────────────────────────────────────
  const ELDER_PAGES: Page[] = ['home', 'companion', 'family', 'games', 'play', 'health', 'memory', 'theatre', 'settings'];
  const CAREGIVER_PAGES: Page[] = ['dashboard', 'caretaker_alarms', 'caretaker_medical', 'caretaker_memories', 'caretaker_contacts', 'caretaker_guide', 'caretaker_link', 'settings'];

  const navigateTo = useCallback((newPage: Page) => {
    let target = newPage;
    if (target === 'landing' || target === 'auth') {
      setPage(target);
      try { window.location.hash = target; } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (user?.role === 'CAREGIVER' && !CAREGIVER_PAGES.includes(target)) {
      target = 'dashboard';
    } else if (user?.role === 'ELDER' && !ELDER_PAGES.includes(target)) {
      target = 'home';
    }
    setPage(target);
    try {
      window.location.hash = target;
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  // ─── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.auth?.isAuthenticated && persisted.auth.user && persisted.auth.token) {
      const u = persisted.auth.user as User;
      setUser(u);
      setToken(persisted.auth.token);
      const hashPage = window.location.hash.replace('#', '') as Page;
      if (u.role === 'CAREGIVER') {
        const valid = CAREGIVER_PAGES.includes(hashPage) ? hashPage : 'dashboard';
        setPage(valid);
        window.location.hash = valid;
      } else {
        const valid = ELDER_PAGES.includes(hashPage) ? hashPage : 'home';
        setPage(valid);
        window.location.hash = valid;
      }
    } else {
      const hashPage = window.location.hash.replace('#', '') as Page;
      if (hashPage === 'auth') setPage('auth');
      else setPage('landing');
    }
    if (persisted.fontSize) setFontSize(persisted.fontSize);
    if (persisted.highContrast) setHighContrast(persisted.highContrast);
    if (persisted.language) setLanguage(persisted.language);

    // Initialize Groq Keys — pre-fill with env keys
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
    // Auto-save env keys to pool if not already saved
    if (envKeys.some(k => k)) groqService.saveKeys(envKeys);

    // Load game time limit from storage
    const storedLimit = localStorage.getItem('granny_game_daily_limit_minutes');
    if (storedLimit) setGameDailyLimitMinutes(parseInt(storedLimit, 10));
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`granny_game_today_minutes_${today}`);
    if (stored) setGameTodayMinutes(parseFloat(stored));
  }, []);

  // ─── Load Ecosystem Data when user changes ────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const targetElderId = user.role === 'ELDER' ? user.id : linkedElder.id;

    databaseService.getOrGenerateLinkCode(targetElderId).then(setElderLinkCode);
    databaseService.getMedicalReports(targetElderId).then(setMedicalReports);
    databaseService.getFamilyContacts(targetElderId).then(setFamilyContacts);
    databaseService.getCareNotes(targetElderId).then(setCareNotes);
    databaseService.getReminders(targetElderId).then(setReminders);
    databaseService.getMemories(targetElderId).then(setMemoriesList);
    databaseService.getCaretakerNotifications(targetElderId).then(setCaretakerNotifications);
  }, [user, linkedElder.id]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (page === 'companion' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, page]);

  // ─── Background Real-Time Medicine Clock & Alarm Chime Ticker ──────────────
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

      // Check if any active reminder matches currentTimeString and was not confirmed today
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

  // ─── SOS BroadcastChannel Listener (receive alarm from paired device) ──────
  useEffect(() => {
    if (!user) return;
    // Each elder-caretaker pair uses a scoped channel: granny_sos_<elderId>
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

  // ─── Activity Tracker: record time when page changes ─────────────────────
  useEffect(() => {
    activityStartRef.current = Date.now();
    return () => {
      const duration = Date.now() - activityStartRef.current;
      if (duration > 2000) { // only log if more than 2s
        setActivityLog(prev => [
          { page, start: activityStartRef.current, durationMs: duration },
          ...prev.slice(0, 99), // keep last 100 entries
        ]);
        // Track game time specifically
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

  // ─── Game Time Limit Enforcement ──────────────────────────────────────────
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
    const updatedUser: User = {
      ...user,
      role: newRole,
      name: newRole === 'CAREGIVER' 
        ? (language === 'ta' ? 'அருண் (மகன் & பராமரிப்பாளர்)' : 'Arun (Son & Caregiver)') 
        : (language === 'ta' ? 'லட்சுமி அம்மா & ராமநாதன் தாத்தா' : 'Lakshmi Amma & Ramanathan Thatha'),
    };
    setUser(updatedUser);
    persistAuth(updatedUser, token || 'demo_token');
    navigateTo(newRole === 'CAREGIVER' ? 'dashboard' : 'home');
  };

  // ─── Caretaker Actions ───
  const handleLinkElderAccount = async () => {
    if (!linkInputCode.trim()) {
      setLinkFeedback(language === 'ta' ? 'தயவுசெய்து குறியீட்டை உள்ளிடவும்' : 'Please enter the link code first.');
      return;
    }
    setLinkFeedback(language === 'ta' ? 'இணைக்கிறோம்...' : 'Connecting...');
    try {
      const caregiverId = user?.id || 'demo_caregiver';
      const res = await databaseService.linkCaregiverToElder(caregiverId, linkInputCode);
      setLinkedElder({ id: res.elderId, name: res.elderName });
      setLinkFeedback(language === 'ta' ? `✅ வெற்றிகரமாக இணைக்கப்பட்டது: ${res.elderName}` : `✅ Successfully linked to: ${res.elderName}`);
      setLinkInputCode('');

      // Refresh all elder data
      databaseService.getMedicalReports(res.elderId).then(setMedicalReports);
      databaseService.getFamilyContacts(res.elderId).then(setFamilyContacts);
      databaseService.getCareNotes(res.elderId).then(setCareNotes);
      databaseService.getReminders(res.elderId).then(setReminders);
      databaseService.getMemories(res.elderId).then(setMemoriesList);
      databaseService.getCaretakerNotifications(res.elderId).then(setCaretakerNotifications);
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

  // ─── Groq 4 Key Management Handlers ───────────────────────────────────────
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

  // ─── Asha Chat Handler (Dual Output: Reply + Memory Extractor + Health Alert) ──
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

      // Call Groq Dual-Output Analyzer
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

      // TTS: Read Asha's reply aloud for the Elder
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

      // 1. If personal memory was extracted, save directly to Elder DB
      if (result.extractedMemory) {
        const savedFact = await databaseService.saveElderPersonalFact(user?.id || 'demo_elder', {
          title: result.extractedMemory.title,
          content: result.extractedMemory.content,
          tags: result.extractedMemory.tags,
          category: result.extractedMemory.category,
        });
        // Refresh memory list
        databaseService.getMemories(user?.id || 'demo_elder').then(setMemoriesList);
      }

      // 2. If health concern / distress detected, alert Caretaker immediately!
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

  // ─── SOS Emergency Handler ────────────────────────────────────────────────
  const handleSOS = () => {
    const elderId = user?.role === 'ELDER' ? user.id : linkedElder.id;
    const channelName = `granny_sos_${elderId}`;
    if (!sosActive) {
      // Activate SOS: play siren locally AND broadcast to the paired device
      setSosActive(true);
      playSosSiren();
      try {
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({ type: 'SOS_ACTIVATE', elderId, triggeredBy: user?.name });
        bc.close();
      } catch {}
      // Log as caretaker notification
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
      // Stop SOS
      setSosActive(false);
      stopSosSiren();
      try {
        const bc = new BroadcastChannel(channelName);
        bc.postMessage({ type: 'SOS_STOP', elderId });
        bc.close();
      } catch {}
    }
  };

  // ─── Dynamic AI Game Generator (Non-Repeating Groq Questions) ─────────────
  const startGame = async (gameKey: string) => {
    // Check daily game time limit before starting
    if (gameDailyLimitMinutes > 0 && gameTodayMinutes >= gameDailyLimitMinutes) {
      setGameTimeLimitReached(true);
      return;
    }
    const game = getGameByKey(gameKey);
    if (!game) return;
    gameSessionStartRef.current = Date.now();

    setIsGeneratingGame(true);
    setCurrentGameKey(gameKey);
    navigateTo('play');

    try {
      const elderProfile = {
        name: user?.name || 'Grandpa & Grandma',
        language,
        memories: memoriesList,
        notes: careNotes?.condition_details,
      };

      // Generate 100% fresh, novel questions tailored to this elder via 4 Groq Keys
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
      // Use standard session if offline
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
    if (isCorrect) {
      playSuccessChime();
    }

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
      const correctCount = gameSession.attempts.filter(a => a.correct).length;
      const score = Math.round((correctCount / gameSession.items.length) * 100);
      gamesApi.submitAttempt({
        sessionId: gameSession.sessionId,
        score,
        accuracy: score,
      }).catch(() => {});
    }
  };

  const finishGame = () => {
    // Record game session time
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

  // ─── Voice Recognition (Web Speech API) ───────────────────────────────────
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
          if (page !== 'companion') {
            navigateTo('companion');
          }
          sendMessage(transcript);
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, language, page, navigateTo]);

  // ─── Test Audio & Modals Triggers (for User Verification) ───────────────────
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

  // ─── Render Landing Page ──────────────────────────────────────────────────
  if (page === 'landing') {
    return (
      <LandingPage
        language={language}
        onToggleLanguage={() => {
          const next = language === 'ta' ? 'en' : 'ta';
          setLanguage(next);
          persistPreferences({ language: next });
        }}
        highContrast={highContrast}
        onToggleContrast={() => {
          const next = !highContrast;
          setHighContrast(next);
          persistPreferences({ highContrast: next });
        }}
        onStartDemo={(role?: 'ELDER' | 'CAREGIVER') => handleDemoLogin(role || 'ELDER')}
        onOpenAuth={(mode?: 'login' | 'register') => {
          setAuthMode(mode || 'login');
          navigateTo('auth');
        }}
      />
    );
  }

  // ─── Render Auth Page ─────────────────────────────────────────────────────
  if (page === 'auth') {
    const isElder = authForm.role === 'ELDER';
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)'
      }}>
        {/* Top bar with back and language */}
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('landing')}>
            ← {t('back_to_home', language)}
          </button>
          <button
            onClick={() => {
              const next = language === 'ta' ? 'en' : 'ta';
              setLanguage(next);
              persistPreferences({ language: next });
            }}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
          >
            {language === 'ta' ? 'English' : 'தமிழ்'}
          </button>
        </div>

        <div className="card" style={{ maxWidth: 440, width: '100%', padding: 'var(--space-xl)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div className="text-center mb-md">
            <div style={{ fontSize: 48, marginBottom: 8 }}>{isElder ? '👵👴' : '👨‍👩‍👧'}</div>
            <h2 style={{ fontSize: '24px', color: 'var(--color-primary-dark)' }}>
              {authMode === 'login' ? t('sign_in', language) : t('create_account', language)}
            </h2>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: 4 }}>
              {isElder 
                ? (language === 'ta' ? 'தாத்தா & பாட்டி பகுதி' : 'Elder Sanctuary Portal')
                : (language === 'ta' ? 'பராமரிப்பாளர் பகுதி' : 'Caregiver Portal')}
            </p>
          </div>

          {/* Role selector pill */}
          <div style={{
            display: 'flex', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-bg)',
            padding: '4px', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)'
          }}>
            <button
              type="button"
              onClick={() => setAuthForm(prev => ({ ...prev, role: 'ELDER' }))}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-full)',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                backgroundColor: isElder ? 'var(--color-primary)' : 'transparent',
                color: isElder ? '#FFFFFF' : 'var(--color-text-secondary)'
              }}
            >
              👵👴 {language === 'ta' ? 'முதியோர்' : 'Elder'}
            </button>
            <button
              type="button"
              onClick={() => setAuthForm(prev => ({ ...prev, role: 'CAREGIVER' }))}
              style={{
                flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-full)',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                backgroundColor: !isElder ? '#7B1FA2' : 'transparent',
                color: !isElder ? '#FFFFFF' : 'var(--color-text-secondary)'
              }}
            >
              👨‍👩‍👧 {language === 'ta' ? 'பராமரிப்பாளர்' : 'Caregiver'}
            </button>
          </div>

          {authError && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="stack" style={{ gap: '14px' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  {language === 'ta' ? 'முழுப் பெயர்' : 'Full Name'}
                </label>
                <input
                  className="input"
                  placeholder={isElder ? (language === 'ta' ? 'ராமநாதன் / லட்சுமி' : 'Ramanathan / Lakshmi') : 'Arun (Son)'}
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {authMode === 'register' 
                  ? (language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி' : 'Email or Phone')
                  : (language === 'ta' ? 'பெயர், மின்னஞ்சல் அல்லது தொலைபேசி' : 'Name, Email or Phone')}
              </label>
              <input
                className="input"
                placeholder={authMode === 'register' ? 'user@granny.app / 9876543210' : (language === 'ta' ? 'உங்கள் பெயர் அல்லது மின்னஞ்சல்' : 'Your name, email or phone')}
                value={authForm.email || authForm.phone || ''}
                onChange={e => {
                  const val = e.target.value;
                  if (val.includes('@')) {
                    setAuthForm({ ...authForm, email: val, phone: '' });
                  } else {
                    setAuthForm({ ...authForm, email: val, phone: val });
                  }
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {language === 'ta' ? 'கடவுச்சொல்' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large w-full mt-sm"
              disabled={isAuthLoading}
              style={{ backgroundColor: isElder ? 'var(--color-primary)' : '#7B1FA2' }}
            >
              {isAuthLoading 
                ? (language === 'ta' ? 'செயலாக்குகிறது...' : 'Processing...') 
                : (authMode === 'login' ? t('sign_in', language) : t('create_account', language))}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="text-center mt-md">
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              {authMode === 'login'
                ? (language === 'ta' ? 'புதிய கணக்கு வேண்டுமா? இங்கே பதிவு செய்க' : "Don't have an account? Sign up here")
                : (language === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக' : 'Already have an account? Sign in here')}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0 12px 0' }} />

          {/* 1-Tap Demo Access */}
          <button
            onClick={() => handleDemoLogin(authForm.role as any)}
            className="btn btn-secondary w-full"
            style={{ fontSize: '13px', padding: '10px' }}
          >
            ⚡ {language === 'ta' ? '1-தட்டு டெமோ அணுகல்' : '1-Tap Instant Demo Login'} ({isElder ? 'Elder' : 'Caregiver'})
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Application with AppShell ───────────────────────────────────────
  const isCaretaker = user?.role === 'CAREGIVER';

  return (
    <AppShell
      user={user || { name: 'Elder', role: 'ELDER' }}
      page={page}
      setPage={navigateTo}
      onLogout={handleLogout}
      language={language}
      onToggleLanguage={() => {
        const next = language === 'ta' ? 'en' : 'ta';
        setLanguage(next);
        persistPreferences({ language: next });
      }}
      onSosTrigger={handleSOS}
    >
      <div className="container">

        {/* ─── SOS Active Top Banner (visible on both Elder & linked Caretaker) ─── */}
        {sosActive && (
          <div className="sos-active-banner" onClick={handleSOS} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: 32, animation: 'pulse 0.6s infinite' }}>🚨</span>
              <div>
                <strong style={{ fontSize: '18px' }}>EMERGENCY SOS ACTIVE</strong>
                <p style={{ fontSize: '13px', opacity: 0.9, margin: '2px 0 0 0' }}>
                  {language === 'ta' ? 'அவசர சைரன் ஒலிக்கிறது. நிறுத்த இங்கே தட்டவும்.' : 'Emergency siren is active. Tap anywhere here to stop.'}
                </p>
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleSOS(); }}
              style={{ backgroundColor: '#FFF', color: '#B71C1C', border: 'none', borderRadius: '999px', padding: '8px 20px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
            >
              🔕 {language === 'ta' ? 'நிறுத்து' : 'STOP'}
            </button>
          </div>
        )}

        {/* ─── Caretaker Alert Banner (When Asha detects health symptom) ─── */}
        {activeHealthAlertBanner && (
          <div style={{
            backgroundColor: '#FFEBEE', border: '2px solid #E53935', borderRadius: '16px',
            padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '16px', animation: 'bounceIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '32px' }}>🚨</span>
              <div>
                <h4 style={{ color: '#C62828', fontSize: '16px', fontWeight: 800 }}>
                  {activeHealthAlertBanner.title} ({activeHealthAlertBanner.elder_name})
                </h4>
                <p style={{ color: '#B71C1C', fontSize: '14px', marginTop: '2px' }}>
                  {activeHealthAlertBanner.message} — <em>"{activeHealthAlertBanner.transcript_excerpt}"</em>
                </p>
                <span style={{ fontSize: '12px', color: '#777', marginTop: '4px', display: 'inline-block' }}>
                  📧 Instant email alert dispatched to Caregiver inbox.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveHealthAlertBanner(null)}
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ELDER SANCTUARY PAGES
           ══════════════════════════════════════════════════════════════════════ */}

        {/* ─── 1. ELDER HOME (Serene, Clean & Joyful — No medicine clutter) ─── */}
        {page === 'home' && (
          <>
            <div className="page-header">
              <div className="page-header-row">
                <div>
                  <h1 style={{ fontSize: '32px', color: 'var(--color-primary-dark)', letterSpacing: '-0.02em' }}>
                    {t('greeting_morning', language)}, {user?.name?.split(' ')[0] || 'Grandpa & Grandma'} 🌸
                  </h1>
                  <p className="text-muted mt-xs" style={{ fontSize: '17px' }}>
                    {t('how_feeling', language)}
                  </p>
                </div>
              </div>
            </div>

            <div className="stack" style={{ gap: 'var(--space-xl)' }}>
              
              {/* 4 Core Hero Cards for Elders (Joyful, Nostalgic, Accessible) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                
                {/* 1. Talk with Asha */}
                <button
                  className="card card-interactive"
                  onClick={() => navigateTo('companion')}
                  style={{ background: 'linear-gradient(135deg, #EFFBF2 0%, #D8F3DC 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #95D5B2' }}
                >
                  <div style={{ fontSize: 48 }}>💬</div>
                  <h3 style={{ marginTop: '10px', color: '#1B4332', fontSize: '20px' }}>{t('talk_to_granny', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('voice_companion_chat', language)}</p>
                </button>

                {/* 2. Fun Memory Games */}
                <button
                  className="card card-interactive"
                  onClick={() => navigateTo('games')}
                  style={{ background: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #B39DDB' }}
                >
                  <div style={{ fontSize: 48 }}>🧩</div>
                  <h3 style={{ marginTop: '10px', color: '#4A148C', fontSize: '20px' }}>{t('play_games', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>✨ 20 {language === 'ta' ? 'AI பாரம்பரிய விளையாட்டுகள்' : 'AI Nostalgia Games'}</p>
                </button>

                {/* 3. Family Circle (1-Tap Calls) */}
                <button
                  className="card card-interactive"
                  onClick={() => navigateTo('family')}
                  style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #FFCC80' }}
                >
                  <div style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</div>
                  <h3 style={{ marginTop: '10px', color: '#E65100', fontSize: '20px' }}>{t('family_circle', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('family_circle_desc', language)}</p>
                </button>

                {/* 4. Family Memories & Photo Album */}
                <button
                  className="card card-interactive"
                  onClick={() => navigateTo('memory')}
                  style={{ background: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #80CBC4' }}
                >
                  <div style={{ fontSize: 48 }}>📸</div>
                  <h3 style={{ marginTop: '10px', color: '#004D40', fontSize: '20px' }}>{t('memories', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('your_life_stories', language)}</p>
                </button>
              </div>

              {/* Life-Story Memory Theatre Highlight Banner */}
              <div
                className="card card-interactive"
                onClick={() => { setTheatreStep(0); setTheatreFeedback(null); navigateTo('theatre'); }}
                style={{
                  background: 'linear-gradient(135deg, #FF7043 0%, #E64A19 100%)',
                  color: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '24px 28px',
                  boxShadow: '0 8px 24px rgba(230, 74, 25, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 56 }}>🎭</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: 800 }}>{t('theatre_banner_title', language)}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.95)', marginTop: 6, fontSize: '15px', lineHeight: 1.5 }}>
                      {t('theatre_banner_desc', language)}
                    </p>
                  </div>
                  <button className="btn" style={{ backgroundColor: '#FFFFFF', color: '#D84315', fontWeight: 800, padding: '10px 22px', borderRadius: 'var(--radius-full)' }}>
                    ▶ {language === 'ta' ? 'தொடங்குக' : 'Begin Scene'}
                  </button>
                </div>
              </div>

              {/* JIT Micro-Intervention Quick Spark */}
              <div className="card" style={{ background: 'var(--color-primary-bg)', border: '2px solid var(--color-primary)', borderRadius: '20px', padding: '22px 26px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>✨</span>
                      <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '19px' }}>{t('spark_title', language)}</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 6, fontSize: '16px', lineHeight: 1.5 }}>
                      {activeMicroDose ? activeMicroDose.task : t('spark_default', language)}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      playTempleBellChime();
                      setActiveMicroDose({
                        title: 'Verandah Observation',
                        prompt: 'Look around your room right now.',
                        task: language === 'ta' ? 'உங்கள் அறையில் நீல அல்லது பச்சை நிறத்தில் உள்ள 3 பொருட்களை மனதிற்குள் கூறுங்கள்!' : 'Name 3 things in your room that are blue or green!'
                      });
                    }}
                    style={{ padding: '12px 24px', fontSize: '15px' }}
                  >
                    {activeMicroDose ? t('spark_done', language) : t('spark_start', language)}
                  </button>
                </div>
              </div>

              {/* Sound & Alarm Tester + SOS Emergency Button */}
              <div className="card" style={{ background: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '18px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                      🔔 {language === 'ta' ? 'ஒலி மணி & அழைப்பு சோதனை' : 'Audio Chime & Alert Quick Test'}
                    </h4>
                    <p className="text-muted" style={{ fontSize: '14px', marginTop: '2px' }}>
                      {language === 'ta' ? 'மருந்து மணி மற்றும் குடும்ப அழைப்பு ஒலிகளை உடனே கேட்டுப் பாருங்கள்.' : 'Test how medicine chimes and incoming calls sound on your device.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={triggerTestMedicineAlarm} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      💊 {language === 'ta' ? 'மருந்து மணி ஒலி' : 'Test Medicine Chime'}
                    </button>
                    <button onClick={() => triggerTestFamilyCall()} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      📞 {language === 'ta' ? 'அழைப்பு ஒலி' : 'Test Family Ring'}
                    </button>
                    <button
                      onClick={() => setTtsEnabled(prev => !prev)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: ttsEnabled ? '#E8F5E9' : '#F5F5F5', border: ttsEnabled ? '1.5px solid #2E7D32' : '1.5px solid #CCC' }}
                    >
                      🔊 TTS {ttsEnabled ? (language === 'ta' ? 'ஆன்' : 'ON') : (language === 'ta' ? 'ஆஃப்' : 'OFF')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Emergency SOS Button */}
              <button
                onClick={handleSOS}
                style={{
                  width: '100%', padding: '20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  background: sosActive
                    ? 'linear-gradient(135deg, #B71C1C 0%, #E53935 100%)'
                    : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
                  color: '#FFFFFF', fontSize: '22px', fontWeight: 900,
                  boxShadow: sosActive ? '0 0 30px rgba(229,57,53,0.7)' : '0 6px 20px rgba(229,57,53,0.35)',
                  animation: sosActive ? 'pulse 0.8s infinite' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px'
                }}
              >
                <span style={{ fontSize: 40 }}>🆘</span>
                <span>{sosActive ? (language === 'ta' ? 'SOS நிறுத்து' : 'STOP SOS ALARM') : (language === 'ta' ? 'அவசர SOS அழைப்பு' : 'EMERGENCY SOS — Call Caretaker!')}</span>
              </button>

            </div>
          </>
        )}

        {/* ─── 2. ELDER THEATRE (Life-Story Memory Theatre) ─── */}
        {page === 'theatre' && (
          <>
            <div className="page-header">
              <div className="page-header-row" style={{ marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: 36 }}>🎭</span>
                <div>
                  <h2 style={{ fontSize: '26px', color: 'var(--color-primary-dark)' }}>{t('theatre_banner_title', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '15px' }}>
                    {language === 'ta' ? 'ஊடாடும் காட்சி: "வராண்டாவில் திருவிழா காலை"' : 'Interactive Scene: "Festival Morning on the Verandah"'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ maxWidth: 680, margin: '0 auto', padding: '36px 30px', background: 'var(--color-card-bg)', border: '2px solid var(--color-primary)', borderRadius: '24px' }}>
              {theatreStep === 0 && (
                <div className="stack text-center">
                  <div style={{ fontSize: 64 }}>🌅</div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '22px' }}>
                    {language === 'ta' ? 'காட்சி 1: திருவிழா காலை' : 'Scene 1: The Festival Morning'}
                  </h3>
                  <p style={{ fontSize: '18px', lineHeight: 1.6, margin: '16px 0', color: 'var(--color-text)' }}>
                    {language === 'ta'
                      ? '"சூரியன் மெதுவாக உதிக்க, பூஜை மணியின் ஓசை கேட்டது. திருவிழாவிற்கு நீங்கள் முதலில் எதை தயார் செய்தீர்கள்?"'
                      : '"The sun rose warm over the terrace, and the brass bells in the prayer room chimed softly. What did you and family begin preparing first?"'}
                  </p>
                  <div className="stack" style={{ gap: '12px' }}>
                    {(language === 'ta' 
                      ? ['பாரம்பரிய இனிப்பு & முறுக்கு', 'புதிய மல்லிகைப் பூ மாலை', 'பித்தளை விளக்கு ஏற்றுதல்']
                      : ['Traditional Sweets & Murukku', 'Fresh Jasmine Garlands', 'Lighting the Brass Lamps']
                    ).map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" style={{ padding: '14px 20px', fontSize: '16px', fontWeight: 700 }} onClick={() => {
                        playTempleBellChime();
                        setTheatreFeedback(language === 'ta' ? "அருமை! நெய் மற்றும் இனிப்புகளின் நறுமணம் வீடு முழுவதும் பரவியது." : "Yes, wonderful! The aroma of fresh ghee and sweets filled the whole house.");
                        setTheatreStep(1);
                      }}>
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {theatreStep === 1 && (
                <div className="stack text-center">
                  <div style={{ fontSize: 64 }}>👨‍👩‍👦</div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '22px' }}>
                    {language === 'ta' ? 'காட்சி 2: வராண்டாவில் குடும்பம்' : 'Scene 2: Gathering on the Verandah'}
                  </h3>
                  <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '16px' }}>✨ {theatreFeedback}</p>
                  <p style={{ fontSize: '18px', lineHeight: 1.6, margin: '16px 0', color: 'var(--color-text)' }}>
                    {language === 'ta'
                      ? '"அனைவரும் பட்டு ஆடைகள் அணிந்திருந்தனர். அன்று காலை குடும்ப ஆசீர்வாதங்களை யார் வழங்கினார்கள்?"'
                      : '"Everyone wore their new silk clothes. Who gave the traditional family blessings that morning?"'}
                  </p>
                  <div className="stack" style={{ gap: '12px' }}>
                    {(language === 'ta'
                      ? ['தாத்தா பட்டு அங்கவஸ்திரத்துடன்', 'மதுரையிலிருந்து வந்த பெரியப்பா', 'குடும்பப் பெரியவர்கள் அனைவரும் ஒன்றாக']
                      : ['Grandfather in his silk angavastram', 'Visiting Uncle from Madurai', 'The family elders together']
                    ).map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" style={{ padding: '14px 20px', fontSize: '16px', fontWeight: 700 }} onClick={() => {
                        playSuccessChime();
                        setTheatreFeedback(language === 'ta' ? "அன்பான நினைவுகள்! தாத்தாவின் ஆசீர்வாதம் எப்போதும் நலம் தரும்." : "Cherished memories! Grandfather's blessings always brought good fortune.");
                        setTheatreStep(2);
                      }}>
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {theatreStep === 2 && (
                <div className="stack text-center">
                  <div style={{ fontSize: 72 }}>🌟</div>
                  <h2 style={{ color: 'var(--color-success)', fontSize: '26px' }}>
                    {language === 'ta' ? 'நினைவுக் காட்சி நிறைவுற்றது!' : 'Memory Episode Complete!'}
                  </h2>
                  <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--color-text)' }}>
                    {language === 'ta'
                      ? '"இந்தக் கதையை நீங்கள் அழகாகப் பகிர்ந்தீர்கள். உங்கள் விலைமதிப்பற்ற நினைவுகள் குடும்ப வட்டத்தில் என்றும் வாழும்."'
                      : '"You shared this story beautifully. Your precious memories remain alive and treasured in our family circle."'}
                  </p>
                  <button className="btn btn-primary btn-large mt-lg" style={{ padding: '14px 30px' }} onClick={() => { setTheatreStep(0); navigateTo('home'); }}>
                    {t('back_to_home', language)}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── 3. ELDER COMPANION CHAT (Dual Output: Memory Extractor + Health Safety) ─── */}
        {page === 'companion' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxWidth: '850px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '12px' }}>
              <div className="page-header-row" style={{ marginBottom: '6px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
                <div style={{
                  padding: '4px 12px', borderRadius: '12px', backgroundColor: '#E8F5E9',
                  color: '#2E7D32', fontSize: '12px', fontWeight: 700
                }}>
                  ✨ {language === 'ta' ? 'ஆஷா AI குரல் துணைவர்' : 'Asha AI Voice Companion'}
                </div>
              </div>
              <h2 style={{ fontSize: '24px', color: 'var(--color-primary-dark)' }}>💬 {t('nav_companion', language)}</h2>
              <p className="text-muted" style={{ fontSize: '14px' }}>
                {language === 'ta' ? 'ஆஷாவுடன் அன்பாகவும் பொறுமையாகவும் பேசுங்கள்' : 'Have a gentle, patient conversation with Asha Voice AI.'}
              </p>
            </div>

            {/* Scrollable chat messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px', backgroundColor: '#FFFFFF',
              borderRadius: '20px', border: '1.5px solid var(--color-border)', display: 'flex',
              flexDirection: 'column', gap: '14px'
            }}>
              {messages.length === 0 && (
                <div className="text-center" style={{ padding: '32px 16px' }}>
                  <div style={{ fontSize: 64 }}>👵👴</div>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '12px' }}>
                    {language === 'ta' ? 'வணக்கம் தாத்தா & பாட்டி! நான் ஆஷா.' : "Hello Grandpa & Grandma! I'm Asha."}
                  </p>
                  <p className="text-muted mt-sm" style={{ fontSize: '15px' }}>
                    {language === 'ta' ? 'வணக்கம் சொல்லுங்கள் அல்லது கீழே தட்டச்சு செய்யுங்கள். உங்கள் பழைய கதைகள், பிடித்த உணவுகள் பற்றி என்னிடம் பகிருங்கள்!' : 'Say hello or tap the mic button to talk anytime. Feel free to share your favourite stories, hometown memories, and daily thoughts!'}
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={`chat-bubble ${msg.sender}`} style={{ fontSize: '16px' }}>
                    {msg.text}
                  </div>
                  {/* Extracted memory notification pill */}
                  {msg.extractedMemory && (
                    <div style={{
                      marginTop: '4px', padding: '3px 10px', borderRadius: '12px',
                      backgroundColor: '#E0F2F1', color: '#004D40', fontSize: '11px',
                      fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <span>💾 Saved to Memory DB:</span>
                      <strong>{msg.extractedMemory.title}</strong>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="chat-bubble assistant">
                  <div className="waveform">
                    {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Docked chat input within container */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <input
                className="input"
                placeholder={language === 'ta' ? 'உங்கள் செய்தியை எழுதுங்கள் (எ.கா. எனக்கு கும்பகோணம் காபி பிடிக்கும்)...' : 'Type your message (e.g. I loved temple festivals in Madurai)...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ fontSize: '16px', borderRadius: 'var(--radius-full)', padding: '14px 20px' }}
              />
              <button
                className="btn btn-primary"
                onClick={() => sendMessage()}
                style={{ padding: '0 24px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
              >
                {language === 'ta' ? 'அனுப்பு' : 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* ─── 4. ELDER GAMES WORLD (20 Nostalgia Games with Dynamic Groq AI) ─── */}
        {page === 'games' && (
          <>
            {/* Game Time Limit Warning */}
            {gameTimeLimitReached && (
              <div style={{ backgroundColor: '#FFF3E0', border: '2px solid #FF9800', borderRadius: '16px', padding: '18px 22px', marginBottom: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: 40 }}>⏰</div>
                <h3 style={{ color: '#E65100', fontSize: '20px', marginTop: '8px' }}>
                  {language === 'ta' ? 'இன்றைய விளையாட்டு நேரம் முடிந்தது!' : "Today's Game Time Limit Reached!"}
                </h3>
                <p style={{ color: '#BF360C', fontSize: '15px', marginTop: '6px' }}>
                  {language === 'ta'
                    ? `உங்கள் பராமரிப்பாளர் ${gameDailyLimitMinutes} நிமிடம் வரம்பு அமைத்துள்ளார். நாளை மீண்டும் வாருங்கள்!`
                    : `Your caretaker has set a ${gameDailyLimitMinutes}-minute daily limit. Come back tomorrow!`}
                </p>
              </div>
            )}
            <div className="page-header">
              <div className="page-header-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
                <div style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
                  fontSize: '13px', fontWeight: 800, border: '1.5px solid var(--color-primary)'
                }}>
                  ✨ {language === 'ta' ? 'தனிப்பயனாக்கப்பட்ட கேள்விகள்' : 'Personalized Dynamic Questions'}
                </div>
              </div>
              <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>🧩 {t('games_title', language)}</h2>
              <p className="text-muted" style={{ fontSize: '16px', marginTop: '2px' }}>
                {t('games_subtitle', language)}
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {[
                { id: 'all' as const, label: `${t('games_cat_all', language)} (20)` },
                { id: 'outdoor' as const, label: `🏃 ${t('games_cat_outdoor', language)} (10)` },
                { id: 'indoor' as const, label: `🎲 ${t('games_cat_indoor', language)} (5)` },
                { id: 'cinema' as const, label: `🎬 ${t('games_cat_cinema', language)} (5)` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setGameCategoryFilter(tab.id)}
                  style={{
                    padding: '10px 18px', fontSize: '14px', fontWeight: 700,
                    backgroundColor: gameCategoryFilter === tab.id ? 'var(--color-primary)' : '#FFFFFF',
                    color: gameCategoryFilter === tab.id ? '#FFFFFF' : 'var(--color-text)',
                    border: gameCategoryFilter === tab.id ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    boxShadow: gameCategoryFilter === tab.id ? '0 4px 12px rgba(59, 122, 87, 0.25)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Games Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {ALL_GAMES.filter(g => {
                if (gameCategoryFilter === 'outdoor') return ['nondi', 'kanche', 'gilli_danda', 'pallanguzhi', 'dhayakkattai', 'seven_stones', 'kabaddi_clues', 'tyre_vandi', 'kitti_pull', 'maram_kothu'].includes(g.key);
                if (gameCategoryFilter === 'indoor') return ['thayam', 'paramapadham', 'aadupuli', 'pandi', 'stone_counting'].includes(g.key);
                if (gameCategoryFilter === 'cinema') return ['cinema_1970', 'carnatic_raga', 'vintage_radio', 'spices_kitchen', 'temple_bells'].includes(g.key);
                return true;
              }).map(game => (
                <div
                  key={game.key}
                  className="card card-interactive"
                  onClick={() => startGame(game.key)}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '22px',
                    border: '2px solid var(--color-border)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', minHeight: '180px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '36px' }}>{game.icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                        AI Customized
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '10px' }}>
                      {game.title}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px', lineHeight: 1.4 }}>
                      {game.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ▶ {language === 'ta' ? 'விளையாடு' : 'Play'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── 5. ACTIVE GAME PLAY SCREEN (With Real Cultural Images & Groq Questions) ─── */}
        {page === 'play' && (
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div className="page-header">
              <div className="page-header-row" style={{ justifyContent: 'space-between' }}>
                <button className="page-header-back-btn" onClick={finishGame}>
                  ← {t('back_to_home', language)}
                </button>
                <button
                  onClick={() => currentGameKey && startGame(currentGameKey)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }}
                  disabled={isGeneratingGame}
                >
                  🔄 {language === 'ta' ? 'புதிய AI கேள்விகளை உருவாக்குக' : 'Generate New Questions'}
                </button>
              </div>
            </div>

            {isGeneratingGame && (
              <div className="card text-center" style={{ padding: '48px 24px', borderRadius: '24px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '20px' }}>
                  ✨ {language === 'ta' ? 'உங்களுக்கான புதிய கேள்விகளை உருவாக்குகிறது...' : 'Generating Fresh Personalized Questions...'}
                </h3>
                <p className="text-muted mt-sm" style={{ fontSize: '14px' }}>
                  Customized with family memories, cultural heritage, and zero repetitions.
                </p>
              </div>
            )}

            {!isGeneratingGame && gameSession && (
              <>
                {/* Phase 1: Memorize Preview */}
                {gamePhase === 'memorize' && (
                  <div className="card" style={{ padding: '32px 28px', borderRadius: '24px', border: '2.5px solid var(--color-primary)', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 800, fontSize: '14px', marginBottom: '16px' }}>
                      ⏱️ {language === 'ta' ? `நினைவில் வைக்கவும்: ${gameTimer} வினாடிகள்` : `Memorize for: ${gameTimer} seconds`}
                    </div>
                    <h3 style={{ fontSize: '22px', color: 'var(--color-primary-dark)', marginBottom: '16px' }}>
                      {language === 'ta' ? 'காட்சியை கூர்ந்து கவனியுங்கள்' : 'Observe the Cultural Clues Carefully'}
                    </h3>

                    {/* Image / Emoji Scene Showcase */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', margin: '20px 0' }}>
                      {gameSession.items.map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                          <span style={{ fontSize: '40px' }}>{item.metadata?.emoji || '🌸'}</span>
                          <h4 style={{ fontSize: '15px', fontWeight: 800, marginTop: '8px', color: 'var(--color-text)' }}>
                            {item.metadata?.object || `Clue #${idx + 1}`}
                          </h4>
                          {item.metadata?.imageUrl && (
                            <img
                              src={item.metadata.imageUrl}
                              alt="Memory Visual"
                              style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px', marginTop: '8px' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <button className="btn btn-primary btn-large" onClick={() => setGamePhase('play')} style={{ padding: '12px 28px' }}>
                      {language === 'ta' ? 'நான் தயாராக இருக்கிறேன்! ▶' : "I'm Ready to Play! ▶"}
                    </button>
                  </div>
                )}

                {/* Phase 2: Play Questions */}
                {gamePhase === 'play' && (
                  <div className="card" style={{ padding: '32px 28px', borderRadius: '24px', border: '2px solid var(--color-primary)' }}>
                    {/* Progress */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                        {language === 'ta' ? 'கேள்வி' : 'Question'} {gameSession.currentItemIndex + 1} / {gameSession.items.length}
                      </span>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', backgroundColor: '#EDE7F6', color: '#6A1B9A', fontWeight: 700 }}>
                        ✨ Groq AI Generated
                      </span>
                    </div>

                    {/* Current Question */}
                    {gameSession.items[gameSession.currentItemIndex] && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <span style={{ fontSize: '48px' }}>
                            {gameSession.items[gameSession.currentItemIndex].metadata?.emoji || '🧩'}
                          </span>
                          <h3 style={{ fontSize: '20px', color: 'var(--color-text)', marginTop: '10px', lineHeight: 1.5 }}>
                            {gameSession.items[gameSession.currentItemIndex].prompt}
                          </h3>
                        </div>

                        {/* 4 Accessible Choices */}
                        <div className="stack" style={{ gap: '12px', marginTop: '20px' }}>
                          {gameSession.items[gameSession.currentItemIndex].choices?.map((choice, i) => (
                            <button
                              key={i}
                              className="btn btn-secondary btn-large"
                              onClick={() => handleGameAnswer(choice)}
                              style={{
                                padding: '16px 20px', fontSize: '17px', fontWeight: 700,
                                textAlign: 'left', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px'
                              }}
                            >
                              <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                                {['A', 'B', 'C', 'D'][i]}
                              </span>
                              <span>{choice}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Phase 3: Result Summary */}
                {gamePhase === 'result' && (
                  <div className="card text-center" style={{ padding: '40px 28px', borderRadius: '24px', border: '2.5px solid var(--color-success)' }}>
                    <div style={{ fontSize: 72 }}>🌟</div>
                    <h2 style={{ fontSize: '26px', color: 'var(--color-success)', marginTop: '8px' }}>
                      {language === 'ta' ? 'அருமையான விளையாட்டு!' : 'Splendid Memory Session!'}
                    </h2>
                    <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                      {language === 'ta'
                        ? `நீங்கள் ${gameSession.attempts.filter(a => a.correct).length} / ${gameSession.items.length} கேள்விகளுக்கு சரியாக பதிலளித்துள்ளீர்கள்.`
                        : `You answered ${gameSession.attempts.filter(a => a.correct).length} out of ${gameSession.items.length} questions correctly.`}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px' }}>
                      <button className="btn btn-primary btn-large" onClick={() => currentGameKey && startGame(currentGameKey)} style={{ padding: '12px 24px' }}>
                        🔄 {language === 'ta' ? 'மீண்டும் விளையாடு' : 'Play Fresh Round'}
                      </button>
                      <button className="btn btn-secondary btn-large" onClick={finishGame} style={{ padding: '12px 24px' }}>
                        {t('back_to_home', language)}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── 6. ELDER FAMILY CIRCLE (1-Tap Call) ─── */}
        {page === 'family' && (
          <>
            <div className="page-header">
              <div className="page-header-row" style={{ marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
              </div>
              <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>👨‍👩‍👧‍👦 {t('nav_family', language)}</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>
                {language === 'ta' ? 'உங்கள் குடும்பத்தினருடன் எளிதாகப் பேச ஒருமுறை தட்டவும்' : 'Tap any family member card below to call them instantly.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {familyContacts.map(c => (
                <div key={c.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '24px',
                  border: c.is_emergency_contact ? '2.5px solid var(--color-danger)' : '2px solid var(--color-border)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '52px' }}>{c.avatar_emoji || '👤'}</span>
                    {c.is_emergency_contact && (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 800 }}>
                        🚨 Emergency SOS
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>{c.name}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '2px' }}>{c.relationship}</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-primary-dark)', fontWeight: 700, marginTop: '4px' }}>📞 {c.phone}</p>
                  </div>
                  <button
                    onClick={() => triggerTestFamilyCall(c)}
                    className="btn btn-primary w-full"
                    style={{
                      padding: '12px', fontSize: '15px', fontWeight: 800,
                      backgroundColor: c.is_emergency_contact ? 'var(--color-danger)' : 'var(--color-primary)'
                    }}
                  >
                    📞 {language === 'ta' ? 'அழைக்கவும்' : 'Call Now'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── 7. ELDER HEALTH & ALARMS (Dedicated Screen with Chime Audio Tester) ─── */}
        {page === 'health' && (
          <>
            <div className="page-header">
              <div className="page-header-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
                <button onClick={triggerTestMedicineAlarm} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                  🔔 {language === 'ta' ? 'ஒலி மணி சோதனை' : 'Test Medicine Chime'}
                </button>
              </div>
              <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>💊 {t('health_and_meds', language)}</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>
                {language === 'ta' ? 'உங்கள் தினசரி மருந்துகள் மற்றும் நினைவூட்டல் அட்டவணை' : 'Your daily medication schedule and health reminders.'}
              </p>
            </div>

            <div className="stack" style={{ gap: '16px' }}>
              {reminders.map(rem => (
                <div key={rem.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px 24px',
                  border: rem.confirmed ? '2px solid var(--color-success)' : '2px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '36px' }}>{rem.type === 'MEDICATION' ? '💊' : rem.type === 'WATER' ? '💧' : '⏰'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{rem.time_of_day}</span>
                        {rem.confirmed && (
                          <span style={{ padding: '2px 8px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: 'var(--color-success)', fontSize: '12px', fontWeight: 700 }}>
                            ✓ {language === 'ta' ? 'சாப்பிட்டேன்' : 'Taken'}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '17px', color: 'var(--color-text)', marginTop: '4px' }}>{rem.title}</h4>
                      {rem.description && <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>{rem.description}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleReminder(rem.id)}
                    className="btn"
                    style={{
                      padding: '10px 20px', fontSize: '14px', fontWeight: 700, borderRadius: 'var(--radius-full)',
                      backgroundColor: rem.confirmed ? '#E8F5E9' : 'var(--color-primary)',
                      color: rem.confirmed ? '#2E7D32' : '#FFFFFF',
                      border: rem.confirmed ? '1.5px solid var(--color-success)' : 'none'
                    }}
                  >
                    {rem.confirmed ? (language === 'ta' ? '✓ எடுக்கப்பட்டது' : '✓ Completed') : (language === 'ta' ? 'மருந்து சாப்பிட்டேன்' : 'Mark as Taken')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── 8. ELDER MEMORY ALBUM ─── */}
        {page === 'memory' && (
          <>
            <div className="page-header">
              <div className="page-header-row" style={{ marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
                  ← {t('back_to_home', language)}
                </button>
              </div>
              <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>📸 {t('memories', language)}</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>
                {language === 'ta' ? 'குடும்ப புகைப்படங்கள் மற்றும் ஆஷா சேகரித்த நினைவுகள்' : 'Family photographs, life stories, and memories discovered by Asha AI.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {memoriesList.map(m => (
                <div key={m.id} className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', padding: 0, border: '1.5px solid var(--color-border)' }}>
                  {m.image_url && (
                    <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>{m.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>{m.content}</p>
                    {m.tags && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {m.tags.map((t: string) => (
                          <span key={t} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            CARETAKER DEDICATED PORTAL (Live Monitoring, Alarms, Notifications)
           ══════════════════════════════════════════════════════════════════════ */}

        {/* ─── CARETAKER DASHBOARD ─── */}
        {page === 'dashboard' && (
          <div className="stack" style={{ gap: 'var(--space-xl)' }}>
            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', color: '#4A148C' }}>
                    👨‍👩‍👧 {t('nav_overview', language)} — {linkedElder.name}
                  </h1>
                  <p className="text-muted" style={{ fontSize: '15px' }}>
                    {language === 'ta' ? 'முதியோரின் பாதுகாப்பு, உரையாடல் பகுப்பாய்வு மற்றும் நிகழ்நேர விழிப்பூட்டல்கள்' : 'Live cognitive health monitoring, memory synthesis & automated health alerts.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => navigateTo('caretaker_link')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    🔗 {language === 'ta' ? 'இணைப்பு குறியீடு' : 'Elder Link Code'}
                  </button>
                  {/* SOS Stop button visible to caretaker if siren is active */}
                  {sosActive && (
                    <button onClick={handleSOS} className="btn" style={{ backgroundColor: '#B71C1C', color: '#FFF', padding: '8px 16px', fontSize: '13px', animation: 'pulse 1s infinite' }}>
                      🔕 Stop SOS Siren
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Elder Account Summary Panel */}
            <div className="card" style={{ backgroundColor: '#F3E5F5', borderRadius: '20px', padding: '20px 24px', border: '2px solid #CE93D8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '17px', color: '#6A1B9A', fontWeight: 800 }}>
                  🔗 {language === 'ta' ? 'இணைக்கப்பட்ட முதியோர் கணக்கு' : 'Linked Elder Account'}
                </h3>
                <button onClick={() => navigateTo('caretaker_link')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  + {language === 'ta' ? 'மற்றொன்னை இணைக்க' : 'Link Another'}
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: 48 }}>👵👴</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 900 }}>{linkedElder.name}</h4>
                  <p style={{ fontSize: '13px', color: '#7B1FA2', marginTop: '2px' }}>ID: {linkedElder.id}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>
                      💊 {reminders.filter(r => r.is_active).length} Active Alarms
                    </span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 700 }}>
                      📋 {medicalReports.length} Medical Reports
                    </span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#FFF8E1', color: '#E65100', fontWeight: 700 }}>
                      📸 {memoriesList.length} Memories
                    </span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#FCE4EC', color: '#B71C1C', fontWeight: 700 }}>
                      🎮 Today: {gameTodayMinutes.toFixed(1)} / {gameDailyLimitMinutes > 0 ? gameDailyLimitMinutes : '∞'} min
                    </span>
                  </div>
                </div>
              </div>
              {/* Activity Log Preview */}
              {activityLog.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #E1BEE7', paddingTop: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#7B1FA2', marginBottom: '8px' }}>📊 Recent Activity Log</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {activityLog.slice(0, 5).map((entry, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
                        <span>📌 {entry.page.replace('_', ' ').toUpperCase()}</span>
                        <span>{((entry.durationMs || 0) / 1000 / 60).toFixed(1)} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Caretaker Game Time Limit Setter */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px 24px', border: '1.5px solid #FFA726' }}>
              <h4 style={{ fontSize: '16px', color: '#E65100', fontWeight: 800, marginBottom: '10px' }}>
                🎮 {language === 'ta' ? 'விளையாட்டு நேர வரம்பு அமைவு' : 'Set Daily Game Time Limit for Elder'}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={gameDailyLimitMinutes}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10) || 0;
                    setGameDailyLimitMinutes(val);
                    localStorage.setItem('granny_game_daily_limit_minutes', String(val));
                  }}
                  className="input"
                  style={{ width: '100px', textAlign: 'center', fontSize: '18px', fontWeight: 800 }}
                />
                <span style={{ fontSize: '15px', color: '#555' }}>{language === 'ta' ? 'நிமிடங்கள் / நாள் (0 = வரம்பில்லை)' : 'minutes / day (0 = unlimited)'}</span>
                <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '10px', backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 700 }}>
                  Today used: {gameTodayMinutes.toFixed(1)} min
                </span>
              </div>
            </div>

            {/* In-App Notifications Feed (Asha Conversational Health Alerts) */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '24px', border: '2px solid #E1BEE7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 800 }}>
                  🚨 {language === 'ta' ? 'நிகழ்நேர விழிப்பூட்டல்கள் & மின்னஞ்சல் அறிவிப்புகள்' : 'Live In-App Health Alerts & Email Dispatches'}
                </h3>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#EDE7F6', color: '#7B1FA2', fontWeight: 700 }}>
                  {caretakerNotifications.length} Alerts
                </span>
              </div>

              <div className="stack" style={{ gap: '10px' }}>
                {caretakerNotifications.map(notif => (
                  <div key={notif.id} style={{
                    padding: '14px 18px', borderRadius: '14px',
                    backgroundColor: notif.severity === 'HIGH' || notif.severity === 'URGENT' ? '#FFEBEE' : '#FAF7FD',
                    border: notif.severity === 'HIGH' || notif.severity === 'URGENT' ? '1.5px solid #E53935' : '1px solid #E1BEE7',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{notif.type === 'HEALTH_ALERT' ? '🚨' : '💬'}</span>
                        <strong style={{ fontSize: '14px', color: notif.severity === 'HIGH' ? '#C62828' : '#4A148C' }}>{notif.title}</strong>
                        <span style={{ fontSize: '11px', color: '#888' }}>({new Date(notif.created_at).toLocaleTimeString()})</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '4px' }}>{notif.message}</p>
                      {notif.transcript_excerpt && (
                        <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>
                          Excerpt: "{notif.transcript_excerpt}"
                        </p>
                      )}
                    </div>
                    {notif.email_sent && (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>
                        ✓ Email Sent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Caretaker Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <button className="card card-interactive" onClick={() => navigateTo('caretaker_alarms')} style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{ fontSize: '36px' }}>⏰</div>
                <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_alarms', language)}</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Set medicine alarms & timings</p>
              </button>
              <button className="card card-interactive" onClick={() => navigateTo('caretaker_medical')} style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{ fontSize: '36px' }}>📋</div>
                <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_medical', language)}</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Upload prescriptions & reports</p>
              </button>
              <button className="card card-interactive" onClick={() => navigateTo('caretaker_memories')} style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{ fontSize: '36px' }}>📸</div>
                <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_upload_memories', language)}</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Add vintage photos & memories</p>
              </button>
              <button className="card card-interactive" onClick={() => navigateTo('caretaker_contacts')} style={{ padding: '20px', borderRadius: '18px' }}>
                <div style={{ fontSize: '36px' }}>📞</div>
                <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_contacts', language)}</h4>
                <p className="text-muted" style={{ fontSize: '13px' }}>Manage 1-tap family contacts</p>
              </button>
            </div>
          </div>
        )}

        {/* ─── CARETAKER ALARMS ─── */}
        {page === 'caretaker_alarms' && (
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '26px', color: '#4A148C' }}>⏰ {t('nav_alarms', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '14px' }}>Alarms configured here play high-pitch audio chimes on the Elder's home screen.</p>
                </div>
                <button onClick={() => setShowAlarmModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>
                  + Add New Alarm
                </button>
              </div>
            </div>

            <div className="stack" style={{ gap: '12px' }}>
              {reminders.map(r => (
                <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '32px' }}>{r.type === 'MEDICATION' ? '💊' : '⏰'}</span>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{r.title}</strong>
                      <div style={{ fontSize: '13px', color: '#666' }}>Time: {r.time_of_day} | Type: {r.type}</div>
                    </div>
                  </div>
                  <button onClick={() => databaseService.deleteReminder(linkedElder.id, r.id).then(() => databaseService.getReminders(linkedElder.id).then(setReminders))} className="btn btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER MEDICAL REPORTS ─── */}
        {page === 'caretaker_medical' && (
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📋 {t('nav_medical', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '14px' }}>Doctor visits, lab reports, and geriatric prescriptions.</p>
                </div>
                <button onClick={() => setShowReportModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>
                  + Add Medical Report
                </button>
              </div>
            </div>

            <div className="stack" style={{ gap: '14px' }}>
              {medicalReports.map(rep => (
                <div key={rep.id} className="card" style={{ padding: '22px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', color: '#4A148C' }}>{rep.title}</h3>
                      <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>👨‍⚕️ {rep.doctor_name} | 📅 {rep.report_date} | 🏷️ {rep.category}</p>
                    </div>
                    <button onClick={() => databaseService.deleteMedicalReport(linkedElder.id, rep.id).then(() => databaseService.getMedicalReports(linkedElder.id).then(setMedicalReports))} className="btn btn-secondary" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
                      Delete
                    </button>
                  </div>
                  {rep.summary && <p style={{ fontSize: '14px', marginTop: '10px', lineHeight: 1.5 }}><strong>Summary:</strong> {rep.summary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER MEMORIES ─── */}
        {page === 'caretaker_memories' && (
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📸 {t('nav_upload_memories', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '14px' }}>Memories added here are instantly processed into Groq AI cognitive games & Asha AI stories.</p>
                </div>
                <button onClick={() => setShowMemoryModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>
                  + Upload New Memory
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {memoriesList.map(m => (
                <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
                  {m.image_url && <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{m.title}</h4>
                    <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER CONTACTS ─── */}
        {page === 'caretaker_contacts' && (
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="page-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📞 {t('nav_contacts', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '14px' }}>Manage 1-tap call family circle visible in the Elder's home sanctuary.</p>
                </div>
                <button onClick={() => setShowContactModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>
                  + Add Family Contact
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {familyContacts.map(c => (
                <div key={c.id} className="card" style={{ padding: '20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '40px' }}>{c.avatar_emoji || '👤'}</span>
                    <div>
                      <strong style={{ fontSize: '16px' }}>{c.name}</strong>
                      <div style={{ fontSize: '13px', color: '#666' }}>{c.relationship} • {c.phone}</div>
                    </div>
                  </div>
                  <button onClick={() => databaseService.deleteFamilyContact(linkedElder.id, c.id).then(() => databaseService.getFamilyContacts(linkedElder.id).then(setFamilyContacts))} className="btn btn-secondary" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER CARE GUIDE ─── */}
        {page === 'caretaker_guide' && (
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="page-header">
              <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📝 {t('nav_care_guide', language)}</h2>
              <p className="text-muted" style={{ fontSize: '14px' }}>Add notes about daily needs, sundowning tendencies, and guidance for Asha Voice AI.</p>
            </div>

            <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
              <div className="stack" style={{ gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Condition & Daily Routine Details
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={careNotes?.condition_details || ''}
                    onChange={e => setCareNotes(prev => prev ? { ...prev, condition_details: e.target.value } : null)}
                    style={{ width: '100%', borderRadius: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Caregiver Action Instructions
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={careNotes?.care_instructions || ''}
                    onChange={e => setCareNotes(prev => prev ? { ...prev, care_instructions: e.target.value } : null)}
                    style={{ width: '100%', borderRadius: '12px' }}
                  />
                </div>
                <button
                  onClick={() => careNotes && databaseService.saveCareNotes(careNotes).then(() => alert('✅ Care guide saved successfully!'))}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', backgroundColor: '#7B1FA2' }}
                >
                  Save Care Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CARETAKER LINK ELDER ─── */}
        {page === 'caretaker_link' && (
          <div className="stack" style={{ gap: 'var(--space-lg)', maxWidth: 640, margin: '0 auto' }}>
            <div className="page-header">
              <h2 style={{ fontSize: '26px', color: '#4A148C' }}>🔗 {t('nav_link_elder', language)}</h2>
              <p className="text-muted" style={{ fontSize: '14px' }}>Enter the 6-digit link code shown on the Elder's screen.</p>
            </div>

            <div className="card" style={{ padding: '32px', borderRadius: '22px' }}>
              <div className="stack" style={{ gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Elder Link Code (e.g. GRN-1234)
                  </label>
                  <input
                    className="input"
                    placeholder="GRN-XXXX"
                    value={linkInputCode}
                    onChange={e => setLinkInputCode(e.target.value.toUpperCase())}
                    style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', letterSpacing: '2px' }}
                  />
                </div>

                {linkFeedback && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: linkFeedback.startsWith('✅') ? '#E8F5E9' : '#FFEBEE', fontSize: '14px', fontWeight: 700 }}>
                    {linkFeedback}
                  </div>
                )}

                <button onClick={handleLinkElderAccount} className="btn btn-primary btn-large w-full" style={{ backgroundColor: '#7B1FA2' }}>
                  Link Elder Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 9. SETTINGS & 4 GROQ API KEYS POOL MANAGER ─── */}
        {page === 'settings' && (
          <div className="stack" style={{ gap: 'var(--space-xl)', maxWidth: 850, margin: '0 auto' }}>
            <div className="page-header">
              <div className="page-header-row" style={{ marginBottom: '8px' }}>
                <button className="page-header-back-btn" onClick={() => navigateTo(isCaretaker ? 'dashboard' : 'home')}>
                  ← {t('back_to_home', language)}
                </button>
              </div>
              <h2 style={{ fontSize: '28px', color: isCaretaker ? '#4A148C' : 'var(--color-primary-dark)' }}>⚙️ {t('nav_settings', language)}</h2>
              <p className="text-muted" style={{ fontSize: '15px' }}>
                {language === 'ta' ? 'அமைப்பு, மொழியியல், மற்றும் ஒலி சோதனை' : 'Preferences, Audio Chime testing, and Elder Link Codes.'}
              </p>
            </div>

            {/* Elder Link Code Display */}
            {!isCaretaker && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                  🔗 {language === 'ta' ? 'பராமரிப்பாளர் இணைப்பு குறியீடு' : 'Caregiver Link Code'}
                </h3>
                <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>
                  {language === 'ta' ? 'இந்தக் குறியீட்டை உங்கள் பராமரிப்பாளரிடம் பகிர்ந்தால், அவர்கள் நிகழ்நேரத்தில் உங்களுக்கு உதவ முடியும்.' : 'Share this code with your caregiver so they can set your medicine alarms and upload family photos.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '2px', padding: '8px 20px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                    {elderLinkCode || 'GRN-7821'}
                  </div>
                  <button onClick={handleCopyLinkCode} className="btn btn-secondary">
                    {codeCopied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Role Switcher & Audio Testing */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🔄 Switch Role / Audio Test</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
                <button onClick={handleSwitchRole} className="btn btn-secondary">
                  Switch to {isCaretaker ? 'Elder Sanctuary' : 'Caregiver Portal'}
                </button>
                <button onClick={triggerTestMedicineAlarm} className="btn btn-secondary">
                  💊 Test Medicine Chime
                </button>
                <button onClick={() => triggerTestFamilyCall()} className="btn btn-secondary">
                  📞 Test Incoming Call
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── Real-Time Medication Alert Modal (With Chime Pulse Ring) ─── */}
      {activeMedicationAlert && (
        <div className="medication-alert-overlay">
          <div className="medication-alert-card">
            <div className="chime-pulse-ring">
              💊
            </div>
            <h2 style={{ fontSize: '24px', color: '#C62828', fontWeight: 900 }}>
              {language === 'ta' ? 'மருந்து நேரம் வந்துவிட்டது!' : 'Medication Time!'}
            </h2>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1B4332', marginTop: '8px' }}>
              {activeMedicationAlert.title}
            </p>
            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
              {activeMedicationAlert.description}
            </p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  playTempleBellChime();
                  handleToggleReminder(activeMedicationAlert.id);
                  setActiveMedicationAlert(null);
                }}
                className="btn btn-primary btn-large"
                style={{ backgroundColor: '#2E7D32', padding: '14px 28px', fontSize: '16px', fontWeight: 800 }}
              >
                ✓ {language === 'ta' ? 'மருந்து சாப்பிட்டேன்' : 'Mark as Taken'}
              </button>
              <button
                onClick={() => setActiveMedicationAlert(null)}
                className="btn btn-secondary btn-large"
                style={{ padding: '14px 24px', fontSize: '15px' }}
              >
                ⏰ {language === 'ta' ? '5 நிமிடம் கழித்து' : 'Snooze 5 Mins'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Real-Time Incoming Family Call Modal ─── */}
      {activeIncomingCall && (
        <div className="medication-alert-overlay">
          <div className="incoming-call-card">
            <div style={{ fontSize: 72, marginBottom: 12 }}>
              {activeIncomingCall.avatar}
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900 }}>
              {activeIncomingCall.name}
            </h2>
            <p style={{ fontSize: '16px', color: '#D8F3DC', marginTop: '4px' }}>
              {activeIncomingCall.relationship} • {activeIncomingCall.phone}
            </p>
            <p style={{ fontSize: '14px', color: '#95D5B2', marginTop: '8px' }}>
              📞 Incoming Voice & Video Call...
            </p>
            <div style={{ marginTop: '28px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  alert(language === 'ta' ? `அழைப்பு இணைக்கப்பட்டது: ${activeIncomingCall.name} உடன் பேசுகிறீர்கள்.` : `Connected with ${activeIncomingCall.name}!`);
                  setActiveIncomingCall(null);
                }}
                style={{
                  backgroundColor: '#2E7D32', color: '#FFFFFF', border: 'none',
                  borderRadius: 'var(--radius-full)', padding: '14px 32px', fontSize: '16px',
                  fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(46, 125, 50, 0.4)'
                }}
              >
                📞 {language === 'ta' ? 'பேசு' : 'Answer'}
              </button>
              <button
                onClick={() => setActiveIncomingCall(null)}
                style={{
                  backgroundColor: '#C62828', color: '#FFFFFF', border: 'none',
                  borderRadius: 'var(--radius-full)', padding: '14px 28px', fontSize: '16px',
                  fontWeight: 800, cursor: 'pointer'
                }}
              >
                ✕ {language === 'ta' ? 'நிராகரி' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Caretaker Form Modals ─── */}
      {showAlarmModal && (
        <div className="medication-alert-overlay">
          <div className="card" style={{ maxWidth: 460, width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '16px' }}>⏰ Set New Elder Alarm</h3>
            <div className="stack" style={{ gap: '12px' }}>
              <input className="input" placeholder="Title (e.g. Evening Heart Medicine)" value={newAlarm.title} onChange={e => setNewAlarm({ ...newAlarm, title: e.target.value })} />
              <input className="input" placeholder="Time (e.g. 08:00 AM)" value={newAlarm.time_of_day} onChange={e => setNewAlarm({ ...newAlarm, time_of_day: e.target.value })} />
              <input className="input" placeholder="Description / Instructions" value={newAlarm.description} onChange={e => setNewAlarm({ ...newAlarm, description: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleCreateAlarm} className="btn btn-primary w-full" style={{ backgroundColor: '#7B1FA2' }}>Save Alarm</button>
                <button onClick={() => setShowAlarmModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="medication-alert-overlay">
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '16px' }}>📋 Add Medical Report</h3>
            <div className="stack" style={{ gap: '12px' }}>
              <input className="input" placeholder="Title (e.g. Apollo Cardiology Routine Checkup)" value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} />
              <input className="input" placeholder="Doctor Name" value={newReport.doctor_name} onChange={e => setNewReport({ ...newReport, doctor_name: e.target.value })} />
              <input className="input" type="date" value={newReport.report_date} onChange={e => setNewReport({ ...newReport, report_date: e.target.value })} />
              <textarea className="input" rows={3} placeholder="Medical summary & vitals" value={newReport.summary} onChange={e => setNewReport({ ...newReport, summary: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleCreateReport} className="btn btn-primary w-full" style={{ backgroundColor: '#7B1FA2' }}>Save Report</button>
                <button onClick={() => setShowReportModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="medication-alert-overlay">
          <div className="card" style={{ maxWidth: 460, width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '16px' }}>📞 Add Family Contact</h3>
            <div className="stack" style={{ gap: '12px' }}>
              <input className="input" placeholder="Name (e.g. Arun)" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
              <input className="input" placeholder="Relationship (e.g. Son)" value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })} />
              <input className="input" placeholder="Phone (+91 98401 23456)" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
              <input className="input" placeholder="Emoji (👨‍💼, 👩‍🎓, 🩺)" value={newContact.avatar_emoji} onChange={e => setNewContact({ ...newContact, avatar_emoji: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleCreateContact} className="btn btn-primary w-full" style={{ backgroundColor: '#7B1FA2' }}>Save Contact</button>
                <button onClick={() => setShowContactModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMemoryModal && (
        <div className="medication-alert-overlay">
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '16px' }}>📸 Add Family Memory</h3>
            <div className="stack" style={{ gap: '12px' }}>
              <input className="input" placeholder="Title (e.g. Madurai Temple Wedding 1975)" value={newMemory.title} onChange={e => setNewMemory({ ...newMemory, title: e.target.value })} />
              <textarea className="input" rows={3} placeholder="Memory story or description" value={newMemory.content} onChange={e => setNewMemory({ ...newMemory, content: e.target.value })} />
              <input className="input" placeholder="Photo URL (Optional)" value={newMemory.image_url} onChange={e => setNewMemory({ ...newMemory, image_url: e.target.value })} />
              <input className="input" placeholder="Tags (e.g. Wedding, Temple, Family)" value={newMemory.tags} onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleCreateMemory} className="btn btn-primary w-full" style={{ backgroundColor: '#7B1FA2' }}>Save Memory</button>
                <button onClick={() => setShowMemoryModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Persistent Voice Mic Button (For Elder View) ─── */}
      {!isCaretaker && (
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Tap to speak with Asha'}
        >
          {isListening ? '⏹' : '🎙️'}
        </button>
      )}

    </AppShell>
  );
}
