import Link from "next/link";

const models = [
  { name: "Mistral Large", vendor: "Mistral AI", color: "#FFB17A" },
  { name: "DeepSeek V3", vendor: "DeepSeek", color: "#C7C9FF" },
  { name: "DeepSeek R1", vendor: "DeepSeek", color: "#0284C7" },
  { name: "Claude 3.7 Sonnet", vendor: "Anthropic", color: "#FF8B5B" },
  { name: "GPT-4o", vendor: "OpenAI", color: "#10A37F" },
  { name: "o3-mini", vendor: "OpenAI", color: "#A8E5CE" },
  { name: "Gemini 2.0 Flash", vendor: "Google", color: "#B8C9FF" },
  { name: "Llama 3.3 70B", vendor: "Meta", color: "#A8C5FF" },
  { name: "Qwen 2.5 72B", vendor: "Alibaba", color: "#FF9173" },
];

export function ModelsStrip() {
  const doubled = [...models, ...models];

  return (
    <div className="models-strip">
      <div className="models-label">
        <Link href="/models" className="hover:text-[#635BFF] transition-colors inline-flex items-center gap-1.5 no-underline">
          <span>Build with all the latest AI models</span>
          <span className="text-[11px] font-mono font-medium text-[#635BFF]">→ Explore Catalog</span>
        </Link>
      </div>
      <div className="models-track-wrap">
        <div className="models-track">
          {doubled.map((m, i) => (
            <Link href="/models" className="model-pill no-underline" key={i}>
              <span className="model-dot" style={{ background: m.color }} />
              <span>
                <span className="name">{m.name}</span>
                <br />
                <span className="vendor">{m.vendor}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

