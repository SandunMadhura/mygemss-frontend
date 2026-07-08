import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { apiFetchAuth } from '../lib/api';

export default function CartPage() {
  const { getToken, isSignedIn } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const fetchCart = useCallback(async () => {
    if (!isSignedIn) { setLoading(false); return; }
    try {
      const token = await getToken();
      const data = await apiFetchAuth('/cart', token);
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (productId, quantity) => {
    setUpdatingId(productId);
    try {
      const token = await getToken();
      const data = await apiFetchAuth('/cart/update', token, {
        method: 'PATCH',
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId) => {
    setUpdatingId(productId);
    try {
      const token = await getToken();
      const data = await apiFetchAuth(`/cart/remove/${productId}`, token, { method: 'DELETE' });
      setCart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const clearCart = async () => {
    if (!confirm('Clear all items from your cart?')) return;
    try {
      const token = await getToken();
      await apiFetchAuth('/cart/clear', token, { method: 'DELETE' });
      setCart({ items: [] });
    } catch (e) {
      setError(e.message);
    }
  };

  // Totals
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  if (!isSignedIn) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <ShoppingBag size={48} className="text-emerald-700" />
      <p className="text-amber-100 font-semibold text-lg">Sign in to view your cart</p>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={36} className="animate-spin text-amber-400" />
    </div>
  );

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Your <span className="text-amber-400">Cart</span></h1>
          <p className="page-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="text-xs text-red-400 hover:text-red-300 border border-red-900/40 rounded-xl px-3 py-1.5 transition-colors">
            Clear All
          </button>
        )}
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-feed">
          <ShoppingBag size={48} className="mx-auto mb-3 text-emerald-700" />
          <p className="text-amber-100 font-semibold">Your cart is empty</p>
          <p className="text-sm text-gray-500 mt-1">Browse the marketplace to add gemstones and more</p>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Item List */}
          <div className="space-y-4">
            {items.map(({ product, quantity }) => {
              if (!product) return null;
              const isUpdating = updatingId === product._id;
              return (
                <div key={product._id} className="cart-item">
                  {/* Image */}
                  <div className="cart-item-img">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      : <ShoppingBag size={24} className="text-emerald-700" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-amber-100 truncate">{product.name}</h3>
                    <p className="text-xs text-emerald-400 mt-0.5">{product.store?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                    <p className="text-amber-400 font-bold mt-1">
                      Rs {(product.price * quantity).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(product._id)}
                      disabled={isUpdating}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="qty-control">
                      <button
                        onClick={() => updateQty(product._id, quantity - 1)}
                        disabled={isUpdating || quantity <= 1}
                        className="qty-btn"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold text-amber-100 w-6 text-center">
                        {isUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : quantity}
                      </span>
                      <button
                        onClick={() => updateQty(product._id, quantity + 1)}
                        disabled={isUpdating}
                        className="qty-btn"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {items.map(({ product, quantity }) => product && (
                <div key={product._id} className="flex justify-between text-sm">
                  <span className="text-gray-400 truncate max-w-[140px]">{product.name} × {quantity}</span>
                  <span className="text-amber-100 shrink-0">Rs {(product.price * quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-emerald-800 pt-3 flex justify-between font-bold">
                <span className="text-amber-100">Subtotal</span>
                <span className="text-amber-400 text-lg">Rs {subtotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-emerald-950/60 rounded-xl p-3 mb-5 text-xs text-gray-400">
              💬 Contact sellers directly via Chat or Call to arrange purchase and delivery.
            </div>

            <button className="btn-gold w-full justify-center py-3 text-sm">
              Contact Sellers <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
