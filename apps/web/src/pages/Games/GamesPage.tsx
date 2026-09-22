import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { ALL_GAMES } from '../../features/games/engine/games';

export default function GamesPage() {
  const {
    language, navigateTo, gameCategoryFilter, setGameCategoryFilter,
    gameTimeLimitReached, gameDailyLimitMinutes, gameVideos, startGame
  } = useAppContext();

  return (
    <>
      {gameTimeLimitReached && (
        <div style={{ backgroundColor: '#FFF3E0', border: '2px solid #FF9800', borderRadius: '16px', padding: '18px 22px', marginBottom: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>⏰</div>
          <h3 style={{ color: '#E65100', fontSize: '20px', marginTop: '8px' }}>
            {language === 'ta' ? 'இன்றைய விளையாட்டு நேரம் முடிந்தது!' : "Today's Game Time Limit Reached!"}
          </h3>
          <p style={{ color: '#BF360C', fontSize: '15px', marginTop: '6px' }}>
            {language === 'ta'
              ? `உங்கள் பராமரிப்பாளர் ${gameDailyLimitMinutes} நிமிடம் வரம்பு அமைத்துள்ளார். நாளை மீண்டும் வாருங்கள்!`
              : `Your caretaker has set a ${gameDailyLimitMinutes}-minute daily limit. Come back tomorrow!`}
          </p>
        </div>
      )}
      <div className="page-header">
        <div className="page-header-row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>← {t('back_to_home', language)}</button>
          <div style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', fontSize: '13px', fontWeight: 800, border: '1.5px solid var(--color-primary)' }}>
            ✨ {language === 'ta' ? 'தனிப்பயனாக்கப்பட்ட கேள்விகள்' : 'Personalized Dynamic Questions'}
          </div>
        </div>
        <h2 style={{ fontSize: '28px', color: 'var(--color-primary-dark)' }}>🧩 {t('games_title', language)}</h2>
        <p className="text-muted" style={{ fontSize: '16px', marginTop: '2px' }}>{t('games_subtitle', language)}</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { id: 'all' as const, label: `${t('games_cat_all', language)} (20)` },
          { id: 'outdoor' as const, label: `🏃 ${t('games_cat_outdoor', language)} (10)` },
          { id: 'indoor' as const, label: `🎲 ${t('games_cat_indoor', language)} (5)` },
          { id: 'cinema' as const, label: `🎬 ${t('games_cat_cinema', language)} (5)` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setGameCategoryFilter(tab.id)}
            style={{
              padding: '10px 18px', fontSize: '14px', fontWeight: 700,
              backgroundColor: gameCategoryFilter === tab.id ? 'var(--color-primary)' : '#FFFFFF',
              color: gameCategoryFilter === tab.id ? '#FFFFFF' : 'var(--color-text)',
              border: gameCategoryFilter === tab.id ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
              boxShadow: gameCategoryFilter === tab.id ? '0 4px 12px rgba(59, 122, 87, 0.25)' : 'none'
            }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
        {ALL_GAMES.filter(g => {
          if (gameCategoryFilter === 'outdoor') return ['nondi', 'kanche', 'gilli_danda', 'uriyadi', 'tyre_oattam', 'pattam_viduthal', 'street_cricket', 'kabaddi', 'kho_kho', 'skipping_rope'].includes(g.key);
          if (gameCategoryFilter === 'indoor') return ['pallanguzhi', 'thaayam', 'paramapadham', 'seettu_vilayattu', 'carrom'].includes(g.key);
          if (gameCategoryFilter === 'cinema') return ['movie_poster', 'ilaiyaraaja_melody', 'actor_actress_match', 'cinema_ticket', 'oliyum_oliyum'].includes(g.key);
          return true;
        }).map(game => {
          const hasVideo = gameVideos.some(v => v.game_key === game.key || v.game_key === game.key.replace(/_/g, ''));
          return (
            <div key={game.key} className="card card-interactive" onClick={() => startGame(game.key)}
              style={{
                backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '22px',
                border: hasVideo ? '2px solid #81C784' : '2px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '190px',
                boxShadow: hasVideo ? '0 6px 18px rgba(76, 175, 80, 0.12)' : 'none', position: 'relative',
              }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '38px' }}>{game.icon}</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {hasVideo && (
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        🎬 {language === 'ta' ? 'வீடியோ உண்டு' : 'Video Memory'}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '8px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)' }}>AI Dynamic</span>
                  </div>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginTop: '12px' }}>{game.title}</h3>
                <p className="text-muted" style={{ fontSize: '13px', marginTop: '4px', lineHeight: 1.4 }}>{game.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #F0F0F0', paddingTop: '10px' }}>
                <span style={{ fontSize: '12px', color: '#777', fontWeight: 600 }}>
                  {hasVideo ? (language === 'ta' ? 'பழைய வீடியோவுடன் விளையாடு' : 'Plays with nostalgia video') : (language === 'ta' ? 'அறிவாற்றல் பயிற்சி' : 'Cognitive workout')}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>▶ {language === 'ta' ? 'விளையாடு' : 'Play'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
