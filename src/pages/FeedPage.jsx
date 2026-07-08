import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, RefreshCw, Lock } from 'lucide-react';
import { io } from 'socket.io-client';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import AdSlider from '../components/AdSlider';
import { apiFetch } from '../lib/api';
import { useAuthModal } from '../context/AuthModalContext';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function FeedPage() {
  const { isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts]           = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError]           = useState('');
  const observerRef  = useRef(null);
  const sentinelRef  = useRef(null);
  const socketRef    = useRef(null);
  const authWallRef  = useRef(null);

  const fetchPosts = useCallback(async (cursor = null) => {
    setLoading(true);
    setError('');
    try {
      const query = cursor ? `?cursor=${cursor}&limit=8` : '?limit=8';
      const data  = await apiFetch(`/posts${query}`);
      setPosts(prev => cursor ? [...prev, ...data.posts] : data.posts);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Socket — listen for admin-approved posts
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('post_approved', (post) => {
      setPosts(prev => {
        const exists = prev.some(p => p._id === post._id);
        return exists ? prev : [post, ...prev];
      });
    });

    return () => socket.disconnect();
  }, []);

  // Infinite scroll via IntersectionObserver (for all users)
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loading) fetchPosts(nextCursor);
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [nextCursor, loading, fetchPosts]);

  const handleNewPost = () => {
    // Post is now pending — show a gentle notification instead of adding to feed
  };

  return (
    <div className="feed-page">
      {/* Ad Slider */}
      <AdSlider />

      {/* Header */}
      <div className="feed-header" style={{ marginTop: '1.25rem' }}>
        <div>
          <h1 className="page-title">Community <span className="text-black">Feed</span></h1>
          <p className="page-subtitle">Discover gemstone stories from Sri Lanka and beyond</p>
        </div>
        <button onClick={() => fetchPosts()} className="refresh-btn" title="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Create post (signed-in only) */}
      {isSignedIn && (
        <>
          <CreatePost onPostCreated={handleNewPost} />
          <div className="flex items-center gap-2 mt-2 mb-4 px-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs text-gray-500 font-medium">
              Our AI reviews gem-related posts instantly — non-gem content goes to admin review.
            </p>
          </div>
        </>
      )}

      {/* Error state */}
      {error && <div className="error-banner">{error}</div>}

      {/* Initial skeleton */}
      {initialLoad && (
        <div className="flex justify-center py-16">
          <Loader2 size={36} className="animate-spin text-black" />
        </div>
      )}

      {/* Empty state */}
      {!initialLoad && posts.length === 0 && !error && (
        <div className="empty-feed">
          <p className="text-4xl mb-3">💎</p>
          <p className="text-black font-bold">No approved posts yet</p>
          <p className="text-sm text-gray-500">Share a story — it will appear after admin approval.</p>
        </div>
      )}

      <div className="space-y-6 mt-6">
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8 mt-4 flex justify-center items-center">
        {loading && !initialLoad && (
          <Loader2 size={24} className="animate-spin text-black/40" />
        )}
      </div>

      {!nextCursor && !initialLoad && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4 pb-8">You've reached the end ✦</p>
      )}
    </div>
  );
}
