import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';

export default function CompanionPage() {
  const {
    language, navigateTo, messages, chatInput, setChatInput,
    isThinking, sendMessage, chatBottomRef
  } = useAppContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', maxWidth: '850px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '12px' }}>
        <div className="page-header-row" style={{ marginBottom: '6px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>
            ← {t('back_to_home', language)}
          </button>
          <div style={{
            padding: '4px 12px', borderRadius: '12px', backgroundColor: '#E8F5E9',
            color: '#2E7D32', fontSize: '12px', fontWeight: 700
          }}>
            ✨ {language === 'ta' ? 'ஆஷா AI குரல் துணைவர்' : 'Asha AI Voice Companion'}
          </div>
        </div>
        <h2 style={{ fontSize: '24px', color: 'var(--color-primary-dark)' }}>💬 {t('nav_companion', language)}</h2>
        <p className="text-muted" style={{ fontSize: '14px' }}>
          {language === 'ta' ? 'ஆஷாவுடன் அன்பாகவும் பொறுமையாகவும் பேசுங்கள்' : 'Have a gentle, patient conversation with Asha Voice AI.'}
        </p>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px', backgroundColor: '#FFFFFF',
        borderRadius: '20px', border: '1.5px solid var(--color-border)', display: 'flex',
        flexDirection: 'column', gap: '14px'
      }}>
        {messages.length === 0 && (
          <div className="text-center" style={{ padding: '32px 16px' }}>
            <div style={{ fontSize: 64 }}>👵👴</div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '12px' }}>
              {language === 'ta' ? 'வணக்கம் தாத்தா & பாட்டி! நான் ஆஷா.' : "Hello Grandpa & Grandma! I'm Asha."}
            </p>
            <p className="text-muted mt-sm" style={{ fontSize: '15px' }}>
              {language === 'ta' ? 'வணக்கம் சொல்லுங்கள் அல்லது கீழே தட்டச்சு செய்யுங்கள். உங்கள் பழைய கதைகள், பிடித்த உணவுகள் பற்றி என்னிடம் பகிருங்கள்!' : 'Say hello or tap the mic button to talk anytime. Feel free to share your favourite stories, hometown memories, and daily thoughts!'}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`chat-bubble ${msg.sender}`} style={{ fontSize: '16px' }}>
              {msg.text}
            </div>
            {msg.extractedMemory && (
              <div style={{
                marginTop: '4px', padding: '3px 10px', borderRadius: '12px',
                backgroundColor: '#E0F2F1', color: '#004D40', fontSize: '11px',
                fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                <span>💾 Saved to Memory DB:</span>
                <strong>{msg.extractedMemory.title}</strong>
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="chat-bubble assistant">
            <div className="waveform">
              {[1,2,3,4,5].map(i => <div key={i} className="waveform-bar" />)}
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
        <input
          className="input"
          placeholder={language === 'ta' ? 'உங்கள் செய்தியை எழுதுங்கள் (எ.கா. எனக்கு கும்பகோணம் காபி பிடிக்கும்)...' : 'Type your message (e.g. I loved temple festivals in Madurai)...'}
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{ fontSize: '16px', borderRadius: 'var(--radius-full)', padding: '14px 20px' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          style={{ padding: '0 24px', fontSize: '15px', borderRadius: 'var(--radius-full)' }}
        >
          {language === 'ta' ? 'அனுப்பு' : 'Send'}
        </button>
      </div>
    </div>
  );
}
