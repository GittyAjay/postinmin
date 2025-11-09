"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloudIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void> | void;
  accept?: string[];
  label?: string;
}

export const FileUpload = ({ onUpload, accept, label = "Drop your file here" }: FileUploadProps) => {
  const [isUploading, setUploading] = useState(false);

  const handleDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);
      try {
        await onUpload(files[0]);
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: accept?.reduce<Record<string, string[]>>((acc, type) => ({ ...acc, [type]: [] }), {}) ?? {
      "image/*": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="flex h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/40"
    >
      <input {...getInputProps()} />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
        <UploadCloudIcon className="h-6 w-6" />
      </div>
      <p className="font-medium text-slate-700 dark:text-slate-200">
        {isDragActive ? "Release to upload" : label}
      </p>
      <p className="text-sm text-slate-500">Supported formats: PNG, JPG, WebP</p>
      <Button variant="outline" disabled={isUploading} className="border-blue-200 text-blue-600">
        {isUploading ? "Uploading…" : "Select File"}
      </Button>
    </div>
  );
};

