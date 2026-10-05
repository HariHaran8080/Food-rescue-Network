import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import BrowseDonations from './pages/BrowseDonations';
import DonationForm from './pages/DonationForm';
import DonorDashboard from './pages/DonorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard';
import MapView from './pages/MapView';
import DonationDetail from './pages/DonationDetail';

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'DONOR' | 'RECEIVER' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<BrowseDonations />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/donations/:id" element={<DonationDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/donor/new"
              element={
                <ProtectedRoute role="DONOR">
                  <DonationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/dashboard"
              element={
                <ProtectedRoute role="DONOR">
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receiver/dashboard"
              element={
                <ProtectedRoute role="RECEIVER">
                  <ReceiverDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
