"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteFile,
  deleteFolder,
  downloadUrl,
  FileEntry,
  listFolder,
  StorageEntry,
  uploadFile,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function FileBrowser() {
  const [userId, setUserId] = useState("");
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [entries, setEntries] = useState<StorageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile_, setUploadFile_] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<StorageEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load userId from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("userId");
    if (saved) setUserId(saved);
  }, []);

  const currentPath =
    pathSegments.length === 0 ? "/" : `/${pathSegments.join("/")}`;

  const fetchEntries = async (uid: string, path: string) => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listFolder(uid, path);
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load folder");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserIdBlur = () => {
    localStorage.setItem("userId", userId);
    fetchEntries(userId, currentPath);
  };

  const handleUserIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      localStorage.setItem("userId", userId);
      fetchEntries(userId, currentPath);
    }
  };

  const navigateTo = (segments: string[]) => {
    setPathSegments(segments);
    const path = segments.length === 0 ? "/" : `/${segments.join("/")}`;
    fetchEntries(userId, path);
  };

  const handleFolderClick = (name: string) => {
    navigateTo([...pathSegments, name]);
  };

  // Upload dialog: update path when file is selected
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadFile_(file);
    if (file) {
      const base = pathSegments.length === 0 ? "" : `/${pathSegments.join("/")}`;
      setUploadPath(`${base}/${file.name}`);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile_ || !uploadPath) return;
    setUploading(true);
    try {
      await uploadFile(userId, uploadPath, uploadFile_);
      setUploadOpen(false);
      setUploadFile_(null);
      setUploadPath("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchEntries(userId, currentPath);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "FILE") {
        await deleteFile(userId, deleteTarget.path);
      } else {
        await deleteFolder(userId, deleteTarget.path);
      }
      setDeleteTarget(null);
      fetchEntries(userId, currentPath);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header: userId + Upload button */}
        <div className="flex items-center gap-3">
          <Input
            className="max-w-xs"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onBlur={handleUserIdBlur}
            onKeyDown={handleUserIdKeyDown}
          />
          <Dialog
            open={uploadOpen}
            onOpenChange={(open) => {
              setUploadOpen(open);
              if (open) {
                const base =
                  pathSegments.length === 0 ? "" : `/${pathSegments.join("/")}`;
                setUploadPath(`${base}/`);
                setUploadFile_(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          >
            <DialogTrigger render={<Button disabled={!userId} />}>
              Upload
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="block w-full text-sm"
                    onChange={handleFileSelect}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Upload path
                  </label>
                  <Input
                    value={uploadPath}
                    onChange={(e) => setUploadPath(e.target.value)}
                    placeholder="/path/to/filename.ext"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile_ || !uploadPath || uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigateTo([])}
          >
            Home
          </button>
          {pathSegments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-gray-400">/</span>
              <button
                className="text-blue-600 hover:underline"
                onClick={() => navigateTo(pathSegments.slice(0, i + 1))}
              >
                {seg}
              </button>
            </span>
          ))}
        </nav>

        {/* Error */}
        {error && (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400">
                    {userId ? "Empty folder" : "Enter a User ID to browse"}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.path}>
                    <TableCell>
                      {entry.type === "FOLDER" ? (
                        <button
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                          onClick={() => handleFolderClick(entry.name)}
                        >
                          <span>📁</span> {entry.name}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span>📄</span> {entry.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{entry.type}</TableCell>
                    <TableCell className="text-gray-500">
                      {entry.type === "FILE"
                        ? formatSize((entry as FileEntry).fileSize)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {entry.type === "FILE"
                        ? formatDate((entry as FileEntry).uploadedAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {entry.type === "FILE" && (
                          <a
                            href={downloadUrl((entry as FileEntry).id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(entry)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "FOLDER" ? "Folder" : "File"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "FOLDER"
                ? `"${deleteTarget.name}" and all its contents will be permanently deleted.`
                : `"${deleteTarget?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
