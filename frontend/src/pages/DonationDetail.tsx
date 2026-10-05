import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Donation } from '../types';
import { getFoodImage, formatFriendlyDate } from '../utils/foodImages';
import { PickupPassModal } from '../components/PickupPassModal';
import { HandoffScannerModal } from '../components/HandoffScannerModal';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AVAILABLE:  { label: 'Available',  className: 'bg-[#E4F3F5] text-[#1E464D] border-[#75B5BE]' },
  CLAIMED:    { label: 'Claimed',    className: 'bg-amber-50 text-amber-800 border-amber-300' },
  PICKED_UP:  { label: 'Picked Up',  className: 'bg-gray-100 text-gray-700 border-gray-300' },
  EXPIRED:    { label: 'Expired',    className: 'bg-rose-50 text-rose-700 border-rose-300' },
  CANCELLED:  { label: 'Cancelled',  className: 'bg-rose-50 text-rose-700 border-rose-300' },
};

function CountdownBadge({ expiryTime }: { expiryTime: string }) {
  const [remaining, setRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const ms = new Date(expiryTime).getTime() - Date.now();
      if (ms <= 0) { setRemaining('Expired'); setIsUrgent(false); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setIsUrgent(ms < 7200000);
      setRemaining(h > 0 ? `${h}h ${m}m left` : m > 0 ? `${m}m ${s}s left` : `${s}s left`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiryTime]);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 border ${isUrgent ? 'text-rose-700 bg-rose-50 border-rose-400' : 'text-gray-900 bg-gray-50 border-gray-300'}`}>
      <span className={`h-2 w-2 rounded-full ${isUrgent ? 'bg-rose-500 live-pulse' : 'bg-emerald-600'}`} />
      {remaining}
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 items-start p-3 bg-gray-50 border border-gray-200">
      <div className="w-8 h-8 bg-white border border-[#111827] flex items-center justify-center text-[#387B85] flex-shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_#111827]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900 leading-snug">{value}</p>
      </div>
    </div>
  );
}

export default function DonationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [claiming, setClaiming] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { data: donation, isLoading } = useQuery({
    queryKey: ['donation', id],
    queryFn: async () => {
      const { data } = await api.get<Donation>(`/donations/${id}`);
      return data;
    },
  });

  async function handleClaim() {
    setClaiming(true);
    try {
      await api.post(`/claims/${id}`);
      queryClient.invalidateQueries({ queryKey: ['donation', id] });
      toast.success('Donation claimed! Head to your dashboard to coordinate pickup.');
      navigate('/receiver/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const serverMsg: string = err.response?.data?.error || '';
      if (status === 409) {
        toast.error('This donation was just claimed by someone else.');
        queryClient.invalidateQueries({ queryKey: ['donation', id] });
      } else if (status === 410) {
        toast.error('This food donation has expired and is no longer available.');
      } else if (status === 404) {
        toast.error('This donation no longer exists — it may have been cancelled.');
      } else if (status === 401) {
        toast.warning('You need to be logged in to claim a donation.');
      } else if (status === 403) {
        toast.warning('Only receivers can claim donations.');
      } else {
        toast.error(serverMsg || 'Something went wrong while claiming. Please try again.');
      }
    } finally {
      setClaiming(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-64 bg-gray-200 border-2 border-gray-300 shimmer" />
        <div className="h-48 bg-gray-200 border-2 border-gray-300 shimmer" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="text-center py-20 bg-white border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] max-w-xl mx-auto p-8">
        <p className="text-xl font-black text-gray-900 mb-2">Donation not found</p>
        <p className="text-sm text-gray-600 mb-4">This listing may have been completed, cancelled, or expired.</p>
        <Link to="/" className="btn-primary text-xs">
          ← Browse Live Listings
        </Link>
      </div>
    );
  }

  const { label, className: statusClass } =
    STATUS_CONFIG[donation.status] ?? { label: donation.status, className: 'bg-gray-100 text-gray-700 border-gray-300' };
  const isAvailable = donation.status === 'AVAILABLE';
  const imageUrl = getFoodImage(donation.foodType, donation.imageUrl);
  const friendlyExpiry = formatFriendlyDate(donation.expiryTime);
  const friendlyPickupStart = formatFriendlyDate(donation.pickupWindowStart);
  const friendlyPickupEnd = formatFriendlyDate(donation.pickupWindowEnd);

  return (
    <div className="max-w-3xl mx-auto animate-slide-up space-y-6 pb-12">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-gray-700 hover:text-black font-extrabold uppercase tracking-wider transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Live Feed
      </Link>

      {/* ── THE POST BOX LAYOUT ───────────────────────────────────────────── */}
      <div className="bg-white border-2 border-[#111827] shadow-[8px_8px_0px_0px_#92C7CF] overflow-hidden">
        
        {/* 1. TOP SPACE: CATEGORY FOOD IMAGE (E.G. DAIRY, COOKED MEALS) */}
        <div className="w-full h-64 sm:h-80 relative overflow-hidden bg-gray-100 border-b-2 border-[#111827]">
          <img
            src={imageUrl}
            alt={donation.title}
            className="w-full h-full object-cover"
          />

          {/* Floating Category Pill on Image */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm border-2 border-[#111827] px-3.5 py-1.5 text-xs font-black text-gray-900 shadow-[3px_3px_0px_0px_#111827]">
              <span className="w-2.5 h-2.5 bg-[#387B85]" />
              <span>{donation.foodType}</span>
            </span>
          </div>

          {/* Floating Status Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isAvailable && (
              <CountdownBadge expiryTime={donation.expiryTime} />
            )}
            <span className={`text-xs font-black uppercase px-3 py-1.5 border-2 shadow-[3px_3px_0px_0px_#111827] ${statusClass}`}>
              {label}
            </span>
          </div>
        </div>

        {/* 2. BELOW: DETAILS ABOUT THE DONATION */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header & Title */}
          <div className="border-b-2 border-[#111827] pb-5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug font-display">
              {donation.title}
            </h1>
            <p className="text-xs font-bold text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
              <span className="bg-[#EAF4F6] text-[#1D4D54] px-2.5 py-1 border border-[#387B85]/30">
                Quantity: {donation.quantity}
              </span>
              {donation.servesApprox && (
                <span className="bg-gray-100 text-gray-900 px-2.5 py-1 border border-[#111827]">
                  Feeds ~{donation.servesApprox} people
                </span>
              )}
            </p>

            {donation.description && (
              <p className="text-sm text-gray-700 mt-4 leading-relaxed font-medium bg-gray-50 p-4 border border-gray-200">
                {donation.description}
              </p>
            )}
          </div>

          {/* Simple & Clean Timing + Location Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              label="Donor Organization"
              value={donation.donor.orgName || donation.donor.name}
            />

            {donation.donor.phone && (
              <InfoRow
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
                label="Direct Contact"
                value={donation.donor.phone}
              />
            )}

            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Pickup Address"
              value={donation.address}
            />

            {/* Clean, Non-Complicated Expiry Format */}
            <InfoRow
              icon={
                <svg className="w-4 h-4 text-[#387B85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Food Expiry"
              value={friendlyExpiry ? `Expires ${friendlyExpiry}` : 'Fresh daily'}
            />

            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Pickup Window Start"
              value={friendlyPickupStart || 'Immediate'}
            />

            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Pickup Window End"
              value={friendlyPickupEnd || 'Until Expiry'}
            />
          </div>

          {/* Action Button for Receivers */}
          {user?.role === 'RECEIVER' && isAvailable && (
            <button
              id="claim-btn"
              onClick={handleClaim}
              disabled={claiming}
              className="btn-primary w-full py-4 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#111827]"
            >
              {claiming ? 'Confirming Claim…' : 'Claim This Food Donation For Pickup ▶'}
            </button>
          )}

          {/* Receiver who claimed this: show Digital Pass */}
          {user?.role === 'RECEIVER' && donation.status === 'CLAIMED' && (donation as any)?.claim?.receiverId === user.id && (
            <button
              onClick={() => setShowPass(true)}
              className="btn-primary w-full py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#111827]"
            >
              <span>📱</span> View Digital Pickup Pass (QR Code & PIN)
            </button>
          )}

          {/* Donor who owns this: verify handoff button */}
          {user?.role === 'DONOR' && donation.status === 'CLAIMED' && donation.donor.id === user.id && (
            <button
              onClick={() => setShowScanner(true)}
              className="btn-primary w-full py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#111827]"
            >
              <span>🔍</span> Verify Pickup Handoff (Scan QR / PIN)
            </button>
          )}

          {donation.status === 'PICKED_UP' && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-center shadow-[3px_3px_0px_0px_#111827]">
              <p className="text-emerald-900 text-xs font-black uppercase tracking-wider">
                ✓ Food Rescued & Pickup Verified! Thank you for reducing waste.
              </p>
            </div>
          )}

          {user?.role === 'RECEIVER' && !isAvailable && donation.status !== 'PICKED_UP' && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 text-center">
              <p className="text-amber-900 text-xs font-bold uppercase tracking-wider">
                This donation is {label.toLowerCase()} and is no longer available.
              </p>
            </div>
          )}

          {!user && isAvailable && (
            <div className="p-6 bg-[#EAF4F6] border-2 border-[#111827] text-center space-y-3">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Shelters & Relief Organizations: Sign in or register to claim
              </p>
              <Link to="/login" className="btn-primary text-xs inline-block">
                Sign In to Claim Food
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* Receiver Pickup Pass Modal */}
      {showPass && (donation as any)?.claim && (
        <PickupPassModal
          claim={{ ...(donation as any).claim, donation }}
          onClose={() => setShowPass(false)}
        />
      )}

      {/* Donor Handoff Scanner Modal */}
      {showScanner && (
        <HandoffScannerModal
          donationId={donation.id}
          onClose={() => setShowScanner(false)}
          onVerified={() => {
            queryClient.invalidateQueries({ queryKey: ['donation', id] });
          }}
        />
      )}
    </div>
  );
}
