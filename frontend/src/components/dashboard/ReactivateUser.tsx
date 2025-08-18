import { useState } from "react";
import { AdminViewUser } from "../types";
import { reactivateUser } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { InteractiveUserTable } from "./InteractiveUserTable";

const ReactivateUser = ({
  deactivatedUsers,
}: {
  deactivatedUsers: AdminViewUser[];
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { refetchUserLists } = useDashboard();

  const handleReactivate = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
      await reactivateUser(selectedUserId);
      setMessage("User reactivated successfully.");
      refetchUserLists(); // Refetch only user lists
    } finally {
      setIsLoading(false);
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
      <h2 className="text-2xl font-bold">Reactivate User</h2>
      <div className="bg-background p-6 rounded-lg border border-border space-y-4">
        <InteractiveUserTable
          users={deactivatedUsers}
          onUserSelect={setSelectedUserId}
          selectedUserId={selectedUserId}
        />
        <div className="flex justify-center">
          <button
            onClick={openConfirmationDialog}
            disabled={!selectedUserId || isLoading}
            className={`
              w-full sm:w-auto
              px-6 py-2 rounded-md
              text-white font-medium
              transition-colors duration-200
              ${
                !selectedUserId || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              }
            `}
          >
            {isLoading ? "Reactivating..." : "Reactivate Selected User"}
          </button>
        </div>
        {message && <p className="text-green-600 text-center">{message}</p>}
      </div>

      {/* Modern Confirmation Dialog */}
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Confirm Reactivation
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Are you sure you want to reactivate this user? They will regain
              access to their account.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmationOpen(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReactivate}
                disabled={isLoading}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Reactivating..." : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReactivateUser;
