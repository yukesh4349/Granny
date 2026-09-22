import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function LinkPage() {
  const { language, linkInputCode, setLinkInputCode, linkFeedback, handleLinkElderAccount } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)', maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h2 style={{ fontSize: '26px', color: '#4A148C' }}>🔗 {t('nav_link_elder', language)}</h2>
        <p className="text-muted" style={{ fontSize: '14px' }}>Enter the 6-digit link code shown on the Elder's screen.</p>
      </div>

      <div className="card" style={{ padding: '32px', borderRadius: '22px' }}>
        <div className="stack" style={{ gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Elder Link Code (e.g. GRN-1234)</label>
            <input className="input" placeholder="GRN-XXXX" value={linkInputCode}
              onChange={e => setLinkInputCode(e.target.value.toUpperCase())}
              style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', letterSpacing: '2px' }} />
          </div>
          {linkFeedback && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: linkFeedback.startsWith('✅') ? '#E8F5E9' : '#FFEBEE', fontSize: '14px', fontWeight: 700 }}>
              {linkFeedback}
            </div>
          )}
          <button onClick={handleLinkElderAccount} className="btn btn-primary btn-large w-full" style={{ backgroundColor: '#7B1FA2' }}>Link Elder Account</button>
        </div>
      </div>
    </div>
  );
}
