import React, { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { ImagePlus, Video, X, Send, Loader2, Sparkles } from 'lucide-react';
import { apiFetchAuthForm } from '../lib/api';

export default function CreatePost({ onPostCreated }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiToast, setAiToast] = useState(false);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPreviews(selected.map((f) => ({ url: URL.createObjectURL(f), type: f.type })));
  };

  const removeFile = (idx) => {
    const f = [...files];
    const p = [...previews];
    f.splice(idx, 1);
    p.splice(idx, 1);
    setFiles(f);
    setPreviews(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;
    setLoading(true);
    setError('');
    setAiToast(false);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('content', content);
      files.forEach((f) => formData.append('media', f));
      const post = await apiFetchAuthForm('/posts', token, formData);
      setContent('');
      setFiles([]);
      setPreviews([]);
      // Show AI-reviewing toast for 6 seconds
      setAiToast(true);
      setTimeout(() => setAiToast(false), 6000);
      onPostCreated?.(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="create-post-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={user?.imageUrl}
          alt={user?.firstName}
          className="w-11 h-11 rounded-full ring-2 ring-amber-400/40 object-cover"
        />
        <div>
          <p className="font-bold text-sm text-black">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-900 font-semibold">Sharing with the community</p>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share a gemstone discovery, tip, or story…"
        rows={3}
        className="post-textarea"
      />

      {/* Media Previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {previews.map((p, i) => (
            <div key={i} className="relative group">
              {p.type.startsWith('video') ? (
                <video src={p.url} className="w-24 h-24 object-cover rounded-xl" />
              ) : (
                <img src={p.url} className="w-24 h-24 object-cover rounded-xl" alt="" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

      {/* AI Reviewing Toast */}
      {aiToast && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 animate-pulse">
          <Sparkles size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            💎 AI is reviewing your post — gem-related content appears in the feed automatically!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          <label className="media-btn cursor-pointer">
            <ImagePlus size={18} />
            <span className="text-xs">Photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </label>
          <label className="media-btn cursor-pointer">
            <Video size={18} />
            <span className="text-xs">Video</span>
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || (!content.trim() && files.length === 0)}
          className="btn-gold flex items-center gap-2 disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {loading ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );

}
