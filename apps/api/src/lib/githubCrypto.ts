function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function sha256Bytes(value: string | Uint8Array): Promise<Uint8Array> {
  const input = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", asBufferSource(input)));
}

async function sha1Bytes(value: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-1", asBufferSource(value)));
}

async function getAesKey(): Promise<CryptoKey> {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("APP_SECRET is not configured");
  const keyBytes = await sha256Bytes(secret);
  return crypto.subtle.importKey("raw", asBufferSource(keyBytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptGitHubToken(token: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedWithTag = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: asBufferSource(iv), tagLength: 128 },
      await getAesKey(),
      asBufferSource(new TextEncoder().encode(token))
    )
  );
  const encrypted = encryptedWithTag.slice(0, -16);
  const authTag = encryptedWithTag.slice(-16);
  return `${bytesToBase64(iv)}:${bytesToBase64(authTag)}:${bytesToBase64(encrypted)}`;
}

export async function decryptGitHubToken(encryptedToken: string): Promise<string> {
  const [ivValue, authTagValue, encryptedValue] = encryptedToken.split(":");
  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Invalid encrypted GitHub token");
  }

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBufferSource(base64ToBytes(ivValue)), tagLength: 128 },
    await getAesKey(),
    asBufferSource(concatBytes(base64ToBytes(encryptedValue), base64ToBytes(authTagValue)))
  );

  return new TextDecoder().decode(decrypted);
}

export async function sha256Hex(value: string | Uint8Array): Promise<string> {
  return bytesToHex(await sha256Bytes(value));
}

export async function gitBlobSha(content: string): Promise<string> {
  const contentBytes = new TextEncoder().encode(content);
  const prefixBytes = new TextEncoder().encode(`blob ${contentBytes.byteLength}\0`);
  return bytesToHex(await sha1Bytes(concatBytes(prefixBytes, contentBytes)));
}

export function utf8ToBase64(value: string): string {
  return bytesToBase64(new TextEncoder().encode(value));
}
