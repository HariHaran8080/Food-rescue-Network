import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import AddressAutocomplete, { AddressSelection } from '../components/AddressAutocomplete';
import { FOOD_TYPE_IMAGES, getFoodImage, formatFriendlyDate } from '../utils/foodImages';

const FOOD_TYPES = [
  { value: 'Cooked meals', label: 'Prepared Meals', desc: 'Warm dishes, soups, meals', icon: '🍲' },
  { value: 'Produce', label: 'Fresh Produce', desc: 'Fruits & vegetables', icon: '🥦' },
  { value: 'Bakery', label: 'Bakery & Bread', desc: 'Bread, pastries, baked goods', icon: '🥖' },
  { value: 'Dairy', label: 'Dairy & Eggs', desc: 'Milk, cheese, yogurt, eggs', icon: '🥛' },
  { value: 'Packaged goods', label: 'Packaged Goods', desc: 'Sealed groceries & pantry', icon: '🥫' },
  { value: 'Other', label: 'Other Food', desc: 'Other quality surplus food', icon: '🍱' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b-2 border-[#111827]">
      <span className="w-2.5 h-2.5 bg-[#387B85]" />
      <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
        {children}
      </h2>
    </div>
  );
}

export default function DonationForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    foodType: 'Dairy',
    quantity: '',
    servesApprox: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  // Intuitive Timing Selection (Replacing complicated dd/mm/yy --:-- inputs)
  const [timingPreset, setTimingPreset] = useState<'3h' | '6h' | 'tonight' | 'tomorrow-noon' | 'tomorrow-night' | 'custom'>('tonight');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [customExpiryTime, setCustomExpiryTime] = useState('20:00');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  // Compute calculated expiry date from preset
  const calculatedExpiry = useMemo(() => {
    const now = new Date();
    if (timingPreset === '3h') {
      return new Date(now.getTime() + 3 * 3600 * 1000);
    }
    if (timingPreset === '6h') {
      return new Date(now.getTime() + 6 * 3600 * 1000);
    }
    if (timingPreset === 'tonight') {
      const d = new Date(now);
      d.setHours(22, 0, 0, 0); // 10:00 PM tonight
      if (d.getTime() <= now.getTime()) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    }
    if (timingPreset === 'tomorrow-noon') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0); // Tomorrow 12:00 PM
      return d;
    }
    if (timingPreset === 'tomorrow-night') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(20, 0, 0, 0); // Tomorrow 8:00 PM
      return d;
    }
    if (timingPreset === 'custom' && customExpiryDate) {
      const [year, month, day] = customExpiryDate.split('-').map(Number);
      const [hours, minutes] = customExpiryTime.split(':').map(Number);
      const d = new Date(year, month - 1, day, hours, minutes, 0);
      return isNaN(d.getTime()) ? new Date(now.getTime() + 4 * 3600 * 1000) : d;
    }
    return new Date(now.getTime() + 4 * 3600 * 1000);
  }, [timingPreset, customExpiryDate, customExpiryTime]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAddressSelect(selection: AddressSelection) {
    setForm((f) => ({
      ...f,
      address: selection.displayName,
      latitude: String(selection.lat),
      longitude: String(selection.lng),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.warning('Please enter a title for the donation.');
      return;
    }
    if (!form.quantity.trim()) {
      toast.warning('Please provide the estimated quantity.');
      return;
    }
    if (!form.latitude || !form.longitude) {
      toast.warning('Please select an address from suggestions to pin your pickup location.');
      return;
    }

    const expiryTime = calculatedExpiry;
    if (expiryTime.getTime() <= Date.now()) {
      toast.warning('Expiry time must be in the future.');
      return;
    }

    // Pickup window starts now and runs until expiry
    const pickupStart = new Date();
    const pickupEnd = new Date(expiryTime);

    // Auto-assign category image URL based on selected foodType
    const imageUrl = getFoodImage(form.foodType);

    setLoading(true);
    try {
      await api.post('/donations', {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        foodType: form.foodType,
        quantity: form.quantity.trim(),
        servesApprox: form.servesApprox ? parseInt(form.servesApprox) : undefined,
        expiryTime: expiryTime.toISOString(),
        pickupWindowStart: pickupStart.toISOString(),
        pickupWindowEnd: pickupEnd.toISOString(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        address: form.address,
        imageUrl,
      });
      toast.success('Surplus food posted successfully! Local relief partners have been notified.');
      navigate('/donor/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post donation. Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  const activeImage = getFoodImage(form.foodType);
  const friendlyExpiryText = formatFriendlyDate(calculatedExpiry);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-12">
      {/* ── Page Header (High Contrast & Visible) ─────────────────────────── */}
      <div className="border-b-2 border-[#111827] pb-5">
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1 border border-[#111827] shadow-[2px_2px_0px_0px_#92C7CF] text-xs font-black text-gray-900 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>New Surplus Food Listing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight font-display">
          Post Surplus Food
        </h1>
        <p className="text-sm font-semibold text-gray-600 mt-1">
          Share surplus meals and ingredients with nearby shelters and communities in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: The Form Inputs ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* 1. Category Selection */}
          <div className="bg-white p-6 border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF]">
            <SectionLabel>1. Food Category</SectionLabel>
            <p className="text-xs font-bold text-gray-700 mb-3">
              Select category to display the corresponding product image on your post:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FOOD_TYPES.map((ft) => {
                const isSelected = form.foodType === ft.value;
                return (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => update('foodType', ft.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 text-center border-2 transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#EAF4F6] border-[#111827] shadow-[3px_3px_0px_0px_#111827] translate-y-[-1px]'
                        : 'bg-white border-gray-200 hover:border-[#111827] hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{ft.icon}</span>
                    <span className="text-xs font-extrabold text-gray-900 leading-tight">
                      {ft.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {ft.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Details */}
          <div className="bg-white p-6 border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-4">
            <SectionLabel>2. Food Details</SectionLabel>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Item Title *
              </label>
              <input
                id="donation-title"
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Fresh Milk Cartons & Artisanal Cheese"
                className="w-full px-4 py-3 bg-white border-2 border-[#111827] text-sm font-bold text-gray-900 placeholder-gray-400 focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Quantity *
                </label>
                <input
                  id="donation-quantity"
                  required
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                  placeholder="e.g. 15 Liters / 30 Packs"
                  className="w-full px-4 py-3 bg-white border-2 border-[#111827] text-sm font-bold text-gray-900 placeholder-gray-400 focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Feeds Approx. (People)
                </label>
                <input
                  id="donation-serves"
                  type="number"
                  min={1}
                  value={form.servesApprox}
                  onChange={(e) => update('servesApprox', e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-4 py-3 bg-white border-2 border-[#111827] text-sm font-bold text-gray-900 placeholder-gray-400 focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Description / Notes <span className="text-gray-500 normal-case">(optional)</span>
              </label>
              <textarea
                id="donation-description"
                rows={2}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Storage temperature, dietary tags, packaged date, or pickup instructions…"
                className="w-full px-4 py-3 bg-white border-2 border-[#111827] text-sm font-semibold text-gray-900 placeholder-gray-400 focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 3. Simple & Clean Timing (No Complicated dd/mm/yy slashes!) */}
          <div className="bg-white p-6 border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-4">
            <SectionLabel>3. Expiry & Pickup Schedule</SectionLabel>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                When does this food expire?
              </label>
              
              {/* Intuitive 1-click Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: '3h', label: 'In 3 Hours' },
                  { id: '6h', label: 'In 6 Hours' },
                  { id: 'tonight', label: 'Tonight (10 PM)' },
                  { id: 'tomorrow-noon', label: 'Tomorrow Noon' },
                  { id: 'tomorrow-night', label: 'Tomorrow Night' },
                  { id: 'custom', label: 'Custom Time' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setTimingPreset(preset.id as any)}
                    className={`px-3 py-2 text-xs font-extrabold border-2 transition-all ${
                      timingPreset === preset.id
                        ? 'bg-[#111827] text-white border-[#111827] shadow-[2px_2px_0px_0px_#92C7CF]'
                        : 'bg-gray-50 text-gray-900 border-gray-300 hover:border-black'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date & Time Inputs (Only shown if 'Custom' is chosen) */}
              {timingPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 border border-[#111827]">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#111827] text-xs font-bold text-gray-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Time</label>
                    <input
                      type="time"
                      value={customExpiryTime}
                      onChange={(e) => setCustomExpiryTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#111827] text-xs font-bold text-gray-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Real-time Human-Friendly Expiry Badge */}
              <div className="mt-3 p-3 bg-[#EAF4F6] border border-[#111827] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-gray-900">
                    Expiry Set To:
                  </span>
                </div>
                <span className="text-xs font-black text-[#1D4D54] font-mono">
                  {friendlyExpiryText || 'Select a time'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Location */}
          <div className="bg-white p-6 border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] space-y-3">
            <SectionLabel>4. Pickup Location</SectionLabel>
            <AddressAutocomplete
              label="Street Address / Facility *"
              labelClassName="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2"
              placeholder="Start typing your street address or facility name…"
              required
              onSelect={handleAddressSelect}
              onTextChange={(text) => update('address', text)}
              showLocationButton
            />
            {form.latitude && form.longitude && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-400 text-xs font-bold text-emerald-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pinned successfully for map and local radius discovery</span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="donation-submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-sm font-black uppercase tracking-wider"
          >
            {loading ? 'Posting Surplus Batch…' : 'Publish Donation to Community ▶'}
          </button>
        </form>

        {/* ── Right Column: LIVE POST BOX LAYOUT PREVIEW ──────────────────── */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#111827]">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Live Post Box Layout Preview
            </span>
            <span className="text-[10px] font-bold bg-[#111827] text-white px-2 py-0.5">
              FEED CARD
            </span>
          </div>

          <p className="text-xs font-medium text-gray-600">
            This is exactly how community shelters will see your post in the live topics feed:
          </p>

          {/* ── THE POST BOX CONTAINER ────────────────────────────────────── */}
          <div className="bg-white border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] overflow-hidden">
            
            {/* 1. TOP SPACE: SELECTED CATEGORY IMAGE (E.G. DAIRY PRODUCT IMAGE) */}
            <div className="w-full h-52 relative overflow-hidden bg-gray-100 border-b-2 border-[#111827]">
              <img
                src={activeImage}
                alt={form.foodType}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Category Pill Tag on Image */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1.5 bg-white border border-[#111827] px-3 py-1 text-xs font-black text-gray-900 shadow-[2px_2px_0px_0px_#111827]">
                  <span className="w-2 h-2 bg-[#387B85]" />
                  <span>{form.foodType}</span>
                </span>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1.5 bg-[#E4F3F5] text-[#1E464D] border border-[#75B5BE] px-2.5 py-1 text-xs font-black shadow-[2px_2px_0px_0px_#111827]">
                  Available
                </span>
              </div>
            </div>

            {/* 2. BELOW: DETAILS ABOUT THE DONATION */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-snug">
                  {form.title.trim() || 'Your Food Item Title'}
                </h3>

                {/* Expiry timing preview */}
                <div className="mt-2.5 flex items-center gap-2 text-xs font-bold text-gray-800 bg-[#F4F9F9] px-2.5 py-1.5 border border-[#387B85]/30">
                  <svg className="w-3.5 h-3.5 text-[#387B85] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Expires {friendlyExpiryText}</span>
                </div>
              </div>

              {/* Quantity / Servings */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span className="bg-gray-100 text-gray-900 px-2.5 py-1 border border-[#111827]">
                  Qty: {form.quantity.trim() || 'e.g. 15 Liters'}
                </span>
                {form.servesApprox && (
                  <span className="bg-[#EBF5F7] text-[#1D4D54] px-2.5 py-1 border border-[#75B5BE]">
                    Feeds ~{form.servesApprox} people
                  </span>
                )}
              </div>

              {/* Notes */}
              {form.description && (
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-medium">
                  {form.description}
                </p>
              )}

              {/* Address / Pickup Preview */}
              <div className="pt-3 border-t border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-2 truncate">
                <svg className="w-3.5 h-3.5 text-[#387B85] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">
                  {form.address || 'Address selected below will display here'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
