// ============================================================================
// LandingPage.tsx — Stunning, Warm, Dignified Landing Page for Granny
// Fully localized in Tamil and English
// ============================================================================
import React, { useState } from 'react';
import { t } from '../i18n';
import { ALL_GAMES } from '../features/games/engine/games';

interface LandingPageProps {
  onStartDemo: (role?: 'ELDER' | 'CAREGIVER') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  language: string;
  onToggleLanguage: () => void;
}

export default function LandingPage({
  onStartDemo,
  onOpenAuth,
  language,
  onToggleLanguage,
}: LandingPageProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'outdoor' | 'indoor' | 'cinema'>('all');

  const filteredGames = ALL_GAMES.filter((_, idx) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'outdoor') return idx < 10;
    if (activeCategory === 'indoor') return idx >= 10 && idx < 15;
    if (activeCategory === 'cinema') return idx >= 15;
    return true;
  });
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── Top Navigation Bar ───────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-xl)', height: '80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <img src="/logo.png" alt="Granny Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          <img src="/title.png" alt="Granny" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Accessibility & Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Tamil / English Toggle */}
          <button
            onClick={onToggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '15px', fontWeight: 700, minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--color-primary)' }}
            title="Switch Language / மொழியை மாற்றுக"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>translate</span>
            <span style={{ color: 'var(--color-primary-dark)' }}>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 600, minHeight: '46px' }}
          >
            {t('sign_in', language)}
          </button>

          <button
            onClick={() => onStartDemo('ELDER')}
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '15px', fontWeight: 700, minHeight: '46px', boxShadow: '0 4px 14px rgba(59, 122, 87, 0.3)' }}
          >
            {t('explore_demo', language)}
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-3xl) var(--space-xl)',
        background: 'radial-gradient(circle at 80% 20%, rgba(59, 122, 87, 0.12) 0%, rgba(245, 251, 246, 0) 60%), radial-gradient(circle at 10% 80%, rgba(252, 151, 97, 0.12) 0%, rgba(245, 251, 246, 0) 60%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 'var(--space-2xl)', alignItems: 'center' }}>
          
          {/* Left Column: Headline & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start', border: '1px solid var(--color-border)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>nest_eco_leaf</span>
              <span>{t('hero_pill', language)}</span>
            </div>

            <h1 style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
              {t('hero_title', language)}
            </h1>

            <p style={{ fontSize: '19px', lineHeight: 1.6, color: 'var(--color-text-secondary)', maxWidth: '580px' }}>
              {t('hero_subtitle', language)}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
              <button
                onClick={() => onStartDemo('ELDER')}
                className="btn btn-primary btn-large"
                style={{
                  padding: '16px 30px', fontSize: '17px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 8px 24px rgba(59, 122, 87, 0.3)'
                }}
              >
                <span>{t('enter_elder_sanctuary', language)}</span>
              </button>

              <button
                onClick={() => onStartDemo('CAREGIVER')}
                className="btn btn-secondary btn-large"
                style={{
                  padding: '16px 26px', fontSize: '17px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <span>{t('caretaker_portal_demo', language)}</span>
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn"
                style={{
                  padding: '16px 26px', fontSize: '17px', fontWeight: 700,
                  backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary-dark)',
                  border: '1px solid var(--color-secondary)'
                }}
              >
                {t('create_account', language)}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Sanctuary Showcase Card */}
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)', border: '2px solid var(--color-border)',
            boxShadow: '0 20px 48px rgba(36, 42, 39, 0.08)', position: 'relative'
          }}>
            {/* Live Synchronized Pill */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  {t('companion_status', language)}
                </span>
              </div>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                {t('synced_live', language)}
              </span>
            </div>

            {/* Morning Greeting Mock */}
            <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg)', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>🪷</span>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-secondary-dark)', fontWeight: 700 }}>
                    {language === 'ta' ? 'காலை வணக்கம்' : 'Kaalai Vanakkam • Good Morning'}
                  </div>
                  <div style={{ fontSize: '19px', fontWeight: 700 }}>{t('morning_greeting_title', language)}</div>
                </div>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {t('morning_greeting_desc', language)}
              </p>
            </div>

            {/* Interactive Picture Activity Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: '#EFF5F0', border: '1.5px solid #C5E5D1', textAlign: 'center' }}>
                <div style={{ fontSize: '32px' }}>🌺</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{t('garland_title', language)}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('garland_sub', language)}</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: '#FFF4EE', border: '1.5px solid #FCD4BE', textAlign: 'center' }}>
                <div style={{ fontSize: '32px' }}>📻</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{t('melodies_title', language)}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{t('melodies_sub', language)}</div>
              </div>
            </div>

            {/* Family Postbox Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', border: '1px dashed var(--color-primary)' }}>
              <span style={{ fontSize: '24px' }}>🎙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t('grandson_note', language)}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{t('grandson_quote', language)}</div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>0:34 ▶</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 4 Core Pillars ──────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', backgroundColor: '#FFFFFF', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
              {t('pillars_eyebrow', language)}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
              {t('pillars_title', language)}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 'var(--space-xl)' }}>
            
            {/* Pillar 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>👵</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {t('pillar1_title', language)}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                {t('pillar1_desc', language)}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>🧩</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {t('pillar2_title', language)}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                {t('pillar2_desc', language)}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>🎭</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {t('pillar3_title', language)}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                {t('pillar3_desc', language)}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>👨‍👩‍👧</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                {t('pillar4_title', language)}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                {t('pillar4_desc', language)}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Picture-Based Games Grid Showcase ────────────────────────────── */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', backgroundColor: 'var(--color-bg)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-secondary-dark)', letterSpacing: '0.05em' }}>
              {t('games_eyebrow', language)}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>
              {t('games_title', language)}
            </h2>
            <p style={{ fontSize: '17px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {t('games_subtitle', language)}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
            {[
              { id: 'all' as const, label: `${t('games_cat_all', language)} (20)` },
              { id: 'outdoor' as const, label: `🏃 ${t('games_cat_outdoor', language)} (10)` },
              { id: 'indoor' as const, label: `🎲 ${t('games_cat_indoor', language)} (5)` },
              { id: 'cinema' as const, label: `🎬 ${t('games_cat_cinema', language)} (5)` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className="btn"
                style={{
                  padding: '10px 18px', fontSize: '14px', fontWeight: 700,
                  backgroundColor: activeCategory === tab.id ? 'var(--color-primary)' : '#FFFFFF',
                  color: activeCategory === tab.id ? '#FFFFFF' : 'var(--color-text)',
                  border: activeCategory === tab.id ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-lg)' }}>
            {filteredGames.map((game, i) => {
              const gameKeyI18n = game.key.replace(/-/g, '_');
              const title = t(`game_${gameKeyI18n}_title`, language) || game.title;
              const desc = t(`game_${gameKeyI18n}_desc`, language) || game.description;
              const globalIndex = ALL_GAMES.findIndex(g => g.key === game.key);
              const catBadge = globalIndex < 10 
                ? (language === 'ta' ? 'வெளிப்புறம்' : 'Outdoor') 
                : globalIndex < 15 
                ? (language === 'ta' ? 'தாயக்கட்டம்' : 'Indoor') 
                : (language === 'ta' ? 'சினிமா' : 'Cinema');

              return (
                <div
                  key={game.key}
                  className="card card-interactive"
                  onClick={() => onStartDemo('ELDER')}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '22px',
                    border: '1.5px solid var(--color-border)', borderTop: `4px solid ${game.color}`,
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '38px' }}>{game.icon}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '10px',
                      backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
                      textTransform: 'uppercase'
                    }}>
                      {catBadge}
                    </span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>{desc}</div>
                  <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                      {language === 'ta' ? 'விளையாடு' : 'Play Activity'}
                    </span>
                    <span style={{ fontSize: '16px', color: 'var(--color-primary)' }}>▶</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <button
              onClick={() => onStartDemo('ELDER')}
              className="btn btn-primary btn-large"
              style={{ padding: '16px 36px', fontSize: '17px', fontWeight: 700 }}
            >
              {t('play_all_games', language)}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        marginTop: 'auto', backgroundColor: '#FFFFFF', borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center', color: 'var(--color-text-secondary)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🌸</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t('app_name', language)}</span>
          </div>
          <p style={{ fontSize: '14px', maxWidth: '600px' }}>
            {language === 'ta' 
              ? 'முதியோர்களுக்காகவும் அவர்களின் குடும்பங்களுக்காகவும் ஆழ்ந்த பாசத்துடன் உருவாக்கப்பட்டது.' 
              : 'Built with deep empathy for elders and their loved ones.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '14px', fontWeight: 600 }}>
            <button onClick={() => onStartDemo('ELDER')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>{t('enter_elder_sanctuary', language)}</button>
            <span>•</span>
            <button onClick={() => onStartDemo('CAREGIVER')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>{t('caretaker_portal_demo', language)}</button>
            <span>•</span>
            <button onClick={() => onOpenAuth('login')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>{t('sign_in', language)}</button>
            <span>•</span>
            <button onClick={() => onOpenAuth('register')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>{t('create_account', language)}</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
