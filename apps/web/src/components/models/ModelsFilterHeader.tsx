"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  Sparkles,
  ShieldCheck,
  Eye,
  Wrench,
  DollarSign,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import { MODALITY_CONFIG, type ModalityType } from "./ModalityIcons";

// ── Filter State Types ────────────────────────────────────────────────────────

export interface SimpleFilterState {
  search: string;
  category: "all" | "reasoning" | "open" | "multimodal" | "tools";
  lab: string;
  // New granular filters
  priceRange: [number | null, number | null]; // [min, max] input price per 1M tokens
  contextRange: [number | null, number | null]; // [min, max] context window tokens
  modalities: string[]; // selected modalities (empty = all)
  providers: string[]; // selected providers (empty = all)
}

export const DEFAULT_FILTERS: SimpleFilterState = {
  search: "",
  category: "all",
  lab: "all",
  priceRange: [null, null],
  contextRange: [null, null],
  modalities: [],
  providers: [],
};

// ── Price Presets ─────────────────────────────────────────────────────────────

const PRICE_PRESETS = [
  { label: "All Prices", min: null, max: null },
  { label: "Free / Open", min: null, max: 0 },
  { label: "Under $1", min: 0, max: 1 },
  { label: "$1 – $5", min: 1, max: 5 },
  { label: "$5 – $15", min: 5, max: 15 },
  { label: "$15+", min: 15, max: null },
] as const;

// ── Context Window Presets ────────────────────────────────────────────────────

const CONTEXT_PRESETS = [
  { label: "Any Length", min: null, max: null },
  { label: "16k+", min: 16000, max: null },
  { label: "128k+", min: 128000, max: null },
  { label: "200k+", min: 200000, max: null },
  { label: "1M+", min: 1000000, max: null },
  { label: "2M+", min: 2000000, max: null },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModelsFilterHeaderProps {
  filters: SimpleFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SimpleFilterState>>;
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
  vendors: string[];
  allProviders: string[];
  allModalities: string[];
  totalCount: number;
  filteredCount: number;
}

// ── Multi-select Dropdown ─────────────────────────────────────────────────────

function MultiSelectDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  const hasSelection = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer select-none border ${
          hasSelection
            ? "bg-[#EEF2FF] text-[#635BFF] border-[#D5D9FC] font-semibold shadow-xs"
            : "bg-[#FAFBFF] text-[#425466] border-[#E3E8EE] hover:bg-[#EEF2FF] hover:text-[#0A2540]"
        }`}
      >
        <Icon size={12} />
        <span>{label}</span>
        {hasSelection && (
          <span className="bg-[#635BFF] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-56 max-h-64 overflow-y-auto bg-white border border-[#E3E8EE] rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Select All / Clear */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#EDF1F6] mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#697386]">
              {hasSelection ? `${selected.length} selected` : "Select items"}
            </span>
            {hasSelection && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-[#635BFF] hover:underline font-medium cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {options.map((item) => {
            const isSelected = selected.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#EEF2FF] text-[#635BFF] font-semibold"
                    : "text-[#425466] hover:bg-[#FAFBFF]"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-[#635BFF] border-[#635BFF]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {isSelected && <Check size={10} className="text-white" />}
                </span>
                <span className="truncate">{item}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Preset Dropdown ───────────────────────────────────────────────────────────

function PresetDropdown({
  label,
  icon: Icon,
  presets,
  currentMin,
  currentMax,
  onSelect,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  presets: readonly { label: string; min: number | null; max: number | null }[];
  currentMin: number | null;
  currentMax: number | null;
  onSelect: (min: number | null, max: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activePreset = presets.find(
    (p) => p.min === currentMin && p.max === currentMax
  );
  const hasFilter = currentMin !== null || currentMax !== null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer select-none border ${
          hasFilter
            ? "bg-[#EEF2FF] text-[#635BFF] border-[#D5D9FC] font-semibold shadow-xs"
            : "bg-[#FAFBFF] text-[#425466] border-[#E3E8EE] hover:bg-[#EEF2FF] hover:text-[#0A2540]"
        }`}
      >
        <Icon size={12} />
        <span>{activePreset && hasFilter ? activePreset.label : label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-48 bg-white border border-[#E3E8EE] rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {presets.map((preset) => {
            const isActive =
              preset.min === currentMin && preset.max === currentMax;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onSelect(preset.min, preset.max);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#EEF2FF] text-[#635BFF] font-semibold"
                    : "text-[#425466] hover:bg-[#FAFBFF]"
                }`}
              >
                {isActive && <Check size={11} className="text-[#635BFF] shrink-0" />}
                {!isActive && <span className="w-[11px] shrink-0" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Active Filter Chips ───────────────────────────────────────────────────────

function ActiveFilterChips({
  filters,
  setFilters,
}: {
  filters: SimpleFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SimpleFilterState>>;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.priceRange[0] !== null || filters.priceRange[1] !== null) {
    const preset = PRICE_PRESETS.find(
      (p) => p.min === filters.priceRange[0] && p.max === filters.priceRange[1]
    );
    chips.push({
      label: `Price: ${preset?.label || "Custom"}`,
      onRemove: () =>
        setFilters((prev) => ({ ...prev, priceRange: [null, null] })),
    });
  }

  if (filters.contextRange[0] !== null || filters.contextRange[1] !== null) {
    const preset = CONTEXT_PRESETS.find(
      (p) =>
        p.min === filters.contextRange[0] && p.max === filters.contextRange[1]
    );
    chips.push({
      label: `Context: ${preset?.label || "Custom"}`,
      onRemove: () =>
        setFilters((prev) => ({ ...prev, contextRange: [null, null] })),
    });
  }

  for (const mod of filters.modalities) {
    chips.push({
      label: `${(MODALITY_CONFIG as any)[mod]?.label || mod}`,
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          modalities: prev.modalities.filter((m) => m !== mod),
        })),
    });
  }

  for (const prov of filters.providers) {
    chips.push({
      label: prov,
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          providers: prev.providers.filter((p) => p !== prov),
        })),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#EDF1F6]">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[#697386] mr-1">
        Active:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] text-[#635BFF] border border-[#D5D9FC]"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="hover:text-red-500 cursor-pointer p-0.5"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => setFilters(DEFAULT_FILTERS)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-[#697386] hover:text-red-500 border border-[#E3E8EE] hover:border-red-200 cursor-pointer transition-colors"
      >
        <RotateCcw size={9} />
        <span>Clear All</span>
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ModelsFilterHeader({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  vendors,
  allProviders,
  allModalities,
  totalCount,
  filteredCount,
}: ModelsFilterHeaderProps) {
  const isFiltered =
    filters.search ||
    filters.category !== "all" ||
    filters.lab !== "all" ||
    filters.priceRange[0] !== null ||
    filters.priceRange[1] !== null ||
    filters.contextRange[0] !== null ||
    filters.contextRange[1] !== null ||
    filters.modalities.length > 0 ||
    filters.providers.length > 0;

  return (
    <div className="bg-white border border-[#E3E8EE] rounded-xl p-3 sm:p-4 shadow-xs mb-5 space-y-3">
      {/* Row 1: Search + Counter + View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#697386]"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search models, providers, or labs..."
            className="w-full pl-9 pr-14 py-2 bg-[#FAFBFF] border border-[#E3E8EE] rounded-lg text-[13px] text-[#0A2540] placeholder-[#697386] focus:outline-hidden focus:border-[#635BFF] focus:bg-white transition-all font-sans"
          />
          {filters.search ? (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#697386] hover:text-[#0A2540] p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#697386] bg-white border border-[#E3E8EE] rounded shadow-2xs select-none">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* View Switcher & Counter */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-[12px] font-mono text-[#697386]">
            <strong className="text-[#0A2540] font-semibold">{filteredCount}</strong> / {totalCount} models
          </span>

          <div className="flex items-center rounded-lg bg-[#FAFBFF] p-0.5 border border-[#E3E8EE]">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#635BFF] shadow-xs font-semibold"
                  : "text-[#697386] hover:text-[#0A2540]"
              }`}
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#635BFF] shadow-xs font-semibold"
                  : "text-[#697386] hover:text-[#0A2540]"
              }`}
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Category Pills + Lab Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDF1F6]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "All Models" },
            { key: "reasoning", label: "Reasoning", icon: Sparkles },
            { key: "open", label: "Open Weights", icon: ShieldCheck },
            { key: "multimodal", label: "Multimodal", icon: Eye },
            { key: "tools", label: "Tool Calling", icon: Wrench },
          ].map((pill) => {
            const isActive = filters.category === pill.key;
            const Icon = pill.icon;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: pill.key as any,
                  }))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-[#635BFF] text-white shadow-xs font-semibold"
                    : "bg-[#FAFBFF] text-[#425466] hover:bg-[#EEF2FF] hover:text-[#0A2540] border border-[#E3E8EE]"
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lab Dropdown Selector */}
        <div className="flex items-center gap-2">
          <select
            value={filters.lab}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, lab: e.target.value }))
            }
            className="px-2.5 py-1 bg-[#FAFBFF] border border-[#E3E8EE] rounded-md text-[12px] font-mono text-[#0A2540] hover:bg-white transition-colors cursor-pointer focus:outline-hidden focus:border-[#635BFF]"
          >
            <option value="all">All AI Labs</option>
            {vendors.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-[11.5px] text-[#635BFF] hover:underline font-medium px-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Advanced Filters — Price, Context Length, Modality, Provider */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EDF1F6]">
        <div className="flex items-center gap-1.5 mr-1">
          <SlidersHorizontal size={12} className="text-[#697386]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#697386]">
            Filter by
          </span>
        </div>

        {/* Price Range */}
        <PresetDropdown
          label="Price"
          icon={DollarSign}
          presets={PRICE_PRESETS}
          currentMin={filters.priceRange[0]}
          currentMax={filters.priceRange[1]}
          onSelect={(min, max) =>
            setFilters((prev) => ({ ...prev, priceRange: [min, max] }))
          }
        />

        {/* Context Length */}
        <PresetDropdown
          label="Context Length"
          icon={Layers}
          presets={CONTEXT_PRESETS}
          currentMin={filters.contextRange[0]}
          currentMax={filters.contextRange[1]}
          onSelect={(min, max) =>
            setFilters((prev) => ({ ...prev, contextRange: [min, max] }))
          }
        />

        {/* Modality Multi-Select */}
        <MultiSelectDropdown
          label="Modality"
          icon={Eye}
          options={allModalities}
          selected={filters.modalities}
          onChange={(modalities) =>
            setFilters((prev) => ({ ...prev, modalities }))
          }
        />

        {/* Provider Multi-Select */}
        <MultiSelectDropdown
          label="Provider"
          icon={Layers}
          options={allProviders}
          selected={filters.providers}
          onChange={(providers) =>
            setFilters((prev) => ({ ...prev, providers }))
          }
        />
      </div>

      {/* Row 4: Active Filter Chips (only shown when advanced filters are active) */}
      <ActiveFilterChips filters={filters} setFilters={setFilters} />
    </div>
  );
}
