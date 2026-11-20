"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Layers,
} from "lucide-react";
import type { EnrichedModel } from "@/lib/modelsData";
import ModalityIcons from "./ModalityIcons";
import LabLogo from "./LabLogo";

interface ModelsCardGridProps {
  models: EnrichedModel[];
  onOpenCode: (model: EnrichedModel) => void;
}

export default function ModelsCardGrid({ models, onOpenCode }: ModelsCardGridProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopySlug = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-[#E3E8EE] rounded-xl text-[#697386]">
        No models match the selected filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {models.map((model) => {
        const targetSlug = model.id || model.slug.split("/").pop() || model.slug;
        return (
          <div
            key={model.id}
            className="bg-white border border-[#E3E8EE] hover:border-[#635BFF]/50 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Top row: Lab logo & Weights badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="p-0.5 rounded bg-[#FAFBFF] border border-[#E3E8EE] shrink-0">
                    <LabLogo vendor={model.vendor} size={16} />
                  </div>
                  <span className="text-[12px] font-semibold text-[#425466] truncate">
                    {model.vendor}
                  </span>
                </div>

                <div className="shrink-0">
                  {model.weights === "Open" ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      <ShieldCheck size={10} />
                      <span>Open</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F6F9FC] text-[#697386] border border-[#E3E8EE]">
                      <Lock size={9} />
                      <span>Closed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Slug */}
              <Link
                href={`/models/${targetSlug}`}
                className="block text-[15px] font-bold text-[#0A2540] group-hover:text-[#635BFF] transition-colors no-underline mb-0.5 truncate"
              >
                {model.name}
              </Link>

              <div className="flex items-center gap-1 mb-2.5">
                <span className="font-mono text-[10.5px] text-[#697386] truncate">
                  {model.slug}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopySlug(model.slug, e)}
                  title="Copy slug"
                  className="text-[#697386] hover:text-[#0A2540] p-0.5 cursor-pointer shrink-0"
                >
                  {copiedSlug === model.slug ? (
                    <Check size={10} className="text-emerald-600" />
                  ) : (
                    <Copy size={10} />
                  )}
                </button>
              </div>

              {/* Providers Status Pill (Clean models.dev style) */}
              <div className="mb-3 pt-2 border-t border-[#EDF1F6] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#697386] uppercase tracking-wider text-[10px]">
                  Providers
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#635BFF] font-medium text-[10.5px]">
                  <Layers size={10} />
                  <span>{model.providersCount} active endpoints</span>
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#FAFBFF] p-2.5 rounded-lg border border-[#E3E8EE] text-[11px] font-mono mb-3">
                <div>
                  <span className="text-[#697386] block text-[9.5px] uppercase">Context</span>
                  <span className="font-medium text-[#0A2540]">
                    {model.contextWindow >= 1000000
                      ? `${(model.contextWindow / 1000000).toFixed(1)}M`
                      : `${Math.round(model.contextWindow / 1000)}k`}
                  </span>
                </div>
                <div>
                  <span className="text-[#697386] block text-[9.5px] uppercase">Output</span>
                  <span className="font-medium text-[#0A2540]">
                    {model.maxOutputTokens >= 1000
                      ? `${Math.round(model.maxOutputTokens / 1000)}k`
                      : model.maxOutputTokens}
                  </span>
                </div>
                <div>
                  <span className="text-[#697386] block text-[9.5px] uppercase">Price / 1M</span>
                  <span className="font-medium text-[#0A2540] truncate block">
                    {model.inputPricePerM !== null
                      ? `$${model.inputPricePerM} / $${model.outputPricePerM}`
                      : "Open / Free"}
                  </span>
                </div>
                <div>
                  <span className="text-[#697386] block text-[9.5px] uppercase">Modalities</span>
                  <div className="pt-0.5">
                    <ModalityIcons modalities={model.modalities} size={11} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EDF1F6]">
              <button
                type="button"
                onClick={() => onOpenCode(model)}
                className="inline-flex items-center gap-1 text-[11.5px] font-mono font-medium px-2.5 py-1 rounded-md bg-[#FAFBFF] hover:bg-[#EEF2FF] text-[#425466] hover:text-[#635BFF] border border-[#E3E8EE] transition-colors cursor-pointer"
              >
                <Code2 size={12} />
                <span>API Code</span>
              </button>

              <Link
                href={`/models/${targetSlug}`}
                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#635BFF] hover:underline"
              >
                <span>Specs</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
