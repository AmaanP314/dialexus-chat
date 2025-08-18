"use client";

import React from "react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { ExplorerProvider } from "@/context/ExplorerContext";

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background">
      <AdminNavbar />
      <main className="flex-grow h-screen overflow-hidden">
        <ExplorerProvider>{children}</ExplorerProvider>
      </main>
    </div>
  );
}
