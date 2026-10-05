import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Donation } from '../types';
import { getFoodImage, formatFriendlyDate } from '../utils/foodImages';
import { HandoffScannerModal } from '../components/HandoffScannerModal';
import { ImpactDashboardView } from '../components/ImpactDashboardView';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: 'Available',  className: 'bg-[#E4F3F5] text-[#1E464D] border-[#75B5BE]' },
  CLAIMED:   { label: 'Claimed',    className: 'bg-amber-50 text-amber-800 border-amber-300' },
  PICKED_UP: { label: 'Picked up',  className: 'bg-gray-100 text-gray-700 border-gray-300' },
  EXPIRED:   { label: 'Expired',    className: 'bg-rose-50 text-rose-700 border-rose-300' },
  CANCELLED: { label: 'Cancelled',  className: 'bg-rose-50 text-rose-700 border-rose-300' },
};

export default function DonorDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [scanDonationId, setScanDonationId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'impact'>('listings');

  const { data: donations, isLoading } = useQuery({
    queryKey: ['my-donations'],
    queryFn: async () => {
      const { data } = await api.get<Donation[]>('/donations/mine');
      return data;
    },
  });

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await api.patch(`/donations/${id}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      toast.success('Donation cancelled successfully.');
    } catch {
      toast.error('Could not cancel — please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  const totalDonations     = donations?.length ?? 0;
  const activeDonations    = donations?.filter((d) => d.status === 'AVAILABLE').length ?? 0;
  const completedDonations = donations?.filter((d) => d.status === 'PICKED_UP').length ?? 0;
  const claimedDonations   = donations?.filter((d) => d.status === 'CLAIMED').length ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-12">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#111827]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight font-display">
            Donor Dashboard
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Managing surplus food for{' '}
            <span className="text-[#387B85] font-extrabold">{user?.orgName || user?.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setScanDonationId(null);
              setShowScanner(true);
            }}
            className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center gap-2 font-black uppercase tracking-wider"
          >
            <span>📷</span>
            Scan Handoff QR
          </button>
          <Link
            to="/donor/new"
            className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-2 font-black uppercase tracking-wider"
          >
            <span className="text-base font-black">+</span>
            Post Surplus Food
          </Link>
        </div>
      </div>

      {/* ── Tabs: Listings vs Impact ──────────────────────────────────────── */}
      <div className="flex border-b-2 border-[#111827] gap-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`py-2.5 px-5 font-black text-xs uppercase tracking-wider transition-all border-t-2 border-l-2 border-r-2 border-[#111827] -mb-[2px] ${
            activeTab === 'listings'
              ? 'bg-white text-gray-900 shadow-[2px_-2px_0px_0px_#111827]'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
        >
          Food Listings ({totalDonations})
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
          {/* ── Impact Stats ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Posted', value: totalDonations, color: 'text-gray-900', bg: 'bg-white' },
              { label: 'Live Now', value: activeDonations, color: 'text-[#387B85]', bg: 'bg-[#EAF4F6]' },
              { label: 'Claimed (Pending)', value: claimedDonations, color: 'text-amber-800', bg: 'bg-amber-50' },
              { label: 'Rescued (Done)', value: completedDonations, color: 'text-emerald-800', bg: 'bg-emerald-50' },
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
          {!isLoading && totalDonations === 0 && (
            <div className="bg-white p-12 text-center border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-4">
              <p className="text-xl font-black text-gray-900">No food posted yet</p>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                Create your first surplus food listing to notify local shelters and communities.
              </p>
              <Link to="/donor/new" className="btn-primary text-xs inline-block">
                + Post First Surplus Batch
              </Link>
            </div>
          )}

          {/* ── Listings ──────────────────────────────────────────────────────── */}
          {!isLoading && totalDonations > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#111827]">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Your Food Rescue Listings ({totalDonations})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donations?.map((d: any) => {
                  const cfg = STATUS_CONFIG[d.status] ?? { label: d.status, className: 'bg-gray-100 text-gray-700 border-gray-300' };
                  const imageUrl = getFoodImage(d.foodType, d.imageUrl);
                  const friendlyExpiry = formatFriendlyDate(d.expiryTime);
                  const isCancelling = cancellingId === d.id;

                  return (
                    <div
                      key={d.id}
                      className="bg-white border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Top space category image */}
                      <div className="w-full h-44 relative bg-gray-100 border-b-2 border-[#111827]">
                        <img src={imageUrl} alt={d.title} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white border border-[#111827] px-2.5 py-0.5 text-xs font-black text-gray-900 shadow-[2px_2px_0px_0px_#111827]">
                            {d.foodType}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 border shadow-[2px_2px_0px_0px_#111827] ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Details below */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-black text-gray-900 text-base leading-snug line-clamp-2">
                            {d.title}
                          </h3>
                          <p className="text-xs text-gray-600 font-bold">
                            Qty: {d.quantity} {d.servesApprox ? `· Feeds ~${d.servesApprox}` : ''}
                          </p>
                          <p className="text-xs text-gray-700 bg-gray-50 p-2 border border-gray-200 font-semibold">
                            Expires {friendlyExpiry}
                          </p>

                          {d.claim && (
                            <div className="p-2.5 bg-[#EAF4F6] border border-[#387B85] text-xs font-bold text-gray-900 space-y-1">
                              <div>
                                Claimed by: <span className="text-[#1E464D] font-black">{d.claim.receiver.orgName || d.claim.receiver.name}</span>
                                {d.claim.receiver.phone && ` · ${d.claim.receiver.phone}`}
                              </div>
                              {d.status === 'CLAIMED' && (
                                <p className="text-[11px] text-amber-900 font-extrabold">
                                  ⏳ Awaiting receiver arrival for pickup handoff
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
                          {d.status === 'CLAIMED' && (
                            <button
                              onClick={() => {
                                setScanDonationId(d.id);
                                setShowScanner(true);
                              }}
                              className="w-full btn-primary text-xs py-2 px-3 font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#111827]"
                            >
                              <span>🔍</span> Verify Pickup (Scan / PIN)
                            </button>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/donations/${d.id}`}
                              className="text-xs font-black uppercase text-[#387B85] hover:underline"
                            >
                              View Post →
                            </Link>

                            {d.status === 'AVAILABLE' && (
                              <button
                                onClick={() => handleCancel(d.id)}
                                disabled={isCancelling}
                                className="text-xs text-rose-700 font-black uppercase border border-rose-300 hover:bg-rose-50 px-2.5 py-1"
                              >
                                {isCancelling ? 'Cancelling…' : 'Cancel'}
                              </button>
                            )}

                            {d.status === 'PICKED_UP' && (
                              <span className="text-xs text-emerald-700 font-black flex items-center gap-1">
                                ✓ Handoff Completed
                              </span>
                            )}
                          </div>
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

      {/* Handoff QR Scanner / PIN Modal */}
      {showScanner && (
        <HandoffScannerModal
          donationId={scanDonationId || undefined}
          onClose={() => {
            setShowScanner(false);
            setScanDonationId(null);
          }}
          onVerified={() => {
            queryClient.invalidateQueries({ queryKey: ['my-donations'] });
            queryClient.invalidateQueries({ queryKey: ['my-impact'] });
          }}
        />
      )}
    </div>
  );
}
