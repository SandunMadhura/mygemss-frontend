import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, User } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';

const GOLD = '#C5A059';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailsModal({ post, onClose, onLikeUpdate, onCommentAdd }) {
  const { getToken, isSignedIn } = useAuth();
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [comments, setComments]   = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [imgIdx, setImgIdx]       = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const author   = post.author || {};
  const initials = `${author.firstName?.[0] || ''}${author.lastName?.[0] || ''}`.toUpperCase() || '?';

  const handleLike = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const data  = await apiFetchAuth(`/posts/${post._id}/like`, token, { method: 'PATCH' });
      setLiked(data.liked);
      setLikeCount(data.likes);
      onLikeUpdate?.(data);
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isSignedIn || submitting) return;
    setSubmitting(true);
    try {
      const token   = await getToken();
      const comment = await apiFetchAuth(`/posts/${post._id}/comment`, token, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      });
      const updated = [...comments, comment];
      setComments(updated);
      setCommentText('');
      onCommentAdd?.(comment);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const images = (post.mediaUrls || []).filter(u => !/\.(mp4|mov|webm)(\?|$)/i.test(u));
  const videos = (post.mediaUrls || []).filter(u => /\.(mp4|mov|webm)(\?|$)/i.test(u));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
        }}
      />

      {/* Modal Box */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(860px, 95vw)',
          maxHeight: '92dvh',
          background: '#FAFAFA',
          borderRadius: '1.25rem',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {author.profileImageUrl ? (
              <img src={author.profileImageUrl} alt={author.firstName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#111' }}>{initials}</div>
            )}
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111' }}>{author.firstName} {author.lastName}</p>
              <p style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.5rem', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem' }}>
          {/* Post content */}
          {post.content && (
            <p style={{ fontSize: '0.92rem', color: '#1f2937', lineHeight: 1.65, fontWeight: 500, marginBottom: '1.1rem', whiteSpace: 'pre-wrap' }}>{post.content}</p>
          )}

          {/* Images with gallery dots */}
          {images.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '1.1rem' }}>
              <img
                src={images[imgIdx]}
                alt="post"
                style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: '0.9rem', display: 'block' }}
              />
              {images.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.6rem' }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', background: i === imgIdx ? GOLD : '#d1d5db', border: 'none', cursor: 'pointer', padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Videos */}
          {videos.map((url, i) => (
            <video key={i} src={url} controls style={{ width: '100%', borderRadius: '0.9rem', marginBottom: '0.75rem', maxHeight: 340 }} />
          ))}

          {/* Like bar */}
          <div style={{ display: 'flex', gap: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', marginBottom: '1.25rem' }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: liked ? '#C5A059' : '#6b7280' }}>
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              {likeCount}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#6b7280' }}>
              <MessageCircle size={18} />
              {comments.length}
            </span>
          </div>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#374151', marginBottom: '0.25rem' }}>Comments</p>
            {comments.length === 0 && (
              <p style={{ fontSize: '0.83rem', color: '#9ca3af', fontStyle: 'italic' }}>No comments yet. Be the first!</p>
            )}
            {comments.map((c, i) => {
              const commenter = c.user || {};
              const ci = `${commenter.firstName?.[0] || ''}${commenter.lastName?.[0] || ''}`.toUpperCase() || '?';
              return (
                <div key={c._id || i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  {commenter.profileImageUrl ? (
                    <img src={commenter.profileImageUrl} alt={commenter.firstName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', color: '#374151', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                      {ci || <User size={14} color="#9ca3af" />}
                    </div>
                  )}
                  <div style={{ background: '#f9f9f9', border: '1px solid #f0f0f0', borderRadius: '0.75rem', padding: '0.55rem 0.85rem', flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#111' }}>{commenter.firstName || 'Unknown'} </span>
                    <span style={{ fontSize: '0.83rem', color: '#374151' }}>{c.text}</span>
                    {c.createdAt && <p style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.2rem' }}>{timeAgo(c.createdAt)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Comment Input */}
        {isSignedIn && (
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem 1.25rem', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.6rem 0.9rem', fontSize: '0.85rem', background: '#fafafa', outline: 'none', fontWeight: 500, color: '#111' }}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.82rem', opacity: !commentText.trim() ? 0.5 : 1 }}
            >
              <Send size={15} />
              Post
            </button>
          </form>
        )}
      </div>
    </>
  );
}
