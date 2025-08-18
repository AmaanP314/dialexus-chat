// --- src/components/FileAttachmentDisplay.tsx (Corrected) ---
import React, { useState } from "react";
import { forceDownload } from "@/lib/utils"; // Assuming this utility function exists
import { File as FileIcon, Loader2, Download } from "lucide-react";

interface FileAttachmentDisplayProps {
  fileUrl: string;
  fileName: string;
}

export const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({
  fileUrl,
  fileName,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior
    setIsDownloading(true);
    await forceDownload(fileUrl, fileName);
    setIsDownloading(false);
  };

  const formatFileName = (name: string) => {
    return name.length > 20
      ? `${name.substring(0, 10)}...${name.substring(name.length - 7)}`
      : name;
  };

  return (
    <div
      onClick={handleDownloadClick}
      className="flex items-center bg-muted/50 p-3 rounded-lg mt-2 hover:bg-muted transition-colors cursor-pointer"
    >
      <FileIcon className="w-8 h-8 text-primary flex-shrink-0" />
      <div className="ml-3 overflow-hidden">
        <p className="text-sm font-medium text-foreground truncate">
          {formatFileName(fileName)}
        </p>
        <p className="text-xs text-muted-foreground">Click to download</p>
      </div>
      <div className="w-8 h-8 flex items-center justify-center ml-auto">
        {isDownloading ? (
          <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" />
        ) : (
          <Download className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};
