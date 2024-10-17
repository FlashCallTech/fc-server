"use client";

import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { resetBodyBackgroundColor, setBodyBackgroundColor } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";
import Headroom from "react-headroom";

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 768);
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
	const { creatorURL } = useCurrentUsersContext();

	const isMobile = useScreenSize();

	useEffect(() => {
		pathname !== creatorURL
			? resetBodyBackgroundColor()
			: setBodyBackgroundColor("#121319");
	}, [pathname, creatorURL]);

	return (
		<main className="relative">
			{isMobile ? (
				<Headroom>
					<Navbar isMobile={isMobile} />
				</Headroom>
			) : (
				<Navbar isMobile={isMobile} />
			)}
			<div className="flex">
				<Sidebar />
				<section
					className={`flex min-h-[calc(100vh-100px)] flex-1 flex-col transition-all duration-300 ease-in-out  md:px-10`}
				>
					<div className="size-full">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
