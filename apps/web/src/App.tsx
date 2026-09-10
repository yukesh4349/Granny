// ============================================================================
// App.tsx — Root component with routing, navigation, and role-based views
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { loadPersistedState, persistAuth, clearAuth, persistPreferences } from './store/appStore';
import { authApi, conversationApi, remindersApi, memoryApi, gamesApi } from './services/api';
import { ALL_GAMES, getGameByKey } from './features/games/engine/games';
import type { SessionState, DifficultyParams } from './features/games/engine/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  role: 'ELDER' | 'CAREGIVER';
  language: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  emotion?: string;
  timestamp: Date;
}

type Page = 'auth' | 'home' | 'companion' | 'games' | 'play' | 'health' | 'memory' | 'dashboard' | 'settings' | 'theatre';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [page, setPage] = useState<Page>('auth');
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

  // Theatre & Micro-Intervention State
  const [theatreStep, setTheatreStep] = useState(0);
  const [theatreFeedback, setTheatreFeedback] = useState<string | null>(null);
  const [activeMicroDose, setActiveMicroDose] = useState<{ title: string; prompt: string; task: string } | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceDeliveryMode, setVoiceDeliveryMode] = useState<'normal' | 'song' | 'poem' | 'word'>('normal');
  const recognitionRef = React.useRef<any>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '', role: 'ELDER' });
  const [authError, setAuthError] = useState('');

  // ─── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.auth?.isAuthenticated && persisted.auth.user && persisted.auth.token) {
      setUser(persisted.auth.user as User);
      setToken(persisted.auth.token);
      setPage('home');
    }
    if (persisted.fontSize) setFontSize(persisted.fontSize);
    if (persisted.highContrast) setHighContrast(persisted.highContrast);
    if (persisted.language) setLanguage(persisted.language);

    // Warm up speech synthesis voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Apply font size and contrast
  useEffect(() => {
    document.documentElement.style.fontSize = `${20 * fontSize}px`;
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
  }, [fontSize, highContrast]);

  // ─── Speech Synthesis Engine (Multi-Mode: Song, Poem, Word-by-Word, Normal) ──
  const cleanTextForSpeech = (rawText: string) => {
    return rawText
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();
  };

  const getWarmVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (lang === 'ta') {
      const taVoice = voices.find(v => v.lang.toLowerCase().startsWith('ta'));
      if (taVoice) return taVoice;
    }

    const preferred = ['Google UK English Female', 'Google US English', 'Samantha', 'Karen', 'Victoria', 'Zira', 'Natural', 'Female'];
    for (const name of preferred) {
      const match = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
      if (match) return match;
    }

    const enVoice = voices.find(v => v.lang.startsWith('en'));
    return enVoice || voices[0] || null;
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingText('');
  }, []);

  const speakText = useCallback((textToSpeak: string, mode: 'normal' | 'song' | 'poem' | 'word' = 'normal') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleaned = cleanTextForSpeech(textToSpeak);
    if (!cleaned) return;

    const voice = getWarmVoice(language);

    if (mode === 'song') {
      // Melodic song mode: split into lines/phrases with musical melodic pitches
      const phrases = cleaned.split(/[,.!?\n]+/).map(p => p.trim()).filter(Boolean);
      if (phrases.length === 0) return;

      setIsSpeaking(true);
      setSpeakingText(`🎵 Singing: "${cleaned}"`);

      const melodyPitches = [1.3, 1.45, 1.2, 1.4, 1.15, 1.35];

      phrases.forEach((phrase, idx) => {
        const utt = new SpeechSynthesisUtterance(phrase);
        utt.lang = language === 'ta' ? 'ta-IN' : 'en-US';
        utt.rate = 0.82; // Gentle musical singing cadence
        utt.pitch = melodyPitches[idx % melodyPitches.length];
        if (voice) utt.voice = voice;

        if (idx === phrases.length - 1) {
          utt.onend = () => {
            setIsSpeaking(false);
            setSpeakingText('');
          };
          utt.onerror = () => {
            setIsSpeaking(false);
            setSpeakingText('');
          };
        }

        window.speechSynthesis.speak(utt);
      });
      return;
    }

    if (mode === 'word') {
      // Slow word-by-word enunciated delivery for cognitive clarity
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      setIsSpeaking(true);
      setSpeakingText(`🗣️ Word-by-Word: "${cleaned}"`);

      words.forEach((word, idx) => {
        const utt = new SpeechSynthesisUtterance(word);
        utt.lang = language === 'ta' ? 'ta-IN' : 'en-US';
        utt.rate = 0.70; // Slow, crystal-clear enunciation
        utt.pitch = 1.04;
        if (voice) utt.voice = voice;

        if (idx === words.length - 1) {
          utt.onend = () => {
            setIsSpeaking(false);
            setSpeakingText('');
          };
          utt.onerror = () => {
            setIsSpeaking(false);
            setSpeakingText('');
          };
        }

        window.speechSynthesis.speak(utt);
      });
      return;
    }

    // Normal or rhythmic poem mode
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = mode === 'poem' ? 0.86 : 0.92;
    utterance.pitch = mode === 'poem' ? 1.12 : 1.06;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(mode === 'poem' ? `🎶 Poem: "${cleaned}"` : cleaned);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    window.speechSynthesis.speak(utterance);
  }, [language, getWarmVoice]);

  // ─── Auth Handlers ────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthError('');
    try {
      let result;
      if (authMode === 'register') {
        result = await authApi.register({
          name: authForm.name,
          email: authForm.email || undefined,
          password: authForm.password || undefined,
          role: authForm.role,
        });
      } else {
        result = await authApi.login({
          email: authForm.email || undefined,
          password: authForm.password || undefined,
        });
      }
      setUser(result.user);
      setToken(result.accessToken);
      persistAuth(result.user, result.accessToken);
      setPage('home');
      if (autoSpeak) {
        speakText(`Welcome ${result.user.name || 'dear'}! I am Granny, your caring companion.`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    stopSpeaking();
    setUser(null);
    setToken(null);
    clearAuth();
    setPage('auth');
    setMessages([]);
    setConversationId(null);
  };

  // ─── Chat Handler ─────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msgText = (text || chatInput).trim();
    if (!msgText) return;

    stopSpeaking();

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setSpeechTranscript('');
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
      // Detect if user is asking for song/poem/word delivery
      const lowerText = msgText.toLowerCase();
      let effectiveMode = voiceDeliveryMode;
      if (lowerText.includes('sing') || lowerText.includes('song') || lowerText.includes('melody') || lowerText.includes('lullaby')) {
        effectiveMode = 'song';
      } else if (lowerText.includes('poem') || lowerText.includes('rhyme')) {
        effectiveMode = 'poem';
      } else if (lowerText.includes('word by word') || lowerText.includes('word-by-word') || lowerText.includes('say each word')) {
        effectiveMode = 'word';
      }

      if (autoSpeak) {
        speakText(result.reply, effectiveMode);
      }
    } catch {
      const lowerText = msgText.toLowerCase();
      let fallbackReplies = [
        "I'm right here with you, dear! It is so lovely to hear your voice. Tell me more about what you're thinking today.",
        "That is wonderful, dear! You always bring such warmth to my heart. How are you feeling right now?",
        "I hear you loud and clear, my dear! Remember to take your water and enjoy this peaceful day. What would you like to do next?",
        "You are so special to all of us. I'm always here listening with all my care!"
      ];

      let effectiveMode = voiceDeliveryMode;
      if (lowerText.includes('sing') || lowerText.includes('song') || lowerText.includes('melody') || lowerText.includes('lullaby')) {
        fallbackReplies = [
          "Morning bells are ringing bright, birds are singing in the light. Sunshine whispers in your ear, Granny's love is always near!",
          "Gentle breezes in the tree, family smiles for you and me. Peaceful morning, sweet and calm, rest your heart in nature's balm.",
          "Sweetest melody of today, joy and blessing on your way. You are cherished, you are dear, hold this melody sincere!"
        ];
        effectiveMode = 'song';
      } else if (lowerText.includes('poem') || lowerText.includes('rhyme')) {
        fallbackReplies = [
          "Softly glows the morning sun, a peaceful day has just begun. Memories bloom like flowers fair, wrapped in love and gentle care.",
          "The jasmine smells so fresh and sweet, pleasant moments we shall greet. Step by step we walk in peace, where worries softly fade and cease."
        ];
        effectiveMode = 'poem';
      } else if (lowerText.includes('word by word') || lowerText.includes('slow')) {
        fallbackReplies = [
          "Good morning. I am here. You are safe and doing great.",
          "Drink warm tea. Take deep breaths. Today is a wonderful day."
        ];
        effectiveMode = 'word';
      }

      const selectedReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      const fallbackMsg: ChatMessage = {
        id: `msg_${Date.now()}_fb`,
        sender: 'assistant',
        text: selectedReply,
        emotion: 'calm',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
      if (autoSpeak) {
        speakText(selectedReply, effectiveMode);
      }
    }
    setIsThinking(false);
  };

  // ─── Game Handlers ────────────────────────────────────────────────────────
  const startGame = (gameKey: string) => {
    stopSpeaking();
    const game = getGameByKey(gameKey);
    if (!game) return;

    const difficulty: DifficultyParams = {
      difficulty: 3, itemCount: 3, delaySeconds: 5, distractorCount: 2,
    };

    const session = game.startSession(user?.id || 'guest', difficulty);
    setGameSession(session);
    setCurrentGameKey(gameKey);
    setGamePhase('memorize');
    setPage('play');

    if (autoSpeak) {
      speakText(`Let's play ${game.title}! Memorize the items on your screen.`);
    }

    // Memorize timer
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

    const result = game.submitAttempt(gameSession, answer);
    const nextItem = game.getNextItem(gameSession);

    if (!nextItem) {
      setGamePhase('result');
      if (autoSpeak) {
        speakText("Game completed! Wonderful effort, dear!");
      }
    }
    setGameSession({ ...gameSession });
  };

  const finishGame = () => {
    stopSpeaking();
    setGameSession(null);
    setCurrentGameKey(null);
    setGamePhase('memorize');
    setPage('games');
  };

  // ─── Voice (Web Speech API) ───────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    // Barge-in: interrupt speech if AI is currently talking
    if (isSpeaking) {
      stopSpeaking();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setSpeechTranscript(currentText);

        if (final && final.trim()) {
          setIsListening(false);
          if (page !== 'companion') {
            setPage('companion');
          }
          sendMessage(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access was not granted. Please allow microphone permissions in your browser.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  }, [isListening, isSpeaking, language, page, stopSpeaking, sendMessage]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // ─── Auth Page ────────────────────────────────────────────────────────────
  if (page === 'auth') {
    return (
      <div className="page flex-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 100%)' }}>
        <div style={{ maxWidth: 420, width: '100%', padding: 'var(--space-xl)' }}>
          <div className="text-center mb-lg">
            <div style={{ fontSize: 72, marginBottom: 'var(--space-md)' }}>👵</div>
            <h1 style={{ color: 'var(--color-primary)' }}>Granny</h1>
            <p className="text-muted mt-sm">Your warm, caring AI companion</p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              <button className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={() => setAuthMode('login')}>Sign In</button>
              <button className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={() => setAuthMode('register')}>Register</button>
            </div>

            <div className="stack">
              {authMode === 'register' && (
                <>
                  <input className="input" placeholder="Your name" value={authForm.name}
                    onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
                  <select className="input" value={authForm.role}
                    onChange={e => setAuthForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="ELDER">I am an Elder</option>
                    <option value="CAREGIVER">I am a Caregiver</option>
                  </select>
                </>
              )}
              <input className="input" placeholder="Email" type="email" value={authForm.email}
                onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
              <input className="input" placeholder="Password" type="password" value={authForm.password}
                onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />

              {authError && <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{authError}</p>}

              <button className="btn btn-primary btn-large w-full" onClick={handleAuth}>
                {authMode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Demo quick access */}
          <div className="text-center mt-lg">
            <button className="btn btn-secondary" onClick={() => {
              const demoUser: User = { id: 'demo', name: 'Margaret', role: 'ELDER', language: 'en' };
              setUser(demoUser);
              setToken('demo-token');
              persistAuth(demoUser, 'demo-token');
              setPage('home');
            }}>
              ✨ Try Demo (No Login)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Game Play Page ───────────────────────────────────────────────────────
  if (page === 'play' && gameSession && currentGameKey) {
    const game = getGameByKey(currentGameKey)!;
    const currentItem = game.getNextItem(gameSession);
    const summary = gamePhase === 'result' ? game.endSession(gameSession) : null;

    return (
      <div className="page container">
        <div className="page-header">
          <button className="btn btn-secondary" onClick={finishGame} style={{ position: 'absolute', left: 'var(--space-lg)' }}>← Back</button>
          <div style={{ fontSize: 48 }}>{game.icon}</div>
          <h2>{game.title}</h2>
        </div>

        {gamePhase === 'memorize' && (
          <div className="text-center stack">
            <h3>Memorize these items!</h3>
            <div className="card" style={{ padding: 'var(--space-2xl)', background: 'var(--color-primary-bg)' }}>
              {gameSession.items.map((item, i) => (
                <p key={i} style={{ fontSize: 'var(--font-size-lg)', padding: 'var(--space-sm)' }}>
                  {item.metadata?.object || item.metadata?.plant || item.metadata?.scene || item.prompt}: <strong>{(item.correctAnswer as string)}</strong>
                </p>
              ))}
            </div>
            <div style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-primary)', fontWeight: 800 }}>
              {gameTimer}s
            </div>
            <p className="text-muted">Remember these before time runs out!</p>
          </div>
        )}

        {gamePhase === 'play' && currentItem && (
          <div className="stack text-center">
            <p className="text-muted">Question {gameSession.currentItemIndex + 1} of {gameSession.items.length}</p>
            <h3 style={{ padding: 'var(--space-lg)' }}>{currentItem.prompt}</h3>
            <div className="stack">
              {currentItem.choices?.map((choice, i) => (
                <button key={i} className="btn btn-secondary btn-large w-full" onClick={() => handleGameAnswer(choice)}>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {gamePhase === 'result' && summary && (
          <div className="stack text-center">
            <div style={{ fontSize: 72 }}>{summary.accuracy >= 70 ? '🎉' : summary.accuracy >= 40 ? '👍' : '💪'}</div>
            <h2>{summary.accuracy >= 70 ? 'Wonderful!' : summary.accuracy >= 40 ? 'Good effort!' : 'Keep practicing!'}</h2>
            <div className="card">
              <p style={{ fontSize: 'var(--font-size-xl)' }}>Score: <strong>{summary.score}</strong></p>
              <p>Correct: {summary.correctCount} / {summary.totalItems}</p>
              <p>Accuracy: {summary.accuracy}%</p>
            </div>
            <button className="btn btn-primary btn-large" onClick={finishGame}>Back to Games</button>
          </div>
        )}
      </div>
    );
  }

  // ─── Main App (All other pages) ───────────────────────────────────────────
  return (
    <div className="page">
      {/* Emergency button — always visible */}
      <button className="emergency-btn" onClick={() => alert('Calling your emergency contact...')}>
        🆘 Help
      </button>

      {/* Page Content */}
      <div className="container" style={{ paddingTop: 'var(--space-lg)', paddingBottom: '120px' }}>

        {/* ─── HOME ────────────────────────────────────────────────────────────── */}
        {page === 'home' && (
          <>
            <div className="page-header">
              <h1>Hello, {user?.name || 'Dear'}! 👋</h1>
              <p className="text-muted mt-sm" style={{ fontSize: 'var(--font-size-lg)' }}>
                How are you feeling today?
              </p>
            </div>

            <div className="stack">
              {/* Quick actions */}
              <div className="grid-2">
                <button className="card card-interactive" onClick={() => setPage('companion')}
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-bg), #FFE0CC)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>💬</div>
                  <h3 className="mt-sm">Talk to Granny</h3>
                  <p className="text-muted">Voice companion chat</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('games')}
                  style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>🧩</div>
                  <h3 className="mt-sm">Play Games</h3>
                  <p className="text-muted">10 memory games</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('health')}
                  style={{ background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>💊</div>
                  <h3 className="mt-sm">Health & Meds</h3>
                  <p className="text-muted">Reminders & schedule</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('memory')}
                  style={{ background: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>📸</div>
                  <h3 className="mt-sm">Memories</h3>
                  <p className="text-muted">Your life stories</p>
                </button>
              </div>

              {/* JIT Micro-Intervention Quick Spark */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #FFF9C4, #FFF176)', border: '2px solid #FBC02D' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: '#F57F17' }}>✨ 2-Minute Brain Spark</h3>
                    <p style={{ color: '#5D4037', marginTop: 4 }}>
                      {activeMicroDose ? activeMicroDose.task : "Quick post-lunch memory check: What is one sweet family memory you smiled at today?"}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => {
                    setActiveMicroDose({
                      title: 'Verandah Observation',
                      prompt: 'Look around your room right now.',
                      task: 'Name 3 things in your room that are blue or green!'
                    });
                  }}>
                    {activeMicroDose ? '✓ Completed' : 'Start (1 min)'}
                  </button>
                </div>
              </div>

              {/* Life-Story Memory Theatre Highlight */}
              <div className="card card-interactive" onClick={() => { setTheatreStep(0); setTheatreFeedback(null); setPage('theatre'); }}
                style={{ background: 'linear-gradient(135deg, #FFE0B2, #FFCC80)', border: '2px solid #FB8C00' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ fontSize: 44 }}>🎭</div>
                  <div>
                    <h3 style={{ color: '#E65100' }}>Life-Story Memory Theatre</h3>
                    <p style={{ color: '#6D4C41', marginTop: 2 }}>
                      Interactive choose-your-own-path memory scene from your family stories.
                    </p>
                  </div>
                </div>
              </div>

              {/* Greeting message */}
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))', color: 'white' }}>
                <p style={{ fontSize: 'var(--font-size-lg)' }}>
                  🌟 Tip: Tap the <strong>microphone button</strong> at the bottom right to talk to me anytime. I'm always listening with care!
                </p>
              </div>
            </div>
          </>
        )}

        {/* ─── COMPANION CHAT ──────────────────────────────────────────────────── */}
        {page === 'companion' && (
          <>
            <div className="page-header" style={{ position: 'relative' }}>
              <h2>💬 Voice Companion</h2>
              <p className="text-muted">I'm here to listen, talk, and keep you company</p>
              
              {/* Voice auto-speak toggle and Delivery Mode Selector */}
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
                  <button
                    className={`btn ${autoSpeak ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 13, padding: '4px 14px', borderRadius: 'var(--radius-full)' }}
                    onClick={() => setAutoSpeak(!autoSpeak)}
                  >
                    {autoSpeak ? '🔊 Voice Audio: ON' : '🔇 Voice Audio: OFF'}
                  </button>
                  {isSpeaking && (
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 13, padding: '4px 14px', borderRadius: 'var(--radius-full)' }}
                      onClick={stopSpeaking}
                    >
                      ⏹ Stop Voice
                    </button>
                  )}
                </div>

                {/* Voice Delivery Modes: Normal, Song, Poem, Word-by-Word */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { mode: 'normal', label: '💬 Normal Speech' },
                    { mode: 'song', label: '🎵 Sing Song' },
                    { mode: 'poem', label: '🎶 Poem / Rhyme' },
                    { mode: 'word', label: '🗣️ Word-by-Word' },
                  ].map(m => (
                    <button
                      key={m.mode}
                      onClick={() => setVoiceDeliveryMode(m.mode as any)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: voiceDeliveryMode === m.mode ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: voiceDeliveryMode === m.mode ? 'var(--color-primary-bg)' : 'var(--color-bg-card)',
                        color: voiceDeliveryMode === m.mode ? 'var(--color-primary)' : 'var(--color-text-muted)'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Large Voice Prompt Card */}
            <div
              className="card card-interactive"
              onClick={toggleListening}
              style={{
                maxWidth: 700,
                margin: '0 auto var(--space-md) auto',
                background: isListening
                  ? 'linear-gradient(135deg, #FFEBEE, #FFCDD2)'
                  : isSpeaking
                  ? 'linear-gradient(135deg, #E8F5E9, #C8E6C9)'
                  : 'linear-gradient(135deg, var(--color-primary-bg), #FFE0CC)',
                border: isListening ? '2px solid #E53935' : isSpeaking ? '2px solid #43A047' : '2px solid var(--color-primary)',
                textAlign: 'center',
                padding: 'var(--space-md)'
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 2 }}>
                {isListening ? '🎙️' : isSpeaking ? '👵🔊' : '🗣️'}
              </div>
              <h3 style={{ color: isListening ? '#C62828' : isSpeaking ? '#2E7D32' : 'var(--color-primary)' }}>
                {isListening
                  ? 'Listening to you... (Speak now)'
                  : isSpeaking
                  ? 'Granny is speaking to you...'
                  : 'Tap here to Speak to Granny'}
              </h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                {isListening
                  ? (speechTranscript || 'Speak clearly into your microphone...')
                  : isSpeaking
                  ? 'Tap to pause or interrupt'
                  : `Mode: ${voiceDeliveryMode.toUpperCase()} — Tap mic to talk!`}
              </p>
            </div>

            {/* Quick Voice Prompt Pills for Song / Rhyme / Word / Memory */}
            <div style={{ maxWidth: 700, margin: '0 auto var(--space-md) auto', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 16 }}
                onClick={() => { setVoiceDeliveryMode('song'); sendMessage("Granny, please sing me a cheerful morning song!"); }}
              >
                🎵 Sing me a song
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 16 }}
                onClick={() => { setVoiceDeliveryMode('poem'); sendMessage("Recite a peaceful comforting poem for me."); }}
              >
                🎶 Recite a poem
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 16 }}
                onClick={() => { setVoiceDeliveryMode('word'); sendMessage("Tell me about our morning routine slowly word by word."); }}
              >
                🗣️ Say word-by-word
              </button>
            </div>

            <div className="chat-container" style={{ minHeight: '40vh' }}>
              {messages.length === 0 && (
                <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <div style={{ fontSize: 72 }}>👵</div>
                  <p className="text-large mt-lg">Hello, dear! I'm Granny.</p>
                  <p className="text-muted mt-sm">Say hello with your voice or choose a song / poem prompt above.</p>
                  <button
                    className="btn btn-primary btn-large mt-lg"
                    onClick={() => {
                      const greeting = "Hello dear! How are you feeling today? I am so happy to chat with you.";
                      const assistantMsg: ChatMessage = {
                        id: `msg_welcome_${Date.now()}`,
                        sender: 'assistant',
                        text: greeting,
                        emotion: 'warm',
                        timestamp: new Date(),
                      };
                      setMessages([assistantMsg]);
                      if (autoSpeak) speakText(greeting, voiceDeliveryMode);
                    }}
                  >
                    👵 Say Hello to Granny
                  </button>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  <div style={{ fontSize: 'var(--font-size-base)' }}>{msg.text}</div>
                  
                  {msg.sender === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="replay-audio-btn"
                          onClick={() => speakText(msg.text, 'normal')}
                          title="Listen as normal speech"
                        >
                          🔊 Speak
                        </button>
                        <button
                          className="replay-audio-btn"
                          style={{ borderColor: '#7E22CE', color: '#7E22CE' }}
                          onClick={() => speakText(msg.text, 'song')}
                          title="Sing this message melodically"
                        >
                          🎵 Sing
                        </button>
                        <button
                          className="replay-audio-btn"
                          style={{ borderColor: '#0284C7', color: '#0284C7' }}
                          onClick={() => speakText(msg.text, 'word')}
                          title="Speak slowly word by word"
                        >
                          🗣️ Word-by-Word
                        </button>
                      </div>
                      {msg.emotion && (
                        <span style={{ fontSize: 12, opacity: 0.75, color: 'var(--color-text-muted)' }}>
                          Mood: {msg.emotion}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="chat-bubble assistant">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Granny is listening & thinking...</span>
                    <div className="waveform">
                      {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: 700, margin: '0 auto' }}>
                <input
                  className="input"
                  placeholder={isListening ? "Listening to your voice..." : "Type or speak your message..."}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={() => sendMessage()}>Send</button>
              </div>
            </div>
          </>
        )}

        {/* ─── GAMES WORLD MAP ─────────────────────────────────────────────────── */}
        {page === 'games' && (
          <>
            <div className="page-header">
              <h2>🧩 Memory World</h2>
              <p className="text-muted">Choose a game to play</p>
            </div>

            <div className="game-world">
              {ALL_GAMES.map((game, i) => (
                <div key={game.key}
                  className="game-card card card-interactive"
                  style={{ borderLeftColor: game.color, borderLeftWidth: 4, borderLeftStyle: 'solid' }}
                  onClick={() => startGame(game.key)}>
                  <div className="game-icon">{game.icon}</div>
                  <div className="game-info">
                    <div className="game-title">{game.title}</div>
                    <div className="game-desc">{game.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Skills: {game.primarySkills.join(', ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 24, color: 'var(--color-text-muted)' }}>▶</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── HEALTH & REMINDERS ──────────────────────────────────────────────── */}
        {page === 'health' && (
          <>
            <div className="page-header">
              <h2>💊 Health & Reminders</h2>
              <p className="text-muted">Your daily schedule</p>
            </div>

            <div className="stack">
              {/* Sample reminders */}
              {[
                { time: '8:00', title: 'Morning Medicine', type: 'medication', confirmed: true },
                { time: '10:00', title: 'Drink Water', type: 'hydration', confirmed: false },
                { time: '12:30', title: 'Lunch Time', type: 'activity', confirmed: false },
                { time: '14:00', title: 'Afternoon Medicine', type: 'medication', confirmed: false },
                { time: '16:00', title: 'Evening Walk', type: 'activity', confirmed: false },
                { time: '20:00', title: 'Night Medicine', type: 'medication', confirmed: false },
              ].map((r, i) => (
                <div key={i} className={`reminder-card ${r.confirmed ? 'confirmed' : ''}`}>
                  <div className="reminder-time">{r.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>{r.title}</div>
                    <div className="text-muted">{r.type}</div>
                  </div>
                  <button className={`btn ${r.confirmed ? 'btn-success' : 'btn-primary'}`}
                    style={{ minWidth: 100 }}>
                    {r.confirmed ? '✓ Done' : 'I Did It'}
                  </button>
                </div>
              ))}

              <button className="btn btn-secondary btn-large w-full mt-lg">
                + Add New Reminder
              </button>
            </div>
          </>
        )}

        {/* ─── MEMORY ALBUM ────────────────────────────────────────────────────── */}
        {page === 'memory' && (
          <>
            <div className="page-header">
              <h2>📸 My Memories</h2>
              <p className="text-muted">Your precious life stories</p>
            </div>

            <div className="stack">
              {/* Sample memories */}
              {[
                { title: 'My wedding day', content: 'I married Rajan on a beautiful evening in 1975. The temple was decorated with jasmine flowers.', type: 'anecdote', tags: ['wedding', 'family'] },
                { title: 'First grandchild', content: 'Priya was born on March 15, 2005. She had the most beautiful eyes, just like her mother.', type: 'anecdote', tags: ['family', 'grandchild'] },
                { title: 'Morning routine', content: 'Wake up at 6 AM, have tea, do prayer, take a walk in the garden, then breakfast.', type: 'routine', tags: ['daily', 'routine'] },
                { title: 'Favorite song', content: 'I love the old melody "Vellai Pookal" — it reminds me of my youth.', type: 'fact', tags: ['music', 'favorites'] },
              ].map((m, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>{m.title}</h3>
                    <span style={{ fontSize: 12, padding: '2px 8px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
                      {m.type}
                    </span>
                  </div>
                  <p className="mt-sm">{m.content}</p>
                  <div className="mt-sm" style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                    {m.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 12, padding: '2px 8px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <button className="btn btn-primary btn-large w-full">
                + Add a New Memory
              </button>
            </div>
          </>
        )}

        {/* ─── CAREGIVER DASHBOARD ─────────────────────────────────────────────── */}
        {page === 'dashboard' && (
          <>
            <div className="page-header">
              <h2>📊 Caregiver Dashboard</h2>
              <p className="text-muted">Monitoring {user?.name || 'Elder'}'s wellbeing</p>
            </div>

            <div className="stack">
              {/* Adherence */}
              <div className="card">
                <h3>💊 Medication Adherence</h3>
                <div style={{ marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                  <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-success)' }}>85%</div>
                  <div>
                    <p>5 of 6 reminders confirmed today</p>
                    <p className="text-muted">Missed: Afternoon medicine (2:00 PM)</p>
                  </div>
                </div>
              </div>

              {/* Mood Trend */}
              <div className="card">
                <h3>❤️ Mood Trend (7 Days)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const moods = ['😊', '😐', '😊', '😢', '😊', '😊', '😐'];
                    return (
                      <div key={day} className="text-center">
                        <div style={{ fontSize: 28 }}>{moods[i]}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Game Performance */}
              <div className="card">
                <h3>🧩 Game Performance</h3>
                <div className="stack mt-md">
                  {[
                    { game: 'Remember My Home', accuracy: 80, trend: '↑' },
                    { game: 'Memory Market', accuracy: 65, trend: '→' },
                    { game: 'Name & Face Match', accuracy: 90, trend: '↑' },
                  ].map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{g.game}</span>
                      <span style={{ fontWeight: 700, color: g.accuracy >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {g.accuracy}% {g.trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Co-Play Quests */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)', border: '2px solid #7E22CE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#581C87' }}>👨‍👩‍👧 Family Co-Play Memory Quest</h3>
                  <span style={{ background: '#7E22CE', color: '#FFF', padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 'bold' }}>
                    Active
                  </span>
                </div>
                <p style={{ marginTop: 8, color: '#3B0764', fontWeight: 600 }}>
                  Quest: "The Story of the Ancestral Madurai Journey"
                </p>
                <div style={{ marginTop: 8, fontSize: 14, color: '#4C1D95' }}>
                  <p>• <strong>Kamala (Chief Storyteller):</strong> Recalls the morning temple bells</p>
                  <p>• <strong>Rahul (Chronicler):</strong> Uploading photo from 1982 album</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── LIFE-STORY MEMORY THEATRE ─────────────────────────────────────── */}
        {page === 'theatre' && (
          <>
            <div className="page-header">
              <button className="btn btn-secondary" onClick={() => setPage('home')} style={{ position: 'absolute', left: 'var(--space-lg)' }}>← Home</button>
              <div style={{ fontSize: 48 }}>🎭</div>
              <h2>Life-Story Memory Theatre</h2>
              <p className="text-muted">Interactive Scene: "Festival Morning on the Verandah"</p>
            </div>

            <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-xl)', background: 'var(--color-card-bg)', border: '2px solid var(--color-primary)' }}>
              {theatreStep === 0 && (
                <div className="stack text-center">
                  <div style={{ fontSize: 56 }}>🌅</div>
                  <h3 style={{ color: 'var(--color-primary)' }}>Scene 1: The Festival Morning</h3>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6, margin: 'var(--space-md) 0' }}>
                    "The sun rose warm over the terrace, and the brass bells in the prayer room chimed softly. What did you and mother begin preparing first for the celebration?"
                  </p>
                  <div className="stack" style={{ gap: 'var(--space-sm)' }}>
                    {['Traditional Sweets & Murukku', 'Fresh Jasmine Garlands', 'Lighting the Brass Lamps'].map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" onClick={() => {
                        setTheatreFeedback("Yes, wonderful! The aroma of fresh ghee and sweets filled the whole house.");
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
                  <h3 style={{ color: 'var(--color-primary)' }}>Scene 2: Gathering on the Verandah</h3>
                  <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>{theatreFeedback}</p>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6, margin: 'var(--space-md) 0' }}>
                    "Everyone wore their new silk clothes. Who gave the traditional family blessings that morning?"
                  </p>
                  <div className="stack" style={{ gap: 'var(--space-sm)' }}>
                    {['Grandfather in his silk angavastram', 'Visiting Uncle from Madurai', 'The family elders together'].map((choice, i) => (
                      <button key={i} className="btn btn-secondary btn-large" onClick={() => {
                        setTheatreFeedback("Cherished memories! Grandfather's blessings always brought good fortune.");
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
                  <h2 style={{ color: 'var(--color-success)' }}>Memory Episode Complete!</h2>
                  <p style={{ fontSize: 'var(--font-size-lg)', lineHeight: 1.6 }}>
                    "You shared this story beautifully. Your precious memories remain alive and treasured in our family circle."
                  </p>
                  <button className="btn btn-primary btn-large mt-lg" onClick={() => { setTheatreStep(0); setPage('home'); }}>
                    Return to Home
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── SETTINGS ────────────────────────────────────────────────────────── */}
        {page === 'settings' && (
          <>
            <div className="page-header">
              <h2>⚙️ Settings</h2>
            </div>

            <div className="stack">
              <div className="card">
                <h3>🔤 Text Size</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                  {[
                    { label: 'Normal', value: 1 },
                    { label: 'Large', value: 1.15 },
                    { label: 'Extra Large', value: 1.3 },
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
                <h3>🎨 High Contrast</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                  <button className={`btn ${!highContrast ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onClick={() => { setHighContrast(false); persistPreferences(fontSize, false, language); }}>
                    Normal
                  </button>
                  <button className={`btn ${highContrast ? 'btn-primary' : 'btn-secondary'} w-full`}
                    onClick={() => { setHighContrast(true); persistPreferences(fontSize, true, language); }}>
                    High Contrast
                  </button>
                </div>
              </div>

              <div className="card">
                <h3>🌐 Language</h3>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
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
                <h3>👤 Account</h3>
                <p className="mt-sm">Name: {user?.name}</p>
                <p>Role: {user?.role}</p>
                <button className="btn btn-danger mt-lg w-full" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Floating Voice HUD (Active whenever listening, speaking, or thinking) ── */}
      {(isListening || isSpeaking || isThinking) && (
        <div className="voice-hud">
          <div className="voice-hud-indicator">
            <span style={{ fontSize: 28 }}>
              {isListening ? '🎙️' : isSpeaking ? '👵' : '⏳'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="voice-hud-text">
                {isListening
                  ? (speechTranscript ? `"${speechTranscript}"` : 'Listening to you... Speak now')
                  : isSpeaking
                  ? 'Granny is speaking...'
                  : 'Granny is thinking...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSpeaking && (
              <div className="waveform green">
                {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
              </div>
            )}
            {isListening && (
              <div className="waveform">
                {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
              </div>
            )}
            {isSpeaking && (
              <button
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-full)' }}
                onClick={stopSpeaking}
              >
                Stop Voice
              </button>
            )}
            {isListening && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-full)' }}
                onClick={() => {
                  if (recognitionRef.current) recognitionRef.current.stop();
                  setIsListening(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Persistent Mic Button ──────────────────────────────────────────── */}
      <button
        className={`mic-button ${isListening ? 'listening' : isSpeaking ? 'speaking' : ''}`}
        onClick={toggleListening}
        title={isListening ? 'Stop listening' : isSpeaking ? 'Tap to speak / interrupt' : 'Tap to talk to Granny'}
      >
        {isListening ? '⏹' : isSpeaking ? '🔊' : '🎙️'}
      </button>

      {/* ─── Bottom Navigation ─────────────────────────────────────────────── */}
      <nav className="bottom-nav">
        <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button className={`nav-item ${page === 'companion' ? 'active' : ''}`} onClick={() => setPage('companion')}>
          <span className="nav-icon">💬</span>
          <span>Chat</span>
        </button>
        <button className={`nav-item ${page === 'games' ? 'active' : ''}`} onClick={() => setPage('games')}>
          <span className="nav-icon">🧩</span>
          <span>Games</span>
        </button>
        <button className={`nav-item ${page === 'health' ? 'active' : ''}`} onClick={() => setPage('health')}>
          <span className="nav-icon">💊</span>
          <span>Health</span>
        </button>
        {user?.role === 'CAREGIVER' && (
          <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
        )}
        <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}
