import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0B0F17] text-gray-300 border-t-2 border-[#1E293B] mt-24">
      {/* Top Banner / Callout */}
      <div className="border-b border-[#1E293B] bg-[#0F141C]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="max-w-xl text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#162233] border border-[#23354D] text-[#92C7CF] text-xs font-mono font-medium mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Dispatch Network Active
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                Never let good food go to waste.
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Subscribe to real-time high-volume surplus food alerts in your local area.
              </p>
            </div>

            {/* Newsletter Subscription Form */}
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {subscribed ? (
                <div className="flex items-center justify-center gap-2 bg-[#142328] border border-[#2D5A64] text-[#92C7CF] px-4 py-2.5 text-xs font-mono">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>You are subscribed to rescue alerts!</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full sm:w-72 px-4 py-2.5 bg-[#141B26] border border-[#2A374A] text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-[#92C7CF] transition-colors text-center sm:text-left"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#92C7CF] hover:bg-[#A6D6DD] text-black text-xs font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#FFFFFF] active:translate-y-0.5"
                  >
                    Join Network
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 text-center md:text-left">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="inline-flex items-center justify-center md:justify-start gap-3 group">
              <img
                src="/logo.png"
                alt="Food Rescue Logo"
                className="h-10 w-auto object-contain brightness-110"
              />
              <span className="font-black text-2xl tracking-tight text-white font-display">
                Food<span className="text-[#599EA8]">Rescue</span>
                <span className="text-[#92C7CF]">.</span>
              </span>
            </Link>

            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto md:mx-0 text-center md:text-left">
              A decentralized civic technology platform connecting restaurants, bakeries, supermarkets, and event caterers with certified shelters and soup kitchens in real time.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-[#141B26] border border-[#23354D] text-gray-300">
                <svg className="w-3 h-3 text-[#92C7CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Good Samaritan Act Protected
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-[#141B26] border border-[#23354D] text-gray-300">
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Real-time Dispatch
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-[#141B26] border border-[#23354D] text-[#92C7CF]">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                100% Free Public Good
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 border-b-2 md:border-b-0 md:border-l-2 border-[#92C7CF] pb-1 md:pb-0 md:pl-2 inline-block">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-center md:text-left w-full flex flex-col items-center md:items-start">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors inline-block">
                  Live Food Feed
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-gray-400 hover:text-white transition-colors inline-block">
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link to="/donor/new" className="text-gray-400 hover:text-white transition-colors inline-block">
                  Post Surplus Food
                </Link>
              </li>
              <li>
                <Link to="/receiver/dashboard" className="text-gray-400 hover:text-white transition-colors inline-block">
                  Recipient Portal
                </Link>
              </li>
              <li>
                <Link to="/donor/dashboard" className="text-gray-400 hover:text-white transition-colors inline-block">
                  Donor Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Safety */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 border-b-2 md:border-b-0 md:border-l-2 border-[#599EA8] pb-1 md:pb-0 md:pl-2 inline-block">
              Safety & Standards
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400 text-center md:text-left w-full flex flex-col items-center md:items-start">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Cold Chain Guidelines
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Safe Food Handling Checklist
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Bill Emerson Protection
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Allergen Labeling Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Recipient Verification
                </span>
              </li>
            </ul>
          </div>

          {/* Community & Legal */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 border-b-2 md:border-b-0 md:border-l-2 border-slate-500 pb-1 md:pb-0 md:pl-2 inline-block">
              Organization
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400 text-center md:text-left w-full flex flex-col items-center md:items-start">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  About the Movement
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Impact & Metrics
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Volunteer Drivers
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer inline-block">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="border-t border-[#1E293B] bg-[#070A0F] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 text-xs text-gray-500 font-mono text-center sm:text-left">
            <span>© {new Date().getFullYear()} FoodRescue Network. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span>Zero Waste · Zero Hunger · Open Community</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:text-white hover:bg-[#162233] transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:text-white hover:bg-[#162233] transition-colors"
              aria-label="Twitter / X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:text-white hover:bg-[#162233] transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
