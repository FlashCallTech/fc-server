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
import OpenInBrowserAlert from "../../components/alerts/OpenBrowserAlert";

const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	const [region, setRegion] = useState<"India" | "Global" | null>(null);
	const [isInAppBrowser, setIsInAppBrowser] = useState<boolean | null>(null);

	useEffect(() => {
		const ua = navigator.userAgent || navigator.vendor;
		const isInApp = /Instagram|FBAN|FBAV|Messenger|Twitter/i.test(ua);
		setIsInAppBrowser(isInApp);
	}, []);

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

	if (isInAppBrowser === null) return null;

	return isInAppBrowser ? (
		<OpenInBrowserAlert />
	) : (
		<QueryProvider>
			<CurrentUsersProvider region={region as string}>
				<WalletBalanceProvider>
					<ChatRequestProvider>
						<SelectedServiceProvider>
							<StreamVideoProvider>
								<LayoutShell>{children}</LayoutShell>
							</StreamVideoProvider>
						</SelectedServiceProvider>
					</ChatRequestProvider>
				</WalletBalanceProvider>
			</CurrentUsersProvider>
		</QueryProvider>
	);
};

export default ClientRootLayout;
