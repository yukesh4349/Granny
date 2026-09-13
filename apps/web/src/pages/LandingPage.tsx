// ============================================================================
// LandingPage.tsx — Stunning, Modern, Accessible Landing Page for Granny
// ============================================================================
import React from 'react';

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
  highContrast,
  onToggleContrast,
  language,
  onToggleLanguage,
}: LandingPageProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── Top Navigation Bar ───────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 var(--space-xl)', height: '80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ fontSize: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🌸</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Granny <span style={{ fontSize: '13px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>Memory Journey</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {language === 'ta' ? 'முதியோருக்கான அன்பான AI நினைவாற்றல் துணை' : 'Cognitive Sanctuary & AI Reminiscence'}
            </div>
          </div>
        </div>

        {/* Accessibility & Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button
            onClick={onToggleContrast}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '14px', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Toggle High Contrast Mode"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>contrast</span>
            <span>{highContrast ? 'Normal' : 'High Contrast'}</span>
          </button>

          <button
            onClick={onToggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '14px', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>translate</span>
            <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', fontSize: '15px', fontWeight: 600, minHeight: '46px' }}
          >
            Sign In
          </button>

          <button
            onClick={() => onStartDemo('ELDER')}
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontSize: '15px', fontWeight: 700, minHeight: '46px', boxShadow: '0 4px 14px rgba(59, 122, 87, 0.3)' }}
          >
            ✨ Explore Live Demo
          </button>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-3xl) var(--space-xl)',
        background: 'radial-gradient(circle at 80% 20%, rgba(59, 122, 87, 0.12) 0%, rgba(245, 251, 246, 0) 60%), radial-gradient(circle at 10% 80%, rgba(252, 151, 97, 0.12) 0%, rgba(245, 251, 246, 0) 60%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-2xl)', alignItems: 'center' }}>
          
          {/* Left Column: Headline & CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
              fontSize: '14px', fontWeight: 700, alignSelf: 'flex-start', border: '1px solid var(--color-border)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>nest_eco_leaf</span>
              <span>Non-Diagnostic • Dignified & Compassionate AI</span>
            </div>

            <h1 style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
              Where Cherished Stories Live &amp; Every Memory is Honored.
            </h1>

            <p style={{ fontSize: '20px', lineHeight: 1.6, color: 'var(--color-text-secondary)', maxWidth: '580px' }}>
              Granny is an elderly-first cognitive engagement sanctuary. Powered by patient, unhurried voice AI, 10 picture-based memory journeys, and continuous heartwarming family connection.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }}>
              <button
                onClick={() => onStartDemo('ELDER')}
                className="btn btn-primary btn-large"
                style={{
                  padding: '16px 32px', fontSize: '18px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 8px 24px rgba(59, 122, 87, 0.3)'
                }}
              >
                <span>🌸</span>
                <span>Enter Elder Sanctuary</span>
              </button>

              <button
                onClick={() => onStartDemo('CAREGIVER')}
                className="btn btn-secondary btn-large"
                style={{
                  padding: '16px 28px', fontSize: '18px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '10px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                <span>👥</span>
                <span>Caretaker Portal Demo</span>
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="btn"
                style={{
                  padding: '16px 28px', fontSize: '18px', fontWeight: 700,
                  backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary-dark)',
                  border: '1px solid var(--color-secondary)'
                }}
              >
                Create Free Account
              </button>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', gap: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-sm)' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)' }}>10+</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Picture Games</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-secondary-dark)' }}>WCAG AAA</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>High Contrast &amp; Big Targets</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>100% Empathetic</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Zero Clinical Pressure</div>
              </div>
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
                  Asha Voice Companion: Attentive
                </span>
              </div>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                Synced Live
              </span>
            </div>

            {/* Morning Greeting Mock */}
            <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg)', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>🪷</span>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-secondary-dark)', fontWeight: 700 }}>Kaalai Vanakkam • காலை வணக்கம்</div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>"Good morning, Lakshmi Amma."</div>
                </div>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                "The jasmine flowers in the verandah smell wonderful today. Would you like to arrange the morning garland or listen to M.S. Subbulakshmi songs?"
              </p>
            </div>

            {/* Interactive Picture Activity Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: '#EFF5F0', border: '1.5px solid #C5E5D1', textAlign: 'center' }}>
                <div style={{ fontSize: '32px' }}>🌺</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>Morning Garland</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Visual &amp; Scent Memory</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: '#FFF4EE', border: '1.5px solid #FCD4BE', textAlign: 'center' }}>
                <div style={{ fontSize: '32px' }}>📻</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>AIR Melodies</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>1965 Classic Songs</div>
              </div>
            </div>

            {/* Family Postbox Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--color-primary-bg)', border: '1px dashed var(--color-primary)' }}>
              <span style={{ fontSize: '24px' }}>🎙️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Voice note from Grandson Arjun (11)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>“Paati, tell me about your blue Ambassador car!”</div>
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
              Four Pillars of Empathetic Care
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>
              Designed with Older Adults, Cherished by Families
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 'var(--space-xl)' }}>
            
            {/* Pillar 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>👵</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Patient Voice Companion
              </h3>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                Asha listens attentively with unhurried cadence, understands natural interruptions, sings devotional &amp; classic songs, and recites warm poems in English and Tamil.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>🧩</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                10 Picture-Based Games
              </h3>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                Engaging, tactile exercises like Name &amp; Face Match, Memory Market Baskets, Remember My Home, and Botanical Garden with adaptive difficulty calibrated to cognitive comfort.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>🎭</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Life-Story Memory Theatre
              </h3>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                Interactive reminiscence adventures that turn ancestral journeys, wedding celebrations, and festival mornings into cherished, multi-generational digital keepsakes.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)' }}>
              <div style={{ fontSize: '42px' }}>👨‍👩‍👧</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Caregiver Live Sanctuary
              </h3>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                Reassuring observational summaries, mood stability trends, and the ability to send gentle memory cues and voice notes directly into the elder's morning sanctuary.
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
              Cognitive Stimulation Library
            </div>
            <h2 style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px' }}>
              10 Delightful Visual &amp; Audio Picture Games
            </h2>
            <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Culturally grounded, high contrast, and enjoyable for daily mental agility.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
            {[
              { icon: '🏠', title: 'Remember My Home', desc: 'Spatial room memory & object recall', tag: 'Spatial' },
              { icon: '🛒', title: 'Memory Market', desc: 'Fresh bazaar grocery & vegetable basket', tag: 'Working Memory' },
              { icon: '👤', title: 'Name & Face Match', desc: 'Family portraits, traits & associations', tag: 'Recognition' },
              { icon: '🍳', title: 'Recipe Recall', desc: 'Traditional cooking steps & spice order', tag: 'Sequential' },
              { icon: '🚶', title: 'Memory Journey', desc: 'Historic temple & city routes traveled', tag: 'Episodic' },
              { icon: '🎵', title: 'Complete the Tune', desc: 'Carnatic, AIR radio & classic melodies', tag: 'Auditory' },
              { icon: '🔍', title: 'Story Detective', desc: 'Gentle story clues & family trivia', tag: 'Comprehension' },
              { icon: '🔑', title: 'Where Did I Keep It?', desc: 'Household hotspot memory recall', tag: 'Spatial' },
              { icon: '🌺', title: 'Memory Garden', desc: 'Jasmine, marigold & botanical growth', tag: 'Botanical' },
              { icon: '📸', title: 'Memory Album', desc: 'Vintage photo details & life anecdotes', tag: 'Reminiscence' },
            ].map((game, i) => (
              <div key={i} className="card" style={{
                backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px',
                border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '36px' }}>{game.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>
                    {game.tag}
                  </span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>{game.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{game.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <button
              onClick={() => onStartDemo('ELDER')}
              className="btn btn-primary btn-large"
              style={{ padding: '16px 36px', fontSize: '18px', fontWeight: 700 }}
            >
              Play All Picture Games Now →
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
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Granny — Memory Journey Sanctuary</span>
          </div>
          <p style={{ fontSize: '14px', maxWidth: '600px' }}>
            Built with deep empathy for elders and their loved ones. Conforms to WCAG AAA contrast, sensory clarity, and non-diagnostic privacy standards.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '14px', fontWeight: 600 }}>
            <button onClick={() => onStartDemo('ELDER')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>Elder Experience</button>
            <span>•</span>
            <button onClick={() => onStartDemo('CAREGIVER')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>Caregiver Portal</button>
            <span>•</span>
            <button onClick={() => onOpenAuth('login')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>Sign In</button>
            <span>•</span>
            <button onClick={() => onOpenAuth('register')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>Create Account</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
