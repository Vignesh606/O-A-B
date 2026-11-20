// =============================================================================
// apps/api/src/services/storage.service.ts
// Edge-safe storage service placeholder.
//
// TODO: Replace this with Cloudflare R2 bindings for durable production storage.
// =============================================================================

export interface StorageObjectInput {
  orgId: string;
  bucket: string;
  key: string;
  value: string | Uint8Array;
  contentType?: string;
}

export interface StorageLookupInput {
  orgId: string;
  bucket: string;
  key: string;
}

export interface StoredObject {
  orgId: string;
  bucket: string;
  key: string;
  value: string;
  contentType?: string;
  size: number;
  updatedAt: string;
}

export interface StorageObjectSummary {
  bucket: string;
  key: string;
  size: number;
  updatedAt: string;
}

const objects = new Map<string, StoredObject>();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function objectId(input: StorageLookupInput): string {
  return `${input.orgId}:${input.bucket}:${input.key}`;
}

export class StorageService {
  async putObject(input: StorageObjectInput): Promise<StorageObjectSummary> {
    const value =
      typeof input.value === "string" ? input.value : bytesToBase64(input.value);
    const updatedAt = new Date().toISOString();
    const object: StoredObject = {
      orgId: input.orgId,
      bucket: input.bucket,
      key: input.key,
      value,
      contentType: input.contentType,
      size: new TextEncoder().encode(value).byteLength,
      updatedAt,
    };

    objects.set(objectId(input), object);
    return {
      bucket: object.bucket,
      key: object.key,
      size: object.size,
      updatedAt: object.updatedAt,
    };
  }

  async getObject(input: StorageLookupInput): Promise<StoredObject> {
    const object = objects.get(objectId(input));
    if (!object) throw new Error("Storage object not found");
    return object;
  }

  async deleteObject(input: StorageLookupInput): Promise<void> {
    objects.delete(objectId(input));
  }

  async listObjects(
    orgId: string,
    bucket: string
  ): Promise<StorageObjectSummary[]> {
    return Array.from(objects.values())
      .filter((object) => object.orgId === orgId && object.bucket === bucket)
      .map((object) => ({
        bucket: object.bucket,
        key: object.key,
        size: object.size,
        updatedAt: object.updatedAt,
      }));
  }
}
