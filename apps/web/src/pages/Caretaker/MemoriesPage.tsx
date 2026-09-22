import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function MemoriesPage() {
  const {
    language, memoriesList, gameVideos,
    showMemoryModal, setShowMemoryModal, newMemory, setNewMemory, handleCreateMemory
  } = useAppContext();

  return (
    <div className="stack" style={{ gap: 'var(--space-lg)' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '26px', color: '#4A148C' }}>📸 {t('nav_upload_memories', language)}</h2>
            <p className="text-muted" style={{ fontSize: '14px' }}>Photos and 10 traditional heritage videos are processed into Groq AI cognitive games & Asha AI stories.</p>
          </div>
          <button onClick={() => setShowMemoryModal(true)} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2' }}>+ Upload New Photo / Memory</button>
        </div>
      </div>

      {/* Video Vault Banner */}
      <div className="card" style={{ backgroundColor: '#F1F8E9', borderRadius: '18px', padding: '18px 24px', border: '1.5px solid #81C784' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🎬</span>
            <div>
              <strong style={{ fontSize: '16px', color: '#2E7D32' }}>10 Traditional Game Video Vault Active</strong>
              <p style={{ fontSize: '13px', color: '#558B2F', marginTop: '2px' }}>All 10 nostalgic game video clips are stored and linked to cognitive games.</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 800 }}>✓ 10 Videos Connected</span>
        </div>
      </div>

      {/* Videos Grid */}
      <div style={{ marginTop: '10px' }}>
        <h3 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 800, marginBottom: '14px' }}>🎬 10 Traditional Game Videos (Elder Side-Player Linked)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {gameVideos.map(vid => (
            <div key={vid.id} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px', border: '1.5px solid #A5D6A7' }}>
              <video src={vid.video_url} controls playsInline preload="metadata" style={{ width: '100%', height: '160px', objectFit: 'cover', backgroundColor: '#000000' }}>
                <source src={vid.video_url} type="video/mp4" />
              </video>
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#2E7D32' }}>{vid.title}</h4>
                <p style={{ fontSize: '12px', color: '#555', marginTop: '4px', lineHeight: 1.4 }}>{vid.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '18px', color: '#4A148C', fontWeight: 800, marginBottom: '14px' }}>🖼️ Family Photos & Life Stories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {memoriesList.map(m => (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
              {m.image_url && <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />}
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{m.title}</h4>
                <p style={{ fontSize: '13px', color: '#555', marginTop: '6px', lineHeight: 1.4 }}>{m.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showMemoryModal && (
        <div className="medication-alert-overlay" onClick={() => setShowMemoryModal(false)}>
          <div className="card" style={{ maxWidth: 540, width: '90%', padding: '32px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', color: '#4A148C', marginBottom: '20px' }}>📸 Upload New Memory</h3>
            <div className="stack" style={{ gap: '14px' }}>
              <input className="input" placeholder="Memory Title" value={newMemory.title} onChange={e => setNewMemory({ ...newMemory, title: e.target.value })} />
              <textarea className="input" rows={3} placeholder="Story / Description" value={newMemory.content} onChange={e => setNewMemory({ ...newMemory, content: e.target.value })} />
              <input className="input" placeholder="Image URL (optional)" value={newMemory.image_url} onChange={e => setNewMemory({ ...newMemory, image_url: e.target.value })} />
              <input className="input" placeholder="Tags (comma separated)" value={newMemory.tags} onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCreateMemory} className="btn btn-primary" style={{ backgroundColor: '#7B1FA2', flex: 1 }}>Save Memory</button>
                <button onClick={() => setShowMemoryModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
