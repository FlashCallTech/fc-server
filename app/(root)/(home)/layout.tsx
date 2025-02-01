"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { usePathname } from "next/navigation";
import Headroom from "react-headroom";

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 1024);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	const pathname = usePathname();
	const { userType } = useCurrentUsersContext();

	const isMobile = useScreenSize();

	useEffect(() => {
		if (pathname !== "/home") {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	}, [pathname]);

	if (userType === "creator") {
		return (
			<main className="flex flex-row size-full">
				<Sidebar />
				<div className="flex flex-col w-full">
					{isMobile ? (
						<Headroom>
							<Navbar />
						</Headroom>
					) : (
						<Navbar />
					)}
					<section className={`flex flex-col size-full`}>
						<div className="size-full">{children}</div>
					</section>
				</div>
			</main>
		);
	}

	return (
		<main className="relative">
			{isMobile ? (
				<Headroom>
					<Navbar />
				</Headroom>
			) : (
				<Navbar />
			)}
			<div className="flex">
				<section
					className={`flex min-h-[calc(100dvh-76px)] flex-1 flex-col transition-all duration-300 ease-in-out md:px-10 xl:px-14`}
				>
					<div className="size-full">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
