import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { databaseService } from '../../services/supabase';

export default function DashboardPage() {
  const {
    language, navigateTo, sosActive, handleSOS, linkedElder,
    reminders, medicalReports, memoriesList, caretakerNotifications,
    gameDailyLimitMinutes, setGameDailyLimitMinutes, gameTodayMinutes,
    activityLog
  } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-xl)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: '#4A148C' }}>👨‍👩‍👧 {t('nav_overview', language)} — {linkedElder.name}</h1>
            <p className="text-muted" style={{ fontSize: '15px' }}>
              {language === 'ta' ? 'முதியோரின் பாதுகாப்பு, உரையாடல் பகுப்பாய்வு மற்றும் நிகழ்நேர விழிப்பூட்டல்கள்' : 'Live cognitive health monitoring, memory synthesis & automated health alerts.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => navigateTo('caretaker_link')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              🔗 {language === 'ta' ? 'இணைப்பு குறியீடு' : 'Elder Link Code'}
            </button>
            {sosActive && (
              <button onClick={handleSOS} className="btn" style={{ backgroundColor: '#B71C1C', color: '#FFF', padding: '8px 16px', fontSize: '13px', animation: 'pulse 1s infinite' }}>
                🔕 Stop SOS Siren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Linked Elder Panel */}
      <div className="card" style={{ backgroundColor: '#F3E5F5', borderRadius: '20px', padding: '20px 24px', border: '2px solid #CE93D8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '17px', color: '#6A1B9A', fontWeight: 800 }}>🔗 {language === 'ta' ? 'இணைக்கப்பட்ட முதியோர் கணக்கு' : 'Linked Elder Account'}</h3>
          <button onClick={() => navigateTo('caretaker_link')} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>+ {language === 'ta' ? 'மற்றொன்னை இணைக்க' : 'Link Another'}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48 }}>👵👴</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 900 }}>{linkedElder.name}</h4>
            <p style={{ fontSize: '13px', color: '#7B1FA2', marginTop: '2px' }}>ID: {linkedElder.id}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>💊 {reminders.filter(r => r.is_active).length} Active Alarms</span>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 700 }}>📋 {medicalReports.length} Medical Reports</span>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#FFF8E1', color: '#E65100', fontWeight: 700 }}>📸 {memoriesList.length} Memories</span>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#FCE4EC', color: '#B71C1C', fontWeight: 700 }}>🎮 Today: {gameTodayMinutes.toFixed(1)} / {gameDailyLimitMinutes > 0 ? gameDailyLimitMinutes : '∞'} min</span>
            </div>
          </div>
        </div>
        {activityLog.length > 0 && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #E1BEE7', paddingTop: '12px' }}>
            <p style={{ fontSize: '12px', fontWeight: 800, color: '#7B1FA2', marginBottom: '8px' }}>📊 Recent Activity Log</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activityLog.slice(0, 5).map((entry, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' }}>
                  <span>📌 {entry.page.replace('_', ' ').toUpperCase()}</span>
                  <span>{((entry.durationMs || 0) / 1000 / 60).toFixed(1)} min</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Time Limit */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '20px 24px', border: '1.5px solid #FFA726' }}>
        <h4 style={{ fontSize: '16px', color: '#E65100', fontWeight: 800, marginBottom: '10px' }}>
          🎮 {language === 'ta' ? 'விளையாட்டு நேர வரம்பு அமைவு' : 'Set Daily Game Time Limit for Elder'}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input type="number" min={0} max={240} value={gameDailyLimitMinutes}
            onChange={e => { const val = parseInt(e.target.value, 10) || 0; setGameDailyLimitMinutes(val); localStorage.setItem('granny_game_daily_limit_minutes', String(val)); }}
            className="input" style={{ width: '100px', textAlign: 'center', fontSize: '18px', fontWeight: 800 }} />
          <span style={{ fontSize: '15px', color: '#555' }}>{language === 'ta' ? 'நிமிடங்கள் / நாள் (0 = வரம்பில்லை)' : 'minutes / day (0 = unlimited)'}</span>
          <span style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '10px', backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 700 }}>Today used: {gameTodayMinutes.toFixed(1)} min</span>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '24px', border: '2px solid #E1BEE7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 800 }}>
            🚨 {language === 'ta' ? 'நிகழ்நேர விழிப்பூட்டல்கள் & மின்னஞ்சல் அறிவிப்புகள்' : 'Live In-App Health Alerts & Email Dispatches'}
          </h3>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#EDE7F6', color: '#7B1FA2', fontWeight: 700 }}>{caretakerNotifications.length} Alerts</span>
        </div>
        <div className="stack" style={{ gap: '10px' }}>
          {caretakerNotifications.map(notif => (
            <div key={notif.id} style={{
              padding: '14px 18px', borderRadius: '14px',
              backgroundColor: notif.severity === 'HIGH' || notif.severity === 'URGENT' ? '#FFEBEE' : '#FAF7FD',
              border: notif.severity === 'HIGH' || notif.severity === 'URGENT' ? '1.5px solid #E53935' : '1px solid #E1BEE7',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{notif.type === 'HEALTH_ALERT' ? '🚨' : '💬'}</span>
                  <strong style={{ fontSize: '14px', color: notif.severity === 'HIGH' ? '#C62828' : '#4A148C' }}>{notif.title}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>({new Date(notif.created_at).toLocaleTimeString()})</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '4px' }}>{notif.message}</p>
                {notif.transcript_excerpt && <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>Excerpt: "{notif.transcript_excerpt}"</p>}
              </div>
              {notif.email_sent && <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>✓ Email Sent</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <button className="card card-interactive" onClick={() => navigateTo('caretaker_alarms')} style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '36px' }}>⏰</div>
          <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_alarms', language)}</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>Set medicine alarms & timings</p>
        </button>
        <button className="card card-interactive" onClick={() => navigateTo('caretaker_medical')} style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '36px' }}>📋</div>
          <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_medical', language)}</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>Upload prescriptions & reports</p>
        </button>
        <button className="card card-interactive" onClick={() => navigateTo('caretaker_memories')} style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '36px' }}>📸</div>
          <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_upload_memories', language)}</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>Add vintage photos & memories</p>
        </button>
        <button className="card card-interactive" onClick={() => navigateTo('caretaker_contacts')} style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '36px' }}>📞</div>
          <h4 style={{ color: '#4A148C', fontSize: '16px', marginTop: '8px' }}>{t('nav_contacts', language)}</h4>
          <p className="text-muted" style={{ fontSize: '13px' }}>Manage 1-tap family contacts</p>
        </button>
      </div>
    </div>
  );
}
