"use client";

import React, { useMemo } from "react";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import ModelsExplorer from "@/components/models/ModelsExplorer";
import { FRONTIER_MODELS_DATA } from "@/lib/modelsData";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const stats = useMemo(() => {
    const total = FRONTIER_MODELS_DATA.length;
    const openCount = FRONTIER_MODELS_DATA.filter((m) => m.weights === "Open").length;
    const uniqueLabs = new Set(FRONTIER_MODELS_DATA.map((m) => m.vendor)).size;
    const reasoningCount = FRONTIER_MODELS_DATA.filter((m) => m.supportsReasoning).length;

    return {
      total,
      openCount,
      uniqueLabs,
      reasoningCount,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#0A2540] flex flex-col">
      <Nav />

      <main className="flex-1 w-full pt-28 pb-16">
        {/* Top Header Hero */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6 border-b border-[#E3E8EE]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#EEF2FF] text-[#635BFF] border border-[#D5D9FC] mb-3 font-semibold">
                <Sparkles size={12} />
                <span>Open Specifications & Live Providers</span>
              </div>

              <h1 className="text-[32px] sm:text-[44px] font-black tracking-tight text-[#0A2540] leading-tight">
                AI Models Directory
              </h1>

              <p className="mt-2 text-[15px] sm:text-[16px] text-[#697386] max-w-2xl leading-relaxed">
                Comprehensive specifications, live inference pricing, token context limits, and instant API code snippets across all leading frontier models.
              </p>
            </div>

            {/* KPI Stats Strip */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="bg-white border border-[#E3E8EE] px-4 py-2.5 rounded-xl shadow-xs">
                <div className="text-[10px] font-mono uppercase text-[#697386]">Frontier Models</div>
                <div className="text-[20px] font-extrabold text-[#0A2540]">{stats.total}</div>
              </div>

              <div className="bg-white border border-[#E3E8EE] px-4 py-2.5 rounded-xl shadow-xs">
                <div className="text-[10px] font-mono uppercase text-[#697386]">Open Weights</div>
                <div className="text-[20px] font-extrabold text-[#047857]">{stats.openCount}</div>
              </div>

              <div className="bg-white border border-[#E3E8EE] px-4 py-2.5 rounded-xl shadow-xs">
                <div className="text-[10px] font-mono uppercase text-[#697386]">Reasoning</div>
                <div className="text-[20px] font-extrabold text-[#635BFF]">{stats.reasoningCount}</div>
              </div>

              <div className="bg-white border border-[#E3E8EE] px-4 py-2.5 rounded-xl shadow-xs">
                <div className="text-[10px] font-mono uppercase text-[#697386]">AI Labs</div>
                <div className="text-[20px] font-extrabold text-[#0A2540]">{stats.uniqueLabs}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Models Explorer Component */}
        <ModelsExplorer isEmbedded={false} />
      </main>

      <Footer />
    </div>
  );
}
