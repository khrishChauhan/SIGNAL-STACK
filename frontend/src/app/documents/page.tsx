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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Internal Knowledge Repository</h1>
            <Badge variant="info" className="text-[11px] font-mono">
              ChromaDB Vector Store
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload strategy decks, meeting notes, customer surveys, or financial models to ground the Monday Brief in internal facts.
          </p>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <Card
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed transition-all text-center ${
          dragActive ? "border-blue-500 bg-blue-50/30" : "border-slate-300 bg-white"
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

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Drag and drop internal files, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:underline font-bold"
              >
                browse local files
              </button>
            </h3>
            <p className="text-xs text-slate-500">
              Supports PDF, DOCX, CSV, XLSX, and TXT (up to 25MB per file)
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium animate-pulse pt-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing text, extracting chunks, and indexing into vector database...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Indexed Internal Documents ({documents.length})</span>
          <span className="text-slate-400 font-mono">Semantic RAG Active</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Retrieving indexed files...</span>
          </div>
        ) : documents.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No internal documents uploaded yet. Upload your FY2026 Strategy Plan or Student Churn CSV above to provide ground truth.
          </Card>
        ) : (
          <div className="divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 shadow-card">
            {documents.map((doc) => {
              const sizeKb = Math.round(doc.file_size_bytes / 1024);
              const isSpreadsheet = doc.file_type === "CSV" || doc.file_type === "XLSX";

              return (
                <div key={doc.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-slate-200">
                      {isSpreadsheet ? <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{doc.filename}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {doc.file_type}
                        </Badge>
                        <Badge variant="success" className="text-[10px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          INDEXED
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {doc.summary || "Internal document parsed and semantically chunked."}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                        <span>{sizeKb} KB</span>
                        <span>•</span>
                        <span>{doc.chunk_count} Vector Chunks</span>
                        <span>•</span>
                        <span>Uploaded {formatRelativeTime(doc.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      ChromaDB: Ready
                    </Badge>
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
