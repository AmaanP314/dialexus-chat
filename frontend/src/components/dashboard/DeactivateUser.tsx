import { useState } from "react";
import { AdminViewUser } from "../types";
import { deactivateUser } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { InteractiveUserTable } from "./InteractiveUserTable";

const DeactivateUser = ({ activeUsers }: { activeUsers: AdminViewUser[] }) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [message, setMessage] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { refetchUserLists } = useDashboard();

  const handleDeactivate = async () => {
    if (!selectedUserId) return;
    setIsDeactivating(true);
    try {
      await deactivateUser(selectedUserId);
      setMessage("User deactivated successfully.");
      refetchUserLists(); // Refetch only user lists
    } finally {
      setIsDeactivating(false);
      setSelectedUserId(null);
      setIsConfirmationOpen(false); // Close the modal
    }
  };

  const openConfirmationDialog = () => {
    if (selectedUserId) {
      setIsConfirmationOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Deactivate User</h2>
      <div className="bg-background p-6 rounded-lg border border-border space-y-4">
        <InteractiveUserTable
          users={activeUsers}
          onUserSelect={setSelectedUserId}
          selectedUserId={selectedUserId}
        />
        <div className="flex justify-center">
          <button
            onClick={openConfirmationDialog}
            disabled={!selectedUserId || isDeactivating}
            className={`
              w-full sm:w-auto
              px-6 py-2 rounded-md
              text-white font-medium
              transition-colors duration-200
              ${
                !selectedUserId || isDeactivating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              }
            `}
          >
            {isDeactivating ? "Deactivating..." : "Deactivate Selected User"}
          </button>
        </div>
        {message && <p className="text-green-600 text-center">{message}</p>}
      </div>

      {/* Modern Confirmation Dialog */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirm Deactivation
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to deactivate this user? This action will
              immediately logout the user if they are currently logged in and
              prevent them from accessing the system.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmationOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeactivateUser;
