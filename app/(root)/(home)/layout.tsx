"use client";

import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 1280);
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

	const creatorURL = localStorage.getItem("creatorURL");

	const isCreatorOrExpertPath = pathname.includes(`${creatorURL}`);

	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isTop, setIsTop] = useState(true);

	const isMobile = useScreenSize();

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("scroll", handleScroll);

			return () => {
				window.removeEventListener("scroll", handleScroll);
			};
		}
	}, [lastScrollY]);

	const handleScroll = () => {
		if (typeof window !== "undefined") {
			const scrollY = window.scrollY;

			// Detect if the user is at the top of the page
			setIsTop(scrollY === 0);

			if (window.innerWidth <= 768) {
				if (scrollY > lastScrollY) {
					// If scrolling down
					setIsVisible(false);
				} else {
					// If scrolling up
					setIsVisible(true);
				}
				setLastScrollY(scrollY);
			} else {
				setIsVisible(true);
			}
		}
	};

	return (
		<main className="relative">
			<Navbar isVisible={isVisible} isMobile={isMobile} />
			<div className="flex">
				<Sidebar isCreatorOrExpertPath={isCreatorOrExpertPath} />
				<section
					className={`flex min-h-screen flex-1 flex-col  transition-all duration-300 ease-in-out ${
						!isVisible ? "translate-y-0" : isMobile && ""
					} ${
						isTop && isCreatorOrExpertPath && isMobile
							? "translate-y-[76px]"
							: isCreatorOrExpertPath && isMobile
							? "pt-0"
							: "pt-24"
					} md:px-10`}
				>
					<div className={`w-full h-full relative`}>{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
