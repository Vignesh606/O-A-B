"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Code2,
  ChevronRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import type { EnrichedModel } from "@/lib/modelsData";
import ModalityIcons from "./ModalityIcons";
import LabLogo from "./LabLogo";

interface ModelsTableProps {
  models: EnrichedModel[];
  onOpenCode: (model: EnrichedModel) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

function formatTokens(val: number): string {
  if (!val) return "—";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return val.toLocaleString();
}

function formatPrice(input: number | null, output: number | null): string {
  if (input === null || output === null) return "Open / Free";
  if (input === 0 && output === 0) return "Free";
  return `$${input.toFixed(2)} / $${output.toFixed(2)}`;
}

export default function ModelsTable({
  models,
  onOpenCode,
  sortField,
  sortDirection,
  onSort,
}: ModelsTableProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopySlug = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="opacity-30 text-[#697386]" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={11} className="text-[#635BFF]" />
    ) : (
      <ArrowDown size={11} className="text-[#635BFF]" />
    );
  };

  return (
    <div className="w-full overflow-hidden border border-[#E3E8EE] bg-white rounded-xl shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-[#E3E8EE] bg-[#FAFBFF] text-[11px] font-mono uppercase tracking-wider text-[#697386] select-none">
              {/* Model & Lab Column */}
              <th
                onClick={() => onSort("name")}
                className="py-3 px-3 sm:px-4 font-semibold hover:text-[#0A2540] cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span>Model & Lab</span>
                  {renderSortIndicator("name")}
                </div>
              </th>

              {/* Providers Column */}
              <th
                onClick={() => onSort("providers")}
                className="py-3 px-3 font-semibold hover:text-[#0A2540] cursor-pointer hidden md:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Providers</span>
                  {renderSortIndicator("providers")}
                </div>
              </th>

              {/* Context / Output Column */}
              <th
                onClick={() => onSort("context")}
                className="py-3 px-3 font-semibold text-right hover:text-[#0A2540] cursor-pointer hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Context / Max</span>
                  {renderSortIndicator("context")}
                </div>
              </th>

              {/* Price / 1M Column */}
              <th
                onClick={() => onSort("price")}
                className="py-3 px-3 sm:px-4 font-semibold text-right hover:text-[#0A2540] cursor-pointer"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Price / 1M</span>
                  {renderSortIndicator("price")}
                </div>
              </th>

              {/* Modalities Column (now sortable) */}
              <th
                onClick={() => onSort("modalities")}
                className="py-3 px-3 font-semibold hover:text-[#0A2540] cursor-pointer hidden lg:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Modalities</span>
                  {renderSortIndicator("modalities")}
                </div>
              </th>

              {/* Access / Weights Column */}
              <th
                onClick={() => onSort("weights")}
                className="py-3 px-3 font-semibold hover:text-[#0A2540] cursor-pointer hidden md:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Access</span>
                  {renderSortIndicator("weights")}
                </div>
              </th>

              {/* Action Column */}
              <th className="py-3 px-3 sm:px-4 text-right font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EDF1F6] text-[13px]">
            {models.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-16 text-center text-[#697386] font-sans"
                >
                  No models found matching the search criteria.
                </td>
              </tr>
            ) : (
              models.map((model) => {
                const targetSlug = model.id || model.slug.split("/").pop() || model.slug;

                return (
                  <tr
                    key={model.id}
                    className="hover:bg-[#FAFBFF] transition-colors group"
                  >
                    {/* Model & Lab Cell */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded bg-[#FAFBFF] border border-[#E3E8EE] shrink-0 mt-0.5">
                          <LabLogo vendor={model.vendor} size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/models/${targetSlug}`}
                              className="font-bold text-[#0A2540] group-hover:text-[#635BFF] transition-colors no-underline text-[13.5px] hover:underline"
                            >
                              {model.name}
                            </Link>
                            {model.supportsReasoning && (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase bg-[#EEF2FF] text-[#635BFF] font-semibold border border-[#D5D9FC]">
                                Reasoning
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-[#697386]">
                            <span className="truncate max-w-[150px] sm:max-w-[200px]">
                              {model.slug}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySlug(model.slug, e)}
                              title="Copy model ID"
                              className="text-[#697386] hover:text-[#0A2540] p-0.5 transition-colors cursor-pointer shrink-0"
                            >
                              {copiedSlug === model.slug ? (
                                <Check size={11} className="text-emerald-600" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                            <span className="text-[#CBD5E1]">·</span>
                            <span className="text-[#425466]">{model.vendor}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Providers Count Cell */}
                    <td className="py-3.5 px-3 font-mono text-[12px] hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FAFBFF] text-[#425466] border border-[#E3E8EE] font-medium">
                        {model.providersCount} providers
                      </span>
                    </td>

                    {/* Context / Output Cell */}
                    <td className="py-3.5 px-3 text-right font-mono text-[12px] text-[#0A2540] hidden sm:table-cell">
                      <div className="font-semibold">{formatTokens(model.contextWindow)}</div>
                      <div className="text-[10.5px] text-[#697386]">
                        {formatTokens(model.maxOutputTokens)} max
                      </div>
                    </td>

                    {/* Price / 1M Cell */}
                    <td className="py-3.5 px-3 sm:px-4 text-right font-mono text-[12px]">
                      <div className="font-semibold text-[#0A2540]">
                        {formatPrice(model.inputPricePerM, model.outputPricePerM)}
                      </div>
                      <div className="text-[10px] text-[#697386]">
                        in / out
                      </div>
                    </td>

                    {/* Modalities Cell */}
                    <td className="py-3.5 px-3 hidden lg:table-cell">
                      <ModalityIcons modalities={model.modalities} size={12} />
                    </td>

                    {/* Access / Weights Cell */}
                    <td className="py-3.5 px-3 font-mono text-[11px] hidden md:table-cell">
                      {model.weights === "Open" ? (
                        <span className="inline-flex items-center gap-1 text-[#047857] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                          <ShieldCheck size={11} />
                          <span>Open</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#425466] font-medium bg-[#F6F9FC] px-2 py-0.5 rounded-full border border-[#E3E8EE]">
                          <Lock size={10} />
                          <span>Closed</span>
                        </span>
                      )}
                    </td>

                    {/* Action Cell */}
                    <td className="py-3.5 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenCode(model)}
                          title="Generate API Code Snippet"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E3E8EE] bg-[#FAFBFF] hover:bg-[#EEF2FF] hover:border-[#635BFF] hover:text-[#635BFF] text-[#425466] text-[12px] font-mono transition-all cursor-pointer shadow-2xs"
                        >
                          <Code2 size={13} />
                          <span className="hidden sm:inline">Code</span>
                        </button>

                        <Link
                          href={`/models/${targetSlug}`}
                          className="p-1.5 rounded-lg text-[#697386] hover:text-[#635BFF] hover:bg-[#EEF2FF] transition-colors inline-flex items-center no-underline"
                          title="View Model Specs"
                        >
                          <ChevronRight size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
