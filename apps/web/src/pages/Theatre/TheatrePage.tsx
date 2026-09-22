import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { t } from '../../i18n';
import { playTempleBellChime, playSuccessChime } from '../../utils/audioChime';

export default function TheatrePage() {
  const { language, navigateTo, theatreStep, setTheatreStep, theatreFeedback, setTheatreFeedback } = useAppContext();

  return (
    <>
      <div className="page-header">
        <div className="page-header-row" style={{ marginBottom: '8px' }}>
          <button className="page-header-back-btn" onClick={() => navigateTo('home')}>← {t('back_to_home', language)}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: 36 }}>🎭</span>
          <div>
            <h2 style={{ fontSize: '26px', color: 'var(--color-primary-dark)' }}>{t('theatre_banner_title', language)}</h2>
            <p className="text-muted" style={{ fontSize: '15px' }}>
              {language === 'ta' ? 'ஊடாடும் காட்சி: "வராண்டாவில் திருவிழா காலை"' : 'Interactive Scene: "Festival Morning on the Verandah"'}
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680, margin: '0 auto', padding: '36px 30px', background: 'var(--color-card-bg)', border: '2px solid var(--color-primary)', borderRadius: '24px' }}>
        {theatreStep === 0 && (
          <div className="stack text-center">
            <div style={{ fontSize: 64 }}>🌅</div>
            <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '22px' }}>
              {language === 'ta' ? 'காட்சி 1: திருவிழா காலை' : 'Scene 1: The Festival Morning'}
            </h3>
            <p style={{ fontSize: '18px', lineHeight: 1.6, margin: '16px 0', color: 'var(--color-text)' }}>
              {language === 'ta'
                ? '"சூரியன் மெதுவாக உதிக்க, பூஜை மணியின் ஓசை கேட்டது. திருவிழாவிற்கு நீங்கள் முதலில் எதை தயார் செய்தீர்கள்?"'
                : '"The sun rose warm over the terrace, and the brass bells in the prayer room chimed softly. What did you and family begin preparing first?"'}
            </p>
            <div className="stack" style={{ gap: '12px' }}>
              {(language === 'ta'
                ? ['பாரம்பரிய இனிப்பு & முறுக்கு', 'புதிய மல்லிகைப் பூ மாலை', 'பித்தளை விளக்கு ஏற்றுதல்']
                : ['Traditional Sweets & Murukku', 'Fresh Jasmine Garlands', 'Lighting the Brass Lamps']
              ).map((choice, i) => (
                <button key={i} className="btn btn-secondary btn-large" style={{ padding: '14px 20px', fontSize: '16px', fontWeight: 700 }} onClick={() => {
                  playTempleBellChime();
                  setTheatreFeedback(language === 'ta' ? "அருமை! நெய் மற்றும் இனிப்புகளின் நறுமணம் வீடு முழுவதும் பரவியது." : "Yes, wonderful! The aroma of fresh ghee and sweets filled the whole house.");
                  setTheatreStep(1);
                }}>{choice}</button>
              ))}
            </div>
          </div>
        )}

        {theatreStep === 1 && (
          <div className="stack text-center">
            <div style={{ fontSize: 64 }}>👨‍👩‍👦</div>
            <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '22px' }}>
              {language === 'ta' ? 'காட்சி 2: வராண்டாவில் குடும்பம்' : 'Scene 2: Gathering on the Verandah'}
            </h3>
            <p style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '16px' }}>✨ {theatreFeedback}</p>
            <p style={{ fontSize: '18px', lineHeight: 1.6, margin: '16px 0', color: 'var(--color-text)' }}>
              {language === 'ta'
                ? '"அனைவரும் பட்டு ஆடைகள் அணிந்திருந்தனர். அன்று காலை குடும்ப ஆசீர்வாதங்களை யார் வழங்கினார்கள்?"'
                : '"Everyone wore their new silk clothes. Who gave the traditional family blessings that morning?"'}
            </p>
            <div className="stack" style={{ gap: '12px' }}>
              {(language === 'ta'
                ? ['தாத்தா பட்டு அங்கவஸ்திரத்துடன்', 'மதுரையிலிருந்து வந்த பெரியப்பா', 'குடும்பப் பெரியவர்கள் அனைவரும் ஒன்றாக']
                : ['Grandfather in his silk angavastram', 'Visiting Uncle from Madurai', 'The family elders together']
              ).map((choice, i) => (
                <button key={i} className="btn btn-secondary btn-large" style={{ padding: '14px 20px', fontSize: '16px', fontWeight: 700 }} onClick={() => {
                  playSuccessChime();
                  setTheatreFeedback(language === 'ta' ? "அன்பான நினைவுகள்! தாத்தாவின் ஆசீர்வாதம் எப்போதும் நலம் தரும்." : "Cherished memories! Grandfather's blessings always brought good fortune.");
                  setTheatreStep(2);
                }}>{choice}</button>
              ))}
            </div>
          </div>
        )}

        {theatreStep === 2 && (
          <div className="stack text-center">
            <div style={{ fontSize: 72 }}>🌟</div>
            <h2 style={{ color: 'var(--color-success)', fontSize: '26px' }}>
              {language === 'ta' ? 'நினைவுக் காட்சி நிறைவுற்றது!' : 'Memory Episode Complete!'}
            </h2>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--color-text)' }}>
              {language === 'ta'
                ? '"இந்தக் கதையை நீங்கள் அழகாகப் பகிர்ந்தீர்கள். உங்கள் விலைமதிப்பற்ற நினைவுகள் குடும்ப வட்டத்தில் என்றும் வாழும்."'
                : '"You shared this story beautifully. Your precious memories remain alive and treasured in our family circle."'}
            </p>
            <button className="btn btn-primary btn-large mt-lg" style={{ padding: '14px 30px' }} onClick={() => { setTheatreStep(0); navigateTo('home'); }}>
              {t('back_to_home', language)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
