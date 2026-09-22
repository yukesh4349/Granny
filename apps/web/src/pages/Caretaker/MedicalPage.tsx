import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { databaseService } from '../../services/supabase';

export default function MedicalPage() {
  const {
    language, medicalReports, setMedicalReports, linkedElder,
    showReportModal, setShowReportModal, newReport, setNewReport, handleCreateReport
  } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📋 {t('nav_medical', language)}</h2>
            <p className="text-muted" style={{ fontSize: '14px' }}>Doctor visits, lab reports, and geriatric prescriptions.</p>
          </div>
          <button onClick={() => setShowReportModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>+ Add Medical Report</button>
        </div>
      </div>

      <div className="stack" style={{ gap: '14px' }}>
        {medicalReports.map(rep => (
          <div key={rep.id} className="card" style={{ padding: '22px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#4A148C' }}>{rep.title}</h3>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>👨‍⚕️ {rep.doctor_name} | 📅 {rep.report_date} | 🏷️ {rep.category}</p>
              </div>
              <button onClick={() => databaseService.deleteMedicalReport(linkedElder.id, rep.id).then(() => databaseService.getMedicalReports(linkedElder.id).then(setMedicalReports))}
                className="btn btn-secondary" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>Delete</button>
            </div>
            {rep.summary && <p style={{ fontSize: '14px', marginTop: '10px', lineHeight: 1.5 }}><strong>Summary:</strong> {rep.summary}</p>}
          </div>
        ))}
      </div>

      {showReportModal && (
        <div className="medication-alert-overlay" onClick={() => setShowReportModal(false)}>
          <div className="card" style={{ maxWidth: 540, width: '90%', padding: '32px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '20px' }}>📋 Add Medical Report</h3>
            <div className="stack" style={{ gap: '14px' }}>
              <input className="input" placeholder="Report Title" value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} />
              <input className="input" placeholder="Doctor Name" value={newReport.doctor_name} onChange={e => setNewReport({ ...newReport, doctor_name: e.target.value })} />
              <input className="input" type="date" value={newReport.report_date} onChange={e => setNewReport({ ...newReport, report_date: e.target.value })} />
              <select className="input" value={newReport.category} onChange={e => setNewReport({ ...newReport, category: e.target.value })}>
                <option value="Prescription">Prescription</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
              </select>
              <textarea className="input" rows={3} placeholder="Summary" value={newReport.summary} onChange={e => setNewReport({ ...newReport, summary: e.target.value })} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCreateReport} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2', flex: 1 }}>Save Report</button>
                <button onClick={() => setShowReportModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
