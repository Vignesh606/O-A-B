"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Database,
  Building2,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import ModelsFilterHeader, {
  type SimpleFilterState,
  DEFAULT_FILTERS,
} from "./ModelsFilterHeader";
import ModelsTable from "./ModelsTable";
import ModelsCardGrid from "./ModelsCardGrid";
import ModelsPagination from "./ModelsPagination";
import ModelCodeModal from "./ModelCodeModal";
import LabsView from "./LabsView";
import { FRONTIER_MODELS_DATA, type EnrichedModel } from "@/lib/modelsData";

interface ModelsExplorerProps {
  isEmbedded?: boolean;
}

export default function ModelsExplorer({ isEmbedded = false }: ModelsExplorerProps) {
  const [allModels] = useState<EnrichedModel[]>(FRONTIER_MODELS_DATA);
  const [activeTab, setActiveTab] = useState<"catalog" | "labs">("catalog");
  const [viewMode, setViewMode] = useState<"table" | "grid">(isEmbedded ? "grid" : "table");
  const [selectedModelForCode, setSelectedModelForCode] = useState<EnrichedModel | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(isEmbedded ? 8 : 24);

  // Filter state — now using the enriched filter type
  const [filters, setFilters] = useState<SimpleFilterState>(DEFAULT_FILTERS);

  const [sortField, setSortField] = useState<string>("trending");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search models"]'
        );
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  // Unique labs list
  const vendors = useMemo(() => {
    const set = new Set<string>();
    for (const m of allModels) {
      if (m.vendor) set.add(m.vendor);
    }
    return Array.from(set).sort();
  }, [allModels]);

  // Unique providers across ALL models (flattened from providers[] arrays)
  const allProviders = useMemo(() => {
    const set = new Set<string>();
    for (const m of allModels) {
      if (m.providers && m.providers.length > 0) {
        for (const p of m.providers) {
          set.add(p);
        }
      }
    }
    return Array.from(set).sort();
  }, [allModels]);

  // Unique modalities across ALL models
  const allModalities = useMemo(() => {
    const set = new Set<string>();
    for (const m of allModels) {
      for (const mod of m.modalities) {
        set.add(mod);
      }
    }
    return Array.from(set).sort();
  }, [allModels]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ── Filtered & sorted models ──────────────────────────────────────────────
  const processedModels = useMemo(() => {
    let result = [...allModels];

    // 1) Text search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          m.vendor.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.providers || []).some((p) => p.toLowerCase().includes(q))
      );
    }

    // 2) Category pill
    if (filters.category === "reasoning") {
      result = result.filter((m) => m.supportsReasoning);
    } else if (filters.category === "open") {
      result = result.filter((m) => m.weights === "Open");
    } else if (filters.category === "multimodal") {
      result = result.filter((m) => m.modalities.length > 1);
    } else if (filters.category === "tools") {
      result = result.filter((m) => m.supportsTools);
    }

    // 3) Lab filter
    if (filters.lab !== "all") {
      result = result.filter(
        (m) => m.vendor.toLowerCase() === filters.lab.toLowerCase()
      );
    }

    // 4) Price range filter
    const [priceMin, priceMax] = filters.priceRange;
    if (priceMin !== null || priceMax !== null) {
      result = result.filter((m) => {
        const price = m.inputPricePerM;
        // "Free / Open" preset: max === 0 means only models with null or 0 price
        if (priceMax === 0 && priceMin === null) {
          return price === null || price === 0;
        }
        if (price === null) return false; // non-priced models don't match a numeric range
        if (priceMin !== null && price < priceMin) return false;
        if (priceMax !== null && price > priceMax) return false;
        return true;
      });
    }

    // 5) Context length range filter
    const [ctxMin, ctxMax] = filters.contextRange;
    if (ctxMin !== null || ctxMax !== null) {
      result = result.filter((m) => {
        const ctx = m.contextWindow;
        if (ctxMin !== null && ctx < ctxMin) return false;
        if (ctxMax !== null && ctx > ctxMax) return false;
        return true;
      });
    }

    // 6) Modality filter (match ALL selected modalities)
    if (filters.modalities.length > 0) {
      result = result.filter((m) =>
        filters.modalities.every((mod) =>
          m.modalities.includes(mod as any)
        )
      );
    }

    // 7) Provider filter (match ANY selected provider)
    if (filters.providers.length > 0) {
      result = result.filter((m) =>
        filters.providers.some((prov) =>
          (m.providers || []).some(
            (mp) => mp.toLowerCase() === prov.toLowerCase()
          )
        )
      );
    }

    // ── Sort ────────────────────────────────────────────────────────────────
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "vendor":
          comparison = a.vendor.localeCompare(b.vendor);
          break;
        case "providers":
          comparison = (a.providersCount || 0) - (b.providersCount || 0);
          break;
        case "context":
          comparison = (a.contextWindow || 0) - (b.contextWindow || 0);
          break;
        case "output":
          comparison = (a.maxOutputTokens || 0) - (b.maxOutputTokens || 0);
          break;
        case "price":
          comparison = (a.inputPricePerM ?? 999) - (b.inputPricePerM ?? 999);
          break;
        case "weights":
          comparison = (a.weights || "").localeCompare(b.weights || "");
          break;
        case "modalities":
          comparison = (a.modalities?.length || 0) - (b.modalities?.length || 0);
          break;
        case "trending":
        default:
          comparison = (b.trendingScore || 0) - (a.trendingScore || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [allModels, filters, sortField, sortDirection]);

  const paginatedModels = useMemo(() => {
    if (pageSize >= processedModels.length) {
      return processedModels;
    }
    const start = (currentPage - 1) * pageSize;
    return processedModels.slice(start, start + pageSize);
  }, [processedModels, currentPage, pageSize]);

  const handleSelectLab = (vendor: string) => {
    setFilters((prev) => ({ ...prev, lab: vendor }));
    setActiveTab("catalog");
  };

  return (
    <div className={`w-full ${isEmbedded ? "py-12 border-t border-[#E3E8EE] bg-[#FAFBFF]" : ""}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8" id="models-catalog-container">
        {/* Header Section */}
        {isEmbedded ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#EEF2FF] text-[#635BFF] border border-[#D5D9FC] mb-2 font-semibold">
                <Sparkles size={11} />
                <span>Unified Models Directory</span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#0A2540]">
                Explore AI Models & Live Providers
              </h2>
              <p className="mt-1 text-[15px] text-[#697386] max-w-2xl">
                Open specifications, provider pricing, token context windows, and instant SDK code snippets across all top frontier models.
              </p>
            </div>
            <Link
              href="/models"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#635BFF] text-white hover:bg-[#5249ea] font-medium text-[13.5px] transition-all shadow-sm shrink-0 self-start md:self-auto"
            >
              <span>View Full Directory</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : null}

        {/* Tab Navigation: Catalog vs Browse by Lab */}
        <div className="flex items-center justify-between border-b border-[#E3E8EE] mb-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`pb-3 text-[14px] font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "border-[#635BFF] text-[#635BFF]"
                  : "border-transparent text-[#697386] hover:text-[#0A2540]"
              }`}
            >
              <Database size={16} />
              <span>Models Catalog</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAFBFF] border border-[#E3E8EE] text-[#425466]">
                {processedModels.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("labs")}
              className={`pb-3 text-[14px] font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "labs"
                  ? "border-[#635BFF] text-[#635BFF]"
                  : "border-transparent text-[#697386] hover:text-[#0A2540]"
              }`}
            >
              <Building2 size={16} />
              <span>Browse by Lab</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAFBFF] border border-[#E3E8EE] text-[#425466]">
                {vendors.length}
              </span>
            </button>
          </div>

          {!isEmbedded && (
            <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-[#697386]">
              <span>Powered by</span>
              <span className="font-semibold text-[#0A2540]">OneAtlas Models Engine</span>
            </div>
          )}
        </div>

        {/* Catalog Tab Content */}
        {activeTab === "catalog" && (
          <div>
            <ModelsFilterHeader
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              vendors={vendors}
              allProviders={allProviders}
              allModalities={allModalities}
              totalCount={allModels.length}
              filteredCount={processedModels.length}
            />

            {viewMode === "table" ? (
              <ModelsTable
                models={paginatedModels}
                onOpenCode={(m) => setSelectedModelForCode(m)}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ) : (
              <ModelsCardGrid
                models={paginatedModels}
                onOpenCode={(m) => setSelectedModelForCode(m)}
              />
            )}

            {/* Pagination */}
            <ModelsPagination
              currentPage={currentPage}
              totalItems={processedModels.length}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </div>
        )}

        {/* Labs Tab Content */}
        {activeTab === "labs" && (
          <LabsView
            models={allModels}
            onSelectLab={handleSelectLab}
          />
        )}

        {/* API Code Snippet Modal */}
        <ModelCodeModal
          model={selectedModelForCode}
          isOpen={Boolean(selectedModelForCode)}
          onClose={() => setSelectedModelForCode(null)}
        />
      </div>
    </div>
  );
}
