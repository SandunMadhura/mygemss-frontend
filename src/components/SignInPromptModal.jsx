import React, { useEffect } from 'react';
import { X, Lock, Shield } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useAuthModal } from '../context/AuthModalContext';

const GOLD = '#C5A059';

export default function SignInPromptModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthModal();
  const { openSignIn } = useClerk();

  // Close on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Lock body scroll when open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSignIn = () => {
    closeAuthModal();
    openSignIn({
      afterSignInUrl: window.location.pathname,
      afterSignUpUrl: window.location.pathname,
    });
  };

  return (
    <>
      {/* Dark semi-transparent backdrop overlay with standard overlay z-index */}
      <div
        onClick={closeAuthModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
          transition: 'opacity 0.2s ease',
        }}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, 92vw)',
          background: '#FAFAFA', // Ivory Background
          borderRadius: '1.5rem',
          zIndex: 50,
          boxShadow: '0 32px 84px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Decorative Luxury Top border */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${GOLD}, #e8c98a, ${GOLD})` }} />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: 32,
            height: 32,
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6B7280',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#111';
            e.currentTarget.style.color = '#111';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          <X size={15} />
        </button>

        {/* Content Body */}
        <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
          {/* Lock Icon Emblem */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: `${GOLD}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              border: `1.5px solid ${GOLD}40`,
            }}
          >
            <Lock size={22} color={GOLD} />
          </div>

          {/* Premium Heading */}
          <h2
            id="auth-modal-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#111827',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Join the MYGEMSS Community
          </h2>

          {/* Subtext */}
          <p
            style={{
              fontSize: '0.85rem',
              color: '#4B5563',
              lineHeight: 1.6,
              fontWeight: 500,
              marginBottom: '2rem',
            }}
          >
            Sign in to unlock full access to the marketplace, connect with verified gem dealers, list your specialized services, and engage with the feed.
          </p>

          {/* Action Button */}
          <button
            onClick={handleSignIn}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: '#111111', // Solid Black
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.9rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background 0.15s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD; }} // Mute Gold on hover
            onMouseLeave={e => { e.currentTarget.style.background = '#111111'; }}
          >
            <Shield size={16} />
            Sign In / Register
          </button>

          {/* Cancel Button */}
          <button
            onClick={closeAuthModal}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '1rem',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
