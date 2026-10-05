import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

interface HandoffScannerModalProps {
  donationId?: string; // Optional: if opened for a specific donation
  onClose: () => void;
  onVerified?: () => void;
}

export const HandoffScannerModal: React.FC<HandoffScannerModalProps> = ({
  donationId,
  onClose,
  onVerified,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    donationTitle: string;
    receiverName: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'handoff-qr-reader';

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#92C7CF', '#387B85', '#111827', '#FBBF24'],
      });
    } catch {
      // Ignore if confetti fails
    }
  };

  // Perform backend verification
  const executeVerification = async (code: string, explicitDonationId?: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await api.post('/claims/verify-pickup', {
        code,
        donationId: explicitDonationId || donationId,
      });

      triggerConfetti();
      setVerifiedResult({
        donationTitle: response.data.donation?.title || 'Food Donation',
        receiverName:
          response.data.receiver?.orgName ||
          response.data.receiver?.name ||
          'Authorized Receiver',
      });
      toast.success('Handoff verified successfully!');

      if (onVerified) {
        onVerified();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Verification failed. Please check the code and try again.';
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle scanned QR payload
  const handleQrSuccess = async (decodedText: string) => {
    // Stop scanner as soon as a code is detected to prevent repeated calls
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop().catch(() => {});
      setIsScannerRunning(false);
    }

    try {
      // Check if decoded text is JSON
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        const payload = JSON.parse(decodedText);
        if (payload.code) {
          await executeVerification(payload.code, payload.donationId);
          return;
        }
      }

      // Check if format is FRN:donationId:code
      if (decodedText.startsWith('FRN:')) {
        const parts = decodedText.split(':');
        if (parts.length >= 3) {
          await executeVerification(parts[2], parts[1]);
          return;
        }
      }

      // Fallback: treated as raw code
      await executeVerification(decodedText.trim());
    } catch {
      // Fallback to raw text
      await executeVerification(decodedText.trim());
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        handleQrSuccess,
        () => {
          // ignore scan frame errors
        }
      );
      setIsScannerRunning(true);
    } catch (err: any) {
      console.warn('Camera failed to start:', err);
      setCameraError(
        'Unable to access camera. Please check camera permissions or use manual 6-digit PIN.'
      );
      setIsScannerRunning(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      setIsScannerRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'scan' && !verifiedResult) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, verifiedResult]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await executeVerification(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white border-4 border-[#111827] shadow-[10px_10px_0px_0px_#111827] max-w-md w-full p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 border-2 border-[#111827] bg-[#EAF4F6] text-gray-900 font-black hover:bg-[#92C7CF] transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_#111827]"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Success State */}
        {verifiedResult ? (
          <div className="text-center space-y-5 py-4 animate-scale-up">
            <div className="w-16 h-16 bg-[#E4F3F5] text-[#1E464D] border-4 border-[#111827] shadow-[4px_4px_0px_0px_#111827] rounded-none mx-auto flex items-center justify-center text-3xl font-black">
              ✓
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border-2 border-[#111827] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#111827]">
                Pickup Confirmed
              </span>
              <h2 className="text-2xl font-black text-gray-900 font-display">
                Food Rescued Successfully!
              </h2>
              <p className="text-sm font-semibold text-gray-600">
                You handed over{' '}
                <strong className="text-gray-900 font-black">{verifiedResult.donationTitle}</strong>{' '}
                to{' '}
                <strong className="text-[#387B85] font-black">{verifiedResult.receiverName}</strong>.
              </p>
            </div>

            <div className="bg-[#EAF4F6] border-2 border-[#111827] p-4 text-xs text-gray-700 font-bold space-y-1 shadow-[2px_2px_0px_0px_#111827]">
              <p>🌱 Status has been updated to Picked Up.</p>
              <p>📊 Environmental and community impact credits have been logged!</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 border-2 border-[#111827] bg-[#111827] hover:bg-gray-800 text-white font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#92C7CF]"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Normal State: Tabs and Scanner */
          <div className="space-y-6">
            <div className="text-center space-y-1 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E4F3F5] text-[#1E464D] border-2 border-[#111827] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#111827]">
                <span>🔍</span> Handoff Scanner
              </div>
              <h2 className="text-2xl font-black text-gray-900 font-display">
                Verify Food Pickup
              </h2>
              <p className="text-xs text-gray-600 font-semibold">
                Scan receiver pass or type their 6-digit PIN
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 border-2 border-[#111827] p-1 bg-gray-100 shadow-[2px_2px_0px_0px_#111827]">
              <button
                type="button"
                onClick={() => setActiveTab('scan')}
                className={`py-2 text-xs font-black uppercase tracking-wider transition-all border ${
                  activeTab === 'scan'
                    ? 'bg-white text-gray-900 border-[#111827] shadow-[2px_2px_0px_0px_#111827]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                📷 Camera Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-2 text-xs font-black uppercase tracking-wider transition-all border ${
                  activeTab === 'manual'
                    ? 'bg-white text-gray-900 border-[#111827] shadow-[2px_2px_0px_0px_#111827]'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                ⌨️ Manual PIN
              </button>
            </div>

            {/* Scan Tab */}
            {activeTab === 'scan' && (
              <div className="space-y-3">
                <div className="relative border-2 border-[#111827] bg-black overflow-hidden shadow-[4px_4px_0px_0px_#92C7CF] min-h-[260px] flex items-center justify-center">
                  <div id={readerElementId} className="w-full"></div>

                  {cameraError && (
                    <div className="absolute inset-0 bg-white/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                      <span className="text-2xl">⚠️</span>
                      <p className="text-xs font-bold text-gray-800">{cameraError}</p>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="btn-primary text-xs py-1.5 px-3 uppercase font-black"
                      >
                        Enter 6-Digit PIN Instead
                      </button>
                    </div>
                  )}

                  {isVerifying && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-8 h-8 border-4 border-[#387B85] border-t-transparent animate-spin mb-2"></div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">
                        Verifying Pickup Pass…
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-center text-gray-500 font-semibold">
                  Point camera at receiver's digital or printed QR pass
                </p>
              </div>
            )}

            {/* Manual PIN Tab */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-800 tracking-wider block">
                    6-Digit Receiver Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 748 291"
                    className="w-full text-center text-2xl font-black font-mono tracking-[0.25em] p-3 border-2 border-[#111827] focus:outline-none focus:ring-2 focus:ring-[#92C7CF] shadow-[3px_3px_0px_0px_#111827]"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 font-semibold">
                    The receiver can see their 6-digit PIN under their pickup pass.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!manualCode.trim() || isVerifying}
                  className="w-full py-3 px-4 border-2 border-[#111827] bg-[#111827] hover:bg-gray-800 text-white font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#92C7CF] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying…' : 'Verify & Complete Pickup'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
