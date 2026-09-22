import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import AppShell from './components/navigation/AppShell';
import ProtectedRoute from './components/navigation/ProtectedRoute';
import { playTempleBellChime } from './utils/audioChime';

// Page Imports
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';

// Elder Pages
import HomePage from './pages/Home/HomePage';
import CompanionPage from './pages/Companion/CompanionPage';
import GamesPage from './pages/Games/GamesPage';
import GamePlayPage from './pages/Games/GamePlayPage';
import FamilyPage from './pages/Family/FamilyPage';
import HealthPage from './pages/Health/HealthPage';
import MemoryPage from './pages/Memory/MemoryPage';
import TheatrePage from './pages/Theatre/TheatrePage';
import SettingsPage from './pages/Settings/SettingsPage';

// Caretaker Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import AlarmsPage from './pages/Caretaker/AlarmsPage';
import MedicalPage from './pages/Caretaker/MedicalPage';
import MemoriesPage from './pages/Caretaker/MemoriesPage';
import ContactsPage from './pages/Caretaker/ContactsPage';
import GuidePage from './pages/Caretaker/GuidePage';
import LinkPage from './pages/Caretaker/LinkPage';

// ─── Authenticated App Layout with AppShell ──────────────────────────────────
function AppLayout() {
  const { user, handleLogout, language, toggleLanguage, handleSOS } = useAppContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      user={user}
      onLogout={handleLogout}
      language={language}
      onToggleLanguage={toggleLanguage}
      onSosTrigger={handleSOS}
    >
      <Outlet />
    </AppShell>
  );
}

// ─── Global Overlays & Modals ────────────────────────────────────────────────
function GlobalOverlays() {
  const {
    user,
    language,
    isCaretaker,
    isListening,
    toggleListening,
    activeMedicationAlert,
    setActiveMedicationAlert,
    activeIncomingCall,
    setActiveIncomingCall,
    activeHealthAlertBanner,
    setActiveHealthAlertBanner,
    handleToggleReminder,
  } = useAppContext();

  return (
    <>
      {/* Real-Time Medication Alert Modal (With Chime Pulse Ring) */}
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

      {/* Real-Time Incoming Family Call Modal */}
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

      {/* Active Health Alert Banner for Caregiver */}
      {activeHealthAlertBanner && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          backgroundColor: activeHealthAlertBanner.severity === 'URGENT' || activeHealthAlertBanner.severity === 'HIGH' ? '#B71C1C' : '#E65100',
          color: '#FFFFFF', padding: '18px 24px', borderRadius: '18px', maxWidth: '420px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚨 {activeHealthAlertBanner.title}
            </strong>
            <button
              onClick={() => setActiveHealthAlertBanner(null)}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '18px', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '14px', margin: 0, opacity: 0.95, lineHeight: 1.4 }}>
            {activeHealthAlertBanner.message}
          </p>
          {activeHealthAlertBanner.recommendation && (
            <p style={{ fontSize: '12px', margin: 0, fontStyle: 'italic', opacity: 0.9, backgroundColor: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '8px' }}>
              💡 {activeHealthAlertBanner.recommendation}
            </p>
          )}
        </div>
      )}

      {/* Persistent Voice Mic Button for Elder Sanctuary */}
      {!isCaretaker && user && (
        <button
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Tap to speak with Asha'}
        >
          {isListening ? '⏹' : '🎙️'}
        </button>
      )}
    </>
  );
}

// ─── Route Declarations ───────────────────────────────────────────────────────
function AppRoutes() {
  const { fontSize, highContrast } = useAppContext();

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize * 100}%`;
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  return (
    <>
      <GlobalOverlays />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected App Shell Routes */}
        <Route element={<AppLayout />}>
          {/* Elder Sanctuary Routes */}
          <Route path="/home" element={<ProtectedRoute role="ELDER"><HomePage /></ProtectedRoute>} />
          <Route path="/companion" element={<ProtectedRoute role="ELDER"><CompanionPage /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute role="ELDER"><GamesPage /></ProtectedRoute>} />
          <Route path="/games/play" element={<ProtectedRoute role="ELDER"><GamePlayPage /></ProtectedRoute>} />
          <Route path="/games/:gameKey" element={<ProtectedRoute role="ELDER"><GamePlayPage /></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute role="ELDER"><FamilyPage /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute role="ELDER"><HealthPage /></ProtectedRoute>} />
          <Route path="/memory" element={<ProtectedRoute role="ELDER"><MemoryPage /></ProtectedRoute>} />
          <Route path="/theatre" element={<ProtectedRoute role="ELDER"><TheatrePage /></ProtectedRoute>} />

          {/* Caregiver Portal Routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="CAREGIVER"><DashboardPage /></ProtectedRoute>} />
          <Route path="/caretaker/alarms" element={<ProtectedRoute role="CAREGIVER"><AlarmsPage /></ProtectedRoute>} />
          <Route path="/caretaker/medical" element={<ProtectedRoute role="CAREGIVER"><MedicalPage /></ProtectedRoute>} />
          <Route path="/caretaker/memories" element={<ProtectedRoute role="CAREGIVER"><MemoriesPage /></ProtectedRoute>} />
          <Route path="/caretaker/contacts" element={<ProtectedRoute role="CAREGIVER"><ContactsPage /></ProtectedRoute>} />
          <Route path="/caretaker/guide" element={<ProtectedRoute role="CAREGIVER"><GuidePage /></ProtectedRoute>} />
          <Route path="/caretaker/link" element={<ProtectedRoute role="CAREGIVER"><LinkPage /></ProtectedRoute>} />

          {/* Shared Settings */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

// ─── Root App Component with AppProvider ─────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
