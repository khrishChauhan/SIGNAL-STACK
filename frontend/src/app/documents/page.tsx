"use client";

import React, { useEffect, useState, useRef } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { InternalDocument } from "@/types/api";
import {
  FolderOpen,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
  Database,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

export default function InternalDocumentsPage() {
  const { selectedCompany } = useCompany();
  const [documents, setDocuments] = useState<InternalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedCompany) return;
    loadDocuments();
  }, [selectedCompany]);

  async function loadDocuments() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const list = await api.listDocuments(selectedCompany.id);
      setDocuments(list);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    if (!selectedCompany) return;
    try {
      setIsUploading(true);
      const uploaded = await api.uploadDocument(selectedCompany.id, file);
      setDocuments((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Internal Knowledge Repository</h1>
            <Badge variant="info" className="text-[11px] font-mono">
              ChromaDB Vector Store
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload strategic plans, financial decks, and internal notes to cross-reference public market signals against proprietary company facts.
          </p>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-8 md:p-10 border-2 border-dashed transition-all text-center rounded-2xl shadow-card ${
          dragActive ? "border-blue-500 bg-blue-50/40" : "border-slate-300 bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.csv,.xlsx,.txt"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-subtle">
            <Upload className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Drag and drop internal files, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
              >
                browse local files
              </button>
            </h3>
            <p className="text-xs text-slate-500">
              Strictly validated: PDF, DOCX, CSV, XLSX, and TXT (up to 25MB ceiling)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">.PDF</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">.DOCX</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">.XLSX</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">.CSV</span>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-semibold animate-pulse pt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing text, extracting chunks, and indexing embeddings into ChromaDB...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Indexed Internal Knowledge ({documents.length})</span>
          <span className="text-slate-400 font-mono font-medium">Local Vector Embeddings Active</span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Internal Documents Uploaded Yet"
            description="Upload internal strategy files, board slides, or financial spreadsheets above to ground the weekly brief in proprietary facts."
            actionLabel="Select Document"
            actionIcon={Upload}
            onAction={() => fileInputRef.current?.click()}
          />
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
            {documents.map((doc) => {
              const sizeKb = Math.round(doc.file_size_bytes / 1024);
              const isSpreadsheet = doc.file_type === "CSV" || doc.file_type === "XLSX";

              return (
                <div key={doc.id} className="p-4 md:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200/80 shadow-subtle">
                      {isSpreadsheet ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">{doc.filename}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {doc.file_type}
                        </Badge>
                        <Badge variant="success" withDot className="text-[10px] font-mono">
                          INDEXED
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">
                        {doc.summary || "Internal document parsed and semantically chunked into vector embeddings."}
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 font-mono pt-0.5">
                        <span className="text-slate-600 font-semibold">{sizeKb} KB</span>
                        <span>•</span>
                        <span>{doc.chunk_count} Vector Chunks</span>
                        <span>•</span>
                        <span>Uploaded {formatRelativeTime(doc.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      Vectorized
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
