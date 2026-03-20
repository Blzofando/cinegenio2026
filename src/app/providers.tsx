// src/app/providers.tsx

"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { WatchedDataProvider } from "@/contexts/WatchedDataContext";
import ApprovalGuardian from "@/components/auth/ApprovalGuardian";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <WatchedDataProvider>
          <ApprovalGuardian>
            {children}
          </ApprovalGuardian>
        </WatchedDataProvider>
      </WatchlistProvider>
    </AuthProvider>
  );
}
