// "use client";

// import React from "react";
// import { LogOut } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import Avatar from "./Avatar";

// const UserProfile: React.FC = () => {
//   const { user, logout } = useAuth();

//   if (!user) {
//     return <div className="p-4 h-[70px] bg-muted/50 animate-pulse"></div>;
//   }

//   return (
//     <div className="flex items-center justify-between p-4 bg-muted/50">
//       <Avatar name={user.username} />
//       <div className="flex-grow ml-4">
//         <h2 className="font-bold text-foreground">
//           {user.full_name || user.username}
//         </h2>
//         <p className="text-sm capitalize text-muted-foreground">{user.type}</p>
//       </div>
//       <button
//         onClick={logout}
//         className="p-2 text-muted-foreground hover:text-red-500"
//         aria-label="Log out"
//       >
//         <LogOut size={20} />
//       </button>
//     </div>
//   );
// };

// export default UserProfile;

"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import ProfileDropdown from "./ProfileDropdown";
import ChangeFullNameModal from "./ChangeFullNameModal";
import ChangePasswordModal from "./ChangePasswordModal";

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isFullNameModalOpen, setIsFullNameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!user) {
    return <div className="p-4 h-[70px] bg-muted/50 animate-pulse"></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 flex-shrink-0">
        <Avatar name={user.username} />
        <div className="flex-grow ml-4 overflow-hidden">
          <h2 className="font-bold text-foreground">
            {user.full_name || user.username}
          </h2>
          <p className="text-sm capitalize text-muted-foreground">
            {user.type}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ProfileDropdown
            onEditProfile={() => setIsFullNameModalOpen(true)}
            onChangePassword={() => setIsPasswordModalOpen(true)}
          />
          <button
            onClick={() => logout()}
            className="p-2 text-muted-foreground hover:text-red-500 rounded-full hover:bg-muted"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <ChangeFullNameModal
        isOpen={isFullNameModalOpen}
        onClose={() => setIsFullNameModalOpen(false)}
      />
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default UserProfile;
