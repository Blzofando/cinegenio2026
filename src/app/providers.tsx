// src/app/providers.tsx

"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { WatchedDataProvider } from "@/contexts/WatchedDataContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <WatchedDataProvider>
          {children}
        </WatchedDataProvider>
      </WatchlistProvider>
    </AuthProvider>
  );
}
