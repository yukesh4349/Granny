import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { databaseService } from '../../services/supabase';

export default function AlarmsPage() {
  const {
    language, reminders, setReminders, linkedElder,
    showAlarmModal, setShowAlarmModal, newAlarm, setNewAlarm, handleCreateAlarm
  } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '26px', color: '#4A148C' }}>⏰ {t('nav_alarms', language)}</h2>
            <p className="text-muted" style={{ fontSize: '14px' }}>Alarms configured here play high-pitch audio chimes on the Elder's home screen.</p>
          </div>
          <button onClick={() => setShowAlarmModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>+ Add New Alarm</button>
        </div>
      </div>

      <div className="stack" style={{ gap: '12px' }}>
        {reminders.map(r => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '32px' }}>{r.type === 'MEDICATION' ? '💊' : '⏰'}</span>
              <div>
                <strong style={{ fontSize: '16px' }}>{r.title}</strong>
                <div style={{ fontSize: '13px', color: '#666' }}>Time: {r.time_of_day} | Type: {r.type}</div>
              </div>
            </div>
            <button onClick={() => databaseService.deleteReminder(linkedElder.id, r.id).then(() => databaseService.getReminders(linkedElder.id).then(setReminders))}
              className="btn btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Delete</button>
          </div>
        ))}
      </div>

      {showAlarmModal && (
        <div className="medication-alert-overlay" onClick={() => setShowAlarmModal(false)}>
          <div className="card" style={{ maxWidth: 500, width: '90%', padding: '32px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '20px' }}>⏰ Add New Medicine Alarm</h3>
            <div className="stack" style={{ gap: '14px' }}>
              <input className="input" placeholder="Alarm Title (e.g. Morning BP Medicine)" value={newAlarm.title} onChange={e => setNewAlarm({ ...newAlarm, title: e.target.value })} />
              <input className="input" placeholder="Time (e.g. 08:00 AM)" value={newAlarm.time_of_day} onChange={e => setNewAlarm({ ...newAlarm, time_of_day: e.target.value })} />
              <select className="input" value={newAlarm.type} onChange={e => setNewAlarm({ ...newAlarm, type: e.target.value })}>
                <option value="MEDICATION">💊 Medication</option>
                <option value="WATER">💧 Water Reminder</option>
                <option value="GENERAL">⏰ General</option>
              </select>
              <textarea className="input" rows={2} placeholder="Notes (optional)" value={newAlarm.description} onChange={e => setNewAlarm({ ...newAlarm, description: e.target.value })} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCreateAlarm} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2', flex: 1 }}>Save Alarm</button>
                <button onClick={() => setShowAlarmModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
