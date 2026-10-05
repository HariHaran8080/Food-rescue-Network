import { Link } from 'react-router-dom';
import { Donation } from '../types';
import { getFoodImage, formatFriendlyDate } from '../utils/foodImages';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AVAILABLE:  { label: 'Available', className: 'bg-[#E4F3F5] text-[#1E464D] border-[#75B5BE]' },
  CLAIMED:    { label: 'Claimed', className: 'bg-amber-50 text-amber-800 border-amber-300' },
  PICKED_UP:  { label: 'Completed', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  EXPIRED:    { label: 'Expired', className: 'bg-rose-50 text-rose-700 border-rose-300' },
  CANCELLED:  { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-300' },
};

function TimeLeft({ expiryTime, status }: { expiryTime: string; status: string }) {
  const msLeft = new Date(expiryTime).getTime() - Date.now();
  const hoursLeft = Math.max(0, msLeft / 3_600_000);
  const isExpired = hoursLeft <= 0 || status !== 'AVAILABLE';
  const isUrgent = hoursLeft < 2 && hoursLeft > 0 && status === 'AVAILABLE';

  let label = '';
  if (isExpired || status !== 'AVAILABLE') {
    label = '';
  } else if (hoursLeft < 1) {
    label = `${Math.round(hoursLeft * 60)}m left`;
  } else if (hoursLeft < 24) {
    label = `${Math.round(hoursLeft)}h left`;
  } else {
    label = `${Math.round(hoursLeft / 24)}d left`;
  }

  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-0.5 border ${
        isUrgent
          ? 'text-rose-700 bg-rose-50 border-rose-400'
          : 'text-gray-900 bg-white border-[#111827]'
      }`}
    >
      <span className={`h-1.5 w-1.5 ${isUrgent ? 'bg-rose-500 live-pulse' : 'bg-emerald-600'}`} />
      {label}
    </span>
  );
}

export default function DonationCard({ donation }: { donation: Donation }) {
  const { label, className: statusClass } =
    STATUS_CONFIG[donation.status] ?? { label: donation.status, className: 'bg-gray-100 text-gray-700 border-gray-300' };

  const isAvailable = donation.status === 'AVAILABLE';
  const imageUrl = getFoodImage(donation.foodType, donation.imageUrl);
  const friendlyExpiry = formatFriendlyDate(donation.expiryTime);

  return (
    <Link
      to={`/donations/${donation.id}`}
      className="bg-white flex flex-col justify-between h-full group text-left relative border-2 border-[#111827] shadow-[4px_4px_0px_0px_#111827] hover:shadow-[7px_7px_0px_0px_#92C7CF] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* ── TOP SPACE: POST CATEGORY FOOD IMAGE (E.G. DAIRY, COOKED MEALS) ── */}
      <div className="w-full h-48 relative overflow-hidden bg-gray-100 border-b-2 border-[#111827]">
        <img
          src={imageUrl}
          alt={donation.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Floating Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-[#111827] px-2.5 py-1 text-xs font-black text-gray-900 shadow-[2px_2px_0px_0px_#111827]">
            <span className="w-2 h-2 bg-[#387B85]" />
            <span>{donation.foodType}</span>
          </span>
        </div>

        {/* Floating Status / Time Left Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {isAvailable && (
            <TimeLeft expiryTime={donation.expiryTime} status={donation.status} />
          )}
          <span className={`text-[11px] font-black uppercase px-2.5 py-1 border shadow-[2px_2px_0px_0px_#111827] ${statusClass}`}>
            {label}
          </span>
        </div>
      </div>

      {/* ── BELOW: DETAILS ABOUT THE DONATION ──────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-black text-gray-900 text-lg leading-snug group-hover:text-[#387B85] transition-colors line-clamp-2">
            {donation.title}
          </h3>

          {/* Simple, Non-Complicated Expiry Indicator */}
          {friendlyExpiry && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-[#F4F9F9] px-2.5 py-1.5 border border-[#387B85]/30">
              <svg className="w-3.5 h-3.5 text-[#387B85]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Expires {friendlyExpiry}</span>
            </div>
          )}

          {/* Quantity & Servings Tags */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold pt-1">
            {donation.quantity && (
              <span className="bg-gray-100 text-gray-900 px-2.5 py-1 border border-[#111827]">
                Qty: {donation.quantity}
              </span>
            )}
            {donation.servesApprox && (
              <span className="bg-[#EBF5F7] text-[#1D4D54] px-2.5 py-1 border border-[#75B5BE]">
                Feeds ~{donation.servesApprox}
              </span>
            )}
          </div>

          {/* Description */}
          {donation.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium pt-1">
              {donation.description}
            </p>
          )}
        </div>

        {/* Footer Info & Action Arrow */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex items-center gap-2 text-gray-700">
            <div className="w-6 h-6 bg-[#111827] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
              {(donation.donor.orgName || donation.donor.name).charAt(0).toUpperCase()}
            </div>
            <span className="truncate font-bold text-gray-900">
              {donation.donor.orgName || donation.donor.name}
            </span>
            {donation.distanceKm != null && (
              <span className="text-[#1D4D54] font-extrabold flex-shrink-0">
                · {donation.distanceKm.toFixed(1)} km
              </span>
            )}
          </div>

          <span className="w-7 h-7 bg-[#111827] text-white flex items-center justify-center text-xs font-bold group-hover:bg-[#387B85] transition-colors flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
