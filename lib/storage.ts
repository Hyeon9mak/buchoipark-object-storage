import { api } from "./api";

export interface FileEntry {
  type: "FILE";
  name: string;
  path: string;
  id: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FolderEntry {
  type: "FOLDER";
  name: string;
  path: string;
}

export type StorageEntry = FileEntry | FolderEntry;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function listFolder(
  userId: string,
  folderPath: string
): Promise<StorageEntry[]> {
  const params = new URLSearchParams({ userId, folderPath });
  return api.get<StorageEntry[]>(`/files/folder?${params}`);
}

export async function uploadFile(
  userId: string,
  filePath: string,
  file: File
): Promise<unknown> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("filePath", filePath);
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/files/upload`, {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — browser will auto-include multipart boundary
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }

  return res.json();
}

export function deleteFile(
  userId: string,
  filePath: string
): Promise<{ deleted: boolean }> {
  const params = new URLSearchParams({ userId, filePath });
  return api.delete<{ deleted: boolean }>(`/files?${params}`);
}

export function deleteFolder(
  userId: string,
  folderPath: string
): Promise<{ deleted: number }> {
  const params = new URLSearchParams({ userId, folderPath });
  return api.delete<{ deleted: number }>(`/files/folder?${params}`);
}

export function downloadUrl(id: string): string {
  return `${API_BASE_URL}/files/${id}/download`;
}
