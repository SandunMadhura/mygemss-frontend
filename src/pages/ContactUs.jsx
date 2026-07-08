import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const GOLD = '#C5A059';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4">Contact Us</h1>
        <p className="text-gray-500 font-medium max-w-2xl text-lg">
          We'd love to hear from you. Reach out for support, inquiries, or feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        {/* Left Column: Contact Info */}
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${GOLD}15`, color: GOLD }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black mb-1">Email</h3>
              <a href="mailto:support@mygemss.lk" className="text-gray-600 hover:text-[#C5A059] font-medium transition-colors">support@mygemss.lk</a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${GOLD}15`, color: GOLD }}>
              <Phone size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black mb-1">Phone</h3>
              <a href="tel:+94700000000" className="text-gray-600 hover:text-[#C5A059] font-medium transition-colors">+94 77 1583 790</a>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${GOLD}15`, color: GOLD }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black mb-1">Office</h3>
              <p className="text-gray-600 font-medium">Ratnapura, Sri Lanka</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative">
          <h2 className="text-2xl font-black text-black mb-6">Send a Message</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="john@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Subject</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="How can we help?"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Message</label>
              <textarea
                required
                rows="4"
                className="input-field resize-none"
                placeholder="Type your message here..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold py-3.5 mt-2 flex items-center justify-center gap-2 text-[15px]"
            >
              {submitting ? 'Sending...' : (
                <>
                  Send Message
                  <Send size={18} />
                </>
              )}
            </button>

            {success && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-center p-8 z-10" style={{ color: GOLD }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${GOLD}20` }}>
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-black text-black mb-2">Message Sent!</h3>
                <p className="text-gray-600 font-medium">We'll get back to you as soon as possible.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
