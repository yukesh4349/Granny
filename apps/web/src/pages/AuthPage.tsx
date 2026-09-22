import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { t } from '../i18n';

export default function AuthPage() {
  const {
    language, authMode, setAuthMode, authForm, setAuthForm,
    authError, isAuthLoading, showPassword, setShowPassword,
    handleAuthSubmit, handleDemoLogin, toggleLanguage
  } = useAppContext();
  const navigate = useNavigate();
  const isElder = authForm.role === 'ELDER';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-lg)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <button className="page-header-back-btn" onClick={() => navigate('/')}>
          ← {t('back_to_home', language)}
        </button>
        <button
          onClick={toggleLanguage}
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          {language === 'ta' ? 'English' : 'தமிழ்'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 'var(--space-xl)', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-md">
          <div style={{ fontSize: 48, marginBottom: 8 }}>{isElder ? '👵👴' : '👨‍👩‍👧'}</div>
          <h2 style={{ fontSize: '24px', color: 'var(--color-primary-dark)' }}>
            {authMode === 'login' ? t('sign_in', language) : t('create_account', language)}
          </h2>
          <p className="text-muted" style={{ fontSize: '14px', marginTop: 4 }}>
            {isElder
              ? (language === 'ta' ? 'தாத்தா & பாட்டி பகுதி' : 'Elder Sanctuary Portal')
              : (language === 'ta' ? 'பராமரிப்பாளர் பகுதி' : 'Caregiver Portal')}
          </p>
        </div>

        <div style={{
          display: 'flex', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-bg)',
          padding: '4px', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)'
        }}>
          <button
            type="button"
            onClick={() => setAuthForm(prev => ({ ...prev, role: 'ELDER' }))}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-full)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              backgroundColor: isElder ? 'var(--color-primary)' : 'transparent',
              color: isElder ? '#FFFFFF' : 'var(--color-text-secondary)'
            }}
          >
            👵👴 {language === 'ta' ? 'முதியோர்' : 'Elder'}
          </button>
          <button
            type="button"
            onClick={() => setAuthForm(prev => ({ ...prev, role: 'CAREGIVER' }))}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: 'var(--radius-full)',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              backgroundColor: !isElder ? '#7B1FA2' : 'transparent',
              color: !isElder ? '#FFFFFF' : 'var(--color-text-secondary)'
            }}
          >
            👨‍👩‍👧 {language === 'ta' ? 'பராமரிப்பாளர்' : 'Caregiver'}
          </button>
        </div>

        {authError && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FFEBEE', color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            ⚠️ {authError}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="stack" style={{ gap: '14px' }}>
          {authMode === 'register' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {language === 'ta' ? 'முழுப் பெயர்' : 'Full Name'}
              </label>
              <input
                className="input"
                placeholder={isElder ? (language === 'ta' ? 'ராமநாதன் / லட்சுமி' : 'Ramanathan / Lakshmi') : 'Arun (Son)'}
                value={authForm.name}
                onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
              {authMode === 'register'
                ? (language === 'ta' ? 'மின்னஞ்சல் அல்லது தொலைபேசி' : 'Email or Phone')
                : (language === 'ta' ? 'பெயர், மின்னஞ்சல் அல்லது தொலைபேசி' : 'Name, Email or Phone')}
            </label>
            <input
              className="input"
              placeholder={authMode === 'register' ? 'user@granny.app / 9876543210' : (language === 'ta' ? 'உங்கள் பெயர் அல்லது மின்னஞ்சல்' : 'Your name, email or phone')}
              value={authForm.email || authForm.phone || ''}
              onChange={e => {
                const val = e.target.value;
                if (val.includes('@')) {
                  setAuthForm({ ...authForm, email: val, phone: '' });
                } else if (/^\+?[0-9\s-]*$/.test(val)) {
                  setAuthForm({ ...authForm, email: '', phone: val });
                } else {
                  setAuthForm({ ...authForm, email: val, phone: '' });
                }
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: 4 }}>
              {language === 'ta' ? 'கடவுச்சொல்' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16 }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large w-full mt-sm"
            disabled={isAuthLoading}
            style={{ backgroundColor: isElder ? 'var(--color-primary)' : '#7B1FA2' }}
          >
            {isAuthLoading
              ? (language === 'ta' ? 'செயலாக்குகிறது...' : 'Processing...')
              : (authMode === 'login' ? t('sign_in', language) : t('create_account', language))}
          </button>
        </form>

        <div className="text-center mt-md">
          <button
            onClick={() => {
              const next = authMode === 'login' ? 'register' : 'login';
              setAuthMode(next);
              setAuthForm(prev => ({ ...prev }));
              navigate(next === 'register' ? '/register' : '/login');
            }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            {authMode === 'login'
              ? (language === 'ta' ? 'புதிய கணக்கு வேண்டுமா? இங்கே பதிவு செய்க' : "Don't have an account? Sign up here")
              : (language === 'ta' ? 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக' : 'Already have an account? Sign in here')}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', margin: '20px 0 12px 0' }} />

        <button
          onClick={() => handleDemoLogin(authForm.role as any)}
          className="btn btn-secondary w-full"
          style={{ fontSize: '13px', padding: '10px' }}
        >
          ⚡ {language === 'ta' ? '1-தட்டு டெமோ அணுகல்' : '1-Tap Instant Demo Login'} ({isElder ? 'Elder' : 'Caregiver'})
        </button>
      </div>
    </div>
  );
}
