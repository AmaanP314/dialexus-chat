import { AdminViewUser, AdminViewGroup } from "../types"; // Already imported above

interface DetailedListProps {
  title: string;
  data: AdminViewUser[] | AdminViewGroup[];
  type: "user" | "group";
}

const DetailedList: React.FC<DetailedListProps> = ({ title, data, type }) => {
  return (
    <div className="bg-background p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              {type === "group" && <th className="p-3">Members</th>}
              {type === "group" && <th className="p-3">Status</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="p-3 font-mono text-xs">{item.id}</td>
                <td className="p-3 font-medium text-foreground">
                  {"username" in item ? item.username : item.name}
                </td>
                {type === "group" && "members" in item && (
                  <td className="p-3">{item.members.length}</td>
                )}
                {type === "group" && "is_active" in item && (
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.is_active
                          ? "bg-green-900/50 text-green-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {item.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
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
