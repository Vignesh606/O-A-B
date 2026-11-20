"use client";

import React, { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Sparkles,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  Code2,
  DollarSign,
  Info,
} from "lucide-react";
import { FRONTIER_MODELS_DATA, type EnrichedModel } from "@/lib/modelsData";
import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import ModalityIcons from "@/components/models/ModalityIcons";
import LabLogo from "@/components/models/LabLogo";
import ModelProvidersTable from "@/components/models/ModelProvidersTable";
import ModelCodeModal from "@/components/models/ModelCodeModal";

function formatTokens(val: number): string {
  if (!val) return "—";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return val.toLocaleString();
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="rounded-xl border border-[#E3E8EE] bg-white px-4 py-3 shadow-xs">
      <div className="text-[11px] uppercase tracking-wider text-[#697386] font-mono">
        {label}
      </div>
      <div className="mt-1 text-[16px] font-bold text-[#0A2540]">
        {value}
      </div>
    </div>
  );
}

export default function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "");
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Find model from curated frontier models data
  const model = useMemo(() => {
    const slugLower = rawSlug.toLowerCase();
    return (
      FRONTIER_MODELS_DATA.find(
        (m) =>
          m.id.toLowerCase() === slugLower ||
          m.slug.toLowerCase() === slugLower ||
          m.slug.toLowerCase().endsWith(`/${slugLower}`)
      ) || FRONTIER_MODELS_DATA[0]
    );
  }, [rawSlug]);

  const handleCopySlug = () => {
    navigator.clipboard.writeText(model.slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#0A2540] flex flex-col">
      <Nav />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Back Link */}
        <Link
          href="/models"
          className="inline-flex items-center gap-1.5 text-[13px] font-mono text-[#697386] hover:text-[#635BFF] transition-colors mb-6 no-underline"
        >
          <ArrowLeft size={14} />
          <span>Back to Models Directory</span>
        </Link>

        {/* Model Hero Header */}
        <div className="bg-white rounded-2xl border border-[#E3E8EE] p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              {/* Lab & Weights */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAFBFF] border border-[#E3E8EE] text-[12px] font-medium text-[#425466]">
                  <LabLogo vendor={model.vendor} size={16} />
                  <span>{model.vendor}</span>
                </div>

                {model.weights === "Open" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                    <ShieldCheck size={12} />
                    <span>Open Weights</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F6F9FC] text-[#697386] border border-[#E3E8EE]">
                    <span>Commercial API</span>
                  </span>
                )}

                {model.supportsReasoning && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#635BFF] border border-[#D5D9FC]">
                    <Sparkles size={12} />
                    <span>Reasoning Engine</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[28px] sm:text-[38px] font-black tracking-tight text-[#0A2540]">
                {model.name}
              </h1>

              {/* Slug with copy button */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAFBFF] border border-[#E3E8EE] text-[12px] font-mono text-[#697386]">
                <span>{model.slug}</span>
                <button
                  type="button"
                  onClick={handleCopySlug}
                  className="hover:text-[#0A2540] transition-colors p-0.5"
                  title="Copy model identifier"
                >
                  {copiedSlug ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="text-[14.5px] text-[#425466] leading-relaxed max-w-3xl">
                {model.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#635BFF] text-white hover:bg-[#5249ea] font-medium text-[13.5px] transition-all shadow-sm cursor-pointer"
              >
                <Code2 size={16} />
                <span>Get API Code</span>
              </button>

              {model.huggingFaceUrl && (
                <a
                  href={model.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E3E8EE] hover:bg-[#FAFBFF] text-[#425466] font-medium text-[13.5px] transition-colors"
                >
                  <span>Hugging Face</span>
                  <ExternalLink size={13} />
                </a>
              )}

              {model.githubUrl && (
                <a
                  href={model.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E3E8EE] hover:bg-[#FAFBFF] text-[#425466] font-medium text-[13.5px] transition-colors"
                >
                  <Github size={14} />
                  <span>GitHub Repository</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-[#EDF1F6]">
            <Stat label="Context Window" value={formatTokens(model.contextWindow)} />
            <Stat label="Max Output" value={formatTokens(model.maxOutputTokens)} />
            <Stat
              label="Pricing (In / Out)"
              value={
                model.inputPricePerM !== null
                  ? `$${model.inputPricePerM} / $${model.outputPricePerM}`
                  : "Open / Free"
              }
            />
            <Stat label="Parameters" value={model.parameterCount || "MoE"} />
            <Stat label="Architecture" value={model.architecture || "Transformer"} />
            <Stat label="License" value={model.license || "Open"} />
          </div>
        </div>

        {/* Section: Live Providers & Routing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#0A2540]">
                Live Inference Providers & Endpoints
              </h2>
              <p className="text-[13px] text-[#697386]">
                Compare latency, token costs, and uptime across official labs and serverless providers for {model.name}.
              </p>
            </div>
          </div>

          <ModelProvidersTable model={model} />
        </div>

        {/* Code Snippet Modal */}
        <ModelCodeModal
          model={model}
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
        />
      </main>

      <Footer />
    </div>
  );
}
