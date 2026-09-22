import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NotFoundPageProps {
  language?: string;
  role?: 'ELDER' | 'CAREGIVER';
}

export default function NotFoundPage({ language = 'en', role = 'ELDER' }: NotFoundPageProps) {
  const navigate = useNavigate();
  const isTa = language === 'ta';

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        fontSize: '72px',
        marginBottom: '16px',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
      }}>
        👵🔍
      </div>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 800,
        color: 'var(--color-primary-dark, #1B4332)',
        marginBottom: '12px',
      }}>
        {isTa ? 'பக்கம் காணப்படவில்லை (404)' : 'Page Not Found (404)'}
      </h1>
      <p style={{
        fontSize: '18px',
        color: 'var(--color-text-secondary, #555)',
        maxWidth: '480px',
        marginBottom: '28px',
        lineHeight: 1.6,
      }}>
        {isTa
          ? 'மன்னிக்கவும்! நீங்கள் தேடும் பக்கம் இங்கு இல்லை அல்லது மாற்றப்பட்டுள்ளது. முகப்புப் பக்கத்திற்குச் செல்லவும்.'
          : 'Oops! The page you are looking for does not exist or has moved. Let us take you back to safety.'}
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => navigate(role === 'CAREGIVER' ? '/dashboard' : '/home')}
          className="btn btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: '16px',
            fontWeight: 700,
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary, #2D6A4F)',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(45, 106, 79, 0.3)',
          }}
        >
          {isTa ? '🏡 முகப்புப் பக்கம் செல்க' : '🏡 Return to Home'}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '12px',
            border: '1.5px solid var(--color-border, #E0E0E0)',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          {isTa ? '⬅️ பின்செல்க' : '⬅️ Go Back'}
        </button>
      </div>
    </div>
  );
}
