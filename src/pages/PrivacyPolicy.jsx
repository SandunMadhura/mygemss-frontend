import React from 'react';

const GOLD = '#C5A059';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-gray-500 font-medium text-lg">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-lg prose-gray max-w-none">

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Introduction
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium">
            Welcome to MYGEMSS. We deeply respect your privacy and are committed to protecting your personal data within the gemstone trade. This Privacy Policy explains how we collect, use, and safeguard your information when you use our digital directory and marketplace.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Data Collection
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium">
            We use <strong>Clerk</strong> for secure authentication. Your public profile and store details such as your name, business address, and contact information are intentionally visible to other users to facilitate B2B networking and trade. Private account details like your login credentials remain strictly confidential.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Media & AI Processing
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium mb-4">
            Images uploaded to MYGEMSS (including product photos, store logos, and cover images) are stored securely via <strong>Cloudinary</strong>.
          </p>
          <p className="text-gray-700 leading-relaxed font-medium">
            Post text and community feed content are processed asynchronously by the <strong>Google Gemini AI API</strong>. This moderation process operates strictly to verify industry relevance and keep the platform spam-free. We do not use your proprietary data to train our own models.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Communications
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium">
            Chat messages are stored securely in our <strong>MongoDB</strong> database to facilitate and maintain a record of your B2B negotiations. While MYGEMSS provides the platform for communication, you are responsible for the information you choose to share in these private channels.
          </p>
        </section>

      </div>
    </div>
  );
}
