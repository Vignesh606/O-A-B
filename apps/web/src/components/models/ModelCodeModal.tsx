"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, X } from "lucide-react";
import type { EnrichedModel } from "@/lib/modelsData";

interface ModelCodeModalProps {
  model: EnrichedModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelCodeModal({ model, isOpen, onClose }: ModelCodeModalProps) {
  const [tab, setTab] = useState<"openai" | "litellm" | "vercel" | "curl">("openai");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !model) return null;

  const modelSlug = model.slug;

  const snippets: Record<string, string> = {
    openai: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.openai.com/v1",  # or your preferred inference endpoint
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="${modelSlug}",
    messages=[
        {"role": "system", "content": "You are a helpful AI assistant on OneAtlas."},
        {"role": "user", "content": "Explain how to build an autonomous agent with this model."}
    ],
    temperature=0.7,
)

print(response.choices[0].message.content)`,

    litellm: `import litellm
from litellm import completion

response = completion(
    model="${modelSlug}",
    messages=[
        {"role": "user", "content": "Summarize the key capabilities of this model."}
    ]
)

print(response.choices[0].message.content)`,

    curl: `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{
    "model": "${modelSlug}",
    "messages": [
      {"role": "user", "content": "Hello OneAtlas!"}
    ]
  }'`,

    vercel: `import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({ apiKey: process.env.API_KEY });

const { text } = await generateText({
  model: openai("${modelSlug}"),
  prompt: "What are the specs and parameters of this model?",
});

console.log(text);`
  };

  const currentCode = snippets[tab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E5E0] max-w-2xl w-full overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE9E4] bg-[#FAFAF8]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-md bg-[#EEF2FF] text-[#635BFF]">
              <Terminal size={18} />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-[#111111]">
                API Integration: {model.name}
              </h3>
              <p className="text-[12px] font-mono text-[#777777]">{modelSlug}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-md hover:bg-[#EAE9E4] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 pt-3 border-b border-[#EAE9E4] bg-[#F7F7F4] gap-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap">
            {[
              { key: "openai", label: "OpenAI Python" },
              { key: "litellm", label: "LiteLLM" },
              { key: "vercel", label: "Vercel AI SDK" },
              { key: "curl", label: "cURL" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors cursor-pointer shrink-0 ${
                  tab === t.key
                    ? "border-[#635BFF] text-[#635BFF] font-semibold"
                    : "border-transparent text-[#666666] hover:text-[#111111]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="self-end sm:self-auto inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 mb-1.5 rounded bg-white hover:bg-[#F0EFEA] text-[#444444] border border-[#D5D5CF] transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code body */}
        <div className="p-4 sm:p-6 bg-[#0E1726] text-[#E4E4E7] overflow-x-auto font-mono text-[12.5px] leading-relaxed max-h-[380px]">
          <pre>{currentCode}</pre>
        </div>

        {/* Specs quick footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#FAFAF8] border-t border-[#EAE9E4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-[#777777]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Context: <strong className="text-[#333333]">{model.contextWindow.toLocaleString()}</strong></span>
            <span>Max Output: <strong className="text-[#333333]">{model.maxOutputTokens.toLocaleString()}</strong></span>
            {model.inputPricePerM !== null && (
              <span>Price: <strong className="text-[#333333]">${model.inputPricePerM} / ${model.outputPricePerM}</strong> per 1M</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="self-end sm:self-auto text-[12px] font-medium text-[#555555] hover:text-[#111111] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
