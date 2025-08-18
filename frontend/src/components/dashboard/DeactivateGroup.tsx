// --- src/components/dashboard/DeactivateGroup.tsx (New File) ---
import { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { deactivateGroup } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";

const DeactivateGroup = () => {
  const { stats, refetchGroupLists } = useDashboard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const activeGroups = useMemo(
    () => stats?.totalGroups.filter((g) => g.is_active) || [],
    [stats]
  );

  const handleDeactivate = async () => {
    if (!selectedGroupId) return;
    if (!window.confirm("Are you sure?")) return;
    setIsLoading(true);
    try {
      await deactivateGroup(selectedGroupId);
      setMessage("Group deactivated successfully.");
      refetchGroupLists();
    } finally {
      setIsLoading(false);
      setSelectedGroupId(null);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Deactivate Group</h2>
      <div className="bg-background p-6 rounded-lg border">
        <h3 className="font-semibold mb-2">
          Select an Active Group to Deactivate
        </h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={setSelectedGroupId}
          selectedGroupId={selectedGroupId}
        />
      </div>
      <div className="text-center">
        <button
          onClick={handleDeactivate}
          disabled={!selectedGroupId || isLoading}
        >
          {isLoading ? "Deactivating..." : "Deactivate Selected Group"}
        </button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};
export default DeactivateGroup;
