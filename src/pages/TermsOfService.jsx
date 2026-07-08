import React from 'react';

const GOLD = '#C5A059';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4">Terms of Service</h1>
        <p className="text-gray-500 font-medium text-lg">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-lg prose-gray max-w-none">
        
        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Platform Role
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium">
            MYGEMSS acts exclusively as a digital directory and communication platform tailored for the Sri Lankan gem industry. We are a B2B facilitator and networking hub, not a direct retailer or broker. We do not own, hold, or inspect any of the gemstones or products listed on the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            User Responsibilities
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium mb-4">
            Sellers are entirely responsible for the accuracy of their product listings. You must provide honest, accurate gemological descriptions, including but not limited to weight (carats), origin, treatments, and certification details where applicable.
          </p>
          <p className="text-gray-700 leading-relaxed font-medium">
            Fraudulent listings, intentional misrepresentation, or scam attempts will not be tolerated and will result in permanent bans from the MYGEMSS platform and potential reporting to local authorities.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            AI Moderation
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium">
            Users acknowledge that community feed posts and uploads are subject to automated AI moderation. Content that is deemed off-topic, spam, or a violation of our industry-focused standards may be removed automatically or flagged for manual administrative review.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black text-black mb-4 flex items-center gap-3">
            <span className="w-8 h-1 rounded-full" style={{ background: GOLD }}></span>
            Financial Disclaimer
          </h2>
          <p className="text-gray-700 leading-relaxed font-medium mb-4">
            MYGEMSS currently does <strong>NOT</strong> process payments on-platform.
          </p>
          <p className="text-gray-700 leading-relaxed font-medium">
            All financial transactions, shipping logistics, quality verifications, and contractual agreements negotiated via the MYGEMSS chat module are the sole responsibility of the buyer and seller. MYGEMSS holds absolutely no liability for offline settlements, financial losses, or disputes arising from user negotiations.
          </p>
        </section>

      </div>
    </div>
  );
}
