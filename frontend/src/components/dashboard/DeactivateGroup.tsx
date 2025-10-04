// --- src/components/dashboard/DeactivateGroup.tsx (New File) ---
import { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { deactivateGroup } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";
import { CircleSlash, CheckCircle, AlertTriangle } from "lucide-react";

const DeactivateGroup = () => {
  const { stats, refetchGroupLists } = useDashboard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const activeGroups = useMemo(
    () => stats?.totalGroups.filter((g) => g.is_active) || [],
    [stats]
  );

  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === selectedGroupId),
    [activeGroups, selectedGroupId]
  );

  const handleDeactivate = async () => {
    if (!selectedGroupId || !selectedGroup) return;
    if (
      !window.confirm(
        `Are you sure you want to deactivate the group "${selectedGroup.name}"? This action cannot be undone through the UI.`
      )
    )
      return;
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await deactivateGroup(selectedGroupId);
      setMessage(`Group "${selectedGroup.name}" deactivated successfully.`);
      refetchGroupLists();
    } catch (err) {
      setMessage("Failed to deactivate group.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setSelectedGroupId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <CircleSlash className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Deactivate Group
          </h2>
          <p className="text-muted-foreground text-sm">
            Select an active group to deactivate it.
          </p>
        </div>
      </div>

      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4 text-lg">
          Select an Active Group to Deactivate
        </h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={setSelectedGroupId}
          selectedGroupId={selectedGroupId}
        />
      </div>

      <div className="text-center pt-4">
        <button
          onClick={handleDeactivate}
          disabled={!selectedGroupId || isLoading}
          className="w-full max-w-md px-4 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Deactivating..." : "Deactivate Selected Group"}
        </button>
        {message && (
          <div
            className={`max-w-md mx-auto mt-4 flex items-center justify-center gap-2 p-3 rounded-lg text-sm ${
              isError
                ? "bg-red-900/30 text-red-300"
                : "bg-green-900/50 text-green-300"
            }`}
          >
            {isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default DeactivateGroup;
