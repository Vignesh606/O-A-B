"use client";

import React from "react";
import { FileText, ImageIcon, Video, Mic, Type } from "lucide-react";

export type ModalityType = "text" | "image" | "video" | "audio" | "pdf";

interface ModalityIconsProps {
  modalities?: string[];
  size?: number;
}

export const MODALITY_CONFIG: Record<
  ModalityType,
  { label: string; icon: any; color: string }
> = {
  text: { label: "Text", icon: Type, color: "#635BFF" },
  image: { label: "Image", icon: ImageIcon, color: "#EC4899" },
  video: { label: "Video", icon: Video, color: "#F97316" },
  audio: { label: "Audio", icon: Mic, color: "#10B981" },
  pdf: { label: "PDF", icon: FileText, color: "#EF4444" },
};

export default function ModalityIcons({ modalities = ["text"], size = 13 }: ModalityIconsProps) {
  const normalized = Array.from(
    new Set(
      modalities.map((m) => m.toLowerCase().trim() as ModalityType)
    )
  ).filter((m) => MODALITY_CONFIG[m]);

  if (normalized.length === 0) {
    normalized.push("text");
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {normalized.map((mod) => {
        const config = MODALITY_CONFIG[mod];
        const IconComponent = config.icon;
        return (
          <span
            key={mod}
            title={config.label}
            className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#F4F4F0] text-[#444444] hover:bg-[#EEF2FF] hover:text-[#635BFF] transition-colors cursor-help border border-[#E8E8E2]"
          >
            {IconComponent ? <IconComponent size={size} /> : null}
          </span>
        );
      })}
    </div>
  );
}
