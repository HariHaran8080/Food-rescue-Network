import React from 'react';
import { ImpactStats } from '../types';

interface ImpactCertificateModalProps {
  stats: ImpactStats;
  onClose: () => void;
}

export const ImpactCertificateModal: React.FC<ImpactCertificateModalProps> = ({
  stats,
  onClose,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const certNumber = `FRN-ESG-${Math.abs(stats.user.name.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0))
    .toString(16)
    .toUpperCase()
    .slice(0, 8)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white border-4 border-[#111827] shadow-[12px_12px_0px_0px_#111827] max-w-2xl w-full p-6 sm:p-10 relative space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="print:hidden absolute top-4 right-4 w-9 h-9 border-2 border-[#111827] bg-[#EAF4F6] text-gray-900 font-black hover:bg-[#92C7CF] transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_#111827]"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Certificate Border Frame */}
        <div className="border-4 border-double border-[#111827] p-6 sm:p-8 bg-[#FAFCFD] text-center relative overflow-hidden">
          {/* Subtle Background Seal */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border-8 border-dashed border-[#92C7CF]/30 flex items-center justify-center pointer-events-none select-none">
            <span className="text-4xl text-[#387B85]/20 font-black rotate-[-20deg]">VERIFIED</span>
          </div>

          {/* Certificate Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111827] text-white text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#92C7CF]">
              🌱 Food Rescue Network · ESG & Sustainability
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase font-display tracking-tight pt-2">
              Certificate of Climate & Community Impact
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Issued for Surplus Food Diversion & Zero-Waste Stewardship
            </p>
          </div>

          <div className="w-24 h-1 bg-[#387B85] mx-auto my-4"></div>

          {/* Recipient */}
          <div className="my-6 space-y-1">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              This certifies the verified social contribution of:
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E464D] underline decoration-[#92C7CF] decoration-4 font-display">
              {stats.user.name}
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              Role: {stats.user.role === 'DONOR' ? 'Certified Food Donor' : 'Community Food Rescuer'}
            </p>
          </div>

          {/* Impact Stats Grid in Certificate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-left">
            <div className="bg-white border-2 border-[#111827] p-3 shadow-[2px_2px_0px_0px_#111827]">
              <p className="text-2xl font-black text-gray-900 font-display">{stats.totalMeals}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Meals Rescued</p>
            </div>
            <div className="bg-white border-2 border-[#111827] p-3 shadow-[2px_2px_0px_0px_#111827]">
              <p className="text-2xl font-black text-[#387B85] font-display">{stats.co2KgSaved} kg</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">CO₂e Diverted</p>
            </div>
            <div className="bg-white border-2 border-[#111827] p-3 shadow-[2px_2px_0px_0px_#111827]">
              <p className="text-2xl font-black text-blue-700 font-display">{stats.waterLitersSaved.toLocaleString()} L</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Water Conserved</p>
            </div>
            <div className="bg-white border-2 border-[#111827] p-3 shadow-[2px_2px_0px_0px_#111827]">
              <p className="text-2xl font-black text-emerald-700 font-display">${stats.moneySavedUsd}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Social Value</p>
            </div>
          </div>

          {/* Description statement */}
          <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed italic">
            "By intercepting wholesome surplus food prior to landfill destination, this organization has directly reduced greenhouse methane emissions, conserved vital agricultural freshwater, and provided dignified nourishment to the local community."
          </p>

          {/* Signature / Issue Row */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600 gap-4">
            <div className="text-left">
              <p className="font-extrabold text-gray-800">Date Issued: {currentDate}</p>
              <p className="text-[10px] font-mono text-gray-500">Ref: {certNumber}</p>
            </div>

            <div className="text-center sm:text-right">
              <div className="inline-block border-2 border-[#111827] bg-[#EAF4F6] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1E464D] shadow-[2px_2px_0px_0px_#111827]">
                ✓ Verified Network Record
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Food Rescue Network Registry</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="print:hidden flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 border-2 border-[#111827] bg-[#387B85] hover:bg-[#1E464D] text-white font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#111827] flex items-center justify-center gap-2"
          >
            <span>🖨️</span> Print / Save PDF Certificate
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 border-2 border-[#111827] bg-white hover:bg-gray-100 text-gray-900 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#111827]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
