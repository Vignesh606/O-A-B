// =============================================================================
// apps/web/src/services/chat.ts
//
// Atlas AI chat SSE client. Mirrors the streaming pattern used in builder.ts
// for the generate endpoint.
// =============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type ChatDoneData = {
  intent: string;
  requiresRegeneration: boolean;
  affectedFiles: string[];
  fullText: string;
  messageCount: number;
};

// ── POST /chat — send a message, stream the response ─────────────────────────

export async function sendChatMessage(
  orgId: string,
  projectId: string,
  token: string,
  message: string,
  signal: AbortSignal,
  onDelta: (text: string) => void,
  onStatus: (message: string) => void,
  onDone: (data: ChatDoneData) => void,
  onError: (error: string) => void
) {
  try {
    const response = await fetch(
      `${API_URL}/orgs/${orgId}/projects/${projectId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
        signal,
      }
    );

    if (!response.ok) {
      onError(`Chat request failed: ${response.statusText}`);
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) {
      onError("No response stream");
      return;
    }

    let buffer = "";
    let sawDone = false;
    let sawError = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        let eventName = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventName = line.slice(7).trim();
          if (line.startsWith("data: ")) data = line.slice(6).trim();
        }
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);

          if (eventName === "status") {
            onStatus(parsed.message ?? "");
          } else if (eventName === "delta") {
            onDelta(parsed.text ?? "");
          } else if (eventName === "done") {
            sawDone = true;
            onDone(parsed as ChatDoneData);
          } else if (eventName === "error") {
            sawError = true;
            onError(parsed.message ?? "Unknown error");
          }
        } catch {
          console.error("Failed to parse chat SSE data", data);
        }
      }
    }

    if (!sawDone && !sawError) {
      onError("Streaming interruption: connection closed before completion");
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.log("Chat request aborted.");
    } else {
      onError("Network error or connection lost");
    }
  }
}

// ── GET /chat — load conversation history ─────────────────────────────────────

export async function getChatHistory(
  orgId: string,
  projectId: string,
  token: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_URL}/orgs/${orgId}/projects/${projectId}/chat`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) return [];
  const json = await response.json();
  return json?.data?.history ?? [];
}

// ── DELETE /chat — clear conversation history ─────────────────────────────────

export async function clearChatHistory(
  orgId: string,
  projectId: string,
  token: string
): Promise<void> {
  await fetch(`${API_URL}/orgs/${orgId}/projects/${projectId}/chat`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}