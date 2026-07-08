import React, { useState } from 'react';
import { ShoppingCart, MessageSquare, Package, Info, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';
import ProductDetailsModal from './ProductDetailsModal';
import { useToast } from './Toast';

const GOLD = '#C5A059';

// Stock status data — kept for modal/details but no longer shown as a badge on the card image
const STOCK_OUT = 'out_of_stock';

export default function ProductCard({ product, onCartAdd }) {
  const { getToken, isSignedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const store = product.store || {};
  const seller = product.seller || {};
  const isOutOfStock = product.stockStatus === STOCK_OUT;

  // ── category label shown in the image badge ──────────────────────────────
  const categoryLabel = product.subCategory || product.category || '';

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast({ message: 'Please sign in to add items to your cart.', type: 'error' });
      return;
    }
    if (isOutOfStock) return;
    if (adding) return; // prevent double-click

    setAdding(true);
    try {
      const token = await getToken();
      await apiFetchAuth('/cart/add', token, {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });
      setAdded(true);
      onCartAdd?.();
      toast({ message: `"${product.name}" added to cart!`, type: 'success' });
      setTimeout(() => setAdded(false), 2500);
    } catch (e) {
      toast({ message: e.message || 'Failed to add to cart.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <article className="product-card group">
        {/* ── Image ── */}
        <div className="product-img-wrap">
          {product.images?.length > 0 ? (
            <>
              <img
                src={product.images[imgIdx]}
                alt={product.name}
                className="product-img"
              />
              {product.images.length > 1 && (
                <div className="img-dots">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`img-dot ${i === imgIdx ? 'img-dot--active' : ''}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="product-img-placeholder">
              <Package size={40} className="text-gray-300" />
            </div>
          )}

          {/* ── Category / Sub-category badge — TOP RIGHT of image ── */}
          {categoryLabel && (
            <span className="img-category-badge">
              {categoryLabel}
            </span>
          )}

          {/* Out-of-stock dim overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 flex items-end justify-center pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="product-body" style={{ padding: '0.7rem 0.75rem 0.85rem', gap: 0 }}>
          {/* Product Name */}
          <h3 className="product-name leading-snug mb-0.5 line-clamp-2">{product.name}</h3>

          {/* Store name */}
          <p className="product-store truncate">{store.name || 'Unknown Store'}</p>

          {/* Price */}
          <p className="product-price mt-1">
            <span className="text-[10px] font-semibold text-gray-400 mr-0.5">Rs</span>
            {parseFloat(product.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
          </p>

          {/* ── Action Bar ── */}
          <div className="flex justify-between items-center mt-2.5 gap-1.5">

            {/* Cart button — icon only on mobile, icon+text on sm+ */}
            <button
              onClick={handleAddToCart}
              disabled={adding || isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className="cart-action-btn"
              style={added
                ? { background: '#059669', color: '#fff', borderColor: '#059669' }
                : isOutOfStock
                  ? { opacity: 0.4, cursor: 'not-allowed' }
                  : {}}
            >
              {adding
                ? <Loader2 size={14} className="animate-spin" />
                : added
                  ? <Check size={14} />
                  : <ShoppingCart size={14} />
              }
              <span style={{ fontSize: '11px', fontWeight: 700 }}>
                {added ? 'Added' : 'Add'}
              </span>
            </button>

            {/* Info / More Details */}
            <button
              onClick={() => setModalOpen(true)}
              title="More Details"
              className="action-square-btn"
              style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}10` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}22`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}10`; }}
            >
              <Info size={14} />
            </button>

            {/* Chat with Seller — passes full product context via router state */}
            <button
              onClick={() => navigate('/chat', { state: { currentProduct: product, sellerId: seller._id } })}
              title="Chat with Seller"
              className="action-square-btn"
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
            >
              <MessageSquare size={14} />
            </button>

          </div>
        </div>
      </article>

      {/* Details Modal */}
      {modalOpen && (
        <ProductDetailsModal
          product={product}
          onClose={() => setModalOpen(false)}
          onCartAdd={onCartAdd}
        />
      )}
    </>
  );
}
