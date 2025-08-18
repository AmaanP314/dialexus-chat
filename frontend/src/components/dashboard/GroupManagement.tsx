import React from "react";
import CreateGroup from "./CreateGroup";
import AddMember from "./AddMember";
import RemoveMember from "./RemoveMember";
import DeactivateGroup from "./DeactivateGroup";

const GroupManagement = ({ activeSubTab }: { activeSubTab: string }) => {
  switch (activeSubTab) {
    case "createGroup":
      return <CreateGroup />;
    case "addMembers":
      return <AddMember />;
    case "removeMembers":
      return <RemoveMember />;
    case "deactivateGroup":
      return <DeactivateGroup />;
    default:
      return (
        <div className="text-center text-muted-foreground mt-8">
          Select an option from the group management menu.
        </div>
      );
  }
};
export default GroupManagement;
