import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Claim } from '../types';
import { getFoodImage, formatFriendlyDate } from '../utils/foodImages';
import { PickupPassModal } from '../components/PickupPassModal';
import { ImpactDashboardView } from '../components/ImpactDashboardView';

export default function ReceiverDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedPassClaim, setSelectedPassClaim] = useState<Claim | null>(null);
  const [activeTab, setActiveTab] = useState<'claims' | 'impact'>('claims');

  const { data: claims, isLoading } = useQuery({
    queryKey: ['my-claims'],
    queryFn: async () => {
      const { data } = await api.get<Claim[]>('/claims/mine');
      return data;
    },
  });

  async function handlePickedUp(donationId: string) {
    setMarkingId(donationId);
    try {
      await api.patch(`/claims/${donationId}/picked-up`);
      queryClient.invalidateQueries({ queryKey: ['my-claims'] });
      queryClient.invalidateQueries({ queryKey: ['my-impact'] });
      toast.success('Food rescue completed! Thank you for feeding the community.');
    } catch {
      toast.error('Could not update status — please try again.');
    } finally {
      setMarkingId(null);
    }
  }

  const pendingCount   = claims?.filter((c) => !c.pickedUpAt).length ?? 0;
  const completedCount = claims?.filter((c) => !!c.pickedUpAt).length ?? 0;
  const totalCount     = claims?.length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#111827]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight font-display">
            Receiver Dashboard
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Tracking claimed food batches for{' '}
            <span className="text-[#387B85] font-extrabold">{user?.orgName || user?.name}</span>
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/"
            className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-2 self-start sm:self-auto font-extrabold"
          >
            <span>←</span>
            Browse More Food
          </Link>
        </div>
      </div>

      {/* ── Tabs: Claims vs Impact ────────────────────────────────────────── */}
      <div className="flex border-b-2 border-[#111827] gap-2">
        <button
          onClick={() => setActiveTab('claims')}
          className={`py-2.5 px-5 font-black text-xs uppercase tracking-wider transition-all border-t-2 border-l-2 border-r-2 border-[#111827] -mb-[2px] ${
            activeTab === 'claims'
              ? 'bg-white text-gray-900 shadow-[2px_-2px_0px_0px_#111827]'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Claimed Batches ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`py-2.5 px-5 font-black text-xs uppercase tracking-wider transition-all border-t-2 border-l-2 border-r-2 border-[#111827] -mb-[2px] flex items-center gap-1.5 ${
            activeTab === 'impact'
              ? 'bg-[#E4F3F5] text-[#1E464D] shadow-[2px_-2px_0px_0px_#111827]'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>🌱</span> Impact & Carbon Savings
        </button>
      </div>

      {activeTab === 'impact' ? (
        <ImpactDashboardView />
      ) : (
        <>
          {/* ── Stats ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Claims', value: totalCount, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Awaiting Pickup', value: pendingCount, color: 'text-amber-800', bg: 'bg-amber-50' },
              { label: 'Completed', value: completedCount, color: 'text-[#387B85]', bg: 'bg-[#EAF4F6]' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`${stat.bg} p-5 text-center border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827]`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className={`text-3xl font-black ${stat.color} font-display`}>{stat.value}</p>
                <p className="text-xs text-gray-600 font-extrabold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Empty State ───────────────────────────────────────────────────── */}
          {!isLoading && totalCount === 0 && (
            <div className="bg-white p-12 text-center border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-4">
              <p className="text-xl font-black text-gray-900">No food claimed yet</p>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                Browse active surplus donations nearby and claim batches for your organization or shelter.
              </p>
              <Link to="/" className="btn-primary text-xs inline-block">
                View Live Surplus Inventory
              </Link>
            </div>
          )}

          {/* ── Claims List ───────────────────────────────────────────────────── */}
          {!isLoading && totalCount > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#111827]">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Your Food Claims ({totalCount})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {claims?.map((c) => {
                  const isPickedUp = !!c.pickedUpAt;
                  const isMarking = markingId === c.donationId;
                  const imageUrl = getFoodImage(c.donation.foodType, c.donation.imageUrl);
                  const friendlyExpiry = formatFriendlyDate(c.donation.expiryTime);
                  const friendlyPickupEnd = formatFriendlyDate(c.donation.pickupWindowEnd);

                  return (
                    <div
                      key={c.id}
                      className="bg-white border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Top space category image */}
                      <div className="w-full h-44 relative bg-gray-100 border-b-2 border-[#111827]">
                        <img src={imageUrl} alt={c.donation.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white border border-[#111827] px-2.5 py-0.5 text-xs font-black text-gray-900 shadow-[2px_2px_0px_0px_#111827]">
                            {c.donation.foodType}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 border shadow-[2px_2px_0px_0px_#111827] ${
                            isPickedUp
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {isPickedUp ? 'Completed' : 'Awaiting Pickup'}
                          </span>
                        </div>
                      </div>

                      {/* Details below */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-black text-gray-900 text-base leading-snug line-clamp-2">
                            {c.donation.title}
                          </h3>
                          <p className="text-xs text-gray-600 font-bold">
                            From: {c.donation.donor.orgName || c.donation.donor.name}
                          </p>
                          <p className="text-xs text-gray-700 bg-gray-50 p-2 border border-gray-200 font-semibold">
                            Pickup by: {friendlyPickupEnd || friendlyExpiry}
                          </p>
                          <p className="text-xs text-gray-600 truncate flex items-center gap-1.5 pt-1">
                            <svg className="w-3.5 h-3.5 text-[#387B85] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{c.donation.address}</span>
                          </p>
                        </div>

                        {/* Pickup Actions */}
                        <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
                          {!isPickedUp ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedPassClaim(c)}
                                className="flex-1 btn-primary text-xs py-2 px-3 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#111827]"
                              >
                                <span>📱</span> View QR Pass
                              </button>
                              <button
                                onClick={() => handlePickedUp(c.donationId)}
                                disabled={isMarking}
                                className="btn-secondary text-[11px] py-2 px-2.5 font-bold uppercase"
                                title="Quick mark without scanning"
                              >
                                {isMarking ? '…' : '✓ Done'}
                              </button>
                            </div>
                          ) : (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-black flex items-center justify-between">
                              <span>✓ Rescued & Verified</span>
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                {c.pickedUpAt ? new Date(c.pickedUpAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                          )}

                          <Link
                            to={`/donations/${c.donationId}`}
                            className="text-xs font-black uppercase text-[#387B85] hover:underline pt-1 text-center"
                          >
                            View Donation Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Pickup Pass Modal */}
      {selectedPassClaim && (
        <PickupPassModal
          claim={selectedPassClaim}
          onClose={() => setSelectedPassClaim(null)}
        />
      )}
    </div>
  );
}
