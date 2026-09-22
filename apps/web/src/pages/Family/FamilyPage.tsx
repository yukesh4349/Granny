import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function FamilyPage() {
  const { language, navigateTo, familyContacts, triggerTestFamilyCall } = useAppContext();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row" style={{ marginBottom: '8px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>← {t('back_to_home', language)}</button>
        </div>
        <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>👨‍👩‍👧‍👦 {t('nav_family', language)}</h2>
        <p className="text-muted" style={{ fontSize: '15px' }}>
          {language === 'ta' ? 'உங்கள் குடும்பத்தினருடன் எளிதாகப் பேச ஒருமுறை தட்டவும்' : 'Tap any family member card below to call them instantly.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {familyContacts.map(c => (
          <div key={c.id} className="card" style={{
            backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '24px',
            border: c.is_emergency_contact ? '2.5px solid var(--color-danger)' : '2px solid var(--color-border)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '52px' }}>{c.avatar_emoji || '👤'}</span>
              {c.is_emergency_contact && (
                <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 800 }}>
                  🚨 Emergency SOS
                </span>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>{c.name}</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '2px' }}>{c.relationship}</p>
              <p style={{ fontSize: '14px', color: 'var(--color-primary-dark)', fontWeight: 700, marginTop: '4px' }}>📞 {c.phone}</p>
            </div>
            <button onClick={() => triggerTestFamilyCall(c)} className="btn btn-primary w-full"
              style={{ padding: '12px', fontSize: '15px', fontWeight: 800, backgroundColor: c.is_emergency_contact ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              📞 {language === 'ta' ? 'அழைக்கவும்' : 'Call Now'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
