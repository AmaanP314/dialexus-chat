"use client";

import { useAuth } from "@/context/AuthContext";
import React from "react";

// This layout is for regular users. It does NOT have the admin navbar.
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (user?.type === "admin" || user?.type === "super_admin") {
    return null;
  }

  return <>{children}</>;
}
