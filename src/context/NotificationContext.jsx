import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// ── Relative time helper ─────────────────────────────────────────────────────
export function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

let _nextId = 1;
function makeId() { return String(_nextId++); }

// ── Context ──────────────────────────────────────────────────────────────────
const NotifCtx = createContext(null);

export function NotificationProvider({ children }) {
  const { isSignedIn, getToken } = useAuth();
  const [myDbUser, setMyDbUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const socketRef = useRef(null);

  // ── Fetch own MongoDB user ID ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn) { setMyDbUser(null); return; }
    const load = async () => {
      try {
        const token = await getToken();
        const user = await apiFetchAuth('/users/me', token);
        setMyDbUser(user);
      } catch (e) { console.error('[Notif] Failed to fetch user:', e.message); }
    };
    load();
  }, [isSignedIn]);

  // ── Push a new notification to the top of the list ───────────────────────
  const push = useCallback(({ type, title, message }) => {
    setNotifications(prev => [
      { id: makeId(), type, title, message, time: new Date(), read: false },
      ...prev,
    ]);
  }, []);

  // ── Connect socket and listen for all notification events ─────────────────
  useEffect(() => {
    if (!myDbUser) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', myDbUser._id);
    });

    // ── 1. NEW CHAT MESSAGE ────────────────────────────────────────────────
    socket.on('new_message_notification', ({ from, preview }) => {
      const senderName = [from?.firstName, from?.lastName].filter(Boolean).join(' ') || 'Someone';
      push({
        type: 'new_message',
        title: 'New Message',
        message: `${senderName}: "${preview}"`,
      });
    });

    // ── 2. STORE STATUS CHANGED (approve / reject / suspend) ──────────────
    socket.on('store_status_changed', ({ targetUserId, storeName, status }) => {
      if (targetUserId !== myDbUser._id) return;
      const labels = {
        approved:  { title: 'Store Approved 🎉',  msg: `Your store '${storeName}' has been approved. You can now list products.` },
        rejected:  { title: 'Store Rejected',     msg: `Your store '${storeName}' was rejected. Please review the guidelines and re-apply.` },
        suspended: { title: 'Store Suspended',    msg: `Your store '${storeName}' has been temporarily suspended by an admin.` },
      };
      const info = labels[status] || { title: `Store ${status}`, msg: `Your store '${storeName}' status changed to ${status}.` };
      push({ type: 'store_approval', title: info.title, message: info.msg });
    });

    // ── 3. SERVICE STATUS CHANGED (approve / reject) ───────────────────────
    socket.on('service_status_changed', ({ targetUserId, serviceName, status }) => {
      if (targetUserId !== myDbUser._id) return;
      const labels = {
        approved: { title: 'Service Approved 🎉', msg: `Your service listing '${serviceName}' has been approved and is now visible in the directory.` },
        rejected: { title: 'Service Rejected',    msg: `Your service listing '${serviceName}' was rejected. Please review the guidelines and re-submit.` },
      };
      const info = labels[status] || { title: `Service ${status}`, msg: `Your service '${serviceName}' status changed to ${status}.` };
      push({ type: 'service_approval', title: info.title, message: info.msg });
    });

    // ── 4. POST AUTO-APPROVED BY AI ────────────────────────────────────────
    socket.on('post_approved_owner', ({ targetUserId }) => {
      if (targetUserId !== myDbUser._id) return;
      push({
        type: 'post_approved',
        title: 'Post is Live ✅',
        message: 'Your community post has been approved and is now visible on the feed.',
      });
    });

    // ── 5. POST FLAGGED BY AI ──────────────────────────────────────────────
    socket.on('post_flagged', ({ targetUserId, confidence }) => {
      if (targetUserId !== myDbUser._id) return;
      push({
        type: 'ai_flag',
        title: 'Post Under Review',
        message: `Your recent post was held by Gemini AI (${Math.round(confidence)}% confidence) for administrative review.`,
      });
    });

    // ── 6. SOMEONE LIKED YOUR POST ─────────────────────────────────────────
    socket.on('post_liked', ({ targetUserId, likerName }) => {
      if (targetUserId !== myDbUser._id) return;
      push({
        type: 'post_liked',
        title: 'New Like ❤️',
        message: `${likerName} liked your post.`,
      });
    });

    // ── 7. SOMEONE COMMENTED ON YOUR POST ─────────────────────────────────
    socket.on('post_commented', ({ targetUserId, commenterName, preview }) => {
      if (targetUserId !== myDbUser._id) return;
      push({
        type: 'post_comment',
        title: 'New Comment 💬',
        message: `${commenterName} commented: "${preview}"`,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [myDbUser, push]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <NotifCtx.Provider value={{ notifications, unreadCount, markAllRead, markRead, drawerOpen, openDrawer, closeDrawer }}>
      {children}
    </NotifCtx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifCtx);
  if (!ctx) throw new Error('useNotifications must be inside <NotificationProvider>');
  return ctx;
}
