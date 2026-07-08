import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, Flame, FlaskConical, Gem,
  MapPin, Phone, MessageSquare, Search,
  Loader2, RefreshCw, SlidersHorizontal, X, Info
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '@clerk/clerk-react';
import { useAuthModal } from '../context/AuthModalContext';

const GOLD = '#C5A059';

const CATEGORIES = ['All', 'Gem Cutting', 'Gem Heating', 'Gem Testing/Lab', 'Jewelry Design'];

const CATEGORY_META = {
  'Gem Cutting':     { icon: Scissors,     color: '#8B5CF6', bg: '#8B5CF615' },
  'Gem Heating':     { icon: Flame,        color: '#EF4444', bg: '#EF444415' },
  'Gem Testing/Lab': { icon: FlaskConical, color: '#3B82F6', bg: '#3B82F615' },
  'Jewelry Design':  { icon: Gem,          color: GOLD,      bg: `${GOLD}15` },
};

// ─── Service Details Modal ─────────────────────────────────────────────────────
function ServiceModal({ service, onClose }) {
  const navigate  = useNavigate();
  const provider  = service?.providerId || {};
  const meta      = service ? (CATEGORY_META[service.category] || { icon: Gem, color: GOLD, bg: `${GOLD}15` }) : {};
  const CatIcon   = meta.icon;

  useEffect(() => {
    if (!service) return;
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [service, onClose]);

  useEffect(() => {
    document.body.style.overflow = service ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [service]);

  if (!service) return null;

  const initials = `${provider.firstName?.[0] || ''}${provider.lastName?.[0] || ''}`.toUpperCase() || '?';

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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border bg-white shadow-sm"
          style={{ borderColor: '#e5e7eb' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <X size={15} />
        </button>

        {/* Service Image (full-size top) */}
        <div className="w-full rounded-t-3xl sm:rounded-t-3xl overflow-hidden" style={{ aspectRatio: '16/8' }}>
          {service.serviceImageUrl ? (
            <img src={service.serviceImageUrl} alt={service.serviceName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: meta.bg }}>
              {CatIcon && <CatIcon size={56} style={{ color: meta.color, opacity: 0.5 }} />}
            </div>
          )}
        </div>

        {/* Category accent stripe */}
        <div className="h-1 w-full" style={{ background: meta.color }} />

        {/* Content */}
        <div className="px-5 py-5 space-y-4">
          {/* Provider row */}
          <div className="flex items-center gap-3">
            {provider.profileImageUrl
              ? <img src={provider.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-gray-500">{initials}</div>}
            <div>
              <h2 className="font-black text-black text-base leading-tight">{service.serviceName}</h2>
              <p className="text-xs text-gray-500 font-medium">{provider.firstName} {provider.lastName}</p>
            </div>
            {/* Category chip */}
            <div className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{ color: meta.color, borderColor: `${meta.color}50`, background: meta.bg }}>
              {CatIcon && <CatIcon size={10} />} {service.category}
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Description */}
          {service.shortDescription && (
            <p className="text-sm text-gray-700 leading-relaxed">{service.shortDescription}</p>
          )}

          {/* Address */}
          {service.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 font-medium">{service.address}</span>
            </div>
          )}

          {/* Phone */}
          {service.contactNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <a href={`tel:${service.contactNumber}`} className="font-semibold text-black hover:underline">
                {service.contactNumber}
              </a>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-6 flex gap-2">
          <button
            onClick={() => { navigate(`/chat?userId=${provider._id}`); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl border transition-all"
            style={{ borderColor: GOLD, color: GOLD, background: `${GOLD}0F` }}
            onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}0F`; }}
          >
            <MessageSquare size={14} /> Chat
          </button>
          {service.contactNumber && (
            <a
              href={`tel:${service.contactNumber}`}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl border transition-all"
              style={{ borderColor: '#000', color: '#000', background: '#f9fafb' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
            >
              <Phone size={14} /> Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Simplified Service Card ──────────────────────────────────────────────────
function ServiceCard({ service, onReview }) {
  const provider = service.providerId || {};
  const meta     = CATEGORY_META[service.category] || { icon: Gem, color: GOLD, bg: `${GOLD}15` };
  const CatIcon  = meta.icon;

  return (
    <article className="product-card group">
      {/* Thumbnail image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: meta.bg }}>
        {service.serviceImageUrl ? (
          <img src={service.serviceImageUrl} alt={service.serviceName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon size={40} style={{ color: meta.color, opacity: 0.4 }} />
          </div>
        )}
        {/* Category chip */}
        <div
          className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
          style={{ background: 'rgba(250,250,250,0.95)', color: meta.color, borderColor: `${meta.color}60` }}
        >
          <CatIcon size={9} /> {service.category}
        </div>
        {/* Color accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: meta.color }} />
      </div>

      {/* Minimal body */}
      <div className="p-3 sm:p-4">
        <h3 className="font-black text-black text-sm sm:text-base leading-tight truncate">{service.serviceName}</h3>
        <p className="text-xs text-gray-500 font-semibold mt-0.5 truncate">
          {provider.firstName} {provider.lastName}
        </p>
        {service.address && (
          <p className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-0.5 truncate">
            <MapPin size={9} className="flex-shrink-0" /> {service.address}
          </p>
        )}

        {/* More Info button */}
        <button
          onClick={() => onReview(service)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl border transition-all"
          style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}0F` }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}20`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}0F`; }}
        >
          <Info size={11} /> More Info
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ServicesPage() {
  const navigate      = useNavigate();
  const { isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [services,  setServices]  = useState([]);
  const [category,  setCategory]  = useState('All');
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [selected,  setSelected]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
      setServices(await apiFetch(`/services${params}`));
    } catch (err) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const filtered = services.filter(s =>
    s.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
    s.address?.toLowerCase().includes(search.toLowerCase()) ||
    `${s.providerId?.firstName} ${s.providerId?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="svc-dir-page">
      <ServiceModal service={selected} onClose={() => setSelected(null)} />

      {/* Page Header */}
      <div className="svc-dir-header">
        <div>
          <h1 className="page-title">
            Service <span style={{ color: GOLD }}>Directory</span>
          </h1>
          <p className="page-subtitle">Find trusted gem &amp; jewelry service providers across Sri Lanka</p>
        </div>
        <div className="svc-dir-header-actions">
          <button
            className="btn-gold"
            onClick={() => {
              if (!isSignedIn) {
                openAuthModal();
              } else {
                navigate('/services/register');
              }
            }}
            id="list-service-btn"
          >
            <Gem size={16} /> List Your Service
          </button>
          <button className="icon-btn" onClick={load} title="Refresh" id="services-refresh-btn">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="svc-filter-bar">
        <div className="svc-search-wrap">
          <Search size={15} className="svc-search-icon" />
          <input
            id="services-search"
            type="text"
            className="svc-search-input"
            placeholder="Search services, providers, or locations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="svc-cat-pills">
          <SlidersHorizontal size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              id={`filter-${cat.replace(/[^a-z]/gi, '-')}`}
              onClick={() => setCategory(cat)}
              className={`svc-cat-pill ${category === cat ? 'svc-cat-pill--active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="svc-loading">
          <Loader2 size={32} className="animate-spin" style={{ color: GOLD }} />
          <p>Loading services…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="svc-empty">
          <Gem size={48} style={{ color: '#D1D5DB', marginBottom: '0.75rem' }} />
          <p className="svc-empty-title">No services found</p>
          <p className="svc-empty-sub">
            {search ? 'Try a different search term or clear the filter.' : 'Be the first to list a service!'}
          </p>
          <button
            className="btn-gold"
            onClick={() => {
              if (!isSignedIn) {
                openAuthModal();
              } else {
                navigate('/services/register');
              }
            }}
            style={{ marginTop: '1rem' }}
          >
            <Gem size={15} /> List Your Service
          </button>
        </div>
      ) : (
        <>
          <p className="svc-results-count">{filtered.length} service{filtered.length !== 1 ? 's' : ''} found</p>
          {/* Use the same 2-col mobile grid as products */}
          <div className="products-grid">
            {filtered.map(service => (
              <ServiceCard key={service._id} service={service} onReview={setSelected} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
