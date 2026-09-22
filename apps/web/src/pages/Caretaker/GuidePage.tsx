import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { databaseService } from '../../services/supabase';

export default function GuidePage() {
  const { language, careNotes, setCareNotes } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📝 {t('nav_care_guide', language)}</h2>
        <p className="text-muted" style={{ fontSize: '14px' }}>Add notes about daily needs, sundowning tendencies, and guidance for Asha Voice AI.</p>
      </div>

      <div className="card" style={{ padding: '28px', borderRadius: '20px' }}>
        <div className="stack" style={{ gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Condition & Daily Routine Details</label>
            <textarea className="input" rows={4} value={careNotes?.condition_details || ''}
              onChange={e => setCareNotes(prev => prev ? { ...prev, condition_details: e.target.value } : null)}
              style={{ width: '100%', borderRadius: '12px' }} />
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Caregiver Action Instructions</label>
            <textarea className="input" rows={4} value={careNotes?.care_instructions || ''}
              onChange={e => setCareNotes(prev => prev ? { ...prev, care_instructions: e.target.value } : null)}
              style={{ width: '100%', borderRadius: '12px' }} />
          </div>
          <button
            onClick={() => careNotes && databaseService.saveCareNotes(careNotes).then(() => alert('✅ Care guide saved successfully!'))}
            className="btn btn-primary" style={{ alignSelf: 'flex-start', backgroundColor: '#7B1FA2' }}>
            Save Care Protocol
          </button>
        </div>
      </div>
    </div>
  );
}
