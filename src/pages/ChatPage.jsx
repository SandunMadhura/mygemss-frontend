import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  Send, ImagePlus, X, Loader2, MessageSquare,
  Circle, Search, ArrowLeft, Mic, Paperclip, Package
} from 'lucide-react';
import { io } from 'socket.io-client';
import { apiFetchAuth, apiFetchAuthForm } from '../lib/api';
import { Users as UsersIcon, Clock } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function roomId(a, b) {
  return [String(a), String(b)].sort().join('_');
}
function timeStr(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function dateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── ContactItem ────────────────────────────────────────────────────────── */
function ContactItem({ contact, isActive, isOnline, onClick }) {
  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
  const preview = contact.lastMessage?.content || (contact.lastMessage?.mediaType !== 'none' ? '📎 Media' : '');

  return (
    <button onClick={onClick} className={`contact-item ${isActive ? 'contact-item--active' : ''}`}>
      <div className="relative shrink-0">
        {contact.profileImageUrl
          ? <img src={contact.profileImageUrl} className="w-11 h-11 rounded-full object-cover" alt="" />
          : <div className="w-11 h-11 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-amber-300 text-sm">{initials}</div>
        }
        <span className={`online-dot ${isOnline ? 'online-dot--on' : 'online-dot--off'}`} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-black truncate">
          {contact.firstName} {contact.lastName}
        </p>
        <p className="text-xs text-black font-medium truncate mt-0.5">{preview || 'Start a conversation'}</p>
      </div>
      {contact.lastMessage && (
        <span className="text-[10px] text-gray-600 shrink-0 self-start mt-1">
          {timeStr(contact.lastMessage.createdAt)}
        </span>
      )}
    </button>
  );
}

/* ─── MessageBubble ──────────────────────────────────────────────────────── */
function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        msg.sender?.profileImageUrl
          ? <img src={msg.sender.profileImageUrl} className="w-7 h-7 rounded-full object-cover shrink-0 mb-1" alt="" />
          : <div className="w-7 h-7 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0 mb-1">
              {msg.sender?.firstName?.[0] || '?'}
            </div>
      )}
      <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
        {msg.mediaUrl && msg.mediaType === 'image' && (
          <img src={msg.mediaUrl} alt="media" className="rounded-lg max-w-xs max-h-56 object-cover mb-2 cursor-pointer" />
        )}
        {msg.mediaUrl && msg.mediaType === 'video' && (
          <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs max-h-56 mb-2" />
        )}
        {msg.mediaUrl && msg.mediaType === 'voice' && (
          <audio src={msg.mediaUrl} controls className="mb-2 w-full" />
        )}
        {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
        <span className={`text-[10px] mt-1 block ${isMine ? 'text-amber-900/70 text-right' : 'text-gray-500'}`}>
          {timeStr(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ─── Main ChatPage ──────────────────────────────────────────────────────── */
export default function ChatPage() {
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myDbUser, setMyDbUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' or 'directory'
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // ── Product context state ──────────────────────────────────────────────────
  const [productContext, setProductContext] = useState(null);
  const productIntroSentRef = useRef(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const currentRoomRef = useRef(null);

  /* ─ Scroll to bottom ─ */
  const scrollBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, []);

  /* ─ Fetch my DB user ─ */
  useEffect(() => {
    if (!isSignedIn) return;
    const load = async () => {
      const token = await getToken();
      const data = await apiFetchAuth('/users/me', token);
      setMyDbUser(data);
    };
    load().catch(console.error);
  }, [isSignedIn]);

  /* ─ Setup socket ─ */
  useEffect(() => {
    if (!myDbUser) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', myDbUser._id);
    });

    socket.on('online_users', (ids) => setOnlineUsers(ids));

    socket.on('receive_message', (msg) => {
      setMessages((prev) => {
        // Replace optimistic message if tempId matches
        if (msg.tempId) {
          const idx = prev.findIndex(m => m._id === msg.tempId);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
        }
        return [...prev, msg];
      });
      scrollBottom();
    });

    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [myDbUser]);

  /* ─ Load contacts ─ */
  useEffect(() => {
    if (!isSignedIn) return;
    const load = async () => {
      try {
        const token = await getToken();
        const data = await apiFetchAuth('/chat/contacts', token);
        setContacts(data);
      } catch (e) { console.error(e); }
    };
    load();
  }, [isSignedIn]);

  /* ─ Load Directory Users ─ */
  useEffect(() => {
    if (!isSignedIn || activeTab !== 'directory') return;
    const load = async () => {
      setLoadingDirectory(true);
      try {
        const token = await getToken();
        const data = await apiFetchAuth(`/chat/users?q=${contactSearch}`, token);
        setDirectoryUsers(data);
      } catch (e) { console.error(e); }
      finally { setLoadingDirectory(false); }
    };
    const timer = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timer);
  }, [isSignedIn, activeTab, contactSearch]);

  /* ─ Open contact from URL param (?sellerId=...) OR router location state ─ */
  useEffect(() => {
    // Priority 1: location.state (from ProductCard navigate)
    const stateProduct = location.state?.currentProduct;
    const stateSellerId = location.state?.sellerId;
    if (stateProduct && stateSellerId && isSignedIn) {
      setProductContext(stateProduct);
      productIntroSentRef.current = false;
      const load = async () => {
        try {
          const token = await getToken();
          const contact = await apiFetchAuth(`/chat/user/${stateSellerId}`, token);
          contact._id = stateSellerId;
          openContact(contact, stateProduct);
        } catch (e) { console.error(e); }
      };
      load();
      return;
    }

    // Priority 2: URL query param ?sellerId=
    const sellerId = searchParams.get('sellerId');
    if (!sellerId || !isSignedIn) return;
    const load = async () => {
      try {
        const token = await getToken();
        const contact = await apiFetchAuth(`/chat/user/${sellerId}`, token);
        contact._id = sellerId;
        openContact(contact);
      } catch (e) { console.error(e); }
    };
    load();
  }, [searchParams, isSignedIn, location.state]);

  /* ─ Open a conversation ─ */
  const openContact = useCallback(async (contact, contextProduct = null) => {
    setActiveContact(contact);
    setMessages([]);
    setIsTyping(false);
    setShowSidebar(false);
    setLoadingHistory(true);

    // Leave old room, join new
    const socket = socketRef.current;
    if (socket && myDbUser) {
      if (currentRoomRef.current) socket.emit('leave_room', currentRoomRef.current);
      const rid = roomId(myDbUser._id, contact._id);
      currentRoomRef.current = rid;
      socket.emit('join_room', rid);
    }

    try {
      const token = await getToken();
      const data = await apiFetchAuth(`/chat/history/${contact._id}`, token);
      setMessages(data.messages);
      setActiveContact(data.contact || contact);
      setContacts(prev => {
        const exists = prev.find(c => c._id === (data.contact?._id || contact._id));
        if (!exists) return [data.contact || contact, ...prev];
        return prev;
      });

      // ── Auto first-message for product context ────────────────────────────
      const product = contextProduct || productContext;
      if (product && !productIntroSentRef.current) {
        const isNewChat = data.messages.length === 0;
        if (isNewChat) {
          // Automatically send the first intro message
          const introText = `Hi, I am interested in your listing: ${product.name} (Rs. ${parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })})`;
          const socket = socketRef.current;
          const tempId = `temp_${Date.now()}`;
          if (socket?.connected && myDbUser) {
            const optimistic = {
              _id: tempId,
              sender: { _id: myDbUser._id, firstName: clerkUser?.firstName, profileImageUrl: clerkUser?.imageUrl },
              receiver: { _id: contact._id },
              content: introText,
              mediaType: 'none',
              createdAt: new Date().toISOString(),
              tempId,
            };
            setMessages(prev => [...prev, optimistic]);
            socket.emit('send_message', {
              roomId: currentRoomRef.current,
              senderId: myDbUser._id,
              receiverId: contact._id,
              content: introText,
              tempId,
            });
          } else {
            // Pre-fill input instead if socket not ready
            setText(`Hi, I am interested in your listing: ${product.name} (Rs. ${parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })})`);
          }
          productIntroSentRef.current = true;
        } else {
          // Chat already exists — pre-fill input instead
          setText(`Hi, I am interested in your listing: ${product.name} (Rs. ${parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })})`);
          productIntroSentRef.current = true;
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingHistory(false); scrollBottom(); }
  }, [myDbUser, getToken, productContext, clerkUser]);

  /* ─ Send message ─ */
  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !mediaFile) || !activeContact || !myDbUser) return;

    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const socket = socketRef.current;

    if (mediaFile) {
      // REST path for media (Cloudinary)
      try {
        const token = await getToken();
        const fd = new FormData();
        fd.append('receiverId', activeContact._id);
        fd.append('content', text);
        fd.append('media', mediaFile);
        const saved = await apiFetchAuthForm('/chat/send', token, fd);
        setMessages(prev => [...prev, saved]);
        scrollBottom();
        setContacts(prev => prev.map(c =>
          c._id === activeContact._id ? { ...c, lastMessage: saved } : c
        ));
      } catch (e) { console.error(e); }
      setMediaFile(null);
      setMediaPreview(null);
    } else if (socket && socket.connected) {
      // Real-time socket path for text
      const optimistic = {
        _id: tempId,
        sender: { _id: myDbUser._id, firstName: clerkUser?.firstName, profileImageUrl: clerkUser?.imageUrl },
        receiver: { _id: activeContact._id },
        content: text,
        mediaType: 'none',
        createdAt: new Date().toISOString(),
        tempId,
      };
      setMessages(prev => [...prev, optimistic]);
      scrollBottom();

      socket.emit('send_message', {
        roomId: currentRoomRef.current,
        senderId: myDbUser._id,
        receiverId: activeContact._id,
        content: text,
        tempId,
      });
      socket.emit('stop_typing', { roomId: currentRoomRef.current, userId: myDbUser._id });
    } else {
      // Fallback REST for text if socket is offline
      try {
        const token = await getToken();
        const saved = await apiFetchAuth('/chat/send', token, {
          method: 'POST',
          body: JSON.stringify({ receiverId: activeContact._id, content: text }),
        });
        setMessages(prev => [...prev, saved]);
        scrollBottom();
      } catch (e) { console.error(e); }
    }

    setText('');
    setSending(false);
  };

  /* ─ Typing indicator ─ */
  const handleTextChange = (e) => {
    setText(e.target.value);
    const socket = socketRef.current;
    if (!socket || !currentRoomRef.current || !myDbUser) return;
    socket.emit('typing', { roomId: currentRoomRef.current, userId: myDbUser._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: currentRoomRef.current, userId: myDbUser._id });
    }, 1500);
  };

  /* ─ Media file picker ─ */
  const handleMediaFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  /* ─ Group messages by date ─ */
  const groupedMessages = (() => {
    const groups = [];
    let lastDate = null;
    for (const msg of messages) {
      const label = dateLabel(msg.createdAt);
      if (label !== lastDate) { groups.push({ type: 'date', label }); lastDate = label; }
      groups.push({ type: 'msg', msg });
    }
    return groups;
  })();

  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase())
  );

  /* ─ Not signed in ─ */
  if (!isSignedIn) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <MessageSquare size={48} className="text-emerald-700" />
      <p className="text-amber-100 font-semibold text-lg">Sign in to access messages</p>
    </div>
  );

  /* ─ Layout ─ */
  return (
    <div className="chat-shell">
      {/* ── LEFT: Contacts Panel ─────────────────────────────────── */}
      <aside className={`chat-contacts flex flex-col ${showSidebar ? 'chat-contacts--visible' : 'chat-contacts--hidden'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-black mb-3">Messages</h2>
          
          <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1
                ${activeTab === 'recent' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
            >
              <Clock size={14} /> Recent
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1
                ${activeTab === 'directory' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
            >
              <UsersIcon size={14} /> Directory
            </button>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm placeholder-gray-500 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {activeTab === 'recent' && (
            filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                <MessageSquare size={32} className="mx-auto mb-2 text-emerald-800" />
                No conversations yet.<br />Use the <strong>Directory</strong> tab to find users.
              </div>
            ) : filteredContacts.map(contact => (
              <ContactItem
                key={contact._id}
                contact={contact}
                isActive={activeContact?._id === contact._id}
                isOnline={onlineUsers.includes(contact._id)}
                onClick={() => openContact(contact)}
              />
            ))
          )}

          {activeTab === 'directory' && (
            loadingDirectory ? (
              <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-amber-400" /></div>
            ) : directoryUsers.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No users found.</div>
            ) : directoryUsers.map(user => (
              <ContactItem
                key={user._id}
                contact={user}
                isActive={activeContact?._id === user._id}
                isOnline={onlineUsers.includes(user._id)}
                onClick={() => { openContact(user); setActiveTab('recent'); setContactSearch(''); }}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── RIGHT: Message Thread ────────────────────────────────── */}
      <section className={`chat-thread ${!showSidebar ? 'chat-thread--visible' : 'chat-thread--hidden'}`}>
        {!activeContact ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <MessageSquare size={36} className="text-emerald-700" />
            </div>
            <p className="text-black font-bold text-lg">Select a conversation</p>
            <p className="text-sm text-gray-900 font-medium">Choose from your contacts on the left, or click <strong className="text-amber-600 font-bold">Chat</strong> on any product listing.</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="chat-thread-header">
              <button onClick={() => setShowSidebar(true)} className="md:hidden icon-btn mr-2">
                <ArrowLeft size={20} />
              </button>
              <div className="relative">
                {activeContact.profileImageUrl
                  ? <img src={activeContact.profileImageUrl} className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/30" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-amber-300">
                      {activeContact.firstName?.[0]}{activeContact.lastName?.[0]}
                    </div>
                }
                <span className={`online-dot ${onlineUsers.includes(activeContact._id) ? 'online-dot--on' : 'online-dot--off'}`} />
              </div>
              <div className="ml-3 min-w-0">
                <p className="font-bold text-black truncate">
                  {activeContact.firstName} {activeContact.lastName}
                </p>
                <p className="text-xs text-black font-semibold">
                  {onlineUsers.includes(activeContact._id) ? '● Online' : '○ Offline'}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              {/* ── Product Context Widget ─────────────────────────── */}
              {productContext && (
                <div
                  style={{
                    background: '#FAFAFA',
                    border: '1px solid #e5e7eb',
                    borderRadius: '1rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Thumbnail */}
                  {productContext.images?.[0] ? (
                    <img
                      src={productContext.images[0]}
                      alt={productContext.name}
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0, border: '1px solid #e5e7eb' }}
                    />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '0.5rem', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={22} color="#9ca3af" />
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C5A059', marginBottom: '0.1rem' }}>
                      Inquiring about this item
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {productContext.name}
                    </p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>Rs </span>
                      {parseFloat(productContext.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {/* Dismiss */}
                  <button
                    onClick={() => setProductContext(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0, padding: '0.25rem' }}
                    title="Dismiss"
                    aria-label="Dismiss product context"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {loadingHistory ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-amber-400" />
                </div>
              ) : (
                <>
                  {groupedMessages.map((item, i) =>
                    item.type === 'date'
                      ? <div key={i} className="chat-date-divider"><span>{item.label}</span></div>
                      : <MessageBubble
                          key={item.msg._id}
                          msg={item.msg}
                          isMine={item.msg.sender?._id === myDbUser?._id || item.msg.sender === myDbUser?._id}
                        />
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="chat-bubble chat-bubble--theirs">
                        <div className="flex gap-1 items-center py-0.5">
                          <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                          <span className="typing-dot" style={{ animationDelay: '150ms' }} />
                          <span className="typing-dot" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="px-4 py-2 border-t border-emerald-800">
                <div className="relative inline-block">
                  {mediaFile?.type?.startsWith('image')
                    ? <img src={mediaPreview} className="h-20 w-20 object-cover rounded-xl border border-emerald-700" alt="preview" />
                    : <div className="h-20 w-20 rounded-xl bg-emerald-900 flex items-center justify-center text-xs text-green-300 border border-emerald-700">
                        <Paperclip size={20} />
                      </div>
                  }
                  <button
                    type="button"
                    onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSend} className="chat-input-bar">
              {/* Media upload */}
              <label className="icon-btn cursor-pointer shrink-0" title="Attach image/video">
                <ImagePlus size={20} />
                <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleMediaFile} />
              </label>

              <input
                value={text}
                onChange={handleTextChange}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                placeholder="Type a message…"
                className="chat-text-input flex-1"
                disabled={sending}
              />

              <button
                type="submit"
                disabled={sending || (!text.trim() && !mediaFile)}
                className="btn-gold shrink-0 px-4 py-2.5 disabled:opacity-40"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
