import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Store, MessageSquare, User, ShoppingCart, LayoutDashboard, ShieldCheck, Menu, X, SquareChartGantt, ChevronDown, MoreHorizontal, Bell } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth
} from '@clerk/clerk-react';
import { apiFetchAuth } from '../lib/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuthModal } from '../context/AuthModalContext';

const links = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/services', icon: SquareChartGantt, label: 'Services' },
  { to: '/chat', icon: MessageSquare, label: 'Messages' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Store' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { isSignedIn, getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const { unreadCount, openDrawer } = useNotifications();
  const { openAuthModal } = useAuthModal();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isSignedIn) {
      const checkRole = async () => {
        try {
          const token = await getToken();
          const user = await apiFetchAuth('/users/me', token);
          if (user.role === 'admin') setIsAdmin(true);
        } catch (e) { console.error(e); }
      };
      checkRole();
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn, getToken]);

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
      {/* Header Row (Always visible, handles logo & hamburger) */}
      <div className="sidebar-header-row flex-shrink-0">
        <div className="logo-block">
          <img src="/logo.png" alt="MYGEMSS Logo" className="logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <span className="logo-text" style={{ display: 'none' }}>MYGEMSS</span>
        </div>

        {/* Mobile right-side controls: Bell + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* Mobile Bell Button */}
          <button
            className="hamburger-btn"
            onClick={openDrawer}
            aria-label="Open notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 1, right: 1,
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  borderRadius: 9999,
                  minWidth: 15,
                  height: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  pointerEvents: 'none',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Nav links container - hidden on mobile unless open */}
      <div className={`sidebar-nav-container ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => {
            const isRestricted = to === '/dashboard' || to === '/profile' || to === '/chat';
            if (isRestricted && !isSignedIn) {
              return (
                <button
                  key={to}
                  onClick={(e) => {
                    e.preventDefault();
                    openAuthModal();
                  }}
                  className="nav-link w-full text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            );
          })}

          {/* Notifications nav item (Desktop) */}
          <button
            onClick={openDrawer}
            className="nav-link w-full"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4, right: -6,
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    borderRadius: 9999,
                    minWidth: 15,
                    height: 15,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span>Notifications</span>
          </button>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
            >
              <ShieldCheck size={20} />
              <span>Admin</span>
            </NavLink>
          )}

          {/* Collapsible More Menu */}
          <div className="flex flex-col w-full">
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`nav-link w-full flex items-center justify-between cursor-pointer transition-colors ${isMoreOpen ? 'nav-link--active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MoreHorizontal size={20} />
                <span>More</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`flex flex-col ml-10 overflow-hidden transition-all duration-300 ${isMoreOpen ? 'max-h-40 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
              <NavLink to="/contact" className={({ isActive }) => `text-sm font-semibold py-2 transition-colors ${isActive ? 'text-[#C5A059]' : 'text-gray-500 hover:text-black'}`}>Contact Us</NavLink>
              <NavLink to="/privacy" className={({ isActive }) => `text-sm font-semibold py-2 transition-colors ${isActive ? 'text-[#C5A059]' : 'text-gray-500 hover:text-black'}`}>Privacy Policy</NavLink>
              <NavLink to="/terms" className={({ isActive }) => `text-sm font-semibold py-2 transition-colors ${isActive ? 'text-[#C5A059]' : 'text-gray-500 hover:text-black'}`}>Terms of Service</NavLink>
            </div>
          </div>
        </nav>

        {/* Auth block */}
        <div className="sidebar-auth">
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: 'w-10 h-10' } }} />
            <span className="text-sm text-black font-bold">Account</span>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-gold w-full justify-center">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </aside>
  );
}
