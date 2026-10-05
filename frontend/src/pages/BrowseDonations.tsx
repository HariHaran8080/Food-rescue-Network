import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { getSocket } from '../api/socket';
import { Donation } from '../types';
import DonationCard from '../components/DonationCard';
import { useAuth } from '../context/AuthContext';

// Categories matching the Foodieland visual presentation with sharp cuboid styling
const FOOD_CATEGORIES = [
  {
    id: 'All',
    label: 'All Food',
    bgGradient: 'from-transparent to-[#F2F8F9]',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=180&auto=format&fit=crop&q=80',
  },
  {
    id: 'Cooked meals',
    label: 'Prepared Meals',
    bgGradient: 'from-transparent to-[#F4F9F2]',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=180&auto=format&fit=crop&q=80',
  },
  {
    id: 'Produce',
    label: 'Fresh Produce',
    bgGradient: 'from-transparent to-[#F0FAF4]',
    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=180&auto=format&fit=crop&q=80',
  },
  {
    id: 'Bakery',
    label: 'Bakery & Bread',
    bgGradient: 'from-transparent to-[#FCF8EE]',
    img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=180&auto=format&fit=crop&q=80',
  },
  {
    id: 'Dairy',
    label: 'Dairy & Eggs',
    bgGradient: 'from-transparent to-[#F2F7FB]',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=180&auto=format&fit=crop&q=80',
  },
  {
    id: 'Packaged goods',
    label: 'Packaged Goods',
    bgGradient: 'from-transparent to-[#FAF3F3]',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=180&auto=format&fit=crop&q=80',
  },
];

export default function BrowseDonations() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null)
    );
  }, []);

  const { data: donations, isLoading } = useQuery({
    queryKey: ['donations', coords],
    queryFn: async () => {
      const params = coords ? { lat: coords.lat, lng: coords.lng, radiusKm: 20 } : {};
      const { data } = await api.get<Donation[]>('/donations', { params });
      return data;
    },
  });

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['donations'] });
    socket.on('donation:new', refresh);
    socket.on('donation:claimed', refresh);
    socket.on('donation:cancelled', refresh);
    socket.on('donations:expired', refresh);
    return () => {
      socket.off('donation:new', refresh);
      socket.off('donation:claimed', refresh);
      socket.off('donation:cancelled', refresh);
      socket.off('donations:expired', refresh);
    };
  }, [queryClient]);

  const filtered = donations?.filter((d) => {
    const matchType = filter === 'All' || d.foodType === filter;
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.foodType.toLowerCase().includes(search.toLowerCase()) ||
      (d.donor?.orgName && d.donor.orgName.toLowerCase().includes(search.toLowerCase())) ||
      (d.donor?.name && d.donor.name.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const availableCount = donations?.filter((d) => d.status === 'AVAILABLE').length ?? 0;

  return (
    <div className="space-y-14 pb-12">
      {/* ── HERO SECTION WITH CUBOID IMAGE (SHARP EDGES) ─────────────────── */}
      <section className="relative bg-[#E8F1F5] p-8 sm:p-12 lg:p-14 border-2 border-[#111827] shadow-[8px_8px_0px_0px_#92C7CF]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Sharp Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 border border-[#111827] shadow-[3px_3px_0px_0px_#111827] text-xs font-bold text-gray-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Food Rescue Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.08] font-display">
              Rescue surplus food.<br />
              <span className="text-[#387B85]">Feed people in need.</span><br />
              Waste nothing.
            </h1>

            {/* Description */}
            <p className="text-base text-gray-700 leading-relaxed max-w-lg font-medium">
              We connect restaurants, bakeries, and markets with shelters, relief kitchens, and communities. Surplus meals are picked up and delivered fresh, the same day, in real time.
            </p>

            {/* Meta Sharp Tags */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#111827] px-3.5 py-1.5 text-xs font-bold text-gray-900 shadow-[2px_2px_0px_0px_#92C7CF]">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Fresh & Quality-Checked
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#111827] px-3.5 py-1.5 text-xs font-bold text-gray-900 shadow-[2px_2px_0px_0px_#92C7CF]">
                <svg className="w-3.5 h-3.5 text-[#1D4D54]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Shelters & Communities
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-[#111827] px-3.5 py-1.5 text-xs font-bold text-gray-900 shadow-[2px_2px_0px_0px_#92C7CF]">
                <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {availableCount > 0 ? `${availableCount} Live Donations Nearby` : 'Be the first to donate'}
              </span>
            </div>

            {/* Bottom Quote Card & Action Buttons */}
            <div className="pt-6 flex flex-wrap items-center justify-between gap-5 border-t border-[#111827]/20">
              {/* Quote Card */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white border-2 border-[#111827] shadow-[2px_2px_0px_0px_#111827] flex items-center justify-center text-[#387B85] flex-shrink-0">
                  <svg className="w-5 h-5 text-[#387B85]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">"Every meal rescued is a person fed."</p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">Community Dispatch Team</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={user?.role === 'DONOR' ? '/donor/new' : '/register?role=DONOR'}
                  className="btn-primary"
                >
                  <span>Donate Surplus Food</span>
                  <span className="ml-2 font-mono">▶</span>
                </Link>
                <a
                  href="#listings-section"
                  className="btn-secondary"
                >
                  <span>Request Food Support</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Hero Image (CUBOID 3D SHAPE WITH SHARP EDGES) */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-4">
            
            {/* Sharp Cuboid Badge */}
            <div className="absolute -top-3 left-2 sm:left-4 z-20 bg-[#111827] text-white px-3 py-2 border-2 border-white shadow-[4px_4px_0px_0px_#92C7CF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider">
                VERIFIED RESCUE
              </span>
            </div>

            {/* 3D Cuboid Image Container */}
            <div className="cuboid-shape w-full max-w-md aspect-[4/3] bg-white overflow-hidden">
              <img
                src="/hero-sharing.jpg"
                alt="Hands sharing a warm bowl of soup in community"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── CATEGORIES SECTION (SHARP EDGES) ──────────────────────────────── */}
      <section className="space-y-6">
        
        {/* Header + View All Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight font-display">
            Categories
          </h2>

          <button
            onClick={() => setFilter('All')}
            className="btn-secondary text-xs"
          >
            View All Categories
          </button>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FOOD_CATEGORIES.map((cat) => {
            const isSelected = filter === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`category-card bg-gradient-to-b ${cat.bgGradient} ${
                  isSelected ? 'border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF]' : 'border border-gray-200'
                }`}
              >
                {/* Food Thumbnail */}
                <div className="w-18 h-18 mb-3 flex items-center justify-center">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="w-16 h-16 object-cover border border-[#111827]/10"
                  />
                </div>

                <p className="text-sm font-extrabold text-gray-900 tracking-tight">
                  {cat.label}
                </p>
                <span className="text-xs text-gray-600 mt-1 font-semibold">
                  {cat.id === 'All'
                    ? `${donations?.length ?? 0} items`
                    : `${donations?.filter((d) => d.foodType === cat.id).length ?? 0} items`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LIVE SURPLUS LISTINGS FEED (SHARP EDGES) ───────────────────────── */}
      <section id="listings-section" className="space-y-6 pt-2">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b-2 border-[#111827]">
          <div>
            <h3 className="text-2xl font-black text-gray-900 font-display">
              Live Surplus Inventory
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Verified food donations available right now for local pickup
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/map"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>View on Map</span>
            </Link>
            {!user && (
              <Link
                to="/register?role=DONOR"
                className="btn-primary text-xs"
              >
                + Donate Surplus
              </Link>
            )}
          </div>
        </div>

        {/* Search Bar (Sharp Edges) */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by food item, category, or donor name..."
            className="w-full pl-12 pr-10 py-3 bg-white border-2 border-[#111827] text-sm font-semibold text-gray-900 focus:shadow-[4px_4px_0px_0px_#92C7CF] transition-all outline-none"
            id="search-donations-input"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black font-bold p-1"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results Metadata Summary */}
        {!isLoading && (
          <div className="flex items-center justify-between text-xs text-gray-600 font-semibold px-1">
            <span>
              Showing {filtered?.length ?? 0} {filtered?.length === 1 ? 'listing' : 'listings'}
              {filter !== 'All' && ` in "${filter}"`}
              {search && ` matching "${search}"`}
            </span>
            {(search || filter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setFilter('All'); }}
                className="text-black hover:underline font-bold"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 border border-gray-300 p-6 h-56 shimmer" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (filtered?.length ?? 0) === 0 && (
          <div className="bg-white p-12 text-center border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-4">
            <div className="w-12 h-12 mx-auto bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No surplus listings found</h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
              {search || filter !== 'All'
                ? 'Try broadening your filter criteria or clearing your search term.'
                : 'All surplus donations in your radius have been claimed. Check back as new batches are posted throughout the day.'}
            </p>
            {(search || filter !== 'All') ? (
              <button
                onClick={() => { setSearch(''); setFilter('All'); }}
                className="btn-secondary text-xs"
              >
                Clear all filters
              </button>
            ) : (
              <div className="pt-2">
                <Link to="/donor/new" className="btn-primary text-xs">
                  + Post First Surplus Batch
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Donations Grid */}
        {!isLoading && (filtered?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((d) => (
              <div key={d.id} className="animate-slide-up">
                <DonationCard donation={d} />
              </div>
            ))}
          </div>
        )}

      </section>

      {/* ── HOW IT WORKS SECTION ────────────────────────────────────────── */}
      <section id="how-it-works" className="space-y-6 pt-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#111827]">
          <div>
            <h2 className="text-2xl font-black text-gray-900 font-display">
              How It Works
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Three simple steps from kitchen surplus to community table
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#92C7CF]">
            <div className="w-9 h-9 bg-[#111827] text-white flex items-center justify-center font-black text-sm mb-4">
              01
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-2">1. Donors Post Surplus</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Restaurants, caterers, and grocers list excess prepared food or fresh groceries with pickup times in under a minute.
            </p>
          </div>

          <div className="bg-white p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#92C7CF]">
            <div className="w-9 h-9 bg-[#387B85] text-white flex items-center justify-center font-black text-sm mb-4">
              02
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-2">2. Instant Match & Claim</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Nearby community kitchens, shelters, and relief coordinators receive live notifications and claim batches immediately.
            </p>
          </div>

          <div className="bg-white p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#92C7CF]">
            <div className="w-9 h-9 bg-[#111827] text-white flex items-center justify-center font-black text-sm mb-4">
              03
            </div>
            <h3 className="text-base font-extrabold text-gray-900 mb-2">3. Rapid Local Dispatch</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Meals are safely retrieved and distributed fresh to people in need, preventing edible food from reaching landfills.
            </p>
          </div>
        </div>
      </section>

      {/* ── IMPACT METRICS SECTION ───────────────────────────────────────── */}
      <section id="impact" className="space-y-6 pt-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#111827]">
          <div>
            <h2 className="text-2xl font-black text-gray-900 font-display">
              Community Impact
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Real-world results achieved by our donors and relief partners
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#EAF4F6] p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] text-center">
            <p className="text-3xl sm:text-4xl font-black text-[#111827] font-display">12,450+</p>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-2">Meals Rescued</p>
          </div>
          <div className="bg-[#EAF4F6] p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] text-center">
            <p className="text-3xl sm:text-4xl font-black text-[#387B85] font-display">85+</p>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-2">Community Partners</p>
          </div>
          <div className="bg-[#EAF4F6] p-6 border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] text-center">
            <p className="text-3xl sm:text-4xl font-black text-[#111827] font-display">6.8 Tons</p>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-2">CO₂ Equivalent Diverted</p>
          </div>
        </div>
      </section>
    </div>
  );
}
