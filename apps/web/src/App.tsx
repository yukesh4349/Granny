import React, { useState, useEffect, useCallback } from 'react';
import { loadPersistedState, persistAuth, clearAuth, persistPreferences } from './store/appStore';
import { authApi, conversationApi, remindersApi, memoryApi, gamesApi } from './services/api';
import { supabaseAuth, databaseService, type MedicalReport, type FamilyContact, type CareNote, type ReminderItem } from './services/supabase';
import { t } from './i18n';
import { ALL_GAMES, getGameByKey } from './features/games/engine/games';
import AppShell from './components/navigation/AppShell';
import LandingPage from './pages/LandingPage';
import type { SessionState, DifficultyParams } from './features/games/engine/types';

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

  // Game state
  const [currentGameKey, setCurrentGameKey] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<SessionState | null>(null);
  const [gamePhase, setGamePhase] = useState<'memorize' | 'play' | 'result'>('memorize');
  const [gameTimer, setGameTimer] = useState(0);
  const [gameCategoryFilter, setGameCategoryFilter] = useState<'all' | 'outdoor' | 'indoor' | 'cinema'>('all');

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
  }, []);

  // Hash change synchronization listener
  useEffect(() => {
    const syncFromHash = () => {
      const rawHash = window.location.hash.replace('#', '') as Page;
      if (!rawHash) return;
      if (!user) {
        if (rawHash === 'auth') setPage('auth');
        else setPage('landing');
        return;
      }
      if (user.role === 'CAREGIVER') {
        if (CAREGIVER_PAGES.includes(rawHash)) {
          setPage(rawHash);
        } else {
          setPage('dashboard');
          window.location.hash = 'dashboard';
        }
      } else {
        if (ELDER_PAGES.includes(rawHash)) {
          setPage(rawHash);
        } else {
          setPage('home');
          window.location.hash = 'home';
        }
      }
    };

    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [user]);

  // Apply font size and contrast
  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontSize}px`;
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
  }, [fontSize, highContrast]);

  // Load Elder & Caretaker ecosystem data
  useEffect(() => {
    if (!user) return;
    const targetElderId = user.role === 'ELDER' ? user.id : linkedElder.id;

    databaseService.getOrGenerateLinkCode(targetElderId).then(setElderLinkCode);
    databaseService.getMedicalReports(targetElderId).then(setMedicalReports);
    databaseService.getFamilyContacts(targetElderId).then(setFamilyContacts);
    databaseService.getCareNotes(targetElderId).then(setCareNotes);
    databaseService.getReminders(targetElderId).then(setReminders);
    databaseService.getMemories(targetElderId).then(setMemoriesList);
  }, [user, linkedElder.id]);

  const toggleLanguage = () => {
    const next = language === 'ta' ? 'en' : 'ta';
    setLanguage(next);
    persistPreferences(fontSize, highContrast, next);
  };

  // ─── Auth Handlers ────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthError('');
    if (authMode === 'register') {
      if (!authForm.name.trim()) {
        setAuthError(language === 'ta' ? 'தயவுசெய்து உங்கள் பெயர்/பயனர் பெயரை உள்ளிடவும்' : 'Please enter full name / username');
        return;
      }
      if (!authForm.email.trim() && !authForm.phone.trim()) {
        setAuthError(language === 'ta' ? 'மின்னஞ்சல் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please provide email and phone');
        return;
      }
      if (!authForm.password || authForm.password.length < 6) {
        setAuthError(language === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்' : 'Password must be at least 6 characters');
        return;
      }
    } else {
      if (!authForm.email.trim() && !authForm.phone.trim()) {
        setAuthError(language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்' : 'Please enter email or phone');
        return;
      }
      if (!authForm.password) {
        setAuthError(language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter password');
        return;
      }
    }

    setIsAuthLoading(true);
    try {
      let result;
      if (authMode === 'register') {
        const emailToUse = authForm.email.trim() || `${authForm.phone.replace(/[^0-9]/g, '')}@granny.app`;
        try {
          result = await supabaseAuth.signUp({
            name: authForm.name.trim(),
            email: emailToUse,
            phone: authForm.phone.trim() || undefined,
            password: authForm.password,
            role: authForm.role as 'ELDER' | 'CAREGIVER',
            language,
          });
        } catch (supaErr: any) {
          result = await authApi.register({
            name: authForm.name.trim(),
            email: emailToUse,
            phone: authForm.phone.trim() || undefined,
            password: authForm.password,
            role: authForm.role,
          }).catch(() => ({
            user: {
              id: `usr_${Date.now()}`,
              name: authForm.name.trim(),
              email: emailToUse,
              phone: authForm.phone.trim(),
              role: authForm.role as 'ELDER' | 'CAREGIVER',
              language,
            },
            accessToken: `jwt_${Date.now()}`
          }));
        }
      } else {
        const loginIdentifier = authForm.email.trim() || authForm.phone.trim();
        const isEmail = loginIdentifier.includes('@');
        try {
          result = await supabaseAuth.signIn({
            email: isEmail ? loginIdentifier : undefined,
            phone: !isEmail ? loginIdentifier : undefined,
            password: authForm.password,
          });
        } catch (supaErr: any) {
          result = await authApi.login({
            email: isEmail ? loginIdentifier : undefined,
            phone: !isEmail ? loginIdentifier : undefined,
            password: authForm.password,
          }).catch(() => {
            throw new Error(supaErr.message || (language === 'ta' ? 'உள்நுழைவு தோல்வியடைந்தது. சான்றுகளை சரிபார்க்கவும்.' : 'Invalid credentials.'));
          });
        }
      }

      if (result && result.user) {
        setUser(result.user);
        setToken(result.accessToken);
        persistAuth(result.user, result.accessToken);
        navigateTo(result.user.role === 'CAREGIVER' ? 'dashboard' : 'home');
      }
    } catch (err: any) {
      setAuthError(err.message || (language === 'ta' ? 'அங்கீகாரப் பிழை ஏற்பட்டது' : 'Authentication failed'));
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
    if (!linkInputCode.trim()) return;
    try {
      const res = await databaseService.linkCaregiverToElder(user?.id || 'demo_caregiver', linkInputCode);
      setLinkedElder({ id: res.elderId, name: res.elderName });
      setLinkFeedback(language === 'ta' ? `வெற்றிகரமாக இணைக்கப்பட்டது: ${res.elderName}` : `Successfully linked to: ${res.elderName}`);
      setLinkInputCode('');
      // Refresh data
      databaseService.getMedicalReports(res.elderId).then(setMedicalReports);
      databaseService.getFamilyContacts(res.elderId).then(setFamilyContacts);
      databaseService.getCareNotes(res.elderId).then(setCareNotes);
      databaseService.getReminders(res.elderId).then(setReminders);
      databaseService.getMemories(res.elderId).then(setMemoriesList);
    } catch (err: any) {
      setLinkFeedback(err.message || 'Linking failed');
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
      const result = await conversationApi.send(msgText, conversationId || undefined);
      setConversationId(result.conversationId);

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_resp`,
        sender: 'assistant',
        text: result.reply,
        emotion: result.emotion,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg_${Date.now()}_fb`,
        sender: 'assistant',
        text: language === 'ta' ? "வணக்கம் தாத்தா & பாட்டி, நான் உங்களுடன் பேச தயாராக இருக்கிறேன். மீண்டும் சொல்லுங்கள்?" : "Hello dear Grandpa & Grandma, I'm right here with you. What would you like to talk about today?",
        emotion: 'calm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    }
    setIsThinking(false);
  };

  // ─── Game Handlers ────────────────────────────────────────────────────────
  const startGame = (gameKey: string) => {
    const game = getGameByKey(gameKey);
    if (!game) return;

    const difficulty: DifficultyParams = {
      difficulty: 3, itemCount: 4, delaySeconds: 6, distractorCount: 3,
    };

    const session = game.startSession(user?.id || 'guest', difficulty);
    setGameSession(session);
    setCurrentGameKey(gameKey);
    setGamePhase('memorize');
    navigateTo('play');

    setGameTimer(difficulty.delaySeconds);
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
  };

  const handleGameAnswer = (answer: string) => {
    if (!gameSession || !currentGameKey) return;
    const game = getGameByKey(currentGameKey);
    if (!game) return;

    game.submitAttempt(gameSession, answer);
    const isCompleted = gameSession.currentItemIndex >= gameSession.items.length;
    setGameSession({ ...gameSession });

    if (isCompleted) {
      setGamePhase('result');
      const summary = game.endSession(gameSession);
      gamesApi.submitAttempt({
        sessionId: gameSession.sessionId,
        score: summary.score,
        accuracy: summary.accuracy,
      }).catch(() => {});
    }
  };

  const finishGame = () => {
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
      alert(language === 'ta' ? 'உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.' : 'Voice recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (page === 'companion') {
        sendMessage(transcript);
      } else {
        setChatInput(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
  }, [isListening, language, page]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // ─── Landing Page ─────────────────────────────────────────────────────────
  if (!user && page !== 'auth') {
    return (
      <LandingPage
        onStartDemo={(role) => handleDemoLogin(role)}
        onOpenAuth={(mode) => { setAuthMode(mode || 'login'); navigateTo('auth'); }}
        highContrast={highContrast}
        onToggleContrast={() => {
          const next = !highContrast;
          setHighContrast(next);
          persistPreferences(fontSize, next, language);
        }}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  // ─── Auth Page (Compact, Single-Screen Design) ────────────────────────────
  if (page === 'auth') {
    return (
      <div style={{
        minHeight: '100vh', maxHeight: '100vh', overflowY: 'auto',
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 20px'
      }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigateTo('landing')}
              style={{ minHeight: 'auto', padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}
            >
              {t('back_to_home', language)}
            </button>

            <button
              onClick={toggleLanguage}
              className="btn btn-secondary"
              style={{ minHeight: 'auto', padding: '5px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>translate</span>
              <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>
          </div>

          <div className="text-center" style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '36px', lineHeight: 1 }}>🌸</div>
            <h2 style={{ color: 'var(--color-primary-dark)', margin: '4px 0 2px 0', fontSize: '24px', fontWeight: 800 }}>
              {t('app_name', language)}
            </h2>
            <p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>
              {t('auth_welcome_sub', language)}
            </p>
          </div>

          <div className="card" style={{
            padding: '20px', borderRadius: '18px',
            border: '2px solid var(--color-border)', backgroundColor: '#FFFFFF',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <button
                className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', minHeight: '38px', fontSize: '14px', fontWeight: 700 }}
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
              >
                {t('sign_in', language)}
              </button>
              <button
                className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', minHeight: '38px', fontSize: '14px', fontWeight: 700 }}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                {t('register', language)}
              </button>
            </div>

            <div className="stack" style={{ gap: '10px' }}>
              {authMode === 'register' && (
                <>
                  <div>
                    <input
                      className="input"
                      placeholder={t('full_name', language)}
                      value={authForm.name}
                      style={{ padding: '9px 12px', fontSize: '14px' }}
                      onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <select
                      className="input"
                      value={authForm.role}
                      style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                      onChange={e => setAuthForm(f => ({ ...f, role: e.target.value }))}
                    >
                      <option value="ELDER">{t('role_elder', language)}</option>
                      <option value="CAREGIVER">{t('role_caregiver', language)}</option>
                    </select>
                  </div>

                  <div>
                    <input
                      className="input"
                      placeholder={t('phone_number', language)}
                      type="tel"
                      value={authForm.phone}
                      style={{ padding: '9px 12px', fontSize: '14px' }}
                      onChange={e => setAuthForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div>
                <input
                  className="input"
                  placeholder={authMode === 'register' ? t('email_address', language) : (language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி எண்' : 'Email or Phone Number')}
                  value={authForm.email}
                  style={{ padding: '9px 12px', fontSize: '14px' }}
                  onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <input
                  className="input"
                  placeholder={t('password', language)}
                  type="password"
                  value={authForm.password}
                  style={{ padding: '9px 12px', fontSize: '14px' }}
                  onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
              </div>

              {authError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, padding: '4px 8px', backgroundColor: '#FFEBEE', borderRadius: '8px' }}>
                  {authError}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={handleAuth}
                disabled={isAuthLoading}
                style={{ padding: '11px', fontSize: '15px', fontWeight: 700, width: '100%', marginTop: '4px' }}
              >
                {isAuthLoading ? t('auth_loading', language) : authMode === 'login' ? t('auth_submit_login', language) : t('auth_submit_register', language)}
              </button>
            </div>
          </div>

          <div className="text-center" style={{ marginTop: '12px' }}>
            <p className="text-muted" style={{ fontSize: '12px', marginBottom: '8px' }}>
              {t('or_demo', language)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleDemoLogin('ELDER')}
                style={{ fontSize: '12px', padding: '7px 8px', fontWeight: 700, minHeight: '36px' }}
              >
                {t('demo_elder_btn', language)}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleDemoLogin('CAREGIVER')}
                style={{ fontSize: '12px', padding: '7px 8px', fontWeight: 700, minHeight: '36px' }}
              >
                {t('demo_caregiver_btn', language)}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── Picture-Based Game Play Page ──────────────────────────────────────────
  if (page === 'play' && gameSession && currentGameKey) {
    const game = getGameByKey(currentGameKey)!;
    const currentItem = game.getNextItem(gameSession);
    const summary = gamePhase === 'result' ? game.endSession(gameSession) : null;

    return (
      <div className="page container" style={{ padding: 'var(--space-xl) var(--space-lg)', maxWidth: '1100px', margin: '0 auto' }}>
        <div className="page-header" style={{ position: 'relative', marginBottom: 'var(--space-xl)' }}>
          <button className="btn btn-secondary" onClick={finishGame} style={{ position: 'absolute', left: 0, top: 0 }}>
            {language === 'ta' ? '← விளையாட்டுகளுக்கு திரும்பு' : '← Back to Games'}
          </button>
          <div style={{ fontSize: 56 }}>{game.icon}</div>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>{t(`game_${game.key.replace(/-/g, '_')}_title`, language) || game.title}</h2>
          <p className="text-muted" style={{ fontSize: '16px', marginTop: '4px' }}>{t(`game_${game.key.replace(/-/g, '_')}_desc`, language) || game.description}</p>
        </div>

        {gamePhase === 'memorize' && (
          <div className="text-center stack" style={{ gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontWeight: 700, fontSize: '16px', margin: '0 auto', border: '1.5px solid var(--color-primary)'
            }}>
              <span>⏱️</span>
              <span>{language === 'ta' ? `நினைவில் வையுங்கள் — ${gameTimer} வினாடிகள் மீதம்` : `Memorize Phase — ${gameTimer}s Remaining`}</span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
              {language === 'ta' ? 'இந்த பட அட்டைகளை உற்றுப் பார்த்து நினைவில் வையுங்கள்!' : 'Look closely at these picture cards and remember them!'}
            </h3>

            <div className="picture-grid">
              {gameSession.items.map((item, i) => {
                const meta = item.metadata || {};
                const emoji = meta.emoji || meta.recipeEmoji || meta.storyEmoji || meta.spotEmoji || '🌸';
                const title = meta.object || meta.itemName || meta.name || meta.recipeTitle || meta.plant || meta.scene || meta.item || item.prompt;
                const answer = (item.correctAnswer as string);

                return (
                  <div key={i} className="picture-card" style={{ borderColor: game.color }}>
                    <div style={{ fontSize: '56px', marginBottom: '6px' }}>{emoji}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>{title}</div>
                    <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-border)', width: '100%' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        📍 {answer}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '36px', color: 'var(--color-primary)', fontWeight: 800 }}>
              {gameTimer}s
            </div>

            <button className="btn btn-primary btn-large" onClick={() => setGamePhase('play')} style={{ alignSelf: 'center', minWidth: '240px' }}>
              {language === 'ta' ? 'நான் தயார்! விடையளிக்கவும் →' : "I'm Ready! Answer Now →"}
            </button>
          </div>
        )}

        {gamePhase === 'play' && currentItem && (
          <div className="stack text-center" style={{ gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontWeight: 700, margin: '0 auto', fontSize: '15px'
            }}>
              <span>{language === 'ta' ? `கேள்வி ${gameSession.currentItemIndex + 1} / ${gameSession.items.length}` : `Question ${gameSession.currentItemIndex + 1} of ${gameSession.items.length}`}</span>
            </div>

            <div className="card" style={{ maxWidth: '780px', margin: '0 auto', padding: 'var(--space-2xl)', background: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-xl)' }}>
              {currentItem.metadata?.emoji && (
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>{currentItem.metadata.emoji}</div>
              )}
              
              <h3 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-xl)', lineHeight: 1.4 }}>
                {currentItem.prompt}
              </h3>

              <div className="picture-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                {currentItem.choices?.map((choice, i) => (
                  <button
                    key={i}
                    className="picture-card btn"
                    onClick={() => handleGameAnswer(choice)}
                    style={{
                      height: 'auto', minHeight: '90px', padding: '16px',
                      justifyContent: 'center', fontSize: '17px', fontWeight: 700,
                      backgroundColor: 'var(--color-bg)', color: 'var(--color-text)',
                      textAlign: 'center', cursor: 'pointer', borderWidth: '2px'
                    }}
                  >
                    <span>{choice}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {gamePhase === 'result' && summary && (
          <div className="stack text-center" style={{ maxWidth: '600px', margin: '0 auto', gap: 'var(--space-lg)' }}>
            <div style={{ fontSize: 80 }}>{summary.accuracy >= 70 ? '🌸' : summary.accuracy >= 40 ? '👍' : '💪'}</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {summary.accuracy >= 70 
                ? (language === 'ta' ? 'அருமையான நினைவாற்றல் பயிற்சி!' : 'Wonderful Memory Activity!') 
                : summary.accuracy >= 40 
                ? (language === 'ta' ? 'நல்ல முயற்சி!' : 'Good effort!') 
                : (language === 'ta' ? 'தொடர்ந்து பயிற்சி செய்யுங்கள்!' : 'Great practice!')}
            </h2>
            
            <div className="card" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-border)' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>
                {language === 'ta' ? 'மதிப்பெண்:' : 'Score:'} <strong>{summary.score}</strong>
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>{summary.correctCount} / {summary.totalItems}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{language === 'ta' ? 'சரியான விடைகள்' : 'Correct Items'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>{summary.accuracy}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{language === 'ta' ? 'துல்லியம்' : 'Accuracy'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-large" onClick={() => startGame(currentGameKey)}>
                {language === 'ta' ? 'மீண்டும் விளையாடு 🔄' : 'Play Again 🔄'}
              </button>
              <button className="btn btn-primary btn-large" onClick={finishGame}>
                {language === 'ta' ? 'அனைத்து விளையாட்டுகள் 🧩' : 'Back to All Games 🧩'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Main App Shell ────────────────────────────────────────────────────────
  return (
    <AppShell
      user={user!}
      page={page}
      setPage={navigateTo}
      onLogout={handleLogout}
      language={language}
      onToggleLanguage={toggleLanguage}
    >
      <div className="container" style={{ paddingBottom: '120px' }}>

        {/* ══════════════════════════════════════════════════════════════════════
            ELDER PORTAL SPACES
           ══════════════════════════════════════════════════════════════════════ */}

        {/* ─── ELDER HOME ─── */}
        {page === 'home' && (
          <>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h1 style={{ fontSize: '32px', color: 'var(--color-primary-dark)' }}>
                  {t('hello_user', language)}, {user?.name || (language === 'ta' ? 'தாத்தா & பாட்டி' : 'Grandpa & Grandma')}! 👋
                </h1>
                <p className="text-muted mt-xs" style={{ fontSize: '18px' }}>
                  {t('how_feeling', language)}
                </p>
              </div>

              {/* Link Code Quick Card for Elder */}
              <div style={{
                backgroundColor: '#FFFFFF', padding: '10px 18px', borderRadius: '14px',
                border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    {t('your_link_code', language)}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-primary-dark)', letterSpacing: '1px' }}>
                    {elderLinkCode || 'GRN-4892'}
                  </div>
                </div>
                <button className="btn btn-secondary" onClick={handleCopyLinkCode} style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'auto' }}>
                  {codeCopied ? t('code_copied', language) : t('copy_code', language)}
                </button>
              </div>
            </div>

            <div className="stack" style={{ gap: 'var(--space-lg)' }}>
              {/* Quick Actions Grid for Elders */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <button className="card card-interactive" onClick={() => navigateTo('companion')}
                  style={{ background: 'linear-gradient(135deg, #EFFBF2 0%, #D8F3DC 100%)', textAlign: 'center', padding: '24px 16px', border: '2px solid #B7E4C7' }}>
                  <div style={{ fontSize: 44 }}>💬</div>
                  <h3 style={{ marginTop: '8px', color: '#1B4332' }}>{t('talk_to_granny', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px' }}>{t('voice_companion_chat', language)}</p>
                </button>

                <button className="card card-interactive" onClick={() => navigateTo('family')}
                  style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', textAlign: 'center', padding: '24px 16px', border: '2px solid #FFCC80' }}>
                  <div style={{ fontSize: 44 }}>👨‍👩‍👧‍👦</div>
                  <h3 style={{ marginTop: '8px', color: '#E65100' }}>{t('family_circle', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px' }}>{t('family_circle_desc', language)}</p>
                </button>

                <button className="card card-interactive" onClick={() => navigateTo('games')}
                  style={{ background: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)', textAlign: 'center', padding: '24px 16px', border: '2px solid #B39DDB' }}>
                  <div style={{ fontSize: 44 }}>🧩</div>
                  <h3 style={{ marginTop: '8px', color: '#4A148C' }}>{t('play_games', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px' }}>{t('ten_memory_games', language)}</p>
                </button>

                <button className="card card-interactive" onClick={() => navigateTo('health')}
                  style={{ background: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)', textAlign: 'center', padding: '24px 16px', border: '2px solid #F48FB1' }}>
                  <div style={{ fontSize: 44 }}>💊</div>
                  <h3 style={{ marginTop: '8px', color: '#880E4F' }}>{t('health_and_meds', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px' }}>{t('reminders_schedule', language)}</p>
                </button>

                <button className="card card-interactive" onClick={() => navigateTo('memory')}
                  style={{ background: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)', textAlign: 'center', padding: '24px 16px', border: '2px solid #80CBC4' }}>
                  <div style={{ fontSize: 44 }}>📸</div>
                  <h3 style={{ marginTop: '8px', color: '#004D40' }}>{t('memories', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px' }}>{t('your_life_stories', language)}</p>
                </button>
              </div>

              {/* JIT Micro-Intervention Quick Spark */}
              <div className="card" style={{ background: 'var(--color-primary-bg)', border: '2px solid var(--color-primary)', borderRadius: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '20px' }}>{t('spark_title', language)}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: '16px' }}>
                      {activeMicroDose ? activeMicroDose.task : t('spark_default', language)}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => {
                    setActiveMicroDose({
                      title: 'Verandah Observation',
                      prompt: 'Look around your room right now.',
                      task: language === 'ta' ? 'உங்கள் அறையில் நீல அல்லது பச்சை நிறத்தில் உள்ள 3 பொருட்களை கூறுங்கள்!' : 'Name 3 things in your room that are blue or green!'
                    });
                  }} style={{ padding: '10px 20px', fontSize: '15px' }}>
                    {activeMicroDose ? t('spark_done', language) : t('spark_start', language)}
                  </button>
                </div>
              </div>

              {/* Life-Story Memory Theatre Highlight */}
              <div className="card card-interactive" onClick={() => { setTheatreStep(0); setTheatreFeedback(null); navigateTo('theatre'); }}
                style={{ background: 'linear-gradient(135deg, var(--color-secondary-light), var(--color-secondary))', border: '1px solid var(--color-secondary-dark)', borderRadius: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ fontSize: 48 }}>🎭</div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '22px' }}>{t('theatre_banner_title', language)}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.95)', marginTop: 4, fontSize: '15px' }}>
                      {t('theatre_banner_desc', language)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Friendly Voice Assistant Tip */}
              <div className="card" style={{ background: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '16px' }}>
                <p style={{ fontSize: '16px', color: 'var(--color-text)' }}>
                  🌟 {t('mic_tip', language)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ─── ELDER FAMILY CIRCLE (1-Tap Call) ─── */}
        {page === 'family' && (
          <>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>👨‍👩‍👧‍👦 {t('nav_family', language)}</h2>
              <p className="text-muted">{language === 'ta' ? 'உங்கள் குடும்பத்தினருடன் எளிதாகப் பேச ஒருமுறை தட்டவும்' : 'Tap any family member card below to call them instantly.'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {familyContacts.map(c => (
                <div key={c.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px',
                  border: c.is_emergency_contact ? '2.5px solid var(--color-danger)' : '2px solid var(--color-border)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '48px' }}>{c.avatar_emoji || '👤'}</span>
                    {c.is_emergency_contact && (
                      <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 800 }}>
                        🚨 Emergency SOS
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '22px', fontWeight: 800 }}>{c.name}</h3>
                    <div style={{ color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: '15px' }}>{c.relationship}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>{c.phone}</div>
                    {c.notes && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px' }}>{c.notes}</p>}
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                    className="btn btn-primary btn-large w-full"
                    style={{
                      marginTop: 'auto', textDecoration: 'none', textAlign: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontSize: '18px', fontWeight: 800, padding: '14px'
                    }}
                  >
                    <span>📞</span>
                    <span>{t('call_now', language)}</span>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── ELDER HEALTH & ALARMS ─── */}
        {page === 'health' && (
          <>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>💊 {t('nav_health', language)}</h2>
              <p className="text-muted">{language === 'ta' ? 'பராமரிப்பாளர் அமைத்த தினசரி மருந்து மற்றும் ஆரோக்கிய அலாரங்கள்' : 'Daily alarms and medication schedule synced by your caregiver.'}</p>
            </div>

            <div className="stack" style={{ gap: '14px' }}>
              {reminders.map((r) => (
                <div key={r.id} className={`reminder-card ${r.confirmed ? 'confirmed' : ''}`} style={{
                  padding: '20px', borderRadius: '18px', backgroundColor: r.confirmed ? '#E8F5E9' : '#FFFFFF',
                  border: r.confirmed ? '2px solid #81C784' : '2px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', gap: '18px'
                }}>
                  <div style={{
                    fontSize: '22px', fontWeight: 900, color: 'var(--color-primary-dark)',
                    minWidth: '110px', textAlign: 'center', padding: '8px',
                    borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)'
                  }}>
                    ⏰ {r.time_of_day}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '20px', color: 'var(--color-text)' }}>{r.title}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                      {r.type} {r.description ? `• ${r.description}` : ''}
                    </div>
                  </div>
                  <button
                    className={`btn ${r.confirmed ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => handleToggleReminder(r.id)}
                    style={{ minWidth: 140, padding: '12px 18px', fontSize: '16px', fontWeight: 800 }}
                  >
                    {r.confirmed ? (language === 'ta' ? '✓ குடித்தேன்' : '✓ Done') : (language === 'ta' ? 'எடுத்துக்கொண்டேன்' : 'I Took It')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── ELDER MEMORIES ─── */}
        {page === 'memory' && (
          <>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>📸 {t('nav_memory', language)}</h2>
              <p className="text-muted">{language === 'ta' ? 'குடும்பத்தினர் பதிவேற்றிய உங்கள் அழகான வாழ்க்கைக் கதைகள் மற்றும் புகைப்படங்கள்' : 'Cherished family photos and life stories uploaded by you and your loved ones.'}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
              {memoriesList.map((m, i) => (
                <div key={m.id || i} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '20px',
                  border: '1.5px solid var(--color-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {m.image_url && (
                    <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '14px' }} />
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{m.title}</h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>{m.content}</p>
                  {m.tags && Array.isArray(m.tags) && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                      {m.tags.map((t: string) => (
                        <span key={t} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── ELDER COMPANION CHAT ─── */}
        {page === 'companion' && (
          <>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>💬 {t('nav_companion', language)}</h2>
              <p className="text-muted">{language === 'ta' ? 'ஆஷாவுடன் அன்பாகவும் பொறுமையாகவும் பேசுங்கள்' : 'Have a gentle, patient conversation with Asha Voice AI.'}</p>
            </div>

            <div className="chat-container" style={{ minHeight: '50vh' }}>
              {messages.length === 0 && (
                <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <div style={{ fontSize: 72 }}>👵👴</div>
                  <p className="text-large mt-lg" style={{ fontSize: '22px', fontWeight: 700 }}>
                    {language === 'ta' ? 'வணக்கம் தாத்தா & பாட்டி! நான் ஆஷா.' : "Hello Grandpa & Grandma! I'm Asha."}
                  </p>
                  <p className="text-muted mt-sm">{language === 'ta' ? 'வணக்கம் சொல்லுங்கள் அல்லது கீழே தட்டச்சு செய்யுங்கள்.' : 'Say hello or tap the mic button to talk anytime.'}</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}

              {isThinking && (
                <div className="chat-bubble assistant">
                  <div className="waveform">
                    {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: 700, margin: '0 auto' }}>
                <input className="input" placeholder={language === 'ta' ? 'உங்கள் செய்தியை எழுதுங்கள்...' : 'Type your message...'} value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                <button className="btn btn-primary" onClick={() => sendMessage()}>{language === 'ta' ? 'அனுப்பு' : 'Send'}</button>
              </div>
            </div>
          </>
        )}

        {/* ─── ELDER GAMES WORLD (20 Nostalgia-Based Cognitive Games) ─── */}
        {page === 'games' && (
          <>
            <div className="page-header" style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '30px', color: 'var(--color-primary-dark)' }}>🧩 {t('games_title', language)}</h2>
                  <p className="text-muted" style={{ fontSize: '16px', marginTop: '4px' }}>
                    {t('games_subtitle', language)}
                  </p>
                </div>
                <div style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
                  fontSize: '14px', fontWeight: 800, border: '1.5px solid var(--color-primary)'
                }}>
                  🌸 20 {language === 'ta' ? 'பாரம்பரிய விளையாட்டுகள்' : 'Nostalgia Games'}
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
              {[
                { id: 'all' as const, label: `${t('games_cat_all', language)} (20)` },
                { id: 'outdoor' as const, label: `🏃 ${t('games_cat_outdoor', language)} (10)` },
                { id: 'indoor' as const, label: `🎲 ${t('games_cat_indoor', language)} (5)` },
                { id: 'cinema' as const, label: `🎬 ${t('games_cat_cinema', language)} (5)` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setGameCategoryFilter(tab.id)}
                  className="btn"
                  style={{
                    padding: '10px 20px', fontSize: '15px', fontWeight: 700,
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

            <div className="game-world" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {ALL_GAMES.filter((_, idx) => {
                if (gameCategoryFilter === 'all') return true;
                if (gameCategoryFilter === 'outdoor') return idx < 10;
                if (gameCategoryFilter === 'indoor') return idx >= 10 && idx < 15;
                if (gameCategoryFilter === 'cinema') return idx >= 15;
                return true;
              }).map((game) => {
                const gameKeyI18n = game.key.replace(/-/g, '_');
                const title = t(`game_${gameKeyI18n}_title`, language) || game.title;
                const desc = t(`game_${gameKeyI18n}_desc`, language) || game.description;
                const globalIndex = ALL_GAMES.findIndex(g => g.key === game.key);
                const catBadge = globalIndex < 10 
                  ? (language === 'ta' ? '🏃 வெளியரங்கம்' : '🏃 Outdoor') 
                  : globalIndex < 15 
                  ? (language === 'ta' ? '🎲 உள்ளரங்கம்' : '🎲 Indoor') 
                  : (language === 'ta' ? '🎬 சினிமா' : '🎬 Cinema');

                return (
                  <div
                    key={game.key}
                    className="game-card card card-interactive"
                    style={{
                      borderLeftColor: game.color, borderLeftWidth: 6, borderLeftStyle: 'solid',
                      padding: '20px', backgroundColor: '#FFFFFF', borderRadius: '18px',
                      display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer'
                    }}
                    onClick={() => startGame(game.key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="game-icon" style={{ fontSize: '40px' }}>{game.icon}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '10px',
                        backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)'
                      }}>
                        {catBadge}
                      </span>
                    </div>

                    <div className="game-info">
                      <div className="game-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>
                        {title}
                      </div>
                      <div className="game-desc" style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        {desc}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                        {language === 'ta' ? 'தொடங்கு →' : 'Start Game →'}
                      </span>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px'
                      }}>
                        ▶
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── ELDER THEATRE ─── */}
        {page === 'theatre' && (
          <>
            <div className="page-header">
              <button className="btn btn-secondary" onClick={() => setPage('home')} style={{ position: 'absolute', left: 'var(--space-lg)' }}>
                {t('back_to_home', language)}
              </button>
              <div style={{ fontSize: 48 }}>🎭</div>
              <h2>{t('theatre_banner_title', language)}</h2>
              <p className="text-muted">{language === 'ta' ? 'ஊடாடும் காட்சி: "வராண்டாவில் திருவிழா காலை"' : 'Interactive Scene: "Festival Morning on the Verandah"'}</p>
            </div>

            <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-xl)', background: 'var(--color-card-bg)', border: '2px solid var(--color-primary)' }}>
              {theatreStep === 0 && (
                <div className="stack text-center">
                  <div style={{ fontSize: 56 }}>🌅</div>
                  <h3 style={{ color: 'var(--color-primary)' }}>{language === 'ta' ? 'காட்சி 1: திருவிழா காலை' : 'Scene 1: The Festival Morning'}</h3>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6, margin: 'var(--space-md) 0' }}>
                    {language === 'ta'
                      ? '"சூரியன் மெதுவாக உதிக்க, பூஜை மணியின் ஓசை கேட்டது. திருவிழாவிற்கு நீங்கள் முதலில் எதை தயார் செய்தீர்கள்?"'
                      : '"The sun rose warm over the terrace, and the brass bells in the prayer room chimed softly. What did you and family begin preparing first?"'}
                  </p>
                  <div className="stack" style={{ gap: 'var(--space-sm)' }}>
                    {(language === 'ta' 
                      ? ['பாரம்பரிய இனிப்பு & முறுக்கு', 'புதிய மல்லிகைப் பூ மாலை', 'பித்தளை விளக்கு ஏற்றுதல்']
                      : ['Traditional Sweets & Murukku', 'Fresh Jasmine Garlands', 'Lighting the Brass Lamps']
                    ).map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" onClick={() => {
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
                  <div style={{ fontSize: 56 }}>👨‍👩‍👦</div>
                  <h3 style={{ color: 'var(--color-primary)' }}>{language === 'ta' ? 'காட்சி 2: வராண்டாவில் குடும்பம்' : 'Scene 2: Gathering on the Verandah'}</h3>
                  <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>{theatreFeedback}</p>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6, margin: 'var(--space-md) 0' }}>
                    {language === 'ta'
                      ? '"அனைவரும் பட்டு ஆடைகள் அணிந்திருந்தனர். அன்று காலை குடும்ப ஆசீர்வாதங்களை யார் வழங்கினார்கள்?"'
                      : '"Everyone wore their new silk clothes. Who gave the traditional family blessings that morning?"'}
                  </p>
                  <div className="stack" style={{ gap: 'var(--space-sm)' }}>
                    {(language === 'ta'
                      ? ['தாத்தா பட்டு அங்கவஸ்திரத்துடன்', 'மதுரையிலிருந்து வந்த பெரியப்பா', 'குடும்பப் பெரியவர்கள் அனைவரும் ஒன்றாக']
                      : ['Grandfather in his silk angavastram', 'Visiting Uncle from Madurai', 'The family elders together']
                    ).map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" onClick={() => {
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
                  <div style={{ fontSize: 64 }}>🌟</div>
                  <h2 style={{ color: 'var(--color-success)' }}>{language === 'ta' ? 'நினைவுக் காட்சி நிறைவுற்றது!' : 'Memory Episode Complete!'}</h2>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6 }}>
                    {language === 'ta'
                      ? '"இந்தக் கதையை நீங்கள் அழகாகப் பகிர்ந்தீர்கள். உங்கள் விலைமதிப்பற்ற நினைவுகள் குடும்ப வட்டத்தில் என்றும் வாழும்."'
                      : '"You shared this story beautifully. Your precious memories remain alive and treasured in our family circle."'}
                  </p>
                  <button className="btn btn-primary btn-large mt-lg" onClick={() => { setTheatreStep(0); setPage('home'); }}>
                    {t('back_to_home', language)}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            CARETAKER DEDICATED PORTAL (No games duplication — 100% Caregiver tools)
           ══════════════════════════════════════════════════════════════════════ */}

        {/* ─── CARETAKER DASHBOARD (Live Activity & Cognitive Monitoring) ─── */}
        {page === 'dashboard' && (
          <div className="stack" style={{ gap: 'var(--space-xl)' }}>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '28px' }}>🌿</span>
                  <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>{linkedElder.name}</h2>
                </div>
                <p className="text-muted" style={{ fontSize: '15px' }}>
                  {language === 'ta' ? 'முதியோரின் அன்றாட செயல்பாடுகள், மனநிலை & அறிவாற்றல் கண்காணிப்பு' : 'Live Cognitive & Health Telemetry for your loved elder.'}
                </p>
              </div>

              {/* Quick Caretaker Action Bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigateTo('caretaker_alarms')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  + {t('add_alarm', language)}
                </button>
                <button className="btn btn-secondary" onClick={() => navigateTo('caretaker_medical')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  + {t('upload_new_report', language)}
                </button>
                <button className="btn btn-secondary" onClick={() => navigateTo('caretaker_link')} style={{ padding: '8px 16px', fontSize: '14px' }}>
                  🔗 {t('nav_link_elder', language)}
                </button>
              </div>
            </div>

            {/* Cognitive AI Summary */}
            <div className="card" style={{ background: 'var(--color-primary-bg)', border: '2px solid var(--color-primary)', borderRadius: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <h3 style={{ color: 'var(--color-primary-dark)' }}>
                  {language === 'ta' ? 'AI வாராந்திர அறிவாற்றல் மேலோட்டம்' : 'Weekly Cognitive & Mood Observation'}
                </h3>
              </div>
              <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>
                {language === 'ta'
                  ? `${linkedElder.name} இந்த வாரம் நிலையான மனநிலையுடன் இருந்தார். காலை மருந்து அட்டவணையை 100% சரியாகப் பின்பற்றினார். மாலை நேரங்களில் இசை விளையாட்டுகளில் அதிக ஈடுபாடு காட்டினார்.`
                  : `${linkedElder.name} has maintained strong cognitive rhythm this week. Medication adherence is at 100%. Morning flower arrangement and AIR tunes were their highest engagement activities.`}
              </p>
            </div>

            {/* Vitals & Telemetry Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '16px' }}>
                <p className="text-muted uppercase" style={{ fontSize: '12px', fontWeight: 700 }}>{language === 'ta' ? 'மருந்து ஒழுங்குமுறை' : 'Med Adherence'}</p>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary)', marginTop: '4px' }}>100%</div>
                <p style={{ fontSize: '13px', color: 'var(--color-success)', marginTop: '4px' }}>✓ All today's alarms confirmed</p>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '16px' }}>
                <p className="text-muted uppercase" style={{ fontSize: '12px', fontWeight: 700 }}>{language === 'ta' ? 'நினைவாற்றல் பயிற்சிகள்' : 'Cognitive Sessions'}</p>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-secondary-dark)', marginTop: '4px' }}>14</div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>+3 games played today</p>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '16px' }}>
                <p className="text-muted uppercase" style={{ fontSize: '12px', fontWeight: 700 }}>{language === 'ta' ? 'செயல்பாட்டு நேரம்' : 'Active Time'}</p>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-accent)', marginTop: '4px' }}>180m</div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Steady unhurried pace</p>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: '16px' }}>
                <p className="text-muted uppercase" style={{ fontSize: '12px', fontWeight: 700 }}>{language === 'ta' ? 'மருத்துவ அறிக்கைகள்' : 'Medical Reports'}</p>
                <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary-dark)', marginTop: '4px' }}>{medicalReports.length}</div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Synced on cloud</p>
              </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1.5px solid var(--color-border)', padding: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
                {language === 'ta' ? 'அண்மைக்கால செயல்பாட்டுப் பதிவு' : 'Real-Time Activity & Alarm Feed'}
              </h3>
              <div className="stack" style={{ gap: '12px' }}>
                {reminders.slice(0, 3).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--color-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>💊</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Scheduled: {r.time_of_day}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', backgroundColor: r.confirmed ? '#E8F5E9' : '#FFF3E0', color: r.confirmed ? '#2E7D32' : '#E65100' }}>
                      {r.confirmed ? '✓ Confirmed by Elder' : '⏳ Pending Confirmation'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── CARETAKER: SET ALARMS & REMINDERS ─── */}
        {page === 'caretaker_alarms' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>⏰ {t('alarms_title', language)}</h2>
                <p className="text-muted">{t('alarms_sub', language)}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAlarmModal(true)} style={{ padding: '10px 20px', fontSize: '15px' }}>
                {t('add_alarm', language)}
              </button>
            </div>

            {/* Modal to Add Alarm */}
            {showAlarmModal && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                  {t('add_alarm', language)}
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  <input
                    className="input"
                    placeholder={t('alarm_title_placeholder', language)}
                    value={newAlarm.title}
                    onChange={e => setNewAlarm({ ...newAlarm, title: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700 }}>{t('alarm_time', language)}</label>
                      <input
                        className="input"
                        placeholder="e.g. 08:00 AM"
                        value={newAlarm.time_of_day}
                        onChange={e => setNewAlarm({ ...newAlarm, time_of_day: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700 }}>{t('alarm_type', language)}</label>
                      <select
                        className="input"
                        value={newAlarm.type}
                        onChange={e => setNewAlarm({ ...newAlarm, type: e.target.value as any })}
                      >
                        <option value="MEDICATION">💊 Medicine Tablet / Drops</option>
                        <option value="WATER">💧 Drink Warm Water</option>
                        <option value="MEAL">🍲 Breakfast / Lunch / Dinner</option>
                        <option value="EXERCISE">🚶 Garden Walk & Exercise</option>
                        <option value="CUSTOM">🔔 Custom Alert</option>
                      </select>
                    </div>
                  </div>
                  <input
                    className="input"
                    placeholder="Caregiver notes / instructions (e.g. Take after breakfast with warm milk)"
                    value={newAlarm.description}
                    onChange={e => setNewAlarm({ ...newAlarm, description: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowAlarmModal(false)}>{t('cancel', language)}</button>
                    <button className="btn btn-primary" onClick={handleCreateAlarm}>{t('save_alarm', language)}</button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Active Alarms */}
            <div className="stack" style={{ gap: '12px' }}>
              {reminders.map(r => (
                <div key={r.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '18px 22px',
                  border: '1.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ padding: '8px 14px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontWeight: 800, fontSize: '16px' }}>
                      ⏰ {r.time_of_day}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{r.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.type} {r.description ? `• ${r.description}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', backgroundColor: r.confirmed ? '#E8F5E9' : '#FFF3E0', color: r.confirmed ? '#2E7D32' : '#E65100' }}>
                      {r.confirmed ? '✓ Confirmed by Elder' : '⏳ Awaiting Confirmation'}
                    </span>
                    <button className="btn btn-secondary" onClick={() => databaseService.deleteReminder(linkedElder.id, r.id).then(() => setReminders(reminders.filter(x => x.id !== r.id)))} style={{ color: 'var(--color-danger)' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER: MEDICAL REPORTS & PRESCRIPTIONS ─── */}
        {page === 'caretaker_medical' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>📋 {t('med_reports_title', language)}</h2>
                <p className="text-muted">{t('med_reports_sub', language)}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowReportModal(true)} style={{ padding: '10px 20px', fontSize: '15px' }}>
                {t('upload_new_report', language)}
              </button>
            </div>

            {/* Upload Medical Report Modal */}
            {showReportModal && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                  {t('upload_new_report', language)}
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  <input
                    className="input"
                    placeholder={t('report_title_label', language)}
                    value={newReport.title}
                    onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <input
                      className="input"
                      placeholder={t('doctor_name_label', language)}
                      value={newReport.doctor_name}
                      onChange={e => setNewReport({ ...newReport, doctor_name: e.target.value })}
                    />
                    <select
                      className="input"
                      value={newReport.category}
                      onChange={e => setNewReport({ ...newReport, category: e.target.value as any })}
                    >
                      <option value="Prescription">💊 Prescription</option>
                      <option value="Doctor Visit">🩺 Doctor Consultation</option>
                      <option value="Lab Test">🧪 Lab Blood/Urine Test</option>
                      <option value="Scan">🩻 X-Ray / Scan</option>
                      <option value="Vitals">❤️ Vitals Checkup</option>
                    </select>
                  </div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder={t('report_summary_label', language)}
                    value={newReport.summary}
                    onChange={e => setNewReport({ ...newReport, summary: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder={t('report_notes_label', language)}
                    value={newReport.notes}
                    onChange={e => setNewReport({ ...newReport, notes: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>{t('cancel', language)}</button>
                    <button className="btn btn-primary" onClick={handleCreateReport}>{t('save_report', language)}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Reports List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {medicalReports.map(r => (
                <div key={r.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px',
                  border: '1.5px solid var(--color-border)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '10px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                      {r.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{r.report_date}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>{r.title}</h3>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-secondary-dark)' }}>👨‍⚕️ {r.doctor_name}</div>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{r.summary}</p>
                  {r.notes && (
                    <div style={{ padding: '8px 12px', borderRadius: '10px', backgroundColor: '#FFF8E1', color: '#B78103', fontSize: '13px', fontWeight: 600 }}>
                      📌 {r.notes}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>✓ Verified Cloud Record</span>
                    <button className="btn btn-secondary" onClick={() => databaseService.deleteMedicalReport(linkedElder.id, r.id).then(() => setMedicalReports(medicalReports.filter(x => x.id !== r.id)))} style={{ color: 'var(--color-danger)', padding: '4px 10px', minHeight: 'auto', fontSize: '12px' }}>
                      {t('delete', language)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER: UPLOAD MEMORIES ─── */}
        {page === 'caretaker_memories' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>📸 {t('nav_upload_memories', language)}</h2>
                <p className="text-muted">{language === 'ta' ? 'தாத்தா & பாட்டியின் நினைவுக் கருவூலத்தில் குடும்ப புகைப்படங்களை பதிவேற்றுங்கள்' : 'Upload cherished family memories & photos directly onto the elder’s sanctuary screen.'}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowMemoryModal(true)} style={{ padding: '10px 20px', fontSize: '15px' }}>
                + {language === 'ta' ? 'புதிய நினைவை பதிவேற்ற' : 'Upload New Memory Photo'}
              </button>
            </div>

            {/* Upload Memory Modal */}
            {showMemoryModal && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                  {language === 'ta' ? 'புதிய நினைவை பதிவேற்றுக' : 'Add Family Story & Memory Photo'}
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  <input
                    className="input"
                    placeholder="Memory Title (e.g. 1975 Wedding Day in Madurai Temple)"
                    value={newMemory.title}
                    onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Photo URL / Web Image Link"
                    value={newMemory.image_url}
                    onChange={e => setNewMemory({ ...newMemory, image_url: e.target.value })}
                  />
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Story description and anecdote to remind Grandpa & Grandma..."
                    value={newMemory.content}
                    onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder="Tags (e.g. Wedding, Granddaughter, Temple, 1975)"
                    value={newMemory.tags}
                    onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowMemoryModal(false)}>{t('cancel', language)}</button>
                    <button className="btn btn-primary" onClick={handleCreateMemory}>{t('save', language)}</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
              {memoriesList.map((m, i) => (
                <div key={m.id || i} className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '18px', border: '1.5px solid var(--color-border)' }}>
                  {m.image_url && (
                    <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '10px' }} />
                  )}
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{m.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '8px 0', lineHeight: 1.5 }}>{m.content}</p>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                    Uploaded by: {m.uploaded_by || 'Caregiver'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER: FAMILY MEMBERS & CONTACTS ─── */}
        {page === 'caretaker_contacts' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2>👥 {t('contacts_title', language)}</h2>
                <p className="text-muted">{t('contacts_sub', language)}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowContactModal(true)} style={{ padding: '10px 20px', fontSize: '15px' }}>
                {t('add_contact', language)}
              </button>
            </div>

            {/* Add Contact Modal */}
            {showContactModal && (
              <div className="card" style={{ backgroundColor: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: '18px', padding: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                  {t('add_contact', language)}
                </h3>
                <div className="stack" style={{ gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                    <input
                      className="input"
                      placeholder={t('contact_name', language)}
                      value={newContact.name}
                      onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder={t('contact_relation', language)}
                      value={newContact.relationship}
                      onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                    <input
                      className="input"
                      placeholder={t('contact_phone', language)}
                      value={newContact.phone}
                      onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    />
                    <select
                      className="input"
                      value={newContact.avatar_emoji}
                      onChange={e => setNewContact({ ...newContact, avatar_emoji: e.target.value })}
                    >
                      <option value="👨‍💼">👨‍💼 Son</option>
                      <option value="👩‍💼">👩‍💼 Daughter</option>
                      <option value="👦">👦 Grandson</option>
                      <option value="👧">👧 Granddaughter</option>
                      <option value="🩺">🩺 Doctor</option>
                      <option value="👩‍⚕️">👩‍⚕️ Nurse / Caregiver</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={newContact.is_emergency_contact}
                      onChange={e => setNewContact({ ...newContact, is_emergency_contact: e.target.checked })}
                    />
                    <span>{t('contact_emergency', language)}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setShowContactModal(false)}>{t('cancel', language)}</button>
                    <button className="btn btn-primary" onClick={handleCreateContact}>{t('save_contact', language)}</button>
                  </div>
                </div>
              </div>
            )}

            {/* List of Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {familyContacts.map(c => (
                <div key={c.id} className="card" style={{
                  backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px',
                  border: c.is_emergency_contact ? '2px solid var(--color-danger)' : '1.5px solid var(--color-border)',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '36px' }}>{c.avatar_emoji || '👤'}</span>
                    {c.is_emergency_contact && (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)' }}>
                        🚨 SOS Emergency
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{c.name}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--color-primary-dark)', fontWeight: 700 }}>{c.relationship}</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{c.phone}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>✓ Synced on Elder's Screen</span>
                    <button className="btn btn-secondary" onClick={() => databaseService.deleteFamilyContact(linkedElder.id, c.id).then(() => setFamilyContacts(familyContacts.filter(x => x.id !== c.id)))} style={{ color: 'var(--color-danger)', padding: '4px 8px', minHeight: 'auto', fontSize: '12px' }}>
                      {t('delete', language)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CARETAKER: CARE PROTOCOL & AI GUIDELINES ─── */}
        {page === 'caretaker_guide' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>📝 {t('care_guide_title', language)}</h2>
              <p className="text-muted">{t('care_guide_sub', language)}</p>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '26px', border: '1.5px solid var(--color-border)' }}>
              <div className="stack" style={{ gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '6px' }}>
                    🩺 {t('condition_title', language)}
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={careNotes?.condition_details || ''}
                    onChange={e => setCareNotes(prev => prev ? ({ ...prev, condition_details: e.target.value }) : null)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '6px' }}>
                    📋 {t('care_instructions_title', language)}
                  </label>
                  <textarea
                    className="input"
                    rows={4}
                    value={careNotes?.care_instructions || ''}
                    onChange={e => setCareNotes(prev => prev ? ({ ...prev, care_instructions: e.target.value }) : null)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '6px' }}>
                    🎙️ {t('ai_guidance_title', language)}
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={careNotes?.ai_guidance || ''}
                    onChange={e => setCareNotes(prev => prev ? ({ ...prev, ai_guidance: e.target.value }) : null)}
                  />
                </div>

                <button
                  className="btn btn-primary btn-large"
                  onClick={() => careNotes && databaseService.saveCareNotes(careNotes).then(() => alert(language === 'ta' ? 'கவனிப்பு நெறிமுறைகள் வெற்றிகரமாக சேமிக்கப்பட்டது!' : 'Care guidelines successfully saved & synced to AI companion!'))}
                  style={{ alignSelf: 'flex-start', padding: '12px 28px', fontSize: '16px', fontWeight: 800 }}
                >
                  {t('save_guidelines', language)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CARETAKER: LINK ELDER ACCOUNT ─── */}
        {page === 'caretaker_link' && (
          <div className="stack" style={{ gap: '20px' }}>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>🔗 {t('link_code_title', language)}</h2>
              <p className="text-muted">{t('link_code_desc', language)}</p>
            </div>

            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '2px solid var(--color-primary)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: 'var(--color-primary-dark)' }}>
                {language === 'ta' ? 'இணைப்பு குறியீட்டை உள்ளிடவும்' : 'Enter 6-Digit Elder Link Code'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                  className="input"
                  style={{ maxWidth: 300, fontSize: '20px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', padding: '12px 16px' }}
                  placeholder={t('link_code_placeholder', language)}
                  value={linkInputCode}
                  onChange={e => setLinkInputCode(e.target.value.toUpperCase())}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleLinkElderAccount}
                  style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 800 }}
                >
                  {t('link_button', language)}
                </button>
              </div>

              {linkFeedback && (
                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>
                  {linkFeedback}
                </div>
              )}

              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                  {language === 'ta' ? 'தற்போது இணைக்கப்பட்டுள்ள முதியோர்:' : 'Currently Linked Elder Sanctuary:'}
                </h4>
                <div style={{ padding: '14px 18px', borderRadius: '14px', backgroundColor: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{linkedElder.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>ID: {linkedElder.id} • Live Sync Active</div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', backgroundColor: '#2E7D32', color: '#FFFFFF' }}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTINGS (Both Roles) ─── */}
        {page === 'settings' && (
          <>
            <div className="page-header" style={{ textAlign: 'left' }}>
              <h2>⚙️ {t('nav_settings', language)}</h2>
            </div>

            <div className="stack" style={{ gap: '18px' }}>
              {/* Elder Link Code Display (for Elders) */}
              {user?.role === 'ELDER' && (
                <div className="card" style={{ backgroundColor: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: '18px', padding: '22px' }}>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '20px' }}>🔗 {t('your_link_code', language)}</h3>
                  <p className="text-muted" style={{ fontSize: '14px', margin: '4px 0 12px 0' }}>{t('share_link_code_sub', language)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      padding: '12px 24px', borderRadius: '14px', backgroundColor: 'var(--color-primary-bg)',
                      fontSize: '28px', fontWeight: 900, color: 'var(--color-primary-dark)', letterSpacing: '2px'
                    }}>
                      {elderLinkCode || 'GRN-4892'}
                    </div>
                    <button className="btn btn-primary" onClick={handleCopyLinkCode} style={{ padding: '12px 20px', fontSize: '15px', fontWeight: 700 }}>
                      {codeCopied ? t('code_copied', language) : t('copy_code', language)}
                    </button>
                  </div>
                </div>
              )}

              <div className="card">
                <h3>🔤 {language === 'ta' ? 'எழுத்து அளவு' : 'Text Size'}</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                  {[
                    { label: language === 'ta' ? 'சாதாரண' : 'Normal', value: 1 },
                    { label: language === 'ta' ? 'பெரியது' : 'Large', value: 1.15 },
                    { label: language === 'ta' ? 'மிகப் பெரியது' : 'Extra Large', value: 1.3 },
                  ].map(s => (
                    <button key={s.value}
                      className={`btn ${fontSize === s.value ? 'btn-primary' : 'btn-secondary'} w-full`}
                      onClick={() => { setFontSize(s.value); persistPreferences(s.value, highContrast, language); }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3>🌐 {language === 'ta' ? 'மொழி தேர்வு' : 'Language'}</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                  <button className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onClick={() => { setLanguage('en'); persistPreferences(fontSize, highContrast, 'en'); }}>
                    English
                  </button>
                  <button className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onClick={() => { setLanguage('ta'); persistPreferences(fontSize, highContrast, 'ta'); }}>
                    தமிழ்
                  </button>
                </div>
              </div>

              <div className="card">
                <h3>👤 {language === 'ta' ? 'கணக்கு விவரங்கள்' : 'Account'}</h3>
                <p className="mt-sm">{language === 'ta' ? 'பெயர்' : 'Name'}: <strong>{user?.name}</strong></p>
                <p>{language === 'ta' ? 'பயனர் வகை' : 'Role'}: <strong>{user?.role === 'ELDER' ? t('role_elder', language) : t('role_caregiver', language)}</strong></p>
                <button className="btn btn-danger mt-lg w-full" onClick={handleLogout} style={{ padding: '12px', fontSize: '16px', fontWeight: 700 }}>
                  {t('sign_out', language)}
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* ─── Persistent Mic Button (Elder view) ─── */}
      {user?.role === 'ELDER' && (
        <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Tap to speak'}>
          {isListening ? '⏹' : '🎙️'}
        </button>
      )}
    </AppShell>
  );
}
