"use client";

import React from "react";
import type { EnrichedModel } from "@/lib/modelsData";
import LabLogo from "./LabLogo";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

interface LabsViewProps {
  models: EnrichedModel[];
  onSelectLab: (lab: string) => void;
}

export default function LabsView({ models, onSelectLab }: LabsViewProps) {
  // Group models by lab
  const labsMap = new Map<string, EnrichedModel[]>();

  for (const m of models) {
    const list = labsMap.get(m.vendor) || [];
    list.push(m);
    labsMap.set(m.vendor, list);
  }

  const sortedLabs = Array.from(labsMap.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedLabs.map(([vendor, labModels]) => {
        const openCount = labModels.filter((m) => m.weights === "Open").length;

        return (
          <div
            key={vendor}
            className="bg-white border border-[#E3E8EE] hover:border-[#635BFF]/50 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Lab Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-lg bg-[#FAFBFF] border border-[#E3E8EE]">
                    <LabLogo vendor={vendor} size={24} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#0A2540] group-hover:text-[#635BFF] transition-colors leading-tight">
                      {vendor}
                    </h3>
                    <p className="text-[11px] font-mono text-[#697386]">
                      {labModels.length} {labModels.length === 1 ? "Model" : "Models"}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-medium text-[#635BFF] bg-[#EEF2FF] border border-[#D5D9FC] px-1.5 py-0.5 rounded">
                  {openCount > 0 ? `${openCount} Open` : "Commercial"}
                </span>
              </div>

              {/* Models List Preview */}
              <div className="space-y-1.5 mb-3.5 pt-2 border-t border-[#EDF1F6]">
                {labModels.slice(0, 3).map((m) => {
                  const targetSlug = m.id || m.slug.split("/").pop() || m.slug;
                  return (
                    <Link
                      key={m.id}
                      href={`/models/${targetSlug}`}
                      className="flex items-center justify-between p-1.5 rounded-md hover:bg-[#FAFBFF] transition-colors group/item no-underline"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[12px] font-semibold text-[#0A2540] group-hover/item:text-[#635BFF] truncate">
                          {m.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#697386] truncate">
                          {m.contextWindow >= 1000000
                            ? `${(m.contextWindow / 1000000).toFixed(1)}M`
                            : `${Math.round(m.contextWindow / 1000)}k`} ctx · {m.weights}
                        </div>
                      </div>
                      <span className="text-[9.5px] font-mono text-[#697386] bg-[#FAFBFF] px-1 py-0.5 rounded shrink-0 border border-[#E3E8EE]">
                        {m.providersCount} prov
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Card Footer Button */}
            <div className="pt-2.5 border-t border-[#EDF1F6]">
              <button
                type="button"
                onClick={() => onSelectLab(vendor)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11.5px] font-semibold text-[#635BFF] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#D5D9FC] transition-colors cursor-pointer"
              >
                <span>View All {vendor} Models</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
