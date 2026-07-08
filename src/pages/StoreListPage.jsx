import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, MessageSquare, Gem, Wrench, ShoppingBag,
  Scissors, ArrowLeft, Store as StoreIcon, Search, X, ExternalLink, Info
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const GOLD = '#C5A059';

const CATEGORIES = [
  { id: null,            label: 'All Stores', icon: null        },
  { id: 'Gemstones',     label: 'Gemstones',  icon: Gem         },
  { id: 'Gem Tools',     label: 'Gem Tools',  icon: Wrench      },
  { id: 'Jewelry Shops', label: 'Jewelry',    icon: ShoppingBag },
  { id: 'Gem Services',  label: 'Services',   icon: Scissors    },
];

const CATEGORY_ICONS = {
  Gemstones:     Gem,
  'Gem Tools':   Wrench,
  'Jewelry Shops': ShoppingBag,
  'Gem Services':  Scissors,
};

// ─── Store Details Modal ──────────────────────────────────────────────────────
function StoreModal({ store, onClose }) {
  const CatIcon = store ? CATEGORY_ICONS[store.category] : null;
  const owner   = store?.owner || {};
  const phone   = store?.contactOptions?.phone;

  // Escape key close
  useEffect(() => {
    if (!store) return;
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [store, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = store ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [store]);

  if (!store) return null;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        style={{ background: '#FAFAFA' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border bg-white shadow-sm transition-all"
          style={{ borderColor: '#e5e7eb' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <X size={15} />
        </button>

        {/* Cover Image */}
        {store.coverImageUrl ? (
          <div className="w-full overflow-hidden rounded-t-3xl sm:rounded-t-3xl" style={{ aspectRatio: '16/6' }}>
            <img src={store.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full rounded-t-3xl sm:rounded-t-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center" style={{ aspectRatio: '16/6' }}>
            <StoreIcon size={36} className="text-gray-300" />
          </div>
        )}

        {/* Logo + Name header */}
        <div className="px-5 pt-2 pb-4 flex items-end gap-4 -mt-7 relative">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 shadow-md flex-shrink-0"
              style={{ borderColor: '#fff' }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center font-black text-2xl border-2 shadow-md flex-shrink-0"
              style={{ borderColor: '#fff' }}>
              {store.name?.[0] || 'S'}
            </div>
          )}
          <div className="pb-1">
            <h2 className="font-black text-black text-lg leading-tight">{store.name}</h2>
            {CatIcon && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1"
                style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}12` }}>
                <CatIcon size={10} /> {store.category}
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 mx-5" />

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          {store.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{store.description}</p>
          )}
          {store.location && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">{store.location}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`tel:${phone}`} className="font-semibold text-black hover:underline">{phone}</a>
            </div>
          )}
          {/* Owner */}
          {(owner.firstName || owner.profileImageUrl) && (
            <div className="flex items-center gap-2 pt-1">
              {owner.profileImageUrl
                ? <img src={owner.profileImageUrl} className="w-7 h-7 rounded-full object-cover border border-gray-200" alt="" />
                : <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-black">{owner.firstName?.[0] || '?'}</div>}
              <span className="text-xs font-semibold text-gray-600">{owner.firstName} {owner.lastName}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 pb-6 pt-2 flex gap-2 flex-wrap">
          {phone && (
            <a href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl border transition-all"
              style={{ borderColor: GOLD, color: GOLD, background: `${GOLD}0F` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}0F`; }}
            >
              <Phone size={14} /> Call
            </a>
          )}
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function StoreCard({ store, onReview }) {
  const initials = store.name?.charAt(0)?.toUpperCase() || 'S';
  const CatIcon  = CATEGORY_ICONS[store.category];

  return (
    <article className="product-card group">
      {/* Top cover area — minimal gradient if no cover */}
      <div className="relative bg-gray-100 overflow-hidden" style={{ aspectRatio: '16/7' }}>
        {store.coverImageUrl ? (
          <img src={store.coverImageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : store.bannerUrl ? (
          <img src={store.bannerUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <StoreIcon size={28} className="text-gray-300" />
          </div>
        )}

        {/* Category chip — top right */}
        {CatIcon && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ background: 'rgba(250,250,250,0.95)', color: GOLD, borderColor: GOLD }}>
            <CatIcon size={9} /> {store.category}
          </div>
        )}

        {/* Logo — overlapping bottom-left */}
        <div className="absolute -bottom-5 left-3">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name}
              className="w-11 h-11 rounded-xl object-cover border-2 shadow-md"
              style={{ borderColor: '#fff' }} />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center font-black text-base border-2 shadow-md"
              style={{ borderColor: '#fff' }}>
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 pt-6">
        <h3 className="font-black text-black text-sm sm:text-base leading-tight truncate">{store.name}</h3>
        {store.location && (
          <p className="flex items-center gap-1 text-xs text-gray-500 font-medium mt-0.5">
            <MapPin size={10} className="flex-shrink-0" /> {store.location}
          </p>
        )}

        {/* More Info button */}
        <button
          onClick={() => onReview(store)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border transition-all"
          style={{
            color: GOLD,
            borderColor: GOLD,
            background: `${GOLD}0F`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}0F`; }}
        >
          <Info size={12} /> More Info
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StoreListPage() {
  const [stores, setStores]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState(null);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    apiFetch(`/stores?${params}`)
      .then(data => setStores(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = stores.filter(s =>
    `${s.name} ${s.location || ''} ${s.owner?.firstName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      <StoreModal store={selected} onClose={() => setSelected(null)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/marketplace" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 font-medium">
              <ArrowLeft size={14} /> Marketplace
            </Link>
          </div>
          <h1 className="page-title">Store <span className="text-black">Directory</span></h1>
          <p className="page-subtitle">{filtered.length} approved stores</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stores…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={String(id)}
            onClick={() => setCategory(id)}
            className={`category-tab ${category === id ? 'category-tab--active' : ''}`}
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-feed">
          <StoreIcon size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-black font-bold text-lg">No stores found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(store => (
            <StoreCard key={store._id} store={store} onReview={setSelected} />
          ))}
        </div>
      )}
    </div>
  );
}
