import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Scissors, Flame, FlaskConical, Gem,
  MapPin, Phone, FileText, Tag, Loader2, CheckCircle2, UploadCloud
} from 'lucide-react';
import { apiFetch, apiFetchAuthForm } from '../lib/api';

const CATEGORIES = [
  { value: 'Gem Cutting',     icon: Scissors,     color: '#8B5CF6' },
  { value: 'Gem Heating',     icon: Flame,        color: '#EF4444' },
  { value: 'Gem Testing/Lab', icon: FlaskConical, color: '#3B82F6' },
  { value: 'Jewelry Design',  icon: Gem,          color: '#C5A059' },
];

export default function ServiceRegistrationPage() {
  const { getToken } = useAuth();
  const navigate     = useNavigate();
  const { id }       = useParams();
  const isEditing    = !!id;

  const [form, setForm] = useState({
    serviceName:      '',
    category:         '',
    address:          '',
    shortDescription: '',
    contactNumber:    '',
  });
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview,setImagePreview]= useState(null);
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(isEditing);
  const [error,       setError]       = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchService = async () => {
        try {
          const data = await apiFetch(`/services/${id}`);
          setForm({
            serviceName: data.serviceName,
            category: data.category,
            address: data.address,
            shortDescription: data.shortDescription,
            contactNumber: data.contactNumber,
          });
          if (data.serviceImageUrl) {
            setImagePreview(data.serviceImageUrl);
          }
        } catch (err) {
          setError('Failed to load service details.');
        } finally {
          setFetching(false);
        }
      };
      fetchService();
    }
  }, [id, isEditing]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { serviceName, category, address, shortDescription, contactNumber } = form;
    if (!serviceName || !category || !address || !shortDescription || !contactNumber) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditing) {
        await apiFetchAuthForm(`/services/${id}`, token, formData, 'PATCH');
      } else {
        await apiFetchAuthForm('/services', token, formData);
      }
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-[#C5A059]" />
      </div>
    );
  }

  return (
    <div className="svc-reg-page">
      {/* ── Page Header ── */}
      <div className="svc-reg-header">
        <div className="svc-reg-badge">
          <Gem size={16} />
          <span>Service Provider</span>
        </div>
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
          {isEditing ? 'Edit Your ' : 'List Your '}
          <span style={{ color: '#C5A059' }}>Service</span>
        </h1>
        <p className="page-subtitle">
          {isEditing 
            ? 'Update your service details. Note: Any changes will require admin re-approval.'
            : 'Register your gem or jewelry service and connect with thousands of buyers. Submissions are reviewed by our admin team before going live.'
          }
        </p>
      </div>

      {/* ── Form Card ── */}
      <div className="svc-reg-card">
        {error && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="svc-form">
          {/* Service Profile Photo */}
          <div className="svc-field">
            <label className="svc-label">
              <UploadCloud size={14} /> Service Profile Photo
            </label>
            <label className="svc-img-upload">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="svc-img-preview" />
              ) : (
                <div className="svc-img-placeholder">
                  <UploadCloud size={24} style={{ color: '#9CA3AF', marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Click to upload image</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {/* Service Name */}
          <div className="svc-field">
            <label className="svc-label" htmlFor="svc-name">
              <Tag size={14} /> Service Name
            </label>
            <input
              id="svc-name"
              type="text"
              className="svc-input"
              placeholder="e.g. Ceylon Gem Cutting Studio"
              value={form.serviceName}
              onChange={set('serviceName')}
            />
          </div>

          {/* Category */}
          <div className="svc-field">
            <label className="svc-label">
              <Gem size={14} /> Category
            </label>
            <div className="svc-category-grid">
              {CATEGORIES.map(({ value, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  id={`cat-${value.replace(/[^a-z]/gi, '-')}`}
                  onClick={() => setForm(p => ({ ...p, category: value }))}
                  className={`svc-cat-btn ${form.category === value ? 'svc-cat-btn--active' : ''}`}
                  style={form.category === value ? { borderColor: color, background: `${color}10` } : {}}
                >
                  <Icon size={18} style={{ color: form.category === value ? color : '#9CA3AF' }} />
                  <span style={{ color: form.category === value ? color : '#374151' }}>{value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="svc-field">
            <label className="svc-label" htmlFor="svc-address">
              <MapPin size={14} /> Business Address
            </label>
            <input
              id="svc-address"
              type="text"
              className="svc-input"
              placeholder="e.g. 42 Gem Street, Ratnapura, Sri Lanka"
              value={form.address}
              onChange={set('address')}
            />
          </div>

          {/* Contact Number */}
          <div className="svc-field">
            <label className="svc-label" htmlFor="svc-contact">
              <Phone size={14} /> Contact Number
            </label>
            <input
              id="svc-contact"
              type="tel"
              className="svc-input"
              placeholder="e.g. +94 77 123 4567"
              value={form.contactNumber}
              onChange={set('contactNumber')}
            />
          </div>

          {/* Short Description */}
          <div className="svc-field">
            <label className="svc-label" htmlFor="svc-desc">
              <FileText size={14} /> Short Description
            </label>
            <textarea
              id="svc-desc"
              className="svc-textarea"
              rows={4}
              placeholder="Describe your service, experience, and specialties (max 500 characters)…"
              maxLength={500}
              value={form.shortDescription}
              onChange={set('shortDescription')}
            />
            <p className="svc-char-count">{form.shortDescription.length}/500</p>
          </div>

          <button
            type="submit"
            id="svc-submit-btn"
            className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> {isEditing ? 'Saving...' : 'Submitting...'}</>
              : <><Gem size={18} /> {isEditing ? 'Save Changes' : 'Submit for Approval'}</>
            }
          </button>
        </form>
      </div>

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="svc-modal-overlay" role="dialog" aria-modal="true">
          <div className="svc-modal">
            <div className="svc-modal-icon">
              <CheckCircle2 size={52} color="#C5A059" />
            </div>
            <h2 className="svc-modal-title">{isEditing ? 'Update Successful!' : 'Submission Successful!'}</h2>
            <p className="svc-modal-body">
              {isEditing
                ? 'Your service listing has been updated and is now waiting for admin re-approval.'
                : 'Your service listing has been submitted and is now waiting for admin approval. You\'ll be notified once it goes live.'
              }
            </p>
            <button
              id="svc-success-ok-btn"
              className="btn-gold"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
              onClick={() => navigate('/profile')}
            >
              OK, Go to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
