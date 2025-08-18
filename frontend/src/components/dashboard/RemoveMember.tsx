// --- src/components/dashboard/RemoveMember.tsx (New File) ---
import { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { removeGroupMember } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";
import { InteractiveUserTable } from "./InteractiveUserTable";

const RemoveMember = () => {
  const { stats, refetchGroupLists } = useDashboard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const activeGroups = useMemo(
    () => stats?.totalGroups.filter((g) => g.is_active) || [],
    [stats]
  );
  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === selectedGroupId),
    [activeGroups, selectedGroupId]
  );

  const membersInSelectedGroup = useMemo(() => {
    if (!stats || !selectedGroup) return [];
    const memberIds = new Set(selectedGroup.members.map((m) => m.user_id));
    return stats.totalUsers.filter((u) => memberIds.has(u.id));
  }, [stats, selectedGroup]);

  const handleRemoveMember = async () => {
    if (!selectedGroupId || !selectedUserId) return;
    if (!window.confirm("Are you sure?")) return;
    setIsLoading(true);
    try {
      await removeGroupMember(selectedGroupId, selectedUserId);
      setMessage("Member removed successfully.");
      refetchGroupLists();
    } finally {
      setIsLoading(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Remove Member from Group</h2>
      <div className="bg-background p-6 rounded-lg border">
        <h3 className="font-semibold mb-2">1. Select a Group</h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={setSelectedGroupId}
          selectedGroupId={selectedGroupId}
        />
      </div>
      {selectedGroup && (
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">
            2. Select a Member to Remove from "{selectedGroup.name}"
          </h3>
          <InteractiveUserTable
            users={membersInSelectedGroup}
            onUserSelect={setSelectedUserId}
            selectedUserId={selectedUserId}
          />
        </div>
      )}
      <div className="text-center">
        <button
          onClick={handleRemoveMember}
          disabled={!selectedGroupId || !selectedUserId || isLoading}
        >
          {isLoading ? "Removing..." : "Remove Selected Member"}
        </button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
};
export default RemoveMember;
