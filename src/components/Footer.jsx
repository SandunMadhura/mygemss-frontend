import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const GOLD = '#C5A059';

export default function Footer() {
  const { pathname } = useLocation();

  // Hide footer on specific pages where it interferes with UI
  if (pathname.startsWith('/admin') || pathname.startsWith('/cart') || pathname.startsWith('/chat')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-gray-200" style={{ background: '#FAFAFA' }}>
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        {/* Main 4-Column Grid (Desktop Only) */}
        <div className="hidden md:grid md:grid-cols-4 gap-6 mb-12">

          {/* Column 1: Brand */}
          <div className="flex flex-col text-center md:text-left">
            <h2 className="text-2xl font-black tracking-tight text-black mb-3">
              MYGEMSS
            </h2>
            <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-xs mx-auto md:mx-0">
              The trusted digital marketplace for Sri Lanka's gemstone and lapidary industry.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-black mb-4">
              Quick Links
            </h3>
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-600">
              <Link to="/marketplace" className="hover:text-[#C5A059] transition-colors">Marketplace</Link>
              <Link to="/services" className="hover:text-[#C5A059] transition-colors">Service Directory</Link>
              <Link to="/" className="hover:text-[#C5A059] transition-colors">Community Feed</Link>
              <Link to="/dashboard" className="hover:text-[#C5A059] transition-colors">Open a Store</Link>
            </div>
          </div>

          {/* Column 3: Support/Legal */}
          <div className="flex flex-col text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-black mb-4">
              Support
            </h3>
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-600">
              <Link to="/contact" className="hover:text-[#C5A059] transition-colors">Contact Us</Link>
              <Link to="/privacy" className="hover:text-[#C5A059] transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-[#C5A059] transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Column 4: Connect */}
          <div className="flex flex-col text-center md:text-left">
            <h3 className="text-sm font-black uppercase tracking-widest text-black mb-4">
              Connect
            </h3>
            <p className="text-sm font-medium text-gray-600 mb-4">
              Reach us directly on WhatsApp.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              {/* Facebook SVG */}
              <a href="#" className="text-gray-600 hover:text-[#C5A059] transition-colors" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              {/* WhatsApp SVG (Using MessageCircle style) */}
              <a href="#" className="text-gray-600 hover:text-[#C5A059] transition-colors" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </a>
              {/* Instagram SVG */}
              <a href="#" className="text-gray-600 hover:text-[#C5A059] transition-colors" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Short Simple Footer (Mobile Only) */}
        <div className="flex md:hidden flex-col items-center text-center gap-4 mb-8">
          <h2 className="text-xl font-black tracking-tight text-black">MYGEMSS</h2>
          <div className="flex gap-4 text-xs font-semibold text-gray-600">
            <Link to="/marketplace" className="hover:text-[#C5A059] transition-colors">Marketplace</Link>
            <Link to="/services" className="hover:text-[#C5A059] transition-colors">Services</Link>
            <Link to="#" className="hover:text-[#C5A059] transition-colors">Contact</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-center text-sm font-semibold text-gray-500">
            © 2026 MYGEMSS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
