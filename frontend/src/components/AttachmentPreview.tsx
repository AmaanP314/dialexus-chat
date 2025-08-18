// --- src/components/AttachmentPreview.tsx ---
import React from "react";
import { File as FileIcon, Loader2, X } from "lucide-react";

export const AttachmentPreview: React.FC<{
  file: File;
  onCancel: () => void;
  isUploading: boolean;
}> = ({ file, onCancel, isUploading }) => {
  const isImage = file.type.startsWith("image/");
  const localUrl = URL.createObjectURL(file);

  return (
    <div className="relative w-20 h-20 p-2">
      <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
        {isImage ? (
          <img
            src={localUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FileIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        {/* Conditionally render loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-colors disabled:opacity-50"
          aria-label="Cancel upload"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
