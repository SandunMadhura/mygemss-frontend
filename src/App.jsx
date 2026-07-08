import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Sidebar from './components/Sidebar';
import FeedPage from './pages/FeedPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import SellerDashboard from './pages/SellerDashboard';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import StoreListPage from './pages/StoreListPage';
import ServicesPage from './pages/ServicesPage';
import ServiceRegistrationPage from './pages/ServiceRegistrationPage';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { useUserSync } from './hooks/useUserSync';
import { ToastProvider } from './components/Toast';
import Footer from './components/Footer';
import { NotificationProvider } from './context/NotificationContext';
import NotificationDrawer from './components/NotificationDrawer';
import { AuthModalProvider } from './context/AuthModalContext';
import SignInPromptModal from './components/SignInPromptModal';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');

function InnerApp() {
  useUserSync();

  return (
    <div className="app-shell">
      <Sidebar />
      <NotificationDrawer />
      <SignInPromptModal />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/stores" element={<StoreListPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/register" element={<ServiceRegistrationPage />} />
          <Route path="/services/edit/:id" element={<ServiceRegistrationPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Router>
        <AuthModalProvider>
          <NotificationProvider>
            <ToastProvider>
              <InnerApp />
            </ToastProvider>
          </NotificationProvider>
        </AuthModalProvider>
      </Router>
    </ClerkProvider>
  );
}
