"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ModelsPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ModelsPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ModelsPaginationProps) {
  const isAll = pageSize >= totalItems && totalItems > 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 mt-8 pt-5 pb-2 border-t border-[#E3E8EE]">
      {/* Centered Pagination Controls */}
      <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E8EE] bg-white text-[12px] font-medium text-[#425466] hover:bg-[#FAFBFF] hover:text-[#0A2540] hover:border-[#635BFF] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs select-none"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-[12px] font-mono text-[#697386] select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg text-[12px] font-mono font-medium transition-all cursor-pointer flex items-center justify-center select-none ${
                  isActive
                    ? "bg-[#635BFF] text-white shadow-xs font-bold border border-[#635BFF]"
                    : "bg-white text-[#425466] border border-[#E3E8EE] hover:bg-[#FAFBFF] hover:text-[#0A2540]"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="Next Page"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E8EE] bg-white text-[12px] font-medium text-[#425466] hover:bg-[#FAFBFF] hover:text-[#0A2540] hover:border-[#635BFF] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs select-none"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Subtle Counter and Page Size */}
      <div className="flex items-center gap-3 text-[11px] font-mono text-[#697386]">
        <span>
          Showing <strong className="text-[#0A2540] font-semibold">{startItem}</strong> -{" "}
          <strong className="text-[#0A2540] font-semibold">{endItem}</strong> of{" "}
          <strong className="text-[#0A2540] font-semibold">{totalItems}</strong>
        </span>

        <span className="text-[#E3E8EE]">|</span>

        <div className="flex items-center gap-1.5">
          <span>Show:</span>
          {[12, 24, 48].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={`px-1.5 py-0.5 rounded text-[10.5px] transition-colors cursor-pointer ${
                pageSize === size
                  ? "bg-[#EEF2FF] text-[#635BFF] font-semibold"
                  : "text-[#697386] hover:text-[#0A2540]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
