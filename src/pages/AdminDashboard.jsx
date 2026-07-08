import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Store, FileText, Users, Image as ImageIcon,
  CheckCircle, XCircle, Trash2, ShieldCheck, ShieldOff,
  AlertTriangle, Loader2, RefreshCw, UploadCloud, ExternalLink,
  PauseCircle, Eye, Wrench, MapPin, Phone, Tag, Bot, X,
  Mail, Calendar, Hash, Star, Globe, Clock
} from 'lucide-react';
import { apiFetchAuth, apiFetchAuthForm } from '../lib/api';

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const GOLD = '#C5A059';

const TABS = [
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'ads', label: 'Ad Slider', icon: ImageIcon },
  { id: 'services', label: 'Manage Services', icon: Wrench },
];

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  suspended: 'bg-gray-100 text-gray-600 border-gray-300',
};

const SERVICE_CATEGORY_COLOR = {
  'Gem Cutting': '#8B5CF6',
  'Gem Heating': '#EF4444',
  'Gem Testing/Lab': '#3B82F6',
  'Jewelry Design': '#C5A059',
};

// ─── Shared primitives ─────────────────────────────────────────────────────────
function Badge({ status }) {
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_BADGE[status] || STATUS_BADGE.pending}`}>
      {status}
    </span>
  );
}

function AdminCard({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${className}`}>{children}</div>;
}

function AiBadge({ ai_reviewed, ai_confidence }) {
  if (!ai_reviewed) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-gray-50 text-gray-400 border-gray-200">
        <Bot size={10} /> AI: analysing…
      </span>
    );
  }
  const pct = Math.round(ai_confidence ?? 0);
  const isHigh = pct > 80;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${isHigh ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}>
      <Bot size={10} /> AI: {pct}% {isHigh ? '💎 gem' : '⚠ uncertain'}
    </span>
  );
}

/** Mute-Gold Review button — consistent across all tabs */
function ReviewBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
      style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}12` }}
      onMouseEnter={e => e.currentTarget.style.background = `${GOLD}25`}
      onMouseLeave={e => e.currentTarget.style.background = `${GOLD}12`}
    >
      <Eye size={13} /> Review
    </button>
  );
}

// ─── Reusable Modal Shell ──────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, subtitle, children, footer }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: '#FAFAFA' }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-black tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>

        {/* ── Footer with action buttons ── */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper: detail row ─────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, href, color }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color || GOLD}18` }}>
        <Icon size={13} style={{ color: color || GOLD }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        {href
          ? <a href={href} className="text-sm font-semibold text-blue-600 underline break-all">{value || '—'}</a>
          : <p className="text-sm font-semibold text-black break-words">{value || '—'}</p>
        }
      </div>
    </div>
  );
}

// ─── Section divider ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest mb-3"
      style={{ color: GOLD }}>{children}</p>
  );
}

// ─── Action button helpers ─────────────────────────────────────────────────────
const Btn = {
  approve: (onClick) => (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
      <CheckCircle size={13} /> Approve
    </button>
  ),
  reject: (onClick) => (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
      <XCircle size={13} /> Reject
    </button>
  ),
  suspend: (onClick) => (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
      <PauseCircle size={13} /> Suspend
    </button>
  ),
  delete: (onClick) => (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
      <Trash2 size={13} /> Delete
    </button>
  ),
  close: (onClick) => (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
      <X size={13} /> Close
    </button>
  ),
};

// ═══════════════════════════════════════════════════════════
// STORES TAB + MODAL
// ═══════════════════════════════════════════════════════════
function StoreModal({ store, onClose, onAction }) {
  if (!store) return null;
  const o = store.owner || {};
  return (
    <Modal
      isOpen={!!store}
      onClose={onClose}
      title={store.name}
      subtitle="Store Details"
      footer={
        <>
          {store.status !== 'approved' && Btn.approve(() => onAction(store._id, 'approved'))}
          {store.status !== 'rejected' && Btn.reject(() => onAction(store._id, 'rejected'))}
          {store.status !== 'suspended' && Btn.suspend(() => onAction(store._id, 'suspended'))}
          {Btn.delete(() => onAction(store._id, '__delete__'))}
          {Btn.close(onClose)}
        </>
      }
    >
      {/* Store hero */}
      <div className="flex items-center gap-4">
        {store.logoUrl
          ? <img src={store.logoUrl} className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-sm" alt="" />
          : <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center font-black text-3xl shrink-0">{store.name[0]}</div>
        }
        <div>
          <p className="font-black text-xl text-black">{store.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge status={store.status} />
            <span className="text-xs text-gray-400">{store.category}</span>
          </div>
        </div>
      </div>

      {/* Store info */}
      <div>
        <SectionLabel>Store Information</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <DetailRow icon={Tag} label="Category" value={store.category} />
          <DetailRow icon={MapPin} label="Location" value={store.location} />
          <DetailRow icon={Phone} label="Phone" value={store.contactOptions?.phone} href={store.contactOptions?.phone ? `tel:${store.contactOptions.phone}` : null} />
          <DetailRow icon={Globe} label="Chat Enabled" value={store.contactOptions?.chatEnabled ? 'Yes' : 'No'} />
          <DetailRow icon={Calendar} label="Applied On" value={store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
        </div>
      </div>

      {/* Description */}
      {store.description && (
        <div>
          <SectionLabel>Description</SectionLabel>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{store.description}</p>
        </div>
      )}

      {/* Identity proof */}
      {store.identityProofUrl && (
        <div>
          <SectionLabel>Identity Proof Document</SectionLabel>
          <a href={store.identityProofUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 underline">
            <ExternalLink size={14} /> View Document
          </a>
        </div>
      )}

      {/* Owner */}
      <div>
        <SectionLabel>Owner</SectionLabel>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          {o.profileImageUrl
            ? <img src={o.profileImageUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
            : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-black text-gray-700">{o.firstName?.[0] || '?'}</div>
          }
          <div>
            <p className="font-bold text-black text-sm">{o.firstName} {o.lastName}</p>
            <p className="text-xs text-gray-500">{o.email}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StoresTab({ getToken }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setStores(await apiFetchAuth('/admin/stores', token));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  // Called from summary cards — no modal side-effects
  const cardAction = async (id, action) => {
    try {
      const token = await getToken();
      if (action === '__delete__') {
        if (!confirm('Permanently delete this store?')) return;
        await apiFetchAuth(`/admin/stores/${id}`, token, { method: 'DELETE' });
        setStores(p => p.filter(s => s._id !== id));
      } else {
        const updated = await apiFetchAuth(`/admin/stores/${id}/status`, token, {
          method: 'PATCH', body: JSON.stringify({ status: action })
        });
        setStores(p => p.map(s => s._id === id ? updated : s));
      }
    } catch (e) { alert(e.message); }
  };

  // Called from inside the modal — closes/updates modal on success
  const modalAction = async (id, action) => {
    try {
      const token = await getToken();
      if (action === '__delete__') {
        if (!confirm('Permanently delete this store?')) return;
        await apiFetchAuth(`/admin/stores/${id}`, token, { method: 'DELETE' });
        setStores(p => p.filter(s => s._id !== id));
        setSelected(null);
      } else {
        const updated = await apiFetchAuth(`/admin/stores/${id}/status`, token, {
          method: 'PATCH', body: JSON.stringify({ status: action })
        });
        setStores(p => p.map(s => s._id === id ? updated : s));
        setSelected(updated); // refresh modal with new status
      }
    } catch (e) { alert(e.message); }
  };

  const filtered = filter === 'all' ? stores : stores.filter(s => s.status === filter);

  return (
    <div>
      <StoreModal store={selected} onClose={() => setSelected(null)} onAction={modalAction} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors capitalize ${filter === f ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="icon-btn"><RefreshCw size={15} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-black" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No stores found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(store => (
            <AdminCard key={store._id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {store.logoUrl
                  ? <img src={store.logoUrl} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                  : <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-base shrink-0">{store.name[0]}</div>
                }
                <div className="min-w-0">
                  <p className="font-black text-black text-sm truncate">{store.name}</p>
                  <p className="text-xs text-gray-500">{store.category} · {store.location || '—'}</p>
                  <p className="text-xs text-gray-400">{store.owner?.firstName} {store.owner?.lastName} · {store.owner?.email}</p>
                </div>
              </div>
              <Badge status={store.status} />
              <div className="flex gap-2 flex-wrap items-center">
                <ReviewBtn onClick={() => setSelected(store)} />
                {store.status !== 'approved' && <button onClick={() => cardAction(store._id, 'approved')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle size={13} /> Approve</button>}
                {store.status !== 'rejected' && <button onClick={() => cardAction(store._id, 'rejected')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><XCircle size={13} /> Reject</button>}
                {store.status !== 'suspended' && <button onClick={() => cardAction(store._id, 'suspended')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"><PauseCircle size={13} /> Suspend</button>}
                <button onClick={() => cardAction(store._id, '__delete__')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><Trash2 size={13} /> Delete</button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// POSTS TAB + MODAL
// ═══════════════════════════════════════════════════════════
function PostModal({ post, onClose, onAction }) {
  if (!post) return null;
  const a = post.author || {};
  return (
    <Modal
      isOpen={!!post}
      onClose={onClose}
      title="Post Review"
      subtitle={`By ${a.firstName || ''} ${a.lastName || ''}`}
      footer={
        <>
          {post.status === 'pending' && Btn.approve(() => onAction(post._id, 'approve'))}
          {post.status === 'pending' && Btn.reject(() => onAction(post._id, 'reject'))}
          {Btn.delete(() => onAction(post._id, 'delete'))}
          {Btn.close(onClose)}
        </>
      }
    >
      {/* Author */}
      <div>
        <SectionLabel>Author</SectionLabel>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <img src={a.profileImageUrl} className="w-11 h-11 rounded-full object-cover border border-gray-100" alt="" />
          <div>
            <p className="font-bold text-black text-sm">{a.firstName} {a.lastName}</p>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${a.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{a.role}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge status={post.status} />
            <AiBadge ai_reviewed={post.ai_reviewed} ai_confidence={post.ai_confidence} />
          </div>
        </div>
      </div>

      {/* Full text content */}
      {post.content && (
        <div>
          <SectionLabel>Post Content</SectionLabel>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>
      )}

      {/* Full-size images */}
      {post.mediaUrls?.length > 0 && (
        <div>
          <SectionLabel>Media ({post.mediaUrls.length})</SectionLabel>
          <div className="grid gap-3" style={{ gridTemplateColumns: post.mediaUrls.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {post.mediaUrls.map((url, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: post.mediaUrls.length === 1 ? '16/9' : '1/1' }}>
                <img src={url} className="w-full h-full object-cover" alt={`media-${i}`} />
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      <div>
        <SectionLabel>Meta</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <DetailRow icon={Calendar} label="Posted" value={post.createdAt ? new Date(post.createdAt).toLocaleString() : null} />
          <DetailRow icon={Star} label="Likes" value={String(post.likes?.length || 0)} />
          <DetailRow icon={Hash} label="Comments" value={String(post.comments?.length || 0)} />
        </div>
      </div>
    </Modal>
  );
}

function PostsTab({ getToken }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setPosts(await apiFetchAuth(`/admin/posts?status=${filter}`, token));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken, filter]);

  useEffect(() => { load(); }, [load]);

  // Called from summary cards — no modal side-effects
  const cardAction = async (id, action) => {
    try {
      const token = await getToken();
      if (action === 'approve') {
        await apiFetchAuth(`/admin/posts/${id}/approve`, token, { method: 'PATCH', body: '{}' });
        setPosts(p => p.filter(x => x._id !== id));
      } else if (action === 'reject') {
        if (!confirm('Reject and remove this post?')) return;
        await apiFetchAuth(`/admin/posts/${id}`, token, { method: 'DELETE' });
        setPosts(p => p.filter(x => x._id !== id));
      } else if (action === 'delete') {
        if (!confirm('Permanently delete this post?')) return;
        await apiFetchAuth(`/admin/posts/${id}`, token, { method: 'DELETE' });
        setPosts(p => p.filter(x => x._id !== id));
      }
    } catch (e) { alert(e.message); }
  };

  // Called from inside the modal — always closes modal on success
  const modalAction = async (id, action) => {
    await cardAction(id, action);
    setSelected(null);
  };

  return (
    <div>
      <PostModal post={selected} onClose={() => setSelected(null)} onAction={modalAction} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2">
          {['pending', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors capitalize ${filter === f ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="icon-btn"><RefreshCw size={15} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-black" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No {filter} posts</p>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <AdminCard key={post._id} className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <img src={post.author?.profileImageUrl} className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100" alt="" />
                <div className="min-w-0">
                  <p className="font-black text-black text-sm">{post.author?.firstName} {post.author?.lastName}</p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{post.content}</p>
                  {post.mediaUrls?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {post.mediaUrls.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} className="w-14 h-14 rounded-lg object-cover border border-gray-100" alt="" />
                      ))}
                      {post.mediaUrls.length > 3 && <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{post.mediaUrls.length - 3}</div>}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge status={post.status} />
                    <AiBadge ai_reviewed={post.ai_reviewed} ai_confidence={post.ai_confidence} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <ReviewBtn onClick={() => setSelected(post)} />
                {post.status === 'pending' && (
                  <>
                    <button onClick={() => cardAction(post._id, 'approve')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle size={13} /> Approve</button>
                    <button onClick={() => cardAction(post._id, 'reject')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><XCircle size={13} /> Reject</button>
                  </>
                )}
                <button onClick={() => cardAction(post._id, 'delete')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"><Trash2 size={13} /> Delete</button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USERS TAB + MODAL
// ═══════════════════════════════════════════════════════════
function UserModal({ user, onClose, onAction }) {
  if (!user) return null;
  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title={`${user.firstName || ''} ${user.lastName || ''}`}
      subtitle="User Account Details"
      footer={
        <>
          {user.role !== 'admin'
            ? <button onClick={() => onAction(user._id, 'role', 'admin')} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"><ShieldCheck size={13} /> Grant Admin</button>
            : <button onClick={() => onAction(user._id, 'role', 'normal')} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"><ShieldOff size={13} /> Revoke Admin</button>
          }
          <button onClick={() => onAction(user._id, 'block')}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${user.isBlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {user.isBlocked ? <><CheckCircle size={13} /> Unblock</> : <><XCircle size={13} /> Block</>}
          </button>
          <button onClick={() => onAction(user._id, 'warn')} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
            <AlertTriangle size={13} /> Warn
          </button>
          {Btn.close(onClose)}
        </>
      }
    >
      {/* Profile */}
      <div className="flex items-center gap-4">
        {user.profileImageUrl
          ? <img src={user.profileImageUrl} className="w-20 h-20 rounded-full object-cover border-2 shadow" style={{ borderColor: GOLD }} alt="" />
          : <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center font-black text-3xl text-gray-600">{user.firstName?.[0] || '?'}</div>
        }
        <div>
          <p className="font-black text-xl text-black">{user.firstName} {user.lastName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
            {user.isBlocked && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">Blocked</span>}
          </div>
        </div>
      </div>

      {/* Account info */}
      <div>
        <SectionLabel>Account Information</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <DetailRow icon={Mail} label="Email" value={user.email} href={`mailto:${user.email}`} />
          <DetailRow icon={Calendar} label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
          <DetailRow icon={Hash} label="User ID" value={user._id} />
          <DetailRow icon={Clock} label="Clerk ID" value={user.clerkId} />
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <div>
          <SectionLabel>Bio</SectionLabel>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{user.bio}</p>
        </div>
      )}

      {/* Account status */}
      <div>
        <SectionLabel>Account Status</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <p className="text-sm font-semibold text-black">{user.isBlocked ? 'Account Blocked' : 'Account Active'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <AlertTriangle size={14} className={user.warningCount > 0 ? 'text-amber-500' : 'text-gray-300'} />
            <p className="text-sm font-semibold text-black">
              {user.warningCount || 0} Warning{(user.warningCount || 0) !== 1 ? 's' : ''} issued
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function UsersTab({ getToken }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setUsers(await apiFetchAuth('/admin/users', token));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  // Called from summary cards — updates list, does NOT touch modal state
  const cardAction = async (id, type, value) => {
    try {
      const token = await getToken();
      let updated;
      if (type === 'role') {
        updated = await apiFetchAuth(`/admin/users/${id}/role`, token, { method: 'PATCH', body: JSON.stringify({ role: value }) });
      } else {
        updated = await apiFetchAuth(`/admin/users/${id}/${type}`, token, { method: 'PATCH', body: '{}' });
      }
      setUsers(p => p.map(u => u._id === id ? updated : u));
    } catch (e) { alert(e.message); }
  };

  // Called from inside the modal — refreshes modal content with updated data
  const modalAction = async (id, type, value) => {
    try {
      const token = await getToken();
      let updated;
      if (type === 'role') {
        updated = await apiFetchAuth(`/admin/users/${id}/role`, token, { method: 'PATCH', body: JSON.stringify({ role: value }) });
      } else {
        updated = await apiFetchAuth(`/admin/users/${id}/${type}`, token, { method: 'PATCH', body: '{}' });
      }
      setUsers(p => p.map(u => u._id === id ? updated : u));
      setSelected(updated); // keep modal open, show updated state
    } catch (e) { alert(e.message); }
  };

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <UserModal user={selected} onClose={() => setSelected(null)} onAction={modalAction} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-black focus:outline-none focus:border-black w-64"
        />
        <button onClick={load} className="icon-btn"><RefreshCw size={15} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-black" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <AdminCard key={user._id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                  : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-black shrink-0">{user.firstName?.[0] || '?'}</div>
                }
                <div className="min-w-0">
                  <p className="font-black text-black text-sm truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                    {user.isBlocked && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Blocked</span>}
                    {user.warningCount > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">⚠ {user.warningCount} warning{user.warningCount > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <ReviewBtn onClick={() => setSelected(user)} />
                {user.role !== 'admin'
                  ? <button onClick={() => cardAction(user._id, 'role', 'admin')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800"><ShieldCheck size={13} /> Grant Admin</button>
                  : <button onClick={() => cardAction(user._id, 'role', 'normal')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"><ShieldOff size={13} /> Revoke Admin</button>
                }
                <button onClick={() => cardAction(user._id, 'block')} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border ${user.isBlocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                  {user.isBlocked ? <><CheckCircle size={13} /> Unblock</> : <><XCircle size={13} /> Block</>}
                </button>
                <button onClick={() => cardAction(user._id, 'warn')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"><AlertTriangle size={13} /> Warn</button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADS TAB (unchanged — no modal needed for ads)
// ═══════════════════════════════════════════════════════════
function AdsTab({ getToken }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adFile, setAdFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setAds(await apiFetchAuth('/admin/ads', token));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAdFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadAd = async () => {
    if (!adFile) { setError('Please select an image'); return; }
    setUploading(true); setError('');
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append('image', adFile);
      if (adTitle) fd.append('title', adTitle);
      if (adLink) fd.append('link', adLink);
      const newAd = await apiFetchAuthForm('/admin/ads', token, fd);
      setAds(p => [newAd, ...p]);
      setAdFile(null); setPreview(''); setAdTitle(''); setAdLink('');
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const deleteAd = async (id) => {
    if (!confirm('Remove this ad?')) return;
    try {
      const token = await getToken();
      await apiFetchAuth(`/admin/ads/${id}`, token, { method: 'DELETE' });
      setAds(p => p.filter(a => a._id !== id));
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      <AdminCard>
        <h3 className="font-black text-black mb-4">Upload New Ad</h3>
        {error && <div className="error-banner mb-3">{error}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Image *</label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl h-40 cursor-pointer hover:border-black transition-colors overflow-hidden">
              {preview
                ? <img src={preview} className="w-full h-full object-cover" alt="preview" />
                : <><UploadCloud size={28} className="text-gray-300" /><span className="text-xs text-gray-400 font-medium">Click to select image</span></>
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <div className="space-y-3">
            <div className="form-group">
              <label className="form-label">Title (optional)</label>
              <input value={adTitle} onChange={e => setAdTitle(e.target.value)} className="form-input" placeholder="e.g. Summer Sale — 20% Off" />
            </div>
            <div className="form-group">
              <label className="form-label">Link URL (optional)</label>
              <input value={adLink} onChange={e => setAdLink(e.target.value)} className="form-input" placeholder="https://…" />
            </div>
            <button onClick={uploadAd} disabled={uploading || !adFile} className="btn-gold w-full justify-center disabled:opacity-40">
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><UploadCloud size={15} /> Upload Ad</>}
            </button>
          </div>
        </div>
      </AdminCard>

      <div>
        <h3 className="font-black text-black mb-3">Current Ads ({ads.length})</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-black" /></div>
        ) : ads.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No ads yet. Upload one above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ads.map(ad => (
              <AdminCard key={ad._id} className="p-0 overflow-hidden">
                <div className="relative h-36 bg-gray-50">
                  <img src={ad.imageUrl} className="w-full h-full object-cover" alt={ad.title || 'Ad'} />
                  <button onClick={() => deleteAd(ad._id)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><Trash2 size={14} /></button>
                </div>
                <div className="p-3">
                  <p className="font-bold text-black text-sm">{ad.title || '(No title)'}</p>
                  {ad.link && <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 hover:text-black"><ExternalLink size={11} /> {ad.link.slice(0, 40)}…</a>}
                </div>
              </AdminCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SERVICES TAB + MODAL (replaces old inline preview)
// ═══════════════════════════════════════════════════════════
function ServiceModal({ service: svc, onClose, onAction, catColor }) {
  if (!svc) return null;
  const provider = svc.providerId || {};
  const color = catColor(svc.category);
  return (
    <Modal
      isOpen={!!svc}
      onClose={onClose}
      title={svc.serviceName}
      subtitle={`${svc.category} · ${provider.firstName || ''} ${provider.lastName || ''}`}
      footer={
        <>
          {svc.status !== 'approved' && Btn.approve(() => onAction(svc._id, 'approved'))}
          {svc.status !== 'rejected' && Btn.reject(() => onAction(svc._id, 'rejected'))}
          {Btn.delete(() => onAction(svc._id, '__delete__'))}
          {Btn.close(onClose)}
        </>
      }
    >
      {/* Provider */}
      <div>
        <SectionLabel>Service Provider</SectionLabel>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          {provider.profileImageUrl
            ? <img src={provider.profileImageUrl} className="w-11 h-11 rounded-full object-cover border border-gray-100" alt="" />
            : <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white" style={{ background: color }}>{provider.firstName?.[0] || '?'}</div>
          }
          <div>
            <p className="font-bold text-black text-sm">{provider.firstName} {provider.lastName}</p>
            <p className="text-xs text-gray-500">{provider.email}</p>
          </div>
          <div className="ml-auto"><Badge status={svc.status} /></div>
        </div>
      </div>

      {/* Service details */}
      <div>
        <SectionLabel>Service Information</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-4">
          <DetailRow icon={Tag} label="Category" value={svc.category} color={color} />
          <DetailRow icon={MapPin} label="Address" value={svc.address} />
          <DetailRow icon={Phone} label="Contact" value={svc.contactNumber} href={svc.contactNumber ? `tel:${svc.contactNumber}` : null} />
          <DetailRow icon={Calendar} label="Submitted" value={svc.createdAt ? new Date(svc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
        </div>
      </div>

      {/* Description */}
      {svc.shortDescription && (
        <div>
          <SectionLabel>Description</SectionLabel>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{svc.shortDescription}</p>
        </div>
      )}

      {/* Certificate / proof */}
      {svc.certificateUrl && (
        <div>
          <SectionLabel>Certificate / Proof</SectionLabel>
          <a href={svc.certificateUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 underline">
            <ExternalLink size={14} /> View Certificate
          </a>
        </div>
      )}
    </Modal>
  );
}

function ServicesTab({ getToken }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);

  const catColor = (cat) => SERVICE_CATEGORY_COLOR[cat] || '#C5A059';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setServices(await apiFetchAuth(`/admin/services?status=${filter}`, token));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken, filter]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    try {
      const token = await getToken();
      if (action === '__delete__') {
        if (!confirm('Permanently delete this service listing?')) return;
        await apiFetchAuth(`/admin/services/${id}`, token, { method: 'DELETE' });
        setServices(p => p.filter(s => s._id !== id));
        setSelected(null);
      } else {
        await apiFetchAuth(`/admin/services/${id}/status`, token, {
          method: 'PATCH', body: JSON.stringify({ status: action })
        });
        setServices(p => p.filter(s => s._id !== id));
        setSelected(null);
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <ServiceModal service={selected} onClose={() => setSelected(null)} onAction={handleAction} catColor={catColor} />

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors capitalize ${filter === f ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-black'
                }`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="icon-btn"><RefreshCw size={15} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-black" /></div>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No {filter} service listings</p>
      ) : (
        <div className="space-y-3">
          {services.map(svc => {
            const provider = svc.providerId || {};
            const color = catColor(svc.category);
            return (
              <AdminCard key={svc._id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {provider.profileImageUrl
                    ? <img src={provider.profileImageUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-base shrink-0" style={{ background: color }}>{provider.firstName?.[0] || '?'}</div>
                  }
                  <div className="min-w-0">
                    <p className="font-black text-black text-sm truncate">{svc.serviceName}</p>
                    <p className="text-xs text-gray-500">{provider.firstName} {provider.lastName} &middot; {provider.email}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ color, borderColor: color, background: `${color}15` }}>{svc.category}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={10} /> {svc.address}</span>
                    </div>
                  </div>
                </div>
                <Badge status={svc.status} />
                <div className="flex gap-2 flex-wrap items-center">
                  <ReviewBtn onClick={() => setSelected(svc)} />
                  {svc.status !== 'approved' && <button onClick={() => handleAction(svc._id, 'approved')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"><CheckCircle size={13} /> Approve</button>}
                  {svc.status !== 'rejected' && <button onClick={() => handleAction(svc._id, 'rejected')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><XCircle size={13} /> Reject</button>}
                  <button onClick={() => handleAction(svc._id, '__delete__')} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"><Trash2 size={13} /> Delete</button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('stores');
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!isSignedIn) { setIsAdmin(false); return; }
    (async () => {
      try {
        const token = await getToken();
        const user = await apiFetchAuth('/users/me', token);
        setIsAdmin(user.role === 'admin');
      } catch { setIsAdmin(false); }
    })();
  }, [isSignedIn, getToken]);

  if (isAdmin === null) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-black" /></div>;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <ShieldCheck size={48} className="text-gray-300" />
      <p className="text-black font-bold text-lg">Admin Access Required</p>
      <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="mb-6">
        <h1 className="page-title">Admin <span className="text-black">Dashboard</span></h1>
        <p className="page-subtitle">Manage stores, posts, users, and advertisements</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap flex-1 justify-center
              ${activeTab === id ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'stores' && <StoresTab getToken={getToken} />}
      {activeTab === 'posts' && <PostsTab getToken={getToken} />}
      {activeTab === 'users' && <UsersTab getToken={getToken} />}
      {activeTab === 'ads' && <AdsTab getToken={getToken} />}
      {activeTab === 'services' && <ServicesTab getToken={getToken} />}
    </div>
  );
}
