// app/ClientRootLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";

import { CurrentUsersProvider } from "@/lib/context/CurrentUsersContext";
import WalletBalanceProvider from "@/lib/context/WalletBalanceContext";
import ChatRequestProvider from "@/lib/context/ChatRequestContext";
import SelectedServiceProvider from "@/lib/context/SelectedServiceContext";
import StreamVideoProvider from "@/providers/streamClientProvider";
import { initMixpanel } from "@/lib/mixpanel";
import { QueryProvider } from "@/lib/react-query/QueryProvider";
import axios from "axios";
import LayoutShell from "@/components/layoutShell/LayoutShell";

const ClientRootLayout = ({ children }: { children: ReactNode }) => {
  const [region, setRegion] = useState<"India" | "Global" | null>(null);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setRegion(
      timezone === "Asia/Calcutta" || timezone === "Asia/Kolkata"
        ? "India"
        : "Global"
    );
    initMixpanel();
    axios.defaults.withCredentials = true;
  }, []);

  return (
    <QueryProvider>
      <CurrentUsersProvider region={region as string}>
        <WalletBalanceProvider>
          <ChatRequestProvider>
            <SelectedServiceProvider>
              <StreamVideoProvider>
                {/* Now the context is available BEFORE LayoutShell renders */}
                <LayoutShell>
                  {children}
                </LayoutShell>
              </StreamVideoProvider>
            </SelectedServiceProvider>
          </ChatRequestProvider>
        </WalletBalanceProvider>
      </CurrentUsersProvider>
    </QueryProvider>
  );
};

export default ClientRootLayout;
