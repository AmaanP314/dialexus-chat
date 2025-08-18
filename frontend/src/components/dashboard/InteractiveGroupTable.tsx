// --- src/components/dashboard/InteractiveGroupTable.tsx (New File) ---
import { useState, useMemo } from "react";
import { AdminViewGroup } from "../types";
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

  const filteredGroups = useMemo(() => {
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groups, searchTerm]);

  const visibleGroups = useMemo(
    () => filteredGroups.slice(0, visibleRows),
    [filteredGroups, visibleRows]
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by group name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border"
        />
      </div>
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          {/* ... table head ... */}
          <tbody>
            {visibleGroups.map((group) => (
              <tr
                key={group.id}
                className={selectedGroupId === group.id ? "bg-primary/10" : ""}
              >
                <td className="p-3 w-12 text-center">
                  <input
                    type="radio"
                    name="group-select"
                    checked={selectedGroupId === group.id}
                    onChange={() => onGroupSelect(group.id)}
                  />
                </td>
                <td className="p-3 font-mono text-xs">{group.id}</td>
                <td className="p-3 font-medium">{group.name}</td>
                <td className="p-3">{group.members.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Show More Button */}
      {visibleRows < filteredGroups.length && (
        <button onClick={() => setVisibleRows((prev) => prev + ROWS_PER_PAGE)}>
          Show More
        </button>
      )}
    </div>
  );
};
