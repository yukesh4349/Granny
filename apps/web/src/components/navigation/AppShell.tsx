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
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Viewing {user.name}'s Journey
          </div>
          <button className="btn btn-secondary" onClick={onLogout} style={{ padding: '8px 16px', minHeight: 'auto' }}>
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
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Elder Spaces</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SidebarItem icon="nature_people" label="Home & Daily Mood" active={page === 'home'} onClick={() => setPage('home')} />
              <SidebarItem icon="explore" label="My Journey World" active={page === 'games'} onClick={() => setPage('games')} />
              <SidebarItem icon="photo_library" label="Memories & Theater" active={page === 'memory' || page === 'theatre'} onClick={() => setPage('memory')} />
              <SidebarItem icon="mark_email_unread" label="Family Quest" active={false} onClick={() => {}} />
              <SidebarItem icon="local_florist" label="Memory Garden" active={false} onClick={() => {}} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-secondary-dark)' }}>Caretaker Insights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SidebarItem icon="analytics" label={`${user.name} Overview`} active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
              <SidebarItem icon="insights" label="Cognitive Reports" active={false} onClick={() => {}} />
              <SidebarItem icon="diversity_1" label="Family Circle" active={false} onClick={() => {}} />
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
      {label}
    </button>
  );
}
