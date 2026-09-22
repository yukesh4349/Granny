import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function MemoryPage() {
  const { language, navigateTo, memoriesList, gameVideos, activeMemoryTab, setActiveMemoryTab, startGame } = useAppContext();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row" style={{ marginBottom: '8px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>← {t('back_to_home', language)}</button>
        </div>
        <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>📸 {t('memories', language)}</h2>
        <p className="text-muted" style={{ fontSize: '15px' }}>
          {language === 'ta' ? 'குடும்ப புகைப்படங்கள் மற்றும் 10 பாரம்பரிய விளையாட்டு வீடியோ நினைவுகள்' : 'Family photographs, childhood life stories, and 10 heritage game video reels.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <button onClick={() => setActiveMemoryTab('all')}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 800, backgroundColor: activeMemoryTab === 'all' ? 'var(--color-primary)' : '#FFFFFF', color: activeMemoryTab === 'all' ? '#FFFFFF' : 'var(--color-text)', border: activeMemoryTab === 'all' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
          🌟 {language === 'ta' ? 'அனைத்தும்' : 'All Memories'} ({memoriesList.length + gameVideos.length})
        </button>
        <button onClick={() => setActiveMemoryTab('photos')}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 800, backgroundColor: activeMemoryTab === 'photos' ? 'var(--color-primary)' : '#FFFFFF', color: activeMemoryTab === 'photos' ? '#FFFFFF' : 'var(--color-text)', border: activeMemoryTab === 'photos' ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}>
          🖼️ {language === 'ta' ? 'குடும்ப புகைப்படங்கள்' : 'Family Photos'} ({memoriesList.length})
        </button>
        <button onClick={() => setActiveMemoryTab('videos')}
          style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 800, backgroundColor: activeMemoryTab === 'videos' ? '#2E7D32' : '#FFFFFF', color: activeMemoryTab === 'videos' ? '#FFFFFF' : 'var(--color-text)', border: activeMemoryTab === 'videos' ? '2px solid #2E7D32' : '1.5px solid var(--color-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer', boxShadow: activeMemoryTab === 'videos' ? '0 4px 12px rgba(46, 125, 50, 0.25)' : 'none' }}>
          🎬 {language === 'ta' ? '10 விளையாட்டு வீடியோக்கள்' : '10 Traditional Game Videos'} ({gameVideos.length})
        </button>
      </div>

      {(activeMemoryTab === 'all' || activeMemoryTab === 'videos') && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🎬</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#2E7D32' }}>
              {language === 'ta' ? 'பாரம்பரிய 10 விளையாட்டு பொக்கிஷ வீடியோக்கள்' : '10 Nostalgia Traditional Game Video Memories'}
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
            {gameVideos.map(vid => (
              <div key={vid.id} className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', overflow: 'hidden', padding: 0, border: '2px solid #A5D6A7', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', width: '100%', backgroundColor: '#000000' }}>
                  <video src={vid.video_url} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: '200px', display: 'block', backgroundColor: '#000000' }}>
                    <source src={vid.video_url} type="video/mp4" />
                  </video>
                  <span style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(46, 125, 50, 0.85)', color: '#FFFFFF', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>🎬 Heritage Video</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>{language === 'ta' ? vid.title_ta : vid.title}</h4>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>{vid.category.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>{language === 'ta' ? vid.description_ta : vid.description}</p>
                  <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F9FBE7', border: '1px solid #E6EE9C', fontSize: '12px', color: '#558B2F' }}>
                    <strong>💡 {language === 'ta' ? 'நினைவு மீட்டெடுப்பு:' : 'Memory Spark:'}</strong> {language === 'ta' ? vid.cultural_notes_ta : vid.cultural_notes}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => startGame(vid.game_key)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-full)', backgroundColor: '#2E7D32' }}>
                      ▶ {language === 'ta' ? 'இந்த விளையாட்டை விளையாடு' : 'Play This Game'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeMemoryTab === 'all' || activeMemoryTab === 'photos') && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🖼️</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {language === 'ta' ? 'குடும்ப புகைப்படங்கள் & கதைகள்' : 'Family Life Photos & Stories'}
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {memoriesList.map(m => (
              <div key={m.id} className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', overflow: 'hidden', padding: 0, border: '1.5px solid var(--color-border)' }}>
                {m.image_url && <img src={m.image_url} alt={m.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>{m.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>{m.content}</p>
                  {m.tags && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {m.tags.map((tag: string) => (
                        <span key={tag} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontWeight: 700 }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
