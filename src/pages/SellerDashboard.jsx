import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  PlusCircle, Package, Loader2, ImagePlus, X,
  Edit2, Trash2, CheckCircle, AlertTriangle, XCircle,
  Store as StoreIcon, UploadCloud, MapPin, Phone, Info, Save
} from 'lucide-react';
import { apiFetchAuth, apiFetchAuthForm } from '../lib/api';
import { useAuthModal } from '../context/AuthModalContext';

const CATEGORIES = ['Gemstones', 'Gem Tools', 'Jewelry Shops', 'Gem Services'];
const STOCK_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', icon: CheckCircle, color: 'text-emerald-600' },
  { value: 'low_stock', label: 'Low Stock', icon: AlertTriangle, color: 'text-amber-500' },
  { value: 'out_of_stock', label: 'Out of Stock', icon: XCircle, color: 'text-red-500' },
];
const SUB_CATEGORIES = {
  Gemstones: ['Blue Sapphire', 'Yellow Sapphire', 'Ruby', 'Garnet', 'Padparadscha', 'Spinel', 'Tourmaline', 'Other'],
  'Jewelry Shops': ['Ring', 'Earring', 'Bracelet', 'Necklace', 'Pendant', 'Custom'],
};
const EMPTY_FORM = { name: '', description: '', price: '', category: 'Gemstones', subCategory: '', stock: '', stockStatus: 'in_stock', storeId: '' };

// ─── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({ onOk }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-black mb-2">Submission Successful!</h2>
        <p className="text-sm text-gray-600 mb-6">Your store application is now <strong>waiting for admin approval</strong>. We'll review it shortly.</p>
        <button onClick={onOk} className="btn-gold w-full justify-center py-3">OK</button>
      </div>
    </div>
  );
}

// ─── Edit Product Modal ────────────────────────────────────────────────────────
function EditProductModal({ product, onClose, onSaved, getToken }) {
  const [form, setForm] = useState({
    name: product.name, description: product.description || '',
    price: product.price, category: product.category,
    subCategory: product.subCategory || '',
    stock: product.stock, stockStatus: product.stockStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleField = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      // reset subCategory when category changes
      ...(name === 'category' ? { subCategory: '' } : {}),
    }));
  };

  const handleSave = async () => {
    // Validate subCategory for categories that require it
    if (SUB_CATEGORIES[form.category] && !form.subCategory) {
      setError(`Please select a ${form.category === 'Gemstones' ? 'Gemstone Type' : 'Jewelry Type'}.`);
      return;
    }
    setSaving(true); setError('');
    try {
      const token = await getToken();
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const updated = await apiFetchAuthForm(`/products/${product._id}`, token, fd, 'PATCH');
      onSaved(updated);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const subCatOptions = SUB_CATEGORIES[form.category];

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card--wide">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-black">Edit Product</h2>
          <button onClick={onClose} className="icon-btn"><X size={18} /></button>
        </div>
        {error && <div className="error-banner mb-4">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['name', 'Product Name'], ['price', 'Price (USD)'], ['stock', 'Stock Qty']].map(([n, l]) => (
            <div className="form-group" key={n}>
              <label className="form-label">{l}</label>
              <input name={n} value={form[n]} onChange={handleField} className="form-input"
                type={n === 'price' || n === 'stock' ? 'number' : 'text'} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" value={form.category} onChange={handleField} className="form-input">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Sub-category — conditional */}
          {subCatOptions && (
            <div className="form-group sm:col-span-2">
              <label className="form-label">
                {form.category === 'Gemstones' ? 'Gemstone Type *' : 'Jewelry Type *'}
              </label>
              <select
                name="subCategory"
                value={form.subCategory}
                onChange={handleField}
                className="form-input"
                style={{ borderColor: form.subCategory ? '#C5A059' : undefined }}
              >
                <option value="">— Select type —</option>
                {subCatOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="form-group mt-2">
          <label className="form-label">Description</label>
          <textarea name="description" value={form.description} onChange={handleField} rows={3} className="form-input text-sm" />
        </div>
        <div className="form-group mt-2">
          <label className="form-label">Stock Status</label>
          <div className="flex gap-2 flex-wrap">
            {STOCK_OPTIONS.map(({ value, label, icon: Icon, color }) => (
              <label key={value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-sm transition-colors ${form.stockStatus === value ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'}`}>
                <input type="radio" name="stockStatus" value={value} checked={form.stockStatus === value} onChange={handleField} className="hidden" />
                <Icon size={13} className={color} /> <span className={form.stockStatus === value ? 'text-black font-semibold' : 'text-gray-500'}>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="icon-btn px-4 py-2 border border-gray-200 text-sm rounded-xl">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gold disabled:opacity-40">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { user } = useUser();
  const [view, setView] = useState('inventory');
  const [myStore, setMyStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingStore, setEditingStore] = useState(false);
  const [storeEditForm, setStoreEditForm] = useState({});

  // Store registration form
  const [regForm, setRegForm] = useState({ name: '', description: '', category: 'Gemstones', location: '', phone: '' });
  const [regFile, setRegFile]             = useState(null);
  const [regCoverFile, setRegCoverFile]   = useState(null);

  const fetchMyStore = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingStore(true);
    try {
      const token = await getToken();
      const data = await apiFetchAuth('/stores/my', token);
      if (data.length > 0) { setMyStore(data[0]); setForm(f => ({ ...f, storeId: data[0]._id })); }
      else setMyStore(null);
    } catch (e) { setError(e.message); }
    finally { setLoadingStore(false); }
  }, [isSignedIn, getToken]);

  const fetchInventory = useCallback(async () => {
    if (!isSignedIn || myStore?.status !== 'approved') return;
    setLoadingInv(true);
    try {
      const token = await getToken();
      setInventory(await apiFetchAuth('/products/my/inventory', token));
    } catch (e) { console.error(e); }
    finally { setLoadingInv(false); }
  }, [isSignedIn, myStore, getToken]);

  useEffect(() => { fetchMyStore(); }, [fetchMyStore]);
  useEffect(() => { if (myStore?.status === 'approved') fetchInventory(); }, [myStore?.status, fetchInventory]);

  // Auth check for dashboard access
  useEffect(() => {
    if (!isSignedIn) {
      openAuthModal();
    }
  }, [isSignedIn, openAuthModal]);

  const handleField = e => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      // Reset subCategory whenever category changes
      ...(name === 'category' ? { subCategory: '' } : {}),
    }));
  };
  const handleRegField = e => setRegForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImages = e => {
    const files = Array.from(e.target.files);
    setImages(p => [...p, ...files]);
    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = idx => {
    setImages(p => p.filter((_, i) => i !== idx));
    setPreviews(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.price || !form.storeId) { setError('Name, Price, and Store are required.'); return; }
    // Validate sub-category for categories that require it
    if (SUB_CATEGORIES[form.category] && !form.subCategory) {
      setError(`Please select a ${form.category === 'Gemstones' ? 'Gemstone Type' : 'Jewelry Type'}.`);
      return;
    }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const token = await getToken();
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await apiFetchAuthForm('/products', token, fd);
      setSuccess('Product listed!'); setForm({ ...EMPTY_FORM, storeId: form.storeId });
      setImages([]); setPreviews([]); fetchInventory();
      setTimeout(() => setView('inventory'), 1200);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const deleteProduct = async id => {
    if (!confirm('Delete this product?')) return;
    try {
      const token = await getToken();
      await apiFetchAuth(`/products/${id}`, token, { method: 'DELETE' });
      setInventory(p => p.filter(x => x._id !== id));
    } catch (e) { alert(e.message); }
  };

  const handleApplyStore = async e => {
    e.preventDefault();
    if (!regForm.name || !regForm.category || !regForm.location || !regForm.phone) {
      setError('Name, Category, Location, and Phone are required.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const token = await getToken();
      const fd = new FormData();
      Object.entries(regForm).forEach(([k, v]) => fd.append(k, v));
      if (regFile)       fd.append('identityProof', regFile);
      if (regCoverFile)  fd.append('coverImage',    regCoverFile);
      const newStore = await apiFetchAuthForm('/stores/apply', token, fd);
      setMyStore(newStore);
      setShowSuccessModal(true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const deleteStoreAndReapply = async () => {
    if (!confirm('Delete rejected application and re-apply?')) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await apiFetchAuth(`/stores/my/${myStore._id}`, token, { method: 'DELETE' });
      setMyStore(null);
      setRegForm({ name: '', description: '', category: 'Gemstones', location: '', phone: '' });
      setRegFile(null);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  // ── Edit Store ───
  const startEditStore = () => {
    setStoreEditForm({
      name: myStore.name, description: myStore.description || '',
      location: myStore.location || '', phone: myStore.contactOptions?.phone || ''
    });
    setEditingStore(true);
  };

  const saveStore = async () => {
    setSubmitting(true); setError('');
    try {
      const token = await getToken();
      const fd = new FormData();
      Object.entries(storeEditForm).forEach(([k, v]) => fd.append(k, v));
      // coverImage is stored separately outside of storeEditForm
      if (storeEditForm._coverFile) fd.append('coverImage', storeEditForm._coverFile);
      const updated = await apiFetchAuthForm(`/stores/my/${myStore._id}`, token, fd, 'PATCH');
      setMyStore(updated); setEditingStore(false);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  // ── Guards ───
  if (!isSignedIn) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <StoreIcon size={48} className="text-gray-300" />
      <div>
        <p className="text-black font-black text-lg">Sign in to access your seller dashboard</p>
        <p className="text-sm text-gray-500 font-medium mt-1">Please sign in to register or manage your store.</p>
      </div>
      <button onClick={openAuthModal} className="btn-gold px-6 py-2.5 text-xs shadow-lg shadow-amber-900/10">
        Sign In / Register
      </button>
    </div>
  );
  if (loadingStore) return <div className="flex justify-center items-center py-20"><Loader2 size={36} className="animate-spin text-black" /></div>;

  // ── NO STORE: Registration ───
  if (!myStore) return (
    <>
      {showSuccessModal && <SuccessModal onOk={() => navigate('/')} />}
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <StoreIcon size={42} className="mx-auto text-black mb-3" />
          <h1 className="text-2xl font-black text-black">Open Your Store</h1>
          <p className="text-black font-semibold text-sm mt-1">Join MYGEMSS as a verified seller and reach buyers globally.</p>
        </div>
        {error && <div className="error-banner mb-4">{error}</div>}
        <form onSubmit={handleApplyStore} className="profile-card space-y-4">
          {[['name', 'Store Name *'], ['location', 'Location / City *'], ['phone', 'Contact Phone *']].map(([n, l]) => (
            <div className="form-group" key={n}>
              <label className="form-label">{l}</label>
              <input name={n} value={regForm[n]} onChange={handleRegField} className="form-input" required />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select name="category" value={regForm.category} onChange={handleRegField} className="form-input">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Store Bio</label>
            <textarea name="description" value={regForm.description} onChange={handleRegField} className="form-input" rows={3} />
          </div>

          {/* Cover Image */}
          <div className="form-group">
            <label className="form-label">Store Cover Image (Optional)</label>
            {regCoverFile && (
              <div className="rounded-xl overflow-hidden border border-gray-200 mb-2" style={{ aspectRatio: '16/5' }}>
                <img src={URL.createObjectURL(regCoverFile)} className="w-full h-full object-cover" alt="cover preview" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 px-4 py-2 rounded-xl text-sm transition-colors w-fit"
              style={{ borderColor: regCoverFile ? '#C5A059' : undefined }}>
              <UploadCloud size={15} className="text-black" />
              <span className="text-black font-medium">{regCoverFile ? regCoverFile.name : 'Upload Cover Image'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={e => setRegCoverFile(e.target.files[0])} />
            </label>
          </div>

          {/* Identity Proof */}
          <div className="form-group">
            <label className="form-label">Identity Proof (Optional)</label>
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl text-sm transition-colors w-fit">
              <UploadCloud size={15} className="text-black" />
              <span className="text-black font-medium">{regFile ? regFile.name : 'Upload Document'}</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setRegFile(e.target.files[0])} />
            </label>
          </div>
          <button type="submit" disabled={submitting} className="btn-gold w-full justify-center py-3 mt-4">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit Application'}
          </button>
        </form>
      </div>
    </>
  );

  // ── PENDING / REJECTED ───
  if (myStore.status === 'pending' || myStore.status === 'rejected') {
    const isPending = myStore.status === 'pending';
    return (
      <div className="max-w-xl mx-auto mt-10">
        <div className={`p-6 rounded-2xl border flex flex-col items-center text-center ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          {isPending ? <AlertTriangle size={48} className="text-amber-500 mb-4" /> : <XCircle size={48} className="text-red-400 mb-4" />}
          <h2 className="text-xl font-black text-black mb-2">{isPending ? 'Application Under Review' : 'Application Rejected'}</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {isPending ? `Your store "${myStore.name}" is waiting for admin approval.` : `Your application for "${myStore.name}" was not approved.`}
          </p>
          {!isPending && (
            <button onClick={deleteStoreAndReapply} disabled={submitting} className="btn-gold">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Re-Apply'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── APPROVED: Full Dashboard ───
  return (
    <div className="seller-page">
      {editingProduct && (
        <EditProductModal
          product={editingProduct} getToken={getToken}
          onClose={() => setEditingProduct(null)}
          onSaved={updated => { setInventory(p => p.map(x => x._id === updated._id ? updated : x)); setEditingProduct(null); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">{myStore.name} <span className="text-black">Dashboard</span></h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-gray-100 text-black px-2 py-0.5 rounded font-semibold uppercase tracking-wider border border-gray-200">{myStore.category}</span>
            <span className="text-xs flex items-center gap-1 text-emerald-700 font-semibold"><CheckCircle size={12} /> Approved</span>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
          {[['inventory', <><Package size={15} /> Inventory</>], ['add', <><PlusCircle size={15} /> Add Product</>], ['profile', <><Info size={15} /> Profile</>]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} className={`tab-btn ${view === v ? 'tab-btn--active' : ''}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* PROFILE TAB */}
      {view === 'profile' && (
        <div className="profile-card">
          {/* ── Cover Image ── */}
          {myStore.coverImageUrl && !editingStore && (
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-5" style={{ aspectRatio: '16/5' }}>
              <img src={myStore.coverImageUrl} className="w-full h-full object-cover" alt="Store cover" />
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black text-black uppercase tracking-wider">Store Information</h2>
            {!editingStore && <button onClick={startEditStore} className="flex items-center gap-1 text-xs font-bold text-black border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"><Edit2 size={13} /> Edit</button>}
          </div>
          {editingStore ? (
            <div className="space-y-4">
              {error && <div className="error-banner">{error}</div>}
              {[['name', 'Store Name'], ['location', 'Location'], ['phone', 'Phone']].map(([n, l]) => (
                <div className="form-group" key={n}>
                  <label className="form-label">{l}</label>
                  <input name={n} value={storeEditForm[n] || ''} onChange={e => setStoreEditForm(f => ({ ...f, [e.target.name]: e.target.value }))} className="form-input" />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea name="description" value={storeEditForm.description || ''} onChange={e => setStoreEditForm(f => ({ ...f, description: e.target.value }))} className="form-input" rows={3} />
              </div>
              {/* Cover Image upload */}
              <div className="form-group">
                <label className="form-label">Cover Image</label>
                {(storeEditForm._coverPreview || myStore.coverImageUrl) && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 mb-2" style={{ aspectRatio: '16/5' }}>
                    <img src={storeEditForm._coverPreview || myStore.coverImageUrl} className="w-full h-full object-cover" alt="cover" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 px-4 py-2 rounded-xl text-sm transition-colors w-fit"
                  style={{ borderColor: storeEditForm._coverFile ? '#C5A059' : undefined }}>
                  <UploadCloud size={14} className="text-black" />
                  <span className="text-black font-medium text-xs">
                    {storeEditForm._coverFile ? storeEditForm._coverFile.name : 'Upload Cover Image'}
                  </span>
                  <input type="file" className="hidden" accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) setStoreEditForm(f => ({
                        ...f,
                        _coverFile:    file,
                        _coverPreview: URL.createObjectURL(file),
                      }));
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingStore(false)} className="icon-btn px-4 py-2 border border-gray-200 text-sm rounded-xl">Cancel</button>
                <button onClick={saveStore} disabled={submitting} className="btn-gold disabled:opacity-40">
                  {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[['Name', myStore.name], ['Location', myStore.location], ['Phone', myStore.contactOptions?.phone], ['Bio', myStore.description || 'N/A']].map(([l, v]) => (
                <p key={l} className="text-sm text-black"><strong className="font-black">{l}:</strong> {v}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD PRODUCT TAB */}
      {view === 'add' && (
        <div className="profile-card">
          <h2 className="text-sm font-black text-black uppercase tracking-wider mb-5">New Product Listing</h2>
          {error && <div className="error-banner mb-4">{error}</div>}
          {success && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['name', 'Product Name *'], ['price', 'Price (Rs) *'], ['stock', 'Stock Quantity']].map(([n, l]) => (
                <div className="form-group" key={n}>
                  <label className="form-label">{l}</label>
                  <input name={n} value={form[n]} onChange={handleField} className="form-input" type={n === 'price' || n === 'stock' ? 'number' : 'text'} required={n !== 'stock'} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select name="category" value={form.category} onChange={handleField} className="form-input">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Sub-category row — shown only for Gemstones and Jewelry Shops */}
            {SUB_CATEGORIES[form.category] && (
              <div className="form-group">
                <label className="form-label" style={{ color: '#C5A059', fontWeight: 700 }}>
                  {form.category === 'Gemstones' ? '💎 Gemstone Type *' : '💍 Jewelry Type *'}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SUB_CATEGORIES[form.category].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, subCategory: opt }))}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        background: form.subCategory === opt ? '#C5A059' : '#FAFAFA',
                        color: form.subCategory === opt ? '#fff' : '#1a1a1a',
                        borderColor: form.subCategory === opt ? '#C5A059' : '#e5e7eb',
                        boxShadow: form.subCategory === opt ? '0 2px 8px #C5A05940' : 'none',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {!form.subCategory && (
                  <p className="text-[11px] text-amber-600 mt-1.5 font-medium">Please select a type to continue</p>
                )}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Stock Status</label>
              <div className="flex gap-2 flex-wrap">
                {STOCK_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                  <label key={value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border text-sm transition-colors ${form.stockStatus === value ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'}`}>
                    <input type="radio" name="stockStatus" value={value} checked={form.stockStatus === value} onChange={handleField} className="hidden" />
                    <Icon size={13} className={color} /> <span className={form.stockStatus === value ? 'text-black font-semibold' : 'text-gray-500'}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleField} rows={3} className="form-input text-sm" placeholder="Describe the gemstone, origin, certificates…" />
            </div>
            <div className="form-group">
              <label className="form-label">Product Images (up to 8)</label>
              <div className="flex flex-wrap gap-3 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <img src={src} className="w-20 h-20 rounded-xl object-cover border border-gray-200" alt="" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </div>
                ))}
                {previews.length < 8 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors text-gray-400 hover:text-black">
                    <ImagePlus size={22} /> <span className="text-[10px] mt-1">Add</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                  </label>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setView('inventory')} className="icon-btn px-4 py-2 border border-gray-200 text-sm rounded-xl">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-gold disabled:opacity-40">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Listing…</> : <><PlusCircle size={16} /> List Product</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INVENTORY TAB */}
      {view === 'inventory' && (
        <div>
          {loadingInv ? (
            <div className="flex justify-center py-16"><Loader2 size={36} className="animate-spin text-black" /></div>
          ) : inventory.length === 0 ? (
            <div className="empty-feed">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-black font-bold text-lg">No products listed yet</p>
              <button onClick={() => setView('add')} className="btn-gold mt-4"><PlusCircle size={16} /> Add Your First Product</button>
            </div>
          ) : (
            <div className="inventory-table">
              <div className="inventory-header">
                <span>Product</span><span className="hidden sm:block">Category</span>
                <span>Price</span><span className="hidden sm:block">Status</span><span>Actions</span>
              </div>
              {inventory.map(p => {
                const StockConfig = STOCK_OPTIONS.find(s => s.value === p.stockStatus);
                const StockIcon = StockConfig?.icon;
                return (
                  <div key={p._id} className="inventory-row">
                    <div className="flex items-center gap-3">
                      {p.images?.[0]
                        ? <img src={p.images[0]} className="w-10 h-10 rounded-lg object-cover border border-gray-200" alt="" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-black truncate">{p.name}</p>
                      </div>
                    </div>
                    <span className="hidden sm:block text-xs text-black font-medium">{p.category}</span>
                    <span className="text-sm font-black text-black">Rs {Number(p.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                    <div className={`hidden sm:flex items-center gap-1 text-xs font-semibold ${StockConfig?.color}`}>
                      {StockIcon && <StockIcon size={12} />} {StockConfig?.label}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingProduct(p)} className="icon-btn" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => deleteProduct(p._id)} className="icon-btn text-red-400 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
