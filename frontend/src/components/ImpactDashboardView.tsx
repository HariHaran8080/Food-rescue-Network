import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ImpactStats } from '../types';
import { ImpactCertificateModal } from './ImpactCertificateModal';

export const ImpactDashboardView: React.FC = () => {
  const [showCertificate, setShowCertificate] = useState(false);

  const { data: stats, isLoading, isError } = useQuery<ImpactStats>({
    queryKey: ['my-impact'],
    queryFn: async () => {
      const { data } = await api.get<ImpactStats>('/impact/mine');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-[#111827] shadow-[6px_6px_0px_0px_#92C7CF] p-8 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#387B85] border-t-transparent animate-spin mx-auto"></div>
        <p className="text-xs font-black uppercase text-gray-700 tracking-wider">
          Calculating Environmental & Community Impact…
        </p>
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const categoryEntries = Object.entries(stats.categoryBreakdown || {});
  const nextMilestone = stats.milestones.find((m) => !m.unlocked) || stats.milestones[stats.milestones.length - 1];
  const progressPercent = nextMilestone
    ? Math.min(100, Math.round((stats.totalMeals / nextMilestone.targetMeals) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* ── Impact Section Header ───────────────────────────────────────── */}
      <div className="bg-[#FAFCFD] border-2 border-[#111827] p-6 shadow-[6px_6px_0px_0px_#111827] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E4F3F5] text-[#1E464D] border-2 border-[#111827] text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#111827]">
            <span>🌱</span> ESG & Climate Footprint
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display mt-2">
            Your Rescue Impact
          </h2>
          <p className="text-xs text-gray-600 font-semibold mt-0.5">
            Verified carbon diversion, water conservation, and community meals provided
          </p>
        </div>

        <button
          onClick={() => setShowCertificate(true)}
          disabled={stats.totalMeals === 0}
          className="btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-2 self-start md:self-auto font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📜</span> View & Export ESG Certificate
        </button>
      </div>

      {/* ── Key Metrics Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meals */}
        <div className="bg-white border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-2xl">🍲</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-[#111827]">
              Community
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 font-display mt-3">
            {stats.totalMeals}
          </p>
          <p className="text-xs font-black uppercase text-gray-600 tracking-wider mt-1">
            Meals Rescued
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            ~{stats.rescuedWeightKg} kg food diverted
          </p>
        </div>

        {/* CO2 Saved */}
        <div className="bg-[#E4F3F5] border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-2xl">🌿</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-[#1E464D] border border-[#111827]">
              Greenhouse
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-[#1E464D] font-display mt-3">
            {stats.co2KgSaved} <span className="text-lg font-bold">kg</span>
          </p>
          <p className="text-xs font-black uppercase text-[#1E464D] tracking-wider mt-1">
            CO₂e Diverted
          </p>
          <p className="text-[11px] text-[#387B85] font-semibold mt-1">
            Avoided landfill methane
          </p>
        </div>

        {/* Water Saved */}
        <div className="bg-white border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-2xl">💧</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-900 border border-[#111827]">
              Resources
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-blue-900 font-display mt-3">
            {stats.waterLitersSaved >= 1000
              ? `${(stats.waterLitersSaved / 1000).toFixed(1)}k`
              : stats.waterLitersSaved}{' '}
            <span className="text-lg font-bold">L</span>
          </p>
          <p className="text-xs font-black uppercase text-gray-600 tracking-wider mt-1">
            Freshwater Conserved
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            Agricultural water footprint
          </p>
        </div>

        {/* Economic Value */}
        <div className="bg-[#FFFBEB] border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-2xl">💵</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-amber-900 border border-[#111827]">
              Value
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-amber-900 font-display mt-3">
            ${stats.moneySavedUsd}
          </p>
          <p className="text-xs font-black uppercase text-amber-900 tracking-wider mt-1">
            Social Value Generated
          </p>
          <p className="text-[11px] text-amber-800 font-medium mt-1">
            Direct community benefit
          </p>
        </div>
      </div>

      {/* ── Real-World Equivalents & Next Milestone ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Real-World Analogies (2 cols) */}
        <div className="md:col-span-2 bg-white border-2 border-[#111827] p-6 shadow-[4px_4px_0px_0px_#111827] space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider border-b-2 border-gray-200 pb-2 flex items-center justify-between">
            <span>What Your CO₂ Savings Equal In Real Terms</span>
            <span className="text-[10px] text-gray-500 font-bold">EPA Standard</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <span className="text-3xl block mb-1">🚗</span>
              <p className="text-xl font-black text-gray-900">{stats.carKmAvoided} km</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                Car travel avoided
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <span className="text-3xl block mb-1">🌲</span>
              <p className="text-xl font-black text-gray-900">{stats.treesEquivalent}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                Tree seedling years
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <span className="text-3xl block mb-1">⚡</span>
              <p className="text-xl font-black text-gray-900">
                {Math.round(stats.co2KgSaved * 120).toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                Phone charges saved
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Card (1 col) */}
        <div className="bg-[#EAF4F6] border-2 border-[#111827] p-6 shadow-[4px_4px_0px_0px_#111827] flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-[#1E464D] border border-[#111827] shadow-[1px_1px_0px_0px_#111827]">
              Next Milestone
            </span>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-3xl">{nextMilestone.icon}</span>
              <div>
                <h4 className="font-black text-gray-900 text-sm leading-tight">
                  {nextMilestone.name}
                </h4>
                <p className="text-xs text-gray-600 font-semibold">
                  Goal: {nextMilestone.targetMeals} meals
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-black">
              <span>{stats.totalMeals} rescued</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-white border-2 border-[#111827] h-4 p-0.5 shadow-[2px_2px_0px_0px_#111827]">
              <div
                className="bg-[#387B85] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold">
              {Math.max(0, nextMilestone.targetMeals - stats.totalMeals)} more meals to unlock badge
            </p>
          </div>
        </div>
      </div>

      {/* ── Badges & Category Breakdown Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Impact Badges Grid */}
        <div className="bg-white border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] space-y-3">
          <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider border-b-2 border-gray-200 pb-2">
            Stewardship Badges
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {stats.milestones.map((m) => (
              <div
                key={m.id}
                className={`p-3 border-2 border-[#111827] text-center transition-all ${
                  m.unlocked
                    ? 'bg-[#E4F3F5] text-gray-900 shadow-[2px_2px_0px_0px_#111827]'
                    : 'bg-gray-100 text-gray-400 opacity-60'
                }`}
              >
                <span className="text-2xl block mb-1">{m.icon}</span>
                <p className="text-[11px] font-black leading-tight line-clamp-1">{m.name}</p>
                <span className="text-[9px] font-extrabold uppercase mt-1 inline-block">
                  {m.unlocked ? '✓ Unlocked' : `${m.targetMeals} meals`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rescued Categories Breakdown */}
        <div className="bg-white border-2 border-[#111827] p-5 shadow-[4px_4px_0px_0px_#111827] space-y-3">
          <h3 className="text-xs font-black uppercase text-gray-900 tracking-wider border-b-2 border-gray-200 pb-2">
            Food Category Breakdown
          </h3>

          {categoryEntries.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 font-semibold">
              Complete your first rescue to see category breakdown.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {categoryEntries.map(([category, count]) => {
                const pct = stats.totalMeals > 0 ? Math.round((count / stats.totalMeals) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-800">
                      <span>{category}</span>
                      <span>{count} meals ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 border border-gray-300 h-2">
                      <div
                        className="bg-[#92C7CF] h-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ESG Certificate Modal */}
      {showCertificate && (
        <ImpactCertificateModal
          stats={stats}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
