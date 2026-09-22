import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function SettingsPage() {
  const {
    language, navigateTo, isCaretaker, elderLinkCode, codeCopied,
    handleCopyLinkCode, handleSwitchRole, triggerTestMedicineAlarm, triggerTestFamilyCall
  } = useAppContext();

  return (
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

      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px', border: '1.5px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🔄 Switch Role / Audio Test</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px' }}>
          <button onClick={handleSwitchRole} className="btn btn-secondary">
            Switch to {isCaretaker ? 'Elder Sanctuary' : 'Caregiver Portal'}
          </button>
          <button onClick={triggerTestMedicineAlarm} className="btn btn-secondary">💊 Test Medicine Chime</button>
          <button onClick={() => triggerTestFamilyCall()} className="btn btn-secondary">📞 Test Incoming Call</button>
        </div>
      </div>
    </div>
  );
}
