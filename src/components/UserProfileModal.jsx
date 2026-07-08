import React, { useState, useEffect } from 'react';
import { X, MessageSquare, User, Store, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const GOLD = '#C5A059';

const ROLE_CONFIG = {
  admin:  { label: 'Administrator', icon: ShieldCheck, color: '#EF4444' },
  seller: { label: 'Verified Seller', icon: Store, color: '#C5A059' },
  normal: { label: 'Member', icon: Users, color: '#059669' },
};

export default function UserProfileModal({ userId, userData, onClose }) {
  const navigate = useNavigate();
  const [user, setUser]       = useState(userData || null);
  const [loading, setLoading] = useState(!userData);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch if only userId was passed
  useEffect(() => {
    if (user || !userId) return;
    const load = async () => {
      try {
        const data = await apiFetch(`/users/${userId}`);
        setUser(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [userId, user]);

  const handleChatClick = () => {
    onClose();
    navigate('/chat', { state: { sellerId: user._id } });
  };

  const role       = user?.role || 'normal';
  const roleConf   = ROLE_CONFIG[role] || ROLE_CONFIG.normal;
  const RoleIcon   = roleConf.icon;
  const initials   = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000 }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(420px, 92vw)',
          background: '#FAFAFA',
          borderRadius: '1.5rem',
          zIndex: 10001,
          boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}
      >
        {/* Gold accent top bar */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${GOLD}, #e8c98a, ${GOLD})` }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', width: 34, height: 34, borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', zIndex: 1 }}
        >
          <X size={16} />
        </button>

        <div style={{ padding: '2rem 1.75rem 1.75rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : user ? (
            <>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName}
                    style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${GOLD}`, boxShadow: `0 0 0 4px ${GOLD}22`, marginBottom: '0.9rem' }}
                  />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#f3f4f6', border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#374151', marginBottom: '0.9rem' }}>
                    {initials || <User size={36} color="#9ca3af" />}
                  </div>
                )}

                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111', marginBottom: '0.3rem' }}>
                  {user.firstName} {user.lastName}
                </h2>

                {/* Role badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: 9999, background: `${roleConf.color}15`, border: `1px solid ${roleConf.color}40`, fontSize: '0.72rem', fontWeight: 800, color: roleConf.color }}>
                  <RoleIcon size={12} />
                  {roleConf.label}
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div style={{ background: '#f9f9f7', border: '1px solid #e5e7eb', borderRadius: '0.9rem', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6, fontWeight: 500, textAlign: 'center' }}>
                    "{user.bio}"
                  </p>
                </div>
              )}

              {/* Chat button */}
              <button
                onClick={handleChatClick}
                style={{ width: '100%', padding: '0.85rem', background: '#111', color: '#fff', border: 'none', borderRadius: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9rem', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#111'; }}
              >
                <MessageSquare size={18} />
                Chat with {user.firstName}
              </button>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>User not found.</p>
          )}
        </div>
      </div>
    </>
  );
}
