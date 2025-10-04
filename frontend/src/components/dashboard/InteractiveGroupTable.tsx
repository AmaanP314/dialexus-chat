// --- src/components/dashboard/InteractiveGroupTable.tsx ---
import React, { useState, useMemo } from "react";
import { AdminViewGroup, GroupMember } from "../types";
import { Search, ChevronDown } from "lucide-react";

interface InteractiveGroupTableProps {
  groups: AdminViewGroup[];
  onGroupSelect: (groupId: number) => void;
  selectedGroupId: number | null;
}

const ROWS_PER_PAGE = 10;

export const InteractiveGroupTable: React.FC<InteractiveGroupTableProps> = ({
  groups,
  onGroupSelect,
  selectedGroupId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const filteredGroups = useMemo(() => {
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.id.toString().includes(searchTerm)
    );
  }, [groups, searchTerm]);

  const visibleGroups = useMemo(
    () => filteredGroups.slice(0, visibleRows),
    [filteredGroups, visibleRows]
  );

  const toggleRowExpansion = (id: number) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by group name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition duration-200"
        />
      </div>
      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="min-w-full text-left text-sm table-auto">
          {/* Table Head */}
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground">ID</th>
              <th className="p-4 font-semibold text-muted-foreground">Name</th>
              <th className="p-4 font-semibold text-muted-foreground">
                Members
              </th>
              <th className="p-4 font-semibold text-muted-foreground">
                Status
              </th>
              <th className="p-4 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {visibleGroups.map((group) => (
              <React.Fragment key={group.id}>
                <tr
                  onClick={() => onGroupSelect(group.id)}
                  className={`
                    border-b border-border/70 last:border-b-0 
                    cursor-pointer 
                    transition-colors duration-150 ease-in-out
                    ${
                      selectedGroupId === group.id
                        ? "bg-primary/10"
                        : "hover:bg-muted/50"
                    }
                  `}
                >
                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    {group.id}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {group.name}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {group.members.length}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        group.is_active
                          ? "bg-green-900/50 text-green-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {group.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    className="p-4 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRowExpansion(group.id);
                    }}
                  >
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform hover:text-foreground ${
                        expandedGroupId === group.id ? "rotate-180" : ""
                      }`}
                    />
                  </td>
                </tr>
                {expandedGroupId === group.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={5} className="p-4">
                      <div className="p-4 bg-background rounded-md border border-border">
                        <h4 className="font-semibold mb-2">Members List</h4>
                        {group.members.length > 0 ? (
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {group.members.map((member: GroupMember) => (
                              <li key={member.user_id}>
                                {member.full_name || member.username} (@
                                {member.username})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No members in this group.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {visibleGroups.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-6 text-muted-foreground"
                >
                  No groups match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Show More Button */}
      {visibleRows < filteredGroups.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setVisibleRows((prev) => prev + ROWS_PER_PAGE)}
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 mx-auto py-2 px-4 rounded-lg transition duration-150"
          >
            Load More <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
