import React, { useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { forceDownload } from "@/lib/utils"; // Import our new helper

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    const fileName = `image_${Date.now()}.jpg`; // Create a generic filename
    await forceDownload(imageUrl, fileName);
    setIsDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full screen view"
          className="w-full h-full object-contain"
        />
        <div className="absolute top-4 right-4 flex gap-4">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-gray-800/80 text-white rounded-full p-3 w-12 h-12 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            aria-label="Download image"
          >
            {isDownloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-800/80 text-white rounded-full p-3 hover:bg-red-500 transition-colors"
            aria-label="Close image view"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
