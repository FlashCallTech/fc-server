"use client";

import React, { ReactNode } from "react";
import StreamVideoProvider from "@/providers/streamClientProvider";
import MyCallUI from "@/components/meeting/MyCallUI";
import { useUser } from "@clerk/nextjs";

const RootLayout = ({ children }: { children: ReactNode }) => {
	const { user } = useUser();
	return user ? (
		<StreamVideoProvider>
			<div className="relative min-h-screen">
				<div className="absolute top-4 right-4 z-50">
					<MyCallUI />
				</div>

				{children}
			</div>
		</StreamVideoProvider>
	) : (
		<>{children}</>
	);
};

export default RootLayout;
