"use client";

import { useState, useEffect } from "react";
import { changePassword } from "@/lib/api";
import { X, Eye, EyeOff } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordInput = ({ value, onChange, placeholder, id }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-4 py-2 pr-10 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
        aria-label="Toggle password visibility"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        setSuccessMessage(null);
      }, 300); // Delay reset to allow for exit animation
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const response = await changePassword(oldPassword, newPassword);
      if (response.ok) {
        // <--- This checks for FAILURE, but you run SUCCESS code here.
        setSuccessMessage("Password changed successfully!");
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(
          errorData?.detail ||
            "Failed to change password. Check your old password."
        );
      }
    } catch (err: any) {
      // FAILURE
      setSuccessMessage(null); // <-- CRITICAL FIX: Ensure success message is cleared!
      const errorData = await err.response?.json();
      setError(
        errorData?.detail ||
          "Failed to change password. Check your old password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-xl border border-border animate-in fade-in-0 zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Change Password</h3>
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
              htmlFor="old_password"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Old Password
            </label>
            <PasswordInput
              id="old_password"
              value={oldPassword}
              onChange={(e: any) => setOldPassword(e.target.value)}
              placeholder="Enter your old password"
            />
          </div>
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              New Password
            </label>
            <PasswordInput
              id="new_password"
              value={newPassword}
              onChange={(e: any) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Confirm New Password
            </label>
            <PasswordInput
              id="confirm_password"
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
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
              disabled={isLoading || !oldPassword || !newPassword}
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

export default ChangePasswordModal;
