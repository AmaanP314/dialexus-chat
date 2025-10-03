"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { changeFullName } from "@/lib/api";
import { X } from "lucide-react";

interface ChangeFullNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeFullNameModal: React.FC<ChangeFullNameModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(user?.full_name || "");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user?.full_name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await changeFullName(fullName);
      updateUser({ full_name: fullName });
      setSuccessMessage(`Full name changed to "${fullName}"`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      const errorData = await err.response?.json();
      setError(errorData?.detail || "Failed to change full name.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-xl border border-border animate-in fade-in-0 zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Change Full Name</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              New Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {successMessage && (
            <p className="text-green-500 text-sm text-center">
              {successMessage}
            </p>
          )}
          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeFullNameModal;
