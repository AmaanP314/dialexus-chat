"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, User, Lock } from "lucide-react";

interface ProfileDropdownProps {
  onEditProfile: () => void;
  onChangePassword: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onEditProfile,
  onChangePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
        aria-label="Profile options"
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mb-2 w-48 bg-background border border-border rounded-lg shadow-lg z-20 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <ul>
            <li>
              <button
                onClick={() => {
                  onEditProfile();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors rounded-t-lg"
              >
                <User size={16} />
                <span>Change Full Name</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onChangePassword();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors rounded-b-lg"
              >
                <Lock size={16} />
                <span>Change Password</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
