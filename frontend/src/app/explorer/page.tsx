"use client";

import React, { useState, useEffect } from "react";
import ConversationPairList from "@/components/explorer/ConversationPairList";
import AdminMessageViewer from "@/components/explorer/AdminMessageViewer";
import { ConversationPair } from "@/components/types";

// This component no longer needs the ExplorerProvider, as it's in the layout
export default function ExplorerPage() {
  useEffect(() => {
    document.title = "DC | Explorer";
  }, []);

  const [selectedPair, setSelectedPair] = useState<ConversationPair | null>(
    null
  );

  return (
    // The flex container with h-full ensures the layout takes up the full screen height
    <div className="flex h-full">
      <ConversationPairList
        onPairSelect={setSelectedPair}
        selectedPair={selectedPair}
      />
      <AdminMessageViewer selectedPair={selectedPair} />
    </div>
  );
}
