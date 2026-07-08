import React, { useState } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Expand } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';
import PostDetailsModal from './PostDetailsModal';
import UserProfileModal from './UserProfileModal';

const ROLE_BADGE = {
  admin:  'bg-red-50 text-red-700 border-red-200',
  seller: 'bg-amber-50 text-amber-700 border-amber-200',
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post, onLike }) {
  const { getToken, isSignedIn } = useAuth();
  const [liked, setLiked]             = useState(false);
  const [likeCount, setLikeCount]     = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments]       = useState(post.comments || []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null); // for UserProfileModal

  const author   = post.author || {};
  const initials = `${author.firstName?.[0] || ''}${author.lastName?.[0] || ''}`.toUpperCase() || '?';

  const handleLike = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const data  = await apiFetchAuth(`/posts/${post._id}/like`, token, { method: 'PATCH' });
      setLiked(data.liked);
      setLikeCount(data.likes);
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !isSignedIn) return;
    try {
      const token   = await getToken();
      const comment = await apiFetchAuth(`/posts/${post._id}/comment`, token, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      });
      setComments(prev => [...prev, comment]);
      setCommentText('');
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <article className="post-card">
        {/* Author Row — clickable to open User Profile Modal */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setProfileUser(author)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '50%' }}
            title={`View ${author.firstName}'s profile`}
          >
            {author.profileImageUrl ? (
              <img src={author.profileImageUrl} alt={author.firstName} className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400/30 hover:ring-[#C5A059] transition-all" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center font-bold text-black border border-gray-200 hover:border-[#C5A059] transition-all">
                {initials}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setProfileUser(author)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <span className="font-bold text-black truncate hover:text-[#C5A059] transition-colors">
                  {author.firstName} {author.lastName}
                </span>
              </button>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${ROLE_BADGE[author.role] || ROLE_BADGE.normal}`}>
                {author.role || 'member'}
              </span>
            </div>
            <span className="text-xs text-gray-900 font-semibold">{timeAgo(post.createdAt)}</span>
          </div>
          {/* Expand / full view button */}
          <button
            onClick={() => setDetailsOpen(true)}
            title="View full post"
            style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '0.5rem', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C5A059'; e.currentTarget.style.color = '#C5A059'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <Expand size={14} />
          </button>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-black text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium line-clamp-4">{post.content}</p>
        )}

        {/* Media — click image to open details modal */}
        {post.mediaUrls?.length > 0 && (
          <div className={`grid gap-2 mb-4 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.mediaUrls.map((url, i) => {
              const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
              return isVideo ? (
                <video key={i} src={url} controls className="w-full rounded-xl max-h-72 object-cover" />
              ) : (
                <img
                  key={i}
                  src={url}
                  alt="post media"
                  className="w-full rounded-xl max-h-72 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setDetailsOpen(true)}
                  title="View full post"
                />
              );
            })}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-amber-600' : 'text-gray-600 hover:text-black'}`}>
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition-colors">
            <MessageCircle size={18} />
            <span>{comments.length}</span>
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => setDetailsOpen(true)} className="ml-auto text-xs font-semibold text-gray-400 hover:text-[#C5A059] transition-colors">
            See full post
          </button>
        </div>

        {/* Inline Comments (collapsed preview) */}
        {showComments && (
          <div className="mt-3 space-y-3">
            {comments.slice(-3).map((c, i) => {
              const commenter = c.user || {};
              const ci = `${commenter.firstName?.[0] || ''}${commenter.lastName?.[0] || ''}`.toUpperCase() || '?';
              return (
                <div key={c._id || i} className="flex gap-2 text-sm">
                  {commenter.profileImageUrl ? (
                    <img
                      src={commenter.profileImageUrl}
                      alt={commenter.firstName}
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer"
                      onClick={() => setProfileUser(commenter)}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-black border border-gray-200 shrink-0 cursor-pointer"
                      onClick={() => setProfileUser(commenter)}
                    >
                      {ci}
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 border border-gray-100">
                    <span className="font-bold text-black text-xs">{commenter.firstName || 'User'} </span>
                    <span className="text-black">{c.text}</span>
                  </div>
                </div>
              );
            })}
            {comments.length > 3 && (
              <button onClick={() => setDetailsOpen(true)} className="text-xs font-semibold text-[#C5A059] ml-9">
                View all {comments.length} comments…
              </button>
            )}
            {isSignedIn && (
              <form onSubmit={handleComment} className="flex gap-2 mt-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  className="comment-input flex-1"
                />
                <button type="submit" className="btn-gold text-xs px-3">Reply</button>
              </form>
            )}
          </div>
        )}
      </article>

      {/* Post Details Modal */}
      {detailsOpen && (
        <PostDetailsModal
          post={{ ...post, comments }}
          onClose={() => setDetailsOpen(false)}
          onLikeUpdate={({ liked: l, likes }) => { setLiked(l); setLikeCount(likes); }}
          onCommentAdd={c => setComments(prev => [...prev, c])}
        />
      )}

      {/* User Profile Quick View Modal */}
      {profileUser && (
        <UserProfileModal
          userData={profileUser}
          onClose={() => setProfileUser(null)}
        />
      )}
    </>
  );
}
