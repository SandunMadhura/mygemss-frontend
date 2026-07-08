import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X, ChevronLeft, ChevronRight, ShoppingCart, MessageSquare,
  Phone, Package, CheckCircle, AlertTriangle, XCircle,
  Store, User, Tag, Layers
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';

const GOLD = '#C5A059';

const STOCK_CONFIG = {
  in_stock: { icon: CheckCircle, label: 'In Stock', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  low_stock: { icon: AlertTriangle, label: 'Low Stock', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  out_of_stock: { icon: XCircle, label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

export default function ProductDetailsModal({ product, onClose, onCartAdd }) {
  const { getToken, isSignedIn } = useAuth();
  const [mainIdx, setMainIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Reset image index when a new product is opened
  useEffect(() => { setMainIdx(0); }, [product?._id]);

  // Close on Escape key
  useEffect(() => {
    if (!product) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (product) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  const handleAddToCart = async () => {
    if (!isSignedIn) { alert('Please sign in to add items to your cart.'); return; }
    if (product.stockStatus === 'out_of_stock') return;
    setAdding(true);
    try {
      const token = await getToken();
      await apiFetchAuth('/cart/add', token, {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      setAdded(true);
      onCartAdd?.();
      setTimeout(() => setAdded(false), 2500);
    } catch (e) { alert(e.message); }
    finally { setAdding(false); }
  };

  const prevImg = useCallback(() =>
    setMainIdx(i => (i - 1 + (product?.images?.length || 1)) % (product?.images?.length || 1)), [product]);
  const nextImg = useCallback(() =>
    setMainIdx(i => (i + 1) % (product?.images?.length || 1)), [product]);

  if (!product) return null;

  const images = product.images || [];
  const store = product.store || {};
  const seller = product.seller || {};
  const phone = store.contactOptions?.phone;
  const stock = STOCK_CONFIG[product.stockStatus] || STOCK_CONFIG.in_stock;
  const StockIcon = stock.icon;

  return (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
      onClick={onClose}
    >
      {/* ── Modal Box ── */}
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: '#FAFAFA' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all"
          style={{ background: '#fff', borderColor: '#e5e7eb', color: '#374151' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* ── Left: Image Gallery ── */}
          <div className="md:w-[46%] md:min-h-full flex-shrink-0">
            {/* Main Image */}
            <div className="relative w-full bg-gray-100 rounded-tl-3xl rounded-tr-3xl md:rounded-tr-none md:rounded-bl-3xl overflow-hidden"
              style={{ aspectRatio: '1 / 1' }}>
              {images.length > 0 ? (
                <img
                  src={images[mainIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={56} className="text-gray-300" />
                </div>
              )}

              {/* Stock overlay badge */}
              <div
                className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                style={{ background: stock.bg, color: stock.color, borderColor: stock.border }}
              >
                <StockIcon size={11} /> {stock.label}
              </div>

              {/* Prev / Next arrows — only if >1 image */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow transition-colors hover:border-amber-400"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center shadow transition-colors hover:border-amber-400"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 text-[10px] font-bold bg-black/60 text-white rounded-full px-2 py-0.5">
                    {mainIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 flex-wrap">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setMainIdx(i)}
                    className="w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0"
                    style={{
                      borderColor: i === mainIdx ? GOLD : '#e5e7eb',
                      boxShadow: i === mainIdx ? `0 0 0 2px ${GOLD}40` : 'none',
                    }}
                  >
                    <img src={url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Details ── */}
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
            {/* Name + Price */}
            <div>
              {/* Category + SubCategory chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}12` }}
                >
                  {product.category}
                </span>
                {product.subCategory && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                    {product.subCategory}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-black leading-tight">{product.name}</h2>
              <p className="text-2xl font-black mt-1" style={{ color: '#000' }}>
                <span className="text-base font-semibold text-gray-400 mr-1">Rs</span>
                {parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                style={{ background: stock.bg, color: stock.color, borderColor: stock.border }}
              >
                <StockIcon size={12} /> {stock.label}
                {product.stock > 0 && <span className="opacity-70">({product.stock} left)</span>}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Store & Seller */}
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">Seller Info</p>
              {store.name && (
                <div className="flex items-center gap-2 text-sm">
                  <Store size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-black">{store.name}</span>
                </div>
              )}
              {(seller.firstName || seller.lastName) && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{seller.firstName} {seller.lastName}</span>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap pt-2">
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stockStatus === 'out_of_stock'}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-40"
                style={{ background: '#000', color: GOLD }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#000'; }}
              >
                <ShoppingCart size={15} />
                {added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Cart'}
              </button>

              <Link
                to={`/chat?sellerId=${seller._id}`}
                onClick={onClose}
                className="flex items-center justify-center w-11 h-11 rounded-xl border transition-all"
                style={{ borderColor: '#e5e7eb', color: '#000' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#000'; }}
                title="Chat with seller"
              >
                <MessageSquare size={17} />
              </Link>

              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center w-11 h-11 rounded-xl border transition-all"
                  style={{ borderColor: '#e5e7eb', color: '#000' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#000'; }}
                  title={`Call ${phone}`}
                >
                  <Phone size={17} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
