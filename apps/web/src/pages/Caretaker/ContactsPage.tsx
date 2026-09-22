import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { databaseService } from '../../services/supabase';

export default function ContactsPage() {
  const {
    language, familyContacts, setFamilyContacts, linkedElder,
    showContactModal, setShowContactModal, newContact, setNewContact, handleCreateContact
  } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📞 {t('nav_contacts', language)}</h2>
            <p className="text-muted" style={{ fontSize: '14px' }}>Manage 1-tap call family circle visible in the Elder's home sanctuary.</p>
          </div>
          <button onClick={() => setShowContactModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>+ Add Family Contact</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {familyContacts.map(c => (
          <div key={c.id} className="card" style={{ padding: '20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '40px' }}>{c.avatar_emoji || '👤'}</span>
              <div>
                <strong style={{ fontSize: '16px' }}>{c.name}</strong>
                <div style={{ fontSize: '13px', color: '#666' }}>{c.relationship} • {c.phone}</div>
              </div>
            </div>
            <button onClick={() => databaseService.deleteFamilyContact(linkedElder.id, c.id).then(() => databaseService.getFamilyContacts(linkedElder.id).then(setFamilyContacts))}
              className="btn btn-secondary" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>Delete</button>
          </div>
        ))}
      </div>

      {showContactModal && (
        <div className="medication-alert-overlay" onClick={() => setShowContactModal(false)}>
          <div className="card" style={{ maxWidth: 500, width: '90%', padding: '32px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '20px' }}>📞 Add Family Contact</h3>
            <div className="stack" style={{ gap: '14px' }}>
              <input className="input" placeholder="Full Name" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
              <select className="input" value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })}>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Grandson">Grandson</option>
                <option value="Granddaughter">Granddaughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Doctor">Doctor</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Friend">Friend</option>
              </select>
              <input className="input" placeholder="Phone Number" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
              <select className="input" value={newContact.avatar_emoji} onChange={e => setNewContact({ ...newContact, avatar_emoji: e.target.value })}>
                <option value="👨‍💼">👨‍💼 Man</option>
                <option value="👩‍💼">👩‍💼 Woman</option>
                <option value="👦">👦 Boy</option>
                <option value="👧">👧 Girl</option>
                <option value="👨‍⚕️">👨‍⚕️ Doctor</option>
                <option value="👤">👤 Generic</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <input type="checkbox" checked={newContact.is_emergency_contact} onChange={e => setNewContact({ ...newContact, is_emergency_contact: e.target.checked })} />
                🚨 Emergency SOS Contact
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCreateContact} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2', flex: 1 }}>Save Contact</button>
                <button onClick={() => setShowContactModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
