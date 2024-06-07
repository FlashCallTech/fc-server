"use client";

import React, { ReactNode, useEffect, useState } from "react";
import StreamVideoProvider from "@/providers/streamClientProvider";
import MyCallUI from "@/components/meeting/MyCallUI";
import { useUser } from "@clerk/nextjs";
import Loader from "@/components/shared/Loader";

const ClientRootLayout = ({ children }: { children: ReactNode }) => {
	const { user, isLoaded } = useUser();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <Loader />;
	}

	return (
		<StreamVideoProvider>
			<div className="relative min-h-screen w-full">
				<MyCallUI />
				{children}
			</div>
		</StreamVideoProvider>
	);
};

export default ClientRootLayout;
