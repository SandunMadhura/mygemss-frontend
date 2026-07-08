import React, { useEffect } from 'react';
import { X, Bell, CheckCheck, Store, MessageSquare, AlertTriangle, Info, CheckCircle, Heart, Wrench, MessageCircle } from 'lucide-react';
import { useNotifications, relativeTime } from '../context/NotificationContext';

const GOLD = '#C5A059';

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  store_approval: {
    icon: Store,
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    dot: '#059669',
  },
  service_approval: {
    icon: Wrench,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    dot: '#16A34A',
  },
  new_message: {
    icon: MessageSquare,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    dot: '#2563EB',
  },
  ai_flag: {
    icon: AlertTriangle,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    dot: '#D97706',
  },
  post_approved: {
    icon: CheckCircle,
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    dot: '#059669',
  },
  post_liked: {
    icon: Heart,
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
    dot: '#E11D48',
  },
  post_comment: {
    icon: MessageCircle,
    iconBg: `${GOLD}15`,
    iconColor: GOLD,
    dot: GOLD,
  },
  default: {
    icon: Info,
    iconBg: `${GOLD}15`,
    iconColor: GOLD,
    dot: GOLD,
  },
};

// ── Single Notification Card ──────────────────────────────────────────────────
function NotifCard({ notif, onRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => onRead(notif.id)}
      className="notif-card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.9rem 1.25rem',
        cursor: 'pointer',
        borderBottom: '1px solid #f3f4f6',
        background: notif.read ? '#FAFAFA' : '#fff',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f9f9f7'; }}
      onMouseLeave={e => { e.currentTarget.style.background = notif.read ? '#FAFAFA' : '#fff'; }}
    >
      {/* Icon */}
      <div
        style={{
          width: 38, height: 38, borderRadius: '50%',
          background: cfg.iconBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={cfg.iconColor} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151', marginBottom: '0.2rem' }}>
          {notif.title}
        </p>
        <p style={{ fontSize: '0.83rem', color: '#4B5563', fontWeight: 500, lineHeight: 1.45 }}>
          {notif.message}
        </p>
        <p style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, marginTop: '0.35rem' }}>
          {relativeTime(notif.time)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: cfg.dot, flexShrink: 0, marginTop: '0.3rem',
          }}
        />
      )}
    </div>
  );
}

// ── Drawer ───────────────────────────────────────────────────────────────────
export default function NotificationDrawer() {
  const { notifications, unreadCount, markAllRead, markRead, drawerOpen, closeDrawer } = useNotifications();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer]);

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        aria-hidden="true"
      />

      {/* ── Drawer Panel ── */}
      <aside
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(380px, 95vw)',
          background: '#FAFAFA',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid #e5e7eb',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={20} color={GOLD} />
            <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Notifications</h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#EF4444', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 800,
                  borderRadius: 9999, padding: '0.1rem 0.45rem',
                  minWidth: 18, textAlign: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: 'none', border: `1px solid ${GOLD}`,
                  color: GOLD, borderRadius: '0.5rem',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.72rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}15`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}

            {/* Close */}
            <button
              onClick={closeDrawer}
              style={{
                width: 34, height: 34,
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6B7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#111'; e.currentTarget.style.color = '#111'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6B7280'; }}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '4rem 2rem', gap: '0.75rem',
                color: '#9CA3AF',
              }}
            >
              <Bell size={40} strokeWidth={1.5} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>You're all caught up!</p>
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <NotifCard key={notif.id} notif={notif} onRead={markRead} />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.8rem 1.25rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            background: '#fff',
          }}
        >
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500 }}>
            Showing last {notifications.length} notifications
          </p>
        </div>
      </aside>
    </>
  );
}
