import { AdminViewUser, AdminViewGroup, GroupMember } from "../types";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DetailedListProps {
  title: string;
  data: AdminViewUser[] | AdminViewGroup[];
  type: "user" | "group";
}

const UserList: React.FC<{ users: AdminViewUser[] }> = ({ users }) => {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="p-4 font-semibold">ID</th>
          <th className="p-4 font-semibold">Username</th>
          <th className="p-4 font-semibold">Full Name</th>
          <th className="p-4 font-semibold">Created At</th>
          <th className="p-4 font-semibold">Last Seen</th>
          <th className="p-4 font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
          >
            <td className="p-4 font-mono text-xs">{user.id}</td>
            <td className="p-4 font-medium text-foreground">{user.username}</td>
            <td className="p-4 text-muted-foreground">
              {user.full_name || "N/A"}
            </td>
            <td className="p-4 text-muted-foreground">
              {new Date(user.created_at).toLocaleDateString()}
            </td>
            <td className="p-4 text-muted-foreground">
              {new Date(user.last_seen).toLocaleString()}
            </td>
            <td className="p-4">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  user.is_active
                    ? "bg-green-900/50 text-green-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {user.is_active ? "Active" : "Deactivated"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const GroupList: React.FC<{ groups: AdminViewGroup[] }> = ({ groups }) => {
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedGroupId(expandedGroupId === id ? null : id);
  };

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="p-4 font-semibold">ID</th>
          <th className="p-4 font-semibold">Name</th>
          <th className="p-4 font-semibold">Members</th>
          <th className="p-4 font-semibold">Status</th>
          <th className="p-4 w-12"></th>
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <React.Fragment key={group.id}>
            <tr
              className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => toggleRow(group.id)}
            >
              <td className="p-4 font-mono text-xs">{group.id}</td>
              <td className="p-4 font-medium text-foreground">{group.name}</td>
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
                  {group.is_active ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className="p-4">
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
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
      </tbody>
    </table>
  );
};

const DetailedList: React.FC<DetailedListProps> = ({ title, data, type }) => {
  return (
    <div className="bg-background p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        {type === "user" ? (
          <UserList users={data as AdminViewUser[]} />
        ) : (
          <GroupList groups={data as AdminViewGroup[]} />
        )}
        {data.length === 0 && (
          <p className="text-center p-4 text-muted-foreground">
            No data to display.
          </p>
        )}
      </div>
    </div>
  );
};
export default DetailedList;
