"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, MessageSquare, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// This is the main vertical navbar for all admin sections
export const AdminNavbar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
    { href: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
    { href: "/explorer", icon: Eye, label: "Explorer" },
  ];

  // Don't render for non-admins or while loading
  if (!user || (user.type !== "admin" && user.type !== "super_admin")) {
    return null;
  }

  return (
    <nav className="flex flex-col items-center w-20 bg-muted border-r border-border py-4 gap-4 flex-shrink-0">
      <div className="mb-4">
        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
          <MessageSquare />
        </div>
      </div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={`p-3 rounded-lg transition-colors ${
            pathname.startsWith(item.href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted-foreground/10"
          }`}
        >
          <item.icon />
        </Link>
      ))}
    </nav>
  );
};
