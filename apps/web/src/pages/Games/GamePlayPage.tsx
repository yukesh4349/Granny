import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function GamePlayPage() {
  const {
    language, currentGameKey, gameSession, gamePhase, setGamePhase,
    gameTimer, isGeneratingGame, currentGameVideo, startGame,
    handleGameAnswer, finishGame
  } = useAppContext();

  return (
    <div style={{ maxWidth: currentGameVideo ? 1100 : 760, margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-header-row" style={{ justifyContent: 'space-between' }}>
          <button className="page-header-back-btn" onClick={finishGame}>← {t('back_to_home', language)}</button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {currentGameVideo && (
              <span style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: '13px', fontWeight: 800, border: '1.5px solid #A5D6A7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                🎬 {language === 'ta' ? 'நினைவூட்டல் வீடியோ இணைப்பு' : 'Nostalgia Video Active'}
              </span>
            )}
            <button onClick={() => currentGameKey && startGame(currentGameKey)} className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-full)' }} disabled={isGeneratingGame}>
              🔄 {language === 'ta' ? 'புதிய AI கேள்விகளை உருவாக்குக' : 'Generate New Questions'}
            </button>
          </div>
        </div>
      </div>

      {isGeneratingGame && (
        <div className="card text-center" style={{ padding: '48px 24px', borderRadius: '24px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '20px' }}>
            ✨ {language === 'ta' ? 'உங்களுக்கான புதிய கேள்விகளை உருவாக்குகிறது...' : 'Generating Fresh Personalized Questions...'}
          </h3>
          <p className="text-muted mt-sm" style={{ fontSize: '14px' }}>Customized with family memories, cultural heritage, and zero repetitions.</p>
        </div>
      )}

      {!isGeneratingGame && gameSession && (
        <div style={{ display: 'grid', gridTemplateColumns: currentGameVideo ? 'minmax(320px, 1fr) minmax(300px, 380px)' : '1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            {gamePhase === 'memorize' && (
              <div className="card" style={{ padding: '32px 28px', borderRadius: '24px', border: '2.5px solid var(--color-primary)', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 'var(--radius-full)', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 800, fontSize: '14px', marginBottom: '16px' }}>
                  ⏱️ {language === 'ta' ? `நினைவில் வைக்கவும்: ${gameTimer} வினாடிகள்` : `Memorize for: ${gameTimer} seconds`}
                </div>
                <h3 style={{ fontSize: '22px', color: 'var(--color-primary-dark)', marginBottom: '16px' }}>
                  {language === 'ta' ? 'காட்சியை கூர்ந்து கவனியுங்கள்' : 'Observe the Cultural Clues Carefully'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', margin: '20px 0' }}>
                  {gameSession.items.map((item, idx) => (
                    <div key={idx} style={{ padding: '16px', borderRadius: '16px', backgroundColor: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                      <span style={{ fontSize: '40px' }}>{item.metadata?.emoji || '🌸'}</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, marginTop: '8px', color: 'var(--color-text)' }}>{item.metadata?.object || `Clue #${idx + 1}`}</h4>
                      {item.metadata?.imageUrl && <img src={item.metadata.imageUrl} alt="Memory Visual" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '12px', marginTop: '8px' }} />}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-large" onClick={() => setGamePhase('play')} style={{ padding: '12px 28px' }}>
                  {language === 'ta' ? 'நான் தயாராக இருக்கிறேன்! ▶' : "I'm Ready to Play! ▶"}
                </button>
              </div>
            )}

            {gamePhase === 'play' && (
              <div className="card" style={{ padding: '32px 28px', borderRadius: '24px', border: '2px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                    {language === 'ta' ? 'கேள்வி' : 'Question'} {gameSession.currentItemIndex + 1} / {gameSession.items.length}
                  </span>
                  <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', backgroundColor: '#EDE7F6', color: '#6A1B9A', fontWeight: 700 }}>✨ Groq AI Generated</span>
                </div>
                {gameSession.items[gameSession.currentItemIndex] && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <span style={{ fontSize: '48px' }}>{gameSession.items[gameSession.currentItemIndex].metadata?.emoji || '🧩'}</span>
                      <h3 style={{ fontSize: '20px', color: 'var(--color-text)', marginTop: '10px', lineHeight: 1.5 }}>
                        {gameSession.items[gameSession.currentItemIndex].prompt}
                      </h3>
                    </div>
                    <div className="stack" style={{ gap: '12px', marginTop: '20px' }}>
                      {gameSession.items[gameSession.currentItemIndex].choices?.map((choice, i) => (
                        <button key={i} className="btn btn-secondary btn-large" onClick={() => handleGameAnswer(choice)}
                          style={{ padding: '16px 20px', fontSize: '17px', fontWeight: 700, textAlign: 'left', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <span>{choice}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {gamePhase === 'result' && (
              <div className="card text-center" style={{ padding: '40px 28px', borderRadius: '24px', border: '2.5px solid var(--color-success)' }}>
                <div style={{ fontSize: 72 }}>🌟</div>
                <h2 style={{ fontSize: '26px', color: 'var(--color-success)', marginTop: '8px' }}>
                  {language === 'ta' ? 'அருமையான விளையாட்டு!' : 'Splendid Memory Session!'}
                </h2>
                <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  {language === 'ta'
                    ? `நீங்கள் ${gameSession.attempts.filter(a => a.correct).length} / ${gameSession.items.length} கேள்விகளுக்கு சரியாக பதிலளித்துள்ளீர்கள்.`
                    : `You answered ${gameSession.attempts.filter(a => a.correct).length} out of ${gameSession.items.length} questions correctly.`}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary btn-large" onClick={() => currentGameKey && startGame(currentGameKey)} style={{ padding: '12px 24px' }}>
                    🔄 {language === 'ta' ? 'மீண்டும் விளையாடு' : 'Play Fresh Round'}
                  </button>
                  <button className="btn btn-secondary btn-large" onClick={finishGame} style={{ padding: '12px 24px' }}>{t('back_to_home', language)}</button>
                </div>
              </div>
            )}
          </div>

          {currentGameVideo && (
            <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '20px', border: '2px solid #81C784', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🎬</span>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#2E7D32' }}>{language === 'ta' ? 'பழைய நினைவு வீடியோ' : 'Nostalgia Video Player'}</h4>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 700 }}>
                  {language === 'ta' ? 'நினைவு மீட்டெடுப்பு' : 'Memory Jogger'}
                </span>
              </div>
              <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000000', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}>
                <video key={currentGameVideo.video_url} src={currentGameVideo.video_url} controls playsInline preload="auto"
                  style={{ width: '100%', maxHeight: '240px', display: 'block', outline: 'none', backgroundColor: '#000000' }}>
                  <source src={currentGameVideo.video_url} type="video/mp4" />Your browser does not support HTML5 video.
                </video>
              </div>
              <div style={{ marginTop: '14px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text)' }}>{language === 'ta' ? currentGameVideo.title_ta : currentGameVideo.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{language === 'ta' ? currentGameVideo.description_ta : currentGameVideo.description}</p>
              </div>
              <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#33691E', marginBottom: '4px' }}>
                  <span>💡</span><span>{language === 'ta' ? 'நினைவுப் பெட்டகம் (Reminiscence Note)' : 'Heritage Memory Note'}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#33691E', lineHeight: 1.4 }}>{language === 'ta' ? currentGameVideo.cultural_notes_ta : currentGameVideo.cultural_notes}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
