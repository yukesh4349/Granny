import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { playTempleBellChime } from '../../utils/audioChime';

export default function HomePage() {
  const {
    user, language, navigateTo, sosActive, handleSOS,
    ttsEnabled, setTtsEnabled, setTheatreStep, setTheatreFeedback,
    activeMicroDose, setActiveMicroDose, triggerTestMedicineAlarm, triggerTestFamilyCall
  } = useAppContext();

  return (
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          <button className="card card-interactive" onClick={() => navigateTo('companion')}
            style={{ background: 'linear-gradient(135deg, #EFFBF2 0%, #D8F3DC 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #95D5B2' }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <h3 style={{ marginTop: '10px', color: '#1B4332', fontSize: '20px' }}>{t('talk_to_granny', language)}</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('voice_companion_chat', language)}</p>
          </button>
          <button className="card card-interactive" onClick={() => navigateTo('games')}
            style={{ background: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #B39DDB' }}>
            <div style={{ fontSize: 48 }}>🧩</div>
            <h3 style={{ marginTop: '10px', color: '#4A148C', fontSize: '20px' }}>{t('play_games', language)}</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>✨ 20 {language === 'ta' ? 'AI பாரம்பரிய விளையாட்டுகள்' : 'AI Nostalgia Games'}</p>
          </button>
          <button className="card card-interactive" onClick={() => navigateTo('family')}
            style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #FFCC80' }}>
            <div style={{ fontSize: 48 }}>👨‍👩‍👧‍👦</div>
            <h3 style={{ marginTop: '10px', color: '#E65100', fontSize: '20px' }}>{t('family_circle', language)}</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('family_circle_desc', language)}</p>
          </button>
          <button className="card card-interactive" onClick={() => navigateTo('memory')}
            style={{ background: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)', textAlign: 'center', padding: '28px 18px', border: '2.5px solid #80CBC4' }}>
            <div style={{ fontSize: 48 }}>📸</div>
            <h3 style={{ marginTop: '10px', color: '#004D40', fontSize: '20px' }}>{t('memories', language)}</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '4px' }}>{t('your_life_stories', language)}</p>
          </button>
        </div>

        {/* Life-Story Memory Theatre Highlight Banner */}
        <div className="card card-interactive"
          onClick={() => { setTheatreStep(0); setTheatreFeedback(null); navigateTo('theatre'); }}
          style={{
            background: 'linear-gradient(135deg, #FF7043 0%, #E64A19 100%)',
            color: '#FFFFFF', borderRadius: '24px', padding: '24px 28px',
            boxShadow: '0 8px 24px rgba(230, 74, 25, 0.2)'
          }}>
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

        {/* Micro-Intervention Quick Spark */}
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
            <button className="btn btn-primary"
              onClick={() => {
                playTempleBellChime();
                setActiveMicroDose({
                  title: 'Verandah Observation',
                  prompt: 'Look around your room right now.',
                  task: language === 'ta' ? 'உங்கள் அறையில் நீல அல்லது பச்சை நிறத்தில் உள்ள 3 பொருட்களை மனதிற்குள் கூறுங்கள்!' : 'Name 3 things in your room that are blue or green!'
                });
              }}
              style={{ padding: '12px 24px', fontSize: '15px' }}>
              {activeMicroDose ? t('spark_done', language) : t('spark_start', language)}
            </button>
          </div>
        </div>

        {/* Sound & Alarm Tester */}
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
                style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: ttsEnabled ? '#E8F5E9' : '#F5F5F5', border: ttsEnabled ? '1.5px solid #2E7D32' : '1.5px solid #CCC' }}>
                🔊 TTS {ttsEnabled ? (language === 'ta' ? 'ஆன்' : 'ON') : (language === 'ta' ? 'ஆஃப்' : 'OFF')}
              </button>
            </div>
          </div>
        </div>

        {/* Emergency SOS */}
        <button onClick={handleSOS}
          style={{
            width: '100%', padding: '20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            background: sosActive
              ? 'linear-gradient(135deg, #B71C1C 0%, #E53935 100%)'
              : 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
            color: '#FFFFFF', fontSize: '22px', fontWeight: 900,
            boxShadow: sosActive ? '0 0 30px rgba(229,57,53,0.7)' : '0 6px 20px rgba(229,57,53,0.35)',
            animation: sosActive ? 'pulse 0.8s infinite' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px'
          }}>
          <span style={{ fontSize: 40 }}>🆘</span>
          <span>{sosActive ? (language === 'ta' ? 'SOS நிறுத்து' : 'STOP SOS ALARM') : (language === 'ta' ? 'அவசர SOS அழைப்பு' : 'EMERGENCY SOS — Call Caretaker!')}</span>
        </button>
      </div>
    </>
  );
}
