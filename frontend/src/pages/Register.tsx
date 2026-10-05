import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import AddressAutocomplete, { AddressSelection } from '../components/AddressAutocomplete';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR' as Role,
    orgName: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAddressSelect(selection: AddressSelection) {
    setForm((f) => ({
      ...f,
      address: selection.displayName,
      latitude: selection.lat,
      longitude: selection.lng,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.orgName?.trim()) payload.orgName = form.orgName.trim();
      if (form.address?.trim()) payload.address = form.address.trim();
      if (typeof form.latitude === 'number' && !isNaN(form.latitude)) payload.latitude = form.latitude;
      if (typeof form.longitude === 'number' && !isNaN(form.longitude)) payload.longitude = form.longitude;
      if (form.phone?.trim()) payload.phone = form.phone.trim();

      const { data } = await api.post('/auth/register', payload);
      login(data.user, data.token);
      navigate(data.user.role === 'DONOR' ? '/donor/dashboard' : '/');
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Registration failed. Please check your details and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center -mt-4 px-4">
      <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_#111827] animate-scale-in border-2 border-[#111827] bg-white">
        
        {/* Left: brand panel */}
        <div
          className="hidden md:flex flex-col justify-between w-5/12 p-10 relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(4, 14, 10, 0.90) 0%, rgba(8, 28, 21, 0.97) 100%), url("/auth-bg.jpg")',
          }}
        >
          {/* Glow blobs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-0 w-64 h-64 bg-emerald-600/15 rounded-full blur-3xl" />

          <div className="relative">
            <Link to="/" className="flex items-center gap-3 mb-10 group">
              <img
                src="/logo.png"
                alt="Food Rescue Logo"
                className="h-11 w-auto object-contain brightness-110"
              />
              <span className="font-black text-white text-xl tracking-tight font-display">
                Food<span className="text-[#92C7CF]">Rescue</span>.
              </span>
            </Link>
            <h2 className="text-2xl font-black text-white mb-3 leading-snug font-display">
              Join the network.<br />
              <span className="text-[#92C7CF]">Make an impact.</span>
            </h2>
            <p className="text-sm text-white/90 font-medium leading-relaxed">
              Whether you have food to share or need food for your organization — welcome to the community.
            </p>
          </div>

          <div className="relative">
            {/* Column box on the left side: clean white text */}
            <div className="bg-black/50 backdrop-blur-md rounded-2xl p-5 border-2 border-white/30">
              <p className="text-xs text-white uppercase tracking-wider font-black mb-3">Choose your role</p>
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border-2 transition-all ${form.role === 'DONOR' ? 'border-white bg-white/20' : 'border-white/20 bg-black/30'}`}>
                  <p className="text-sm font-bold text-white">Donor</p>
                  <p className="text-xs text-white/90 font-medium mt-0.5">Restaurants, grocery stores & caterers with surplus food</p>
                </div>
                <div className={`p-3 rounded-xl border-2 transition-all ${form.role === 'RECEIVER' ? 'border-white bg-white/20' : 'border-white/20 bg-black/20'}`}>
                  <p className="text-sm font-bold text-white">Receiver</p>
                  <p className="text-xs text-white/90 font-medium mt-0.5">Shelters, community kitchens, NGOs & individuals</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form with black text */}
        <div className="flex-1 bg-white border-t-2 md:border-t-0 md:border-l-2 border-[#111827] p-8 md:p-10 overflow-y-auto max-h-[90vh] text-black">
          <div className="max-w-sm mx-auto">
            <h1 className="text-2xl font-black text-black mb-1 font-display">Create account</h1>
            <p className="text-sm text-gray-800 mb-6 font-semibold">Join the Food Rescue Network today</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">I am a…</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['DONOR', 'RECEIVER'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      id={`role-${r.toLowerCase()}`}
                      onClick={() => update('role', r)}
                      className={`py-3 px-4 border-2 text-sm font-bold transition-all duration-150 ${
                        form.role === r
                          ? 'bg-[#111827] border-[#111827] text-white shadow-[2px_2px_0px_0px_#92C7CF]'
                          : 'bg-white border-[#111827] text-black hover:bg-gray-100'
                      }`}
                    >
                      {r === 'DONOR' ? 'Donor' : 'Receiver'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">Full Name</label>
                <input
                  id="register-name"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-[#111827] focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              {/* Org name */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  Organization <span className="normal-case font-medium text-gray-700">(optional)</span>
                </label>
                <input
                  id="register-orgname"
                  value={form.orgName}
                  onChange={(e) => update('orgName', e.target.value)}
                  placeholder="e.g. Green Table Restaurant"
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-[#111827] focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">Email</label>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-[#111827] focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">Password</label>
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 8 chars (upper, lower, number)"
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-[#111827] focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              {/* Address */}
              <AddressAutocomplete
                label="Your Location"
                labelClassName="block text-xs font-bold text-black uppercase tracking-wider mb-2"
                placeholder="Start typing your address…"
                required={false}
                onSelect={handleAddressSelect}
                onTextChange={(text) => update('address', text)}
                showLocationButton
              />

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  Phone <span className="normal-case font-medium text-gray-700">(optional)</span>
                </label>
                <input
                  id="register-phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full px-4 py-3 text-sm font-bold text-black bg-white border-2 border-[#111827] focus:shadow-[4px_4px_0px_0px_#92C7CF] outline-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border-2 border-rose-600">
                  <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-rose-900 text-sm font-bold">{error}</span>
                </div>
              )}

              <button
                id="register-submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm font-black mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-sm text-black text-center mt-5 font-semibold">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-black underline hover:text-[#387B85] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
