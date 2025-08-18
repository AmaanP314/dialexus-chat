import { useState } from "react";
import { AdminViewUser } from "../types";
import { resetUserPassword } from "@/lib/api";
import { InteractiveUserTable } from "./InteractiveUserTable";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = ({ allUsers }: { allUsers: AdminViewUser[] }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!selectedUserId || !newPassword) return;
    setIsLoading(true);
    try {
      await resetUserPassword(selectedUserId, newPassword);
      setMessage("Password reset successfully.");
    } finally {
      setIsLoading(false);
      setSelectedUserId(null);
      setNewPassword("");
      setIsConfirmationOpen(false); // Close the modal
    }
  };

  const openConfirmationDialog = () => {
    if (selectedUserId && newPassword) {
      setIsConfirmationOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Reset User Password</h2>
      <div className="bg-background p-6 rounded-lg border border-border space-y-4">
        <InteractiveUserTable
          users={allUsers}
          onUserSelect={setSelectedUserId}
          selectedUserId={selectedUserId}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            className="w-full pr-10 px-4 py-2 bg-muted border border-border rounded-lg"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={openConfirmationDialog}
            disabled={!selectedUserId || !newPassword || isLoading}
            className="w-full sm:w-auto px-6 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors duration-200"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        {message && <p className="text-green-600 text-center">{message}</p>}
      </div>

      {/* Modern Confirmation Dialog */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirm Password Reset
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to reset this user's password?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmationOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ResetPassword;
