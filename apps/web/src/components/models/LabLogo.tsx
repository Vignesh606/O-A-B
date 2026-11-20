"use client";

import React, { useState } from "react";
import { getVendorFaviconUrl } from "@/lib/modelsData";

interface LabLogoProps {
  vendor: string;
  size?: number;
  className?: string;
}

export default function LabLogo({ vendor, size = 20, className = "" }: LabLogoProps) {
  const [imgError, setImgError] = useState(false);
  const normalized = (vendor || "").toLowerCase().trim();

  // Custom inline SVGs for prominent frontier labs
  if (normalized === "openai") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#111111] dark:text-white shrink-0 ${className}`}
      >
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.4097 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.1416-1.5299l2.5523-1.4727 2.5522 1.4727v2.936l-2.5522 1.4727-2.5523-1.4727z" />
      </svg>
    );
  }

  if (normalized === "anthropic") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#D97706] shrink-0 ${className}`}
      >
        <path d="M17.067 2.667H13.62L19.78 18.27H23.14L17.067 2.667ZM7.147 2.667L1.067 18.27H4.51L5.867 14.987H12.287L13.567 18.27H17.007L10.767 2.667H7.147ZM6.837 12.107L8.917 6.587L11.077 12.107H6.837Z" />
      </svg>
    );
  }

  if (normalized === "meta") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#0081FB] shrink-0 ${className}`}
      >
        <path d="M16.993 4.542c-1.804 0-3.215 1.359-4.492 3.085-1.754-2.234-3.22-3.085-4.976-3.085-3.579 0-6.322 4.659-6.322 9.589 0 3.085 1.492 5.031 3.992 5.031 1.8 0 3.094-.848 5.395-4.87 0 0 .959-1.693 1.618-2.86.231.373.475.776.731 1.207l1.079 1.815c2.101 3.517 3.272 4.708 5.393 4.708 2.437 0 3.793-1.973 3.793-5.121 0-5.163-2.804-9.494-6.208-9.494zm-8.158 8.661c-1.865 2.924-2.51 3.58-3.548 3.58-1.069 0-1.705-.939-1.705-2.613 0-3.579 1.785-7.239 3.913-7.239 1.152 0 2.115.665 3.59 2.778-1.401 2.148-2.25 3.494-2.25 3.494zm7.042-.367l-1.291-2.153c-.324-.529-.66-.105-1.006-.52 1.163-1.794 2.121-2.689 3.262-2.689 2.369 0 4.265 3.49 4.265 7.775 0 1.634-.535 2.582-1.643 2.582-1.062 0-1.569-.702-3.587-4.995z" />
      </svg>
    );
  }

  if (normalized === "google") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#4285F4] shrink-0 ${className}`}
      >
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
      </svg>
    );
  }

  if (normalized === "deepseek") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#0284C7] shrink-0 ${className}`}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5L4.5 9.75 2 11l10 5 10-5-2.5-1.25L12 13.5zm0 5.5l-7.5-3.75L2 16.5 12 22l10-5.5-2.5-1.25L12 19z" />
      </svg>
    );
  }

  // Favicon or initials fallback
  const faviconUrl = getVendorFaviconUrl(vendor);

  if (!imgError && faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt={vendor}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`rounded-xs object-contain shrink-0 ${className}`}
      />
    );
  }

  const initial = (vendor || "M").charAt(0).toUpperCase();
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded bg-[#F0EFEA] text-[#555555] font-semibold text-[11px] flex items-center justify-center shrink-0 border border-[#E5E5DF] ${className}`}
    >
      {initial}
    </div>
  );
}
