// --- src/components/dashboard/RemoveMember.tsx (New File) ---
import { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { removeGroupMember } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";
import { InteractiveUserTable } from "./InteractiveUserTable";
import { UserMinus, CheckCircle, AlertTriangle } from "lucide-react";

const RemoveMember = () => {
  const { stats, refetchGroupLists } = useDashboard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
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

  const membersInSelectedGroup = useMemo(() => {
    if (!stats || !selectedGroup) return [];
    const memberIds = new Set(selectedGroup.members.map((m) => m.user_id));
    return stats.totalUsers.filter((u) => memberIds.has(u.id));
  }, [stats, selectedGroup]);

  const handleRemoveMember = async () => {
    if (!selectedGroupId || !selectedUserId || !selectedGroup) return;
    if (
      !window.confirm(
        `Are you sure you want to remove this member from "${selectedGroup.name}"?`
      )
    )
      return;
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await removeGroupMember(selectedGroupId, selectedUserId);
      setMessage("Member removed successfully.");
      refetchGroupLists();
    } catch (err) {
      setMessage("Failed to remove member.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <UserMinus className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Remove Member from Group
          </h2>
          <p className="text-muted-foreground text-sm">
            Select a group, then choose a member to remove.
          </p>
        </div>
      </div>

      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4 text-lg">
          <span className="text-primary font-bold">Step 1:</span> Select a Group
        </h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={(id) => {
            setSelectedGroupId(id);
            setSelectedUserId(null);
            setMessage("");
          }}
          selectedGroupId={selectedGroupId}
        />
      </div>

      {selectedGroup && (
        <div className="bg-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-lg">
            <span className="text-primary font-bold">Step 2:</span> Select a
            Member to Remove from "{selectedGroup.name}"
          </h3>
          <InteractiveUserTable
            users={membersInSelectedGroup}
            onUserSelect={setSelectedUserId}
            selectedUserId={selectedUserId}
          />
        </div>
      )}

      <div className="text-center pt-4">
        <button
          onClick={handleRemoveMember}
          disabled={!selectedGroupId || !selectedUserId || isLoading}
          className="w-full max-w-md px-4 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Removing Member..." : "Remove Selected Member"}
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
export default RemoveMember;
