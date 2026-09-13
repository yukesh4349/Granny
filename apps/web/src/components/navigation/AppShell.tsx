import React from 'react';

interface AppShellProps {
  user: { name: string; role: string; language: string };
  page: string;
  setPage: (page: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AppShell({ user, page, setPage, onLogout, children }: AppShellProps) {
  const isCaretaker = user.role === 'CAREGIVER';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      
      {/* Top Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
        zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 var(--space-lg)', borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div style={{ fontSize: '28px' }}>🌸</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Memory Journey</span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Remember • Explore • Connect</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Emergency SOS Button in Header */}
          <button
            onClick={() => alert('🚨 Calling designated emergency contact: Rahul (Son - +91 98765 43210). Help is on the way!')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger)', color: '#FFFFFF',
              border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(229, 57, 53, 0.3)'
            }}
          >
            <span>🆘</span>
            <span>Emergency SOS</span>
          </button>

          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
            <span>Viewing <strong>{user.name}</strong></span>
          </div>

          <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: '80px', bottom: 0, left: 0, width: '280px',
        backgroundColor: 'var(--color-primary-bg)', padding: 'var(--space-lg)',
        borderRight: '1px solid var(--color-border)', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'
      }}>
        {!isCaretaker ? (
          <>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Elder Spaces</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SidebarItem icon="nature_people" label="Home & Daily Mood" active={page === 'home'} onClick={() => setPage('home')} />
              <SidebarItem icon="record_voice_over" label="Talk with Granny" active={page === 'companion'} onClick={() => setPage('companion')} />
              <SidebarItem icon="explore" label="My Journey World" active={page === 'games' || page === 'play'} onClick={() => setPage('games')} />
              <SidebarItem icon="medication" label="Health & Meds" active={page === 'health'} onClick={() => setPage('health')} />
              <SidebarItem icon="photo_library" label="Memories & Theater" active={page === 'memory' || page === 'theatre'} onClick={() => setPage('memory')} />
              <SidebarItem icon="settings" label="Settings" active={page === 'settings'} onClick={() => setPage('settings')} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-secondary-dark)', letterSpacing: '0.05em' }}>Caretaker Insights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SidebarItem icon="analytics" label={`${user.name} Overview`} active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
              <SidebarItem icon="nature_people" label="Elder Sanctuary" active={page === 'home'} onClick={() => setPage('home')} />
              <SidebarItem icon="medication" label="Medication Schedule" active={page === 'health'} onClick={() => setPage('health')} />
              <SidebarItem icon="photo_library" label="Memory Circle" active={page === 'memory' || page === 'theatre'} onClick={() => setPage('memory')} />
              <SidebarItem icon="settings" label="Settings" active={page === 'settings'} onClick={() => setPage('settings')} />
            </div>
          </>
        )}
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: '280px', marginTop: '80px', width: 'calc(100% - 280px)', padding: 'var(--space-xl)' }}>
        {children}
      </main>

    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        borderRadius: '12px', border: 'none', cursor: 'pointer',
        backgroundColor: active ? 'var(--color-primary)' : 'transparent',
        color: active ? 'white' : 'var(--color-text-secondary)',
        fontWeight: 600, fontSize: '15px', textAlign: 'left', transition: 'all 0.2s ease'
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: active ? 'white' : 'var(--color-primary)' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
