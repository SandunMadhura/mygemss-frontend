import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Search, Gem, Wrench, ShoppingBag, SquareChartGantt, Loader2, PackageOpen, PlusCircle, LayoutList, ChevronRight } from 'lucide-react';
import { apiFetch, apiFetchAuth } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useAuthModal } from '../context/AuthModalContext';

// ─── Filter data ───────────────────────────────────────────────────────────────
const GOLD = '#C5A059';

const CATEGORIES = [
  { id: null, label: 'All', icon: null },
  { id: 'Gemstones', label: 'Gemstones', icon: Gem },
  { id: 'Gem Tools', label: 'Gem Tools', icon: Wrench },
  { id: 'Jewelry Shops', label: 'Jewelry', icon: ShoppingBag },
  { id: 'Gem Services', label: 'Services', icon: SquareChartGantt },
];

const SUB_CATEGORIES = {
  Gemstones: ['Blue Sapphire', 'Yellow Sapphire', 'Ruby', 'Garnet', 'Padparadscha', 'Spinel', 'Tourmaline', 'Other'],
  'Jewelry Shops': ['Ring', 'Earring', 'Bracelet', 'Necklace', 'Pendant', 'Custom'],
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cartBump, setCartBump] = useState(0);

  const { isSignedIn, getToken } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [myStore, setMyStore] = useState(null);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadMyStore = async () => {
      try {
        const token = await getToken();
        const data = await apiFetchAuth('/stores/my', token);
        if (data.length > 0) setMyStore(data[0]);
      } catch (e) { console.error(e); }
    };
    loadMyStore();
  }, [isSignedIn, getToken]);

  const fetchProducts = async (cat, subCat, query, pg) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: pg });
      if (cat) params.set('category', cat);
      if (subCat) params.set('subCategory', subCat);
      if (query) params.set('q', query);
      const data = await apiFetch(`/products?${params}`);
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(category, subCategory, q, page); }, [category, subCategory, q, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQ(searchInput);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSubCategory(null); // reset sub-filter whenever primary changes
    setPage(1);
  };

  const handleSubCategoryChange = (sub) => {
    // Toggle: clicking the active sub-filter deselects it
    setSubCategory(prev => prev === sub ? null : sub);
    setPage(1);
  };

  const subOptions = SUB_CATEGORIES[category] || null;

  return (
    <div className="marketplace-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Ceylon <span className="text-black">Marketplace</span></h1>
          <p className="page-subtitle">{total} products from verified sellers</p>
        </div>

        {/* Add Store / My Store Button */}
        <div>
          {myStore ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-black px-4 py-2 rounded-xl transition-colors"
            >
              {myStore.logoUrl ? (
                <img src={myStore.logoUrl} alt="logo" className="w-8 h-8 rounded-full object-cover border border-emerald-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-black text-xs border border-gray-200">
                  {myStore.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs text-black leading-none font-medium">Your Store</p>
                <p className="text-sm font-bold text-black leading-tight">{myStore.name}</p>
              </div>
            </Link>
          ) : (
            <Link
              to={isSignedIn ? "/dashboard" : "#"}
              onClick={(e) => {
                if (!isSignedIn) {
                  e.preventDefault();
                  openAuthModal();
                }
              }}
              className="btn-gold flex items-center gap-2 px-4 py-2 text-sm shadow-lg shadow-amber-900/20"
            >
              <PlusCircle size={16} /> Add Your Store
            </Link>
          )}
        </div>

        {/* View All Stores */}
        <Link
          to="/stores"
          className="flex items-center gap-2 border border-gray-200 hover:border-black px-4 py-2 rounded-xl text-sm font-semibold text-black transition-colors bg-white"
        >
          <LayoutList size={15} /> View All Stores
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-6 max-w-lg">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search gemstones, tools, jewellery…"
          className="w-full pl-11 pr-28 py-3 rounded-2xl bg-white border border-gray-200 text-black placeholder-gray-500 focus:outline-none focus:border-black transition-colors text-sm font-medium"
        />
        <button type="submit" className="btn-gold absolute right-2 top-1/2 -translate-y-1/2 py-1.5 px-4 text-xs">
          Search
        </button>
      </form>

      {/* ── Primary Category Filters ── */}
      <div className="flex gap-2 flex-wrap mb-3">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={String(id)}
            onClick={() => handleCategoryChange(id)}
            className="category-tab transition-all"
            style={
              category === id
                ? { background: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' }
                : {}
            }
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* ── Secondary Sub-Category Filter Row ── */}
      {subOptions && (
        <div
          className="flex flex-wrap gap-2 mb-6 px-4 py-3 rounded-2xl border"
          style={{ background: '#FAFAFA', borderColor: '#e5e7eb' }}
        >
          {/* Breadcrumb hint */}
          <div className="w-full flex items-center gap-1 mb-1.5">
            <ChevronRight size={12} style={{ color: GOLD }} />
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: GOLD }}
            >
              {category === 'Gemstones' ? 'Gemstone Type' : 'Jewelry Type'}
            </span>
          </div>

          {/* "All" pill */}
          <button
            onClick={() => handleSubCategoryChange(null)}
            className="px-3 py-1 rounded-full text-xs font-bold border transition-all"
            style={
              !subCategory
                ? { background: GOLD, color: '#fff', borderColor: GOLD, boxShadow: `0 2px 8px ${GOLD}40` }
                : { background: '#fff', color: '#555', borderColor: '#d1d5db' }
            }
          >
            All {category === 'Gemstones' ? 'Gemstones' : 'Jewelry'}
          </button>

          {subOptions.map(sub => {
            const isActive = subCategory === sub;
            return (
              <button
                key={sub}
                onClick={() => handleSubCategoryChange(sub)}
                className="px-3 py-1 rounded-full text-xs font-bold border transition-all"
                style={
                  isActive
                    ? { background: GOLD, color: '#fff', borderColor: GOLD, boxShadow: `0 2px 8px ${GOLD}40` }
                    : { background: '#fff', color: '#374151', borderColor: '#d1d5db' }
                }
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = GOLD; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#d1d5db'; }}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}

      {/* Active filter summary */}
      {(category || subCategory) && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Filtering by:</span>
          {category && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full border"
              style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}12` }}
            >
              {category}
            </span>
          )}
          {subCategory && (
            <>
              <ChevronRight size={12} className="text-gray-300" />
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full border"
                style={{ color: GOLD, borderColor: GOLD, background: `${GOLD}12` }}
              >
                {subCategory}
              </span>
            </>
          )}
          <button
            onClick={() => { handleCategoryChange(null); setQ(''); setSearchInput(''); }}
            className="text-xs text-gray-400 hover:text-black underline ml-1 font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-banner mb-6">{error}</div>}

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-amber-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="empty-feed">
          <PackageOpen size={48} className="mx-auto mb-3 text-gray-700" />
          <p className="text-black font-bold text-lg">No products found</p>
          <p className="text-sm text-gray-900 font-medium mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <ProductCard
              key={p._id}
              product={p}
              onCartAdd={() => setCartBump(b => b + 1)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map(pg => (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold border transition-colors
                ${pg === page
                  ? 'bg-amber-400 text-emerald-950 border-amber-400'
                  : 'border-emerald-700 text-emerald-300 hover:border-amber-400 hover:text-amber-400'}`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
