import React, { useState, useEffect, useCallback } from 'react';
import { loadPersistedState, persistAuth, clearAuth, persistPreferences } from './store/appStore';
import { authApi, conversationApi, remindersApi, memoryApi, gamesApi } from './services/api';
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
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  emotion?: string;
  timestamp: Date;
}

type Page = 'landing' | 'auth' | 'home' | 'companion' | 'games' | 'play' | 'health' | 'memory' | 'dashboard' | 'settings' | 'theatre';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  // ─── State ────────────────────────────────────────────────────────────────
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
  }, []);

  // Apply font size and contrast
  useEffect(() => {
    document.documentElement.style.fontSize = `${20 * fontSize}px`;
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
  }, [fontSize, highContrast]);

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
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    clearAuth();
    setPage('landing');
    setMessages([]);
    setConversationId(null);
  };

  const handleDemoLogin = (demoRole: 'ELDER' | 'CAREGIVER' = 'ELDER') => {
    const demoUser: User = {
      id: demoRole === 'ELDER' ? 'demo_elder' : 'demo_caregiver',
      name: demoRole === 'ELDER' ? 'Lakshmi Amma' : 'Arun (Son & Caregiver)',
      role: demoRole,
      language: language,
    };
    setUser(demoUser);
    setToken('demo_token');
    persistAuth(demoUser, 'demo_token');
    setPage(demoRole === 'CAREGIVER' ? 'dashboard' : 'home');
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
        text: "I'm here for you, dear. Could you say that again?",
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
    setPage('play');

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
    }
    setGameSession({ ...gameSession });
  };

  const finishGame = () => {
    setGameSession(null);
    setCurrentGameKey(null);
    setGamePhase('memorize');
    setPage('games');
  };

  // ─── Voice (Web Speech API) ───────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        onOpenAuth={(mode) => { setAuthMode(mode || 'login'); setPage('auth'); }}
        highContrast={highContrast}
        onToggleContrast={() => {
          const next = !highContrast;
          setHighContrast(next);
          persistPreferences(fontSize, next, language);
        }}
        language={language}
        onToggleLanguage={() => {
          const next = language === 'ta' ? 'en' : 'ta';
          setLanguage(next);
          persistPreferences(fontSize, highContrast, next);
        }}
      />
    );
  }

  // ─── Auth Page ────────────────────────────────────────────────────────────
  if (page === 'auth') {
    return (
      <div className="page flex-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 100%)', padding: 'var(--space-xl)' }}>
        <div style={{ maxWidth: 460, width: '100%' }}>
          
          <button
            className="btn btn-secondary mb-md"
            onClick={() => setPage('landing')}
            style={{ minHeight: 'auto', padding: '6px 14px', fontSize: '14px' }}
          >
            ← Back to Home
          </button>

          <div className="text-center mb-lg">
            <div style={{ fontSize: 72, marginBottom: 'var(--space-md)' }}>🌸</div>
            <h1 style={{ color: 'var(--color-primary-dark)' }}>Granny</h1>
            <p className="text-muted mt-sm">Your warm, caring AI companion &amp; memory sanctuary</p>
          </div>

          <div className="card" style={{ borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
              <button className={`btn ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={() => setAuthMode('login')}>Sign In</button>
              <button className={`btn ${authMode === 'register' ? 'btn-primary' : 'btn-secondary'} w-full`} onClick={() => setAuthMode('register')}>Register</button>
            </div>

            <div className="stack">
              {authMode === 'register' && (
                <>
                  <input className="input" placeholder="Your full name" value={authForm.name}
                    onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
                  <select className="input" value={authForm.role}
                    onChange={e => setAuthForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="ELDER">👵 I am an Elder (Personal Sanctuary)</option>
                    <option value="CAREGIVER">👨‍👩‍👧 I am a Caregiver (Family Insights)</option>
                  </select>
                </>
              )}
              <input className="input" placeholder="Email address or Phone" type="email" value={authForm.email}
                onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
              <input className="input" placeholder="Password" type="password" value={authForm.password}
                onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />

              {authError && <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{authError}</p>}

              <button className="btn btn-primary btn-large w-full" onClick={handleAuth}>
                {authMode === 'register' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Quick Demo Access */}
          <div className="text-center mt-lg stack" style={{ gap: '8px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Or explore immediately without creating an account:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => handleDemoLogin('ELDER')} style={{ fontSize: '14px', padding: '8px 16px' }}>
                🌸 Elder Demo (Lakshmi)
              </button>
              <button className="btn btn-secondary" onClick={() => handleDemoLogin('CAREGIVER')} style={{ fontSize: '14px', padding: '8px 16px' }}>
                👥 Caregiver Demo
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
            ← Back to Games
          </button>
          <div style={{ fontSize: 56 }}>{game.icon}</div>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>{game.title}</h2>
          <p className="text-muted">{game.description}</p>
        </div>

        {/* ─── MEMORIZE PHASE (Visual Picture Grid) ─── */}
        {gamePhase === 'memorize' && (
          <div className="text-center stack" style={{ gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontWeight: 700, fontSize: '16px', margin: '0 auto', border: '1.5px solid var(--color-primary)'
            }}>
              <span>⏱️</span>
              <span>Memorize Phase — {gameTimer}s Remaining</span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 700 }}>
              Look closely at these picture cards and remember them!
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
                    {meta.category && (
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                        {meta.category}
                      </span>
                    )}
                    {meta.trait && (
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>{meta.trait}</p>
                    )}
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
              I'm Ready! Answer Now →
            </button>
          </div>
        )}

        {/* ─── PLAY / QUESTION PHASE (Visual Picture Choices) ─── */}
        {gamePhase === 'play' && currentItem && (
          <div className="stack text-center" style={{ gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontWeight: 700, margin: '0 auto', fontSize: '15px'
            }}>
              <span>Question {gameSession.currentItemIndex + 1} of {gameSession.items.length}</span>
            </div>

            <div className="card" style={{ maxWidth: '780px', margin: '0 auto', padding: 'var(--space-2xl)', background: '#FFFFFF', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-xl)' }}>
              {currentItem.metadata?.emoji && (
                <div style={{ fontSize: '64px', marginBottom: '12px' }}>{currentItem.metadata.emoji}</div>
              )}
              
              <h3 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-xl)', lineHeight: 1.4 }}>
                {currentItem.prompt}
              </h3>

              {/* Visual Choice Cards */}
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

        {/* ─── RESULT PHASE ─── */}
        {gamePhase === 'result' && summary && (
          <div className="stack text-center" style={{ maxWidth: '600px', margin: '0 auto', gap: 'var(--space-lg)' }}>
            <div style={{ fontSize: 80 }}>{summary.accuracy >= 70 ? '🌸' : summary.accuracy >= 40 ? '👍' : '💪'}</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {summary.accuracy >= 70 ? 'Wonderful Memory Activity!' : summary.accuracy >= 40 ? 'Good effort!' : 'Great practice!'}
            </h2>
            
            <div className="card" style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-xl)', border: '2px solid var(--color-border)' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>
                Score: <strong>{summary.score}</strong>
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>{summary.correctCount} / {summary.totalItems}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Correct Items</div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700 }}>{summary.accuracy}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Accuracy</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-large" onClick={() => startGame(currentGameKey)}>
                Play Again 🔄
              </button>
              <button className="btn btn-primary btn-large" onClick={finishGame}>
                Back to All Games 🧩
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Main App (All other authenticated pages) ──────────────────────────────
  return (
    <AppShell user={user!} page={page} setPage={setPage} onLogout={handleLogout}>
      {/* Main Page Container */}
      <div className="container" style={{ paddingBottom: '120px' }}>

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
                  style={{ background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-primary-bg))', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>💬</div>
                  <h3 className="mt-sm">Talk to Granny</h3>
                  <p className="text-muted">Voice companion chat</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('games')}
                  style={{ background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-primary-light))', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>🧩</div>
                  <h3 className="mt-sm">Play Games</h3>
                  <p className="text-muted">10 memory games</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('health')}
                  style={{ background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-accent-light))', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>💊</div>
                  <h3 className="mt-sm">Health & Meds</h3>
                  <p className="text-muted">Reminders & schedule</p>
                </button>
                <button className="card card-interactive" onClick={() => setPage('memory')}
                  style={{ background: 'linear-gradient(135deg, var(--color-bg-card), var(--color-secondary-light))', textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>📸</div>
                  <h3 className="mt-sm">Memories</h3>
                  <p className="text-muted">Your life stories</p>
                </button>
              </div>

              {/* JIT Micro-Intervention Quick Spark */}
              <div className="card" style={{ background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-primary-dark)' }}>✨ 2-Minute Brain Spark</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
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
                style={{ background: 'linear-gradient(135deg, var(--color-secondary-light), var(--color-secondary))', border: '1px solid var(--color-secondary-dark)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ fontSize: 44 }}>🎭</div>
                  <div>
                    <h3 style={{ color: 'white' }}>Life-Story Memory Theatre</h3>
                    <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
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
            <div className="page-header">
              <h2>💬 Voice Companion</h2>
              <p className="text-muted">I'm here to listen and chat with you</p>
            </div>

            <div className="chat-container" style={{ minHeight: '50vh' }}>
              {messages.length === 0 && (
                <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <div style={{ fontSize: 72 }}>👵</div>
                  <p className="text-large mt-lg">Hello, dear! I'm Granny.</p>
                  <p className="text-muted mt-sm">Say hello or type a message below.</p>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                  {msg.text}
                  {msg.emotion && msg.sender === 'assistant' && (
                    <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                      Mood: {msg.emotion}
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
            </div>

            {/* Chat input */}
            <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: 'var(--space-md) var(--space-lg)', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', maxWidth: 700, margin: '0 auto' }}>
                <input className="input" placeholder="Type your message..." value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()} />
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
          <div className="stack" style={{ gap: 'var(--space-xl)' }}>
            <div className="page-header" style={{ textAlign: 'left', padding: '0 0 var(--space-md) 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="text-secondary" style={{ fontSize: 'var(--font-size-2xl)' }}>🌿</span>
                <h2>{user?.name || 'Lakshmi'}'s Memory Journey</h2>
              </div>
              <p className="text-muted" style={{ fontSize: 'var(--font-size-lg)' }}>Here's how her journey has been going.</p>
            </div>

            {/* AI Journey Summary */}
            <div className="card" style={{ background: 'var(--color-primary-bg)', border: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <h3 style={{ color: 'var(--color-primary-dark)' }}>AI Journey Summary</h3>
              </div>
              <p style={{ color: 'var(--color-text)' }}>
                {user?.name || 'Lakshmi'} had a consistent week and explored several memory activities. She particularly enjoyed music and garden activities. Upcoming activities have been gently adjusted to match her current pace.
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid-2">
              <div className="card">
                <p className="text-muted uppercase" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Sessions</p>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>12</div>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>This week</p>
              </div>
              <div className="card">
                <p className="text-muted uppercase" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Minutes Active</p>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>145</div>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Consistent rhythm</p>
              </div>
              <div className="card">
                <p className="text-muted uppercase" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Activities Explored</p>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>4</div>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Favorites: Music & Garden</p>
              </div>
              <div className="card">
                <p className="text-muted uppercase" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Memories Created</p>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary)' }}>3</div>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>2 Family stories shared</p>
              </div>
            </div>

            {/* Performance Trend Placeholder */}
            <div className="card">
              <h3>📈 Recent Activity Performance</h3>
              <p className="text-muted mt-sm mb-md">Areas of exploration and recall activities</p>
              <div style={{ height: '200px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--color-border)' }}>
                <span className="text-muted">[ Interactive Trend Chart (Memory, Attention, Recall) ]</span>
              </div>
            </div>

            {/* Favorite Activities & Timeline */}
            <div className="grid-2">
              <div className="card">
                <h3>⭐ Activities They Enjoy</h3>
                <div className="stack" style={{ gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                  <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600 }}>Memory Garden</div>
                    <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Enjoyed frequently</div>
                  </div>
                  <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 600 }}>Complete the Tune</div>
                    <div className="text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>Very engaged this week</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>🌱 Memory Garden Growth</h3>
                <p className="text-muted mt-sm">Her garden has grown this week!</p>
                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '32px' }}>🌺</span>
                  <div style={{ fontWeight: 600, marginTop: 'var(--space-sm)' }}>New Jasmine unlocked</div>
                  <div style={{ color: 'var(--color-primary-dark)', fontSize: 'var(--font-size-sm)' }}>From Story Detective activity</div>
                </div>
              </div>
            </div>
          </div>
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

      {/* ─── Persistent Mic Button ──────────────────────────────────────────── */}
      <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={toggleListening}
        title={isListening ? 'Stop listening' : 'Tap to speak'}>
        {isListening ? '⏹' : '🎙️'}
      </button>
    </AppShell>
  );
}
