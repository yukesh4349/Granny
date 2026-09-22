import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function HealthPage() {
  const { language, navigateTo, reminders, handleToggleReminder, triggerTestMedicineAlarm } = useAppContext();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>← {t('back_to_home', language)}</button>
          <button onClick={triggerTestMedicineAlarm} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
            🔔 {language === 'ta' ? 'ஒலி மணி சோதனை' : 'Test Medicine Chime'}
          </button>
        </div>
        <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>💊 {t('health_and_meds', language)}</h2>
        <p className="text-muted" style={{ fontSize: '15px' }}>
          {language === 'ta' ? 'உங்கள் தினசரி மருந்துகள் மற்றும் நினைவூட்டல் அட்டவணை' : 'Your daily medication schedule and health reminders.'}
        </p>
      </div>

      <div className="stack" style={{ gap: '16px' }}>
        {reminders.map(rem => (
          <div key={rem.id} className="card" style={{
            backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px 24px',
            border: rem.confirmed ? '2px solid var(--color-success)' : '2px solid var(--color-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '36px' }}>{rem.type === 'MEDICATION' ? '💊' : rem.type === 'WATER' ? '💧' : '⏰'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{rem.time_of_day}</span>
                  {rem.confirmed && (
                    <span style={{ padding: '2px 8px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: 'var(--color-success)', fontSize: '12px', fontWeight: 700 }}>
                      ✓ {language === 'ta' ? 'சாப்பிட்டேன்' : 'Taken'}
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '17px', color: 'var(--color-text)', marginTop: '4px' }}>{rem.title}</h4>
                {rem.description && <p className="text-muted" style={{ fontSize: '13px', marginTop: '2px' }}>{rem.description}</p>}
              </div>
            </div>
            <button onClick={() => handleToggleReminder(rem.id)} className="btn"
              style={{
                padding: '10px 20px', fontSize: '14px', fontWeight: 700, borderRadius: 'var(--radius-full)',
                backgroundColor: rem.confirmed ? '#E8F5E9' : 'var(--color-primary)',
                color: rem.confirmed ? '#2E7D32' : '#FFFFFF',
                border: rem.confirmed ? '1.5px solid var(--color-success)' : 'none'
              }}>
              {rem.confirmed ? (language === 'ta' ? '✓ எடுக்கப்பட்டது' : '✓ Completed') : (language === 'ta' ? 'மருந்து சாப்பிட்டேன்' : 'Mark as Taken')}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
