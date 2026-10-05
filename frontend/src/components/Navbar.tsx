import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, location.hash]);

  // Handle hash scrolling on page load or navigation
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    }
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        // Only if clicking outside the navbar
        const header = document.querySelector('header');
        if (header && !header.contains(e.target as Node)) {
          setMobileOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility: Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleNavClick(path: string, hash?: string) {
    if (hash) {
      if (location.pathname === '/') {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${hash}`);
        }
      } else {
        navigate(`/#${hash}`);
      }
    } else {
      navigate(path);
      if (path === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    setMobileOpen(false);
  }

  const isLinkActive = (path: string, hash?: string) => {
    if (hash) {
      return location.pathname === '/' && location.hash === `#${hash}`;
    }
    if (path === '/') {
      return location.pathname === '/' && (!location.hash || location.hash === '#listings-section');
    }
    return location.pathname === path;
  };

  const navLinkClass = (path: string, hash?: string) => {
    const active = isLinkActive(path, hash);
    return `text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 transition-all duration-150 border inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2 ${
      active
        ? 'text-gray-900 bg-[#EAF4F6] border-[#111827] shadow-[2px_2px_0px_0px_#111827] translate-y-[-1px]'
        : 'text-gray-600 border-transparent hover:text-black hover:bg-gray-100 hover:border-gray-300 hover:-translate-y-0.5'
    }`;
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-[#111827] shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* Left: Brand Logo */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 sm:gap-2.5 group flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2"
          >
            <img
              src="/logo.png"
              alt="Food Rescue Network Logo"
              className="h-8 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
            />
            <span className="font-black text-lg sm:text-xl tracking-tight text-gray-900 font-display">
              Food<span className="text-[#387B85]">Rescue</span>
              <span className="text-[#92C7CF]">.</span>
            </span>
          </Link>

          {/* Center: Desktop Nav Links (Order: Live Feed, Map View, How It Works, Impact) */}
          <nav className="hidden md:flex items-center gap-3">
            {/* 1. Live Feed with Real-time Pulsing Green Dot */}
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className={navLinkClass('/')}
              aria-label="Live Feed with real-time updates"
            >
              <span className="live-indicator-dot" aria-hidden="true" />
              <span>Live Feed</span>
            </button>

            {/* 2. Map View */}
            <button
              type="button"
              onClick={() => handleNavClick('/map')}
              className={navLinkClass('/map')}
            >
              Map View
            </button>

            {/* 3. How It Works */}
            <button
              type="button"
              onClick={() => handleNavClick('/', 'how-it-works')}
              className={navLinkClass('/', 'how-it-works')}
            >
              How It Works
            </button>

            {/* 4. Impact */}
            <button
              type="button"
              onClick={() => handleNavClick('/', 'impact')}
              className={navLinkClass('/', 'impact')}
            >
              Impact
            </button>

            {/* Role-specific dashboard tabs for authenticated users */}
            {user?.role === 'DONOR' && (
              <button
                type="button"
                onClick={() => handleNavClick('/donor/dashboard')}
                className={navLinkClass('/donor/dashboard')}
              >
                My Donations
              </button>
            )}
            {user?.role === 'RECEIVER' && (
              <button
                type="button"
                onClick={() => handleNavClick('/receiver/dashboard')}
                className={navLinkClass('/receiver/dashboard')}
              >
                My Claims
              </button>
            )}
          </nav>

          {/* Right: Desktop Actions & Mobile CTA */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black hover:underline transition-all duration-150 px-2 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2"
                >
                  Sign In
                </Link>
                {/* Resized compact button on mobile to prevent taking full space and vertical stretching */}
                <Link
                  to="/register?role=DONOR"
                  className="btn-primary !text-[11px] sm:!text-xs !py-1.5 sm:!py-2 !px-2.5 sm:!px-4 font-bold whitespace-nowrap self-center shadow-[2px_2px_0px_0px_#92C7CF] sm:shadow-[4px_4px_0px_0px_#92C7CF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2 flex-shrink-0"
                >
                  Become a Donor
                </Link>
              </>
            ) : (
              <>
                {user.role === 'DONOR' && (
                  <Link
                    to="/donor/new"
                    className="btn-primary !text-[11px] sm:!text-xs !py-1.5 sm:!py-2 !px-2.5 sm:!px-4 flex items-center gap-1.5 whitespace-nowrap self-center shadow-[2px_2px_0px_0px_#92C7CF] sm:shadow-[4px_4px_0px_0px_#92C7CF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2 flex-shrink-0"
                  >
                    <span>+</span> Post Food
                  </Link>
                )}

                {/* Notification Bell */}
                <div ref={bellRef} className="relative">
                  <button
                    id="notification-bell"
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={dropdownOpen}
                    className="relative w-9 h-9 bg-white border-2 border-[#111827] shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center text-gray-900 hover:bg-[#EAF4F6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-[#92C7CF] text-[10px] font-mono font-black text-black leading-none border border-[#111827]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {dropdownOpen && (
                    <div
                      id="notification-dropdown"
                      className="absolute right-0 mt-2 w-80 bg-white border-2 border-[#111827] shadow-[6px_6px_0px_0px_#111827] z-50 overflow-hidden animate-scale-in"
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-[#111827] bg-[#EAF4F6]">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Notifications ({unreadCount})
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                            className="text-[11px] text-[#1D4D54] hover:underline font-bold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                        {recentNotifications.length === 0 ? (
                          <li className="px-4 py-8 text-center text-xs text-gray-500 font-mono">
                            No notifications yet
                          </li>
                        ) : (
                          recentNotifications.map((notif) => (
                            <li
                              key={notif.id}
                              onClick={() => markRead(notif.id)}
                              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notif.read ? 'bg-[#F0F8FA]' : ''
                              }`}
                            >
                              <p className="text-xs font-bold text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Profile Button */}
                <button
                  onClick={handleLogout}
                  title={`Sign out (${user.name})`}
                  className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white border border-[#111827] shadow-[2px_2px_0px_0px_#92C7CF] hover:bg-gray-50 transition-colors text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2"
                >
                  <div className="w-5 h-5 bg-[#111827] text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name.split(' ')[0]} (Sign Out)</span>
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle Button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
                className="w-9 h-9 bg-white border-2 border-[#111827] shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center text-gray-900 hover:bg-[#EAF4F6] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#387B85] focus-visible:outline-offset-2"
              >
                {mobileOpen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu Panel (Below 768px) */}
        {mobileOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t-2 border-[#111827] py-4 px-2 space-y-2 bg-white animate-slide-down"
          >
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
                isLinkActive('/')
                  ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="live-indicator-dot" aria-hidden="true" />
              <span>Live Feed</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('/map')}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider border ${
                isLinkActive('/map')
                  ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              Map View
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('/', 'how-it-works')}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider border ${
                isLinkActive('/', 'how-it-works')
                  ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              How It Works
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('/', 'impact')}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider border ${
                isLinkActive('/', 'impact')
                  ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'
              }`}
            >
              Impact
            </button>

            {user?.role === 'DONOR' && (
              <button
                type="button"
                onClick={() => handleNavClick('/donor/dashboard')}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider border ${
                  isLinkActive('/donor/dashboard')
                    ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                    : 'border-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Donations
              </button>
            )}

            {user?.role === 'RECEIVER' && (
              <button
                type="button"
                onClick={() => handleNavClick('/receiver/dashboard')}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider border ${
                  isLinkActive('/receiver/dashboard')
                    ? 'bg-[#EAF4F6] border-[#111827] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                    : 'border-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Claims
              </button>
            )}

            {!user ? (
              <div className="pt-3 border-t-2 border-gray-200 px-2 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-900 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="pt-3 border-t-2 border-gray-200 px-2 space-y-2">
                <button
                  type="button"
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full text-left py-2 px-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:underline"
                >
                  Sign Out ({user.name})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
