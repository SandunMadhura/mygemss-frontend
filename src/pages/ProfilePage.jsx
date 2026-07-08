import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import {
  Loader2, Pencil, Check, X, ShieldCheck, Store, Users,
  Settings, Camera
} from 'lucide-react';
import { apiFetchAuth, apiFetchAuthForm } from '../lib/api';

const GOLD = '#C5A059';

const ROLE_CONFIG = {
  admin:  { label: 'Administrator', icon: ShieldCheck, color: 'text-red-400',     bg: 'bg-red-900/30 border-red-700/40' },
  seller: { label: 'Verified Seller', icon: Store,    color: 'text-amber-400',   bg: 'bg-amber-900/30 border-amber-700/40' },
  normal: { label: 'Member', icon: Users,             color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-700/40' },
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const [dbUser, setDbUser]         = useState(null);
  const [myServices, setMyServices] = useState([]);
  const [fetching, setFetching]     = useState(true);

  // ── Bio-only inline edit (legacy, kept for the bio card) ──────────────────
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput]     = useState('');
  const [saving, setSaving]         = useState(false);

  // ── Full profile edit mode ─────────────────────────────────────────────────
  const [editMode, setEditMode]         = useState(false);
  const [editFirst, setEditFirst]       = useState('');
  const [editLast, setEditLast]         = useState('');
  const [editBio, setEditBio]           = useState('');
  const [avatarFile, setAvatarFile]     = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const load = async () => {
      try {
        const token = await getToken();
        const [userData, servicesData] = await Promise.all([
          apiFetchAuth('/users/me', token),
          apiFetchAuth('/services/my', token)
        ]);
        setDbUser(userData);
        setBioInput(userData.bio || '');
        setMyServices(servicesData);
      } catch (e) { console.error(e); }
      finally { setFetching(false); }
    };
    load();
  }, [isLoaded, isSignedIn]);

  const openEdit = () => {
    setEditFirst(dbUser?.firstName || user?.firstName || '');
    setEditLast(dbUser?.lastName  || user?.lastName  || '');
    setEditBio(dbUser?.bio || '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = await getToken();
      const fd    = new FormData();
      fd.append('firstName', editFirst);
      fd.append('lastName',  editLast);
      fd.append('bio',       editBio);
      if (avatarFile) fd.append('avatar', avatarFile);

      const updated = await apiFetchAuthForm('/users/profile', token, fd, 'PUT');
      setDbUser(updated);
      setBioInput(updated.bio || '');
      setEditMode(false);
      setAvatarPreview(null);
    } catch (e) { console.error(e); }
    finally { setSavingProfile(false); }
  };

  const saveBio = async () => {
    setSaving(true);
    try {
      const token   = await getToken();
      const updated = await apiFetchAuth('/users/me/bio', token, {
        method: 'PATCH',
        body: JSON.stringify({ bio: bioInput }),
      });
      setDbUser(updated);
      setEditingBio(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (!isLoaded || fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="text-center py-24">
        <p className="text-2xl text-amber-100 font-semibold">Sign in to view your profile</p>
      </div>
    );
  }

  const role       = dbUser?.role || 'normal';
  const RoleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.normal;
  const RoleIcon   = RoleConfig.icon;
  const displayAvatar = avatarPreview || dbUser?.profileImageUrl || user?.imageUrl;
  const displayName   = editMode
    ? `${editFirst} ${editLast}`.trim()
    : `${dbUser?.firstName || user?.firstName || ''} ${dbUser?.lastName || user?.lastName || ''}`.trim();

  return (
    <div className="profile-page">
      {/* Cover Banner */}
      <div className="profile-cover" />

      {/* Avatar + basic info */}
      <div className="profile-info-block" style={{ position: 'relative' }}>
        {/* Edit Profile button */}
        {!editMode && (
          <button
            onClick={openEdit}
            style={{
              position: 'absolute', top: 0, right: 0,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#fff', border: `1px solid ${GOLD}`,
              color: GOLD, borderRadius: '0.65rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = GOLD; }}
          >
            <Pencil size={13} />
            Edit Profile
          </button>
        )}

        {/* Avatar with optional upload overlay */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={displayAvatar}
            alt={displayName}
            className="profile-avatar"
            style={{ objectFit: 'cover' }}
          />
          {editMode && (
            <label
              htmlFor="avatar-upload"
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', gap: '0.2rem',
              }}
            >
              <Camera size={22} />
              <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>Change</span>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          )}
        </div>

        {/* Name + role */}
        <div className="mt-4">
          {editMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 320 }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={editFirst}
                  onChange={e => setEditFirst(e.target.value)}
                  placeholder="First name"
                  style={{ flex: 1, padding: '0.55rem 0.8rem', borderRadius: '0.65rem', border: '1.5px solid #e5e7eb', fontSize: '0.9rem', fontWeight: 700, color: '#111', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                />
                <input
                  value={editLast}
                  onChange={e => setEditLast(e.target.value)}
                  placeholder="Last name"
                  style={{ flex: 1, padding: '0.55rem 0.8rem', borderRadius: '0.65rem', border: '1.5px solid #e5e7eb', fontSize: '0.9rem', fontWeight: 700, color: '#111', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = GOLD; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                />
              </div>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Tell the community about yourself…"
                rows={3}
                style={{ padding: '0.55rem 0.8rem', borderRadius: '0.65rem', border: '1.5px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 500, color: '#111', resize: 'none', outline: 'none', lineHeight: 1.5 }}
                onFocus={e => { e.target.style.borderColor = GOLD; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{ flex: 1, padding: '0.6rem', background: '#111', color: '#fff', border: 'none', borderRadius: '0.65rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} /> Save Changes</>}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{ padding: '0.6rem 1rem', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '0.65rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-amber-100">
                {displayName}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{dbUser?.email}</p>
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full border text-sm font-medium ${RoleConfig.bg} ${RoleConfig.color}`}>
                <RoleIcon size={14} />
                {RoleConfig.label}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bio section (only shown when not in full edit mode) */}
      {!editMode && (
        <div className="profile-card mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">About</h2>
            {!editingBio ? (
              <button onClick={() => setEditingBio(true)} className="icon-btn">
                <Pencil size={15} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveBio} disabled={saving} className="icon-btn text-emerald-400">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                </button>
                <button onClick={() => { setEditingBio(false); setBioInput(dbUser?.bio || ''); }} className="icon-btn text-red-400">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
          {editingBio ? (
            <textarea
              value={bioInput}
              onChange={e => setBioInput(e.target.value)}
              rows={3}
              placeholder="Tell the community about yourself…"
              className="post-textarea text-sm"
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">
              {dbUser?.bio || <span className="text-gray-500 italic">No bio yet. Click the pencil to add one.</span>}
            </p>
          )}
        </div>
      )}

      {/* Account Details Card */}
      {!editMode && (
        <div className="profile-card mt-4">
          <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-4">Account Details</h2>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: displayName },
              { label: 'Email', value: dbUser?.email },
              { label: 'Member Since', value: dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
              { label: 'Role', value: RoleConfig.label },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-emerald-900/40 last:border-0">
                <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-sm text-amber-100 font-medium">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Services Section */}
      {!editMode && (
        <div className="profile-card mt-4 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">My Listed Services</h2>
            <Link to="/services/register" className="text-xs text-amber-400 hover:text-amber-300 font-medium border border-amber-900 px-3 py-1.5 rounded-lg transition-colors">
              + New Service
            </Link>
          </div>
          {myServices.length === 0 ? (
            <p className="text-gray-400 text-sm italic">You haven't listed any services yet.</p>
          ) : (
            <div className="space-y-3">
              {myServices.map(service => (
                <div key={service._id} className="flex items-center justify-between p-3 rounded-xl border border-emerald-900/30 bg-black/20">
                  <div className="flex items-center gap-3">
                    {service.serviceImageUrl ? (
                      <img src={service.serviceImageUrl} alt={service.serviceName} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Settings size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-amber-50">{service.serviceName}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{service.category}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          service.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400' :
                          service.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                          'bg-amber-900/50 text-amber-400'
                        }`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/services/edit/${service._id}`} className="icon-btn text-amber-200 hover:bg-amber-900/30 border border-transparent hover:border-amber-700/50">
                    <Pencil size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
