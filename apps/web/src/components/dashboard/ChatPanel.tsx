"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Trash2 } from "lucide-react";

import {
  ChatMessage,
  sendChatMessage,
  getChatHistory,
  clearChatHistory,
} from "@/services/chat";

interface ChatPanelProps {
  orgId: string;
  projectId: string;
  getToken: () => Promise<string | null>;
}

export default function ChatPanel({
  orgId,
  projectId,
  getToken,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await getToken();

        if (!token || !orgId || !projectId) {
          return;
        }

        const history = await getChatHistory(
          orgId,
          projectId,
          token
        );

        setMessages(history);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    }

    loadHistory();
  }, [orgId, projectId, getToken]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ]);

    setInput("");
    setLoading(true);
    setStatus("");

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    const token = await getToken();

    if (!token) {
      setLoading(false);
      setStatus("Authentication failed");
      return;
    }
    await sendChatMessage(
      orgId,
      projectId,
      token,
      text,
      controller.signal,

      (delta) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;

          const copy = [...prev];
          const lastIndex = copy.length - 1;

          copy[lastIndex] = {
            ...copy[lastIndex],
            content: copy[lastIndex].content + delta,
          };

          return copy;
        });
      },

      (message) => {
        setStatus(message);
      },

      () => {
        setLoading(false);
        setStatus("");
      },

      (error) => {
        console.error(error);
        setLoading(false);
        setStatus(error);
      }
    );
  };

  const handleClear = async () => {
    try {
      const token = await getToken();

      if (!token) return;

      await clearChatHistory(
        orgId,
        projectId,
        token
      );

      setMessages([]);
      setStatus("");
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="bg-white border border-[#E3E8EE] rounded-2xl shadow-sm h-[500px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#EDF1F6] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-[#635BFF]"
            />
            <h2 className="font-semibold text-[#0A2540]">
              Atlas AI Assistant
            </h2>
          </div>

          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-[#F6F9FC] transition-colors"
            title="Clear chat"
          >
            <Trash2
              size={16}
              className="text-[#697386]"
            />
          </button>
        </div>

        <p className="text-sm text-[#697386] mt-1">
          Ask Atlas AI anything about your project
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="bg-[#F6F9FC] rounded-xl p-3 text-sm text-[#425466] max-w-[80%]">
            Hello! Ask me anything about your
            project, generated code, architecture,
            or possible improvements.
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={
              message.role === "user"
                ? "ml-auto bg-[#635BFF] text-white rounded-xl p-3 text-sm max-w-[80%] whitespace-pre-wrap"
                : "bg-[#F6F9FC] rounded-xl p-3 text-sm text-[#425466] max-w-[80%] whitespace-pre-wrap"
            }
          >
            {message.content}
          </div>
        ))}

        {status && (
          <div className="text-xs text-[#697386] italic">
            {status}
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 pb-3 flex gap-2 flex-wrap">
        <button
          onClick={() =>
            handlePromptClick(
              "Explain this project's architecture"
            )
          }
          className="text-xs px-3 py-2 rounded-full bg-[#F6F9FC] hover:bg-[#EDF1F6] text-[#425466]"
        >
          Explain architecture
        </button>

        <button
          onClick={() =>
            handlePromptClick(
              "Review the generated code and suggest improvements"
            )
          }
          className="text-xs px-3 py-2 rounded-full bg-[#F6F9FC] hover:bg-[#EDF1F6] text-[#425466]"
        >
          Review code
        </button>

        <button
          onClick={() =>
            handlePromptClick(
              "What files should I modify to add new features?"
            )
          }
          className="text-xs px-3 py-2 rounded-full bg-[#F6F9FC] hover:bg-[#EDF1F6] text-[#425466]"
        >
          Suggest changes
        </button>
      </div>

      {/* Input */}
      <div className="border-t border-[#EDF1F6] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            placeholder="Ask Atlas AI..."
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 border border-[#E3E8EE] rounded-xl px-4 py-3 outline-none focus:border-[#635BFF] disabled:bg-gray-50"
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 rounded-xl bg-[#635BFF] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}