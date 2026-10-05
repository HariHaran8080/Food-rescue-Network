import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Claim } from '../types';

interface PickupPassModalProps {
  claim: Claim;
  onClose: () => void;
}

export const PickupPassModal: React.FC<PickupPassModalProps> = ({ claim, onClose }) => {
  const [copied, setCopied] = useState(false);
  const pickupCode = claim.pickupCode || claim.id.slice(0, 6).toUpperCase();

  // QR Code payload contains both verified code and donation reference
  const qrPayload = JSON.stringify({
    type: 'FRN_PICKUP',
    donationId: claim.donationId,
    claimId: claim.id,
    code: pickupCode,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
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

        {/* Modal Header */}
        <div className="text-center space-y-1 pr-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E4F3F5] text-[#1E464D] border-2 border-[#111827] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#111827]">
            <span>📱</span> Digital Pickup Pass
          </div>
          <h2 className="text-2xl font-black text-gray-900 font-display">
            Handoff Verification
          </h2>
          <p className="text-xs text-gray-600 font-semibold">
            Present this code or QR pass to the donor at pickup
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-[#FAFCFD] border-2 border-[#111827] p-6 flex flex-col items-center justify-center shadow-[4px_4px_0px_0px_#92C7CF]">
          <div className="p-3 bg-white border-2 border-[#111827] rounded-none">
            <QRCodeSVG
              value={qrPayload}
              size={190}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mt-3">
            Scan with donor camera
          </p>

          {/* Backup 6-Digit PIN */}
          <div className="w-full mt-4 pt-4 border-t-2 border-dashed border-gray-300 text-center">
            <span className="text-[11px] font-extrabold uppercase text-gray-500 tracking-wider block mb-1">
              Manual 6-Digit Verification PIN
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-[0.2em] font-mono bg-white px-4 py-1.5 border-2 border-[#111827] shadow-[2px_2px_0px_0px_#111827]">
                {pickupCode.slice(0, 3)} {pickupCode.slice(3)}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-2 border-2 border-[#111827] bg-[#EAF4F6] hover:bg-[#92C7CF] text-xs font-black uppercase transition-colors shadow-[2px_2px_0px_0px_#111827]"
                title="Copy verification code"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Donation Details Summary */}
        <div className="bg-[#EAF4F6] border-2 border-[#111827] p-4 space-y-2 text-xs">
          <div className="flex justify-between items-start">
            <span className="font-extrabold text-gray-700">Donation:</span>
            <span className="font-black text-gray-900 text-right truncate max-w-[200px]">
              {claim.donation.title}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="font-extrabold text-gray-700">Donor:</span>
            <span className="font-bold text-gray-900 text-right">
              {claim.donation.donor.orgName || claim.donation.donor.name}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="font-extrabold text-gray-700">Pickup Address:</span>
            <span className="font-semibold text-gray-800 text-right max-w-[220px]">
              {claim.donation.address}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 border-2 border-[#111827] bg-white hover:bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-900 shadow-[3px_3px_0px_0px_#111827] flex items-center justify-center gap-1.5"
          >
            <span>🖨️</span> Print / Save Pass
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 border-2 border-[#111827] bg-[#111827] hover:bg-gray-800 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_#92C7CF]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
