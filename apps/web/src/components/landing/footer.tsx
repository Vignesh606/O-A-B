import { Logo } from "./logo";
import Link from "next/link";

const COLS = [
  {
    h: "Models Database",
    links: [
      { label: "All Frontier Models", href: "/models" },
      { label: "DeepSeek R1", href: "/models/deepseek-r1" },
      { label: "Claude 3.7 Sonnet", href: "/models/claude-3-7-sonnet" },
      { label: "GPT-4o", href: "/models/gpt-4o" },
      { label: "Llama 3.3 70B", href: "/models/llama-3-3-70b-instruct" },
    ],
  },
  {
    h: "Inference Providers",
    links: [
      { label: "Groq LPU", href: "/models/deepseek-r1" },
      { label: "Together AI", href: "/models/deepseek-r1" },
      { label: "Fireworks AI", href: "/models/deepseek-r1" },
      { label: "OpenRouter", href: "/models/deepseek-r1" },
      { label: "AWS Bedrock", href: "/models/deepseek-r1" },
    ],
  },
  {
    h: "Developers",
    links: [
      { label: "API Specs", href: "https://models.dev" },
      { label: "OpenAI SDK Snippets", href: "/models" },
      { label: "LiteLLM Router", href: "/models" },
      { label: "Platform Backup", href: "/platform" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "OneAtlas.dev", href: "/" },
      { label: "Frontier Labs", href: "/models" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer bg-white border-t border-[#E3E8EE] pt-12 pb-8">
      <div className="foot-grid max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="foot-brand md:col-span-1 space-y-3">
          <Logo />
          <p className="text-[13px] text-[#697386] leading-relaxed">
            Open-source database of AI model specifications, live provider pricing, and developer endpoints.
          </p>
        </div>
        {COLS.map((col) => (
          <div className="foot-col" key={col.h}>
            <h4 className="text-[12px] font-mono uppercase tracking-wider text-[#0A2540] font-bold mb-3">{col.h}</h4>
            <ul className="space-y-2 text-[13px]">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[#697386] hover:text-[#635BFF] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="foot-bottom max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-[#EDF1F6] flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#697386] gap-3">
        <span>© 2026 OneAtlas, Inc. All rights reserved.</span>
        <div className="foot-bottom-links flex items-center gap-4">
          <a href="#" className="hover:text-[#635BFF]">Privacy Policy</a>
          <a href="#" className="hover:text-[#635BFF]">Terms of Service</a>
          <Link href="/platform" className="hover:text-[#635BFF]">Legacy Platform</Link>
        </div>
      </div>
    </footer>
  );
}
