import React from 'react';
import { t } from '../../i18n';

interface AppShellProps {
  user: { name: string; role: string; language?: string };
  page: string;
  setPage: (page: any) => void;
  onLogout: () => void;
  language: string;
  onToggleLanguage: () => void;
  children: React.ReactNode;
}

export default function AppShell({
  user,
  page,
  setPage,
  onLogout,
  language,
  onToggleLanguage,
  children
}: AppShellProps) {
  const isCaretaker = user.role === 'CAREGIVER';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      {/* ─── Top Header ──────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(12px)',
        zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: isCaretaker ? '2px solid #7B1FA2' : '2px solid var(--color-primary)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', boxSizing: 'border-box'
      }}>
        {/* Left: Brand + Prominent Portal Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{ fontSize: '32px', cursor: 'pointer', lineHeight: 1 }} 
            onClick={() => setPage(isCaretaker ? 'dashboard' : 'home')}
          >
            🌸
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span 
                style={{ fontWeight: 900, color: 'var(--color-primary-dark)', fontSize: '22px', letterSpacing: '-0.02em', cursor: 'pointer' }}
                onClick={() => setPage(isCaretaker ? 'dashboard' : 'home')}
              >
                {t('app_name', language)}
              </span>

              {/* High-visibility Portal Mode Pill */}
              {isCaretaker ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '16px',
                  backgroundColor: '#4A148C', color: '#FFFFFF',
                  fontWeight: 800, fontSize: '12px', letterSpacing: '0.02em'
                }}>
                  <span>👨‍👩‍👧</span>
                  <span>{language === 'ta' ? 'பராமரிப்பாளர் தளம்' : 'Caretaker Portal'}</span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '16px',
                  backgroundColor: '#1B4332', color: '#D8F3DC',
                  fontWeight: 800, fontSize: '12px', letterSpacing: '0.02em'
                }}>
                  <span>👵👴</span>
                  <span>{language === 'ta' ? 'முதியோர் சரணாலயம்' : 'Elder Sanctuary'}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {t('tagline', language)}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid var(--color-primary)' }}
            title="Switch Language / மொழியை மாற்றுக"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>translate</span>
            <span style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>

          {/* Emergency SOS Button in Header (for Elders) */}
          {!isCaretaker && (
            <button
              onClick={() => alert(language === 'ta' ? '🚨 அவசர உதவி அழைப்பு விடுக்கப்பட்டது! உங்கள் குடும்பத்தினருக்கு தகவல் அனுப்பப்பட்டுள்ளது.' : '🚨 Calling designated emergency contact: Rahul (Son - +91 98765 43210). Help is on the way!')}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-danger)', color: '#FFFFFF',
                border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', minHeight: '36px',
                boxShadow: '0 2px 8px rgba(229, 57, 53, 0.25)'
              }}
            >
              <span>🆘</span>
              <span>{t('emergency_sos', language)}</span>
            </button>
          )}

          {/* Active User Pill */}
          <div style={{
            fontSize: '12px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '10px', backgroundColor: isCaretaker ? '#EDE7F6' : '#E8F5E9',
            border: isCaretaker ? '1px solid #CE93D8' : '1px solid #A5D6A7', minHeight: '36px', boxSizing: 'border-box'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isCaretaker ? '#7B1FA2' : '#2E7D32' }} />
            <span>
              {isCaretaker 
                ? (language === 'ta' ? 'பராமரிப்பாளர்: ' : 'Caretaker: ') 
                : (language === 'ta' ? 'முதியோர்: ' : 'Elder: ')}
              <strong>{user.name}</strong>
            </span>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={onLogout} 
            style={{ padding: '6px 12px', minHeight: '36px', fontSize: '12px', fontWeight: 600 }}
          >
            {t('sign_out', language)}
          </button>
        </div>
      </header>

      {/* ─── Sidebar Navigation ──────────────────────────────────────────────── */}
      <aside style={{
        position: 'fixed', top: '80px', bottom: 0, left: 0, width: '280px',
        backgroundColor: isCaretaker ? '#FAF7FD' : 'var(--color-primary-bg)', 
        padding: '20px 16px',
        borderRight: isCaretaker ? '2px solid #E1BEE7' : '1px solid var(--color-border)', 
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px',
        boxSizing: 'border-box'
      }}>
        {/* Sidebar Portal Banner Header */}
        <div style={{
          padding: '14px 16px', borderRadius: '14px',
          background: isCaretaker 
            ? 'linear-gradient(135deg, #6A1B9A 0%, #4A148C 100%)' 
            : 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
          color: '#FFFFFF', marginBottom: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, fontWeight: 800 }}>
              {isCaretaker ? (language === 'ta' ? 'பராமரிப்பாளர் தளம்' : 'CARETAKER PORTAL') : (language === 'ta' ? 'முதியோர் சரணாலயம்' : 'ELDER SANCTUARY')}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
              {isCaretaker ? 'PRO' : 'LIVE'}
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{isCaretaker ? '👨‍👩‍👧' : '👵👴'}</span>
            <span>{isCaretaker ? (language === 'ta' ? 'கண்காணிப்பு மையம்' : 'Caretaker Dashboard') : (language === 'ta' ? 'முதியோர் பகுதி' : 'Elder Space')}</span>
          </div>
          <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '3px' }}>
            {isCaretaker 
              ? (language === 'ta' ? 'குடும்ப முதியோரை கவனித்தல்' : 'Managing Elder Care')
              : (language === 'ta' ? 'அன்பான நினைவுகள் & அமைதி' : 'Daily Peace & Memories')}
          </div>
        </div>

        {!isCaretaker ? (
          <>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.06em', padding: '4px 8px' }}>
              {t('nav_elder_spaces', language)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SidebarItem icon="nature_people" label={t('nav_home', language)} active={page === 'home'} onClick={() => setPage('home')} />
              <SidebarItem icon="record_voice_over" label={t('nav_companion', language)} active={page === 'companion'} onClick={() => setPage('companion')} />
              <SidebarItem icon="contact_phone" label={t('nav_family', language)} active={page === 'family'} onClick={() => setPage('family')} />
              <SidebarItem icon="explore" label={t('nav_games', language)} active={page === 'games' || page === 'play'} onClick={() => setPage('games')} />
              <SidebarItem icon="medication" label={t('nav_health', language)} active={page === 'health'} onClick={() => setPage('health')} />
              <SidebarItem icon="photo_library" label={t('nav_memory', language)} active={page === 'memory'} onClick={() => setPage('memory')} />
              <SidebarItem icon="theaters" label={t('nav_theatre', language)} active={page === 'theatre'} onClick={() => setPage('theatre')} />
              <SidebarItem icon="settings" label={t('nav_settings', language)} active={page === 'settings'} onClick={() => setPage('settings')} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#6A1B9A', letterSpacing: '0.06em', padding: '4px 8px' }}>
              {t('nav_caretaker_insights', language)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <SidebarItem icon="analytics" label={t('nav_overview', language)} active={page === 'dashboard'} onClick={() => setPage('dashboard')} isCaretaker />
              <SidebarItem icon="alarm" label={t('nav_alarms', language)} active={page === 'caretaker_alarms'} onClick={() => setPage('caretaker_alarms')} isCaretaker />
              <SidebarItem icon="medical_services" label={t('nav_medical', language)} active={page === 'caretaker_medical'} onClick={() => setPage('caretaker_medical')} isCaretaker />
              <SidebarItem icon="add_photo_alternate" label={t('nav_upload_memories', language)} active={page === 'caretaker_memories'} onClick={() => setPage('caretaker_memories')} isCaretaker />
              <SidebarItem icon="contacts" label={t('nav_contacts', language)} active={page === 'caretaker_contacts'} onClick={() => setPage('caretaker_contacts')} isCaretaker />
              <SidebarItem icon="assignment" label={t('nav_care_guide', language)} active={page === 'caretaker_guide'} onClick={() => setPage('caretaker_guide')} isCaretaker />
              <SidebarItem icon="link" label={t('nav_link_elder', language)} active={page === 'caretaker_link'} onClick={() => setPage('caretaker_link')} isCaretaker />
              <SidebarItem icon="settings" label={t('nav_settings', language)} active={page === 'settings'} onClick={() => setPage('settings')} isCaretaker />
            </div>
          </>
        )}
      </aside>

      {/* ─── Main Content Area ───────────────────────────────────────────────── */}
      <main style={{
        marginLeft: '280px',
        marginTop: '80px',
        width: 'calc(100% - 280px)',
        minHeight: 'calc(100vh - 80px)',
        padding: '28px 36px',
        boxSizing: 'border-box'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Top Context Indicator Ribbon on every page */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderRadius: '14px', marginBottom: '24px',
            backgroundColor: isCaretaker ? '#EDE7F6' : '#E8F5E9',
            border: isCaretaker ? '1.5px solid #D1C4E9' : '1.5px solid #C8E6C9',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{isCaretaker ? '🛡️' : '🌿'}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: isCaretaker ? '#4A148C' : '#1B4332' }}>
                  {isCaretaker 
                    ? (language === 'ta' ? 'பராமரிப்பாளர் தளம்: குடும்ப முதியோருக்கான மேலாண்மை மற்றும் நேரலை கண்காணிப்பு' : 'Caretaker Portal: Actively Managing & Monitoring Elder Care')
                    : (language === 'ta' ? 'முதியோர் சரணாலயம்: முதியோருக்கான அமைதியான அன்றாட தளம்' : 'Elder Sanctuary: Dedicated Daily Care Space')}
                </div>
              </div>
            </div>

            <span style={{ fontSize: '12px', fontWeight: 700, color: isCaretaker ? '#6A1B9A' : '#2D6A4F' }}>
              {isCaretaker ? '● Live Telemetry & Alerts' : '● 1-Tap Assisted Mode'}
            </span>
          </div>

          {children}
        </div>
      </main>

    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  isCaretaker = false
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  isCaretaker?: boolean;
}) {
  const activeBg = isCaretaker ? '#7B1FA2' : 'var(--color-primary)';
  const activeColor = '#FFFFFF';
  const inactiveColor = isCaretaker ? '#4A148C' : 'var(--color-text-secondary)';

  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px',
        borderRadius: '12px', border: 'none', cursor: 'pointer',
        backgroundColor: active ? activeBg : 'transparent',
        color: active ? activeColor : inactiveColor,
        fontWeight: active ? 800 : 600, fontSize: '14px', textAlign: 'left',
        transition: 'all 0.15s ease', width: '100%', boxSizing: 'border-box'
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: active ? 'white' : (isCaretaker ? '#7B1FA2' : 'var(--color-primary)') }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
