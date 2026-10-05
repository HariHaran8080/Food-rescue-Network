import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../api/client';
import { Donation } from '../types';

// Custom map icon with professional status pinpoint
function createCustomIcon(status: string) {
  const isAvailable = status === 'AVAILABLE';
  const bg = isAvailable
    ? 'linear-gradient(135deg, #387B85, #111827)'
    : 'linear-gradient(135deg, #d97706, #78350f)';

  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: ${bg};
      border: 2px solid #ffffff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
    "><div style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff;"></div></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

export default function MapView() {
  const { data: donations, isLoading } = useQuery({
    queryKey: ['donations-map'],
    queryFn: async () => {
      const { data } = await api.get<Donation[]>('/donations');
      return data;
    },
  });

  const center: [number, number] = donations?.[0]
    ? [donations[0].latitude, donations[0].longitude]
    : [19.076, 72.8777];

  const availableCount = donations?.filter((d) => d.status === 'AVAILABLE').length ?? 0;

  if (isLoading) {
    return (
      <div className="animate-slide-up">
        <div className="mb-6">
          <h1 className="text-3xl font-900 text-surface-50">Donation Map</h1>
        </div>
        <div className="glass-card rounded-3xl h-[600px] shimmer border border-rescue-800/50" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-900 text-surface-50">Donation Map</h1>
          <p className="text-rescue-400 text-sm font-600 mt-1">
            {availableCount > 0
              ? `${availableCount} donation${availableCount !== 1 ? 's' : ''} available nearby`
              : 'No available donations at the moment'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-700 text-rescue-400">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rescue-400" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            Claimed
          </span>
        </div>
      </div>

      {/* Map container */}
      <div className="rounded-3xl overflow-hidden border border-rescue-800/60 shadow-glass-lg" style={{ height: '580px' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {donations?.map((d) => {
            return (
              <Marker
                key={d.id}
                position={[d.latitude, d.longitude]}
                icon={createCustomIcon(d.status)}
              >
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <p className="font-800 text-surface-50 mb-1">{d.title}</p>
                    <p className="text-rescue-400 text-xs font-600 mb-2">
                      {d.foodType} · {d.quantity}
                    </p>
                    <p className="text-xs font-600 mb-3 text-rescue-500">
                      <span className={d.status === 'AVAILABLE' ? 'text-rescue-300 font-700' : 'text-amber-400 font-700'}>
                        {d.status.replace('_', ' ')}
                      </span>
                      {' · '}{d.donor.orgName || d.donor.name}
                    </p>
                    <Link
                      to={`/donations/${d.id}`}
                      className="inline-block text-xs font-800 text-rescue-300 hover:text-surface-50 bg-rescue-900/80 border border-rescue-500/40 rounded-xl px-3 py-1.5 transition-colors"
                    >
                      View details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
