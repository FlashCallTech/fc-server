"use client";

import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { usePathname } from "next/navigation";
import React, { ReactNode, useEffect, useState } from "react";

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

	const creatorURL = localStorage.getItem("creatorURL");

	const isCreatorOrExpertPath = pathname.includes(`${creatorURL}`);

	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isTop, setIsTop] = useState(true);

	const isMobile = useScreenSize();

	useEffect(() => {
		if (!isMobile) {
			setIsVisible(true);
		}
	}, [isMobile]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("scroll", handleScroll);

			return () => {
				window.removeEventListener("scroll", handleScroll);
			};
		}
	}, [lastScrollY]);

	const SCROLL_THRESHOLD = 50;

	useEffect(() => {
		setIsVisible(true); // Ensure navbar is visible on page change
	}, [pathname]);

	// Handle scroll event
	const handleScroll = () => {
		if (typeof window !== "undefined") {
			const scrollY = window.scrollY;
			const maxScrollY =
				document.documentElement.scrollHeight - window.innerHeight;

			// Detect if the user is at the top of the page
			setIsTop(scrollY === 0);

			// Check if the user is at the bottom
			const isAtBottom = scrollY >= maxScrollY;

			// Only apply navbar visibility changes on mobile
			if (window.innerWidth <= 768) {
				if (isAtBottom) {
					// Hide the navbar when at the bottom
					setIsVisible(false);
				} else if (Math.abs(scrollY - lastScrollY) > SCROLL_THRESHOLD) {
					// Only toggle visibility if scroll change exceeds the threshold
					if (scrollY > lastScrollY) {
						// Scrolling down
						setIsVisible(false);
					} else {
						// Scrolling up
						setIsVisible(true);
					}
					setLastScrollY(scrollY);
				}
			} else {
				setIsVisible(true);
			}
		}
	};

	// Add scroll listener
	useEffect(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("scroll", handleScroll);
			return () => {
				window.removeEventListener("scroll", handleScroll);
			};
		}
	}, [lastScrollY]);

	return (
		<main className="relative">
			<Navbar isVisible={isVisible} isMobile={isMobile} />
			<div className="flex">
				<Sidebar isCreatorOrExpertPath={isCreatorOrExpertPath} />
				<section
					className={`flex min-h-[calc(100vh-100px)] flex-1 flex-col  transition-all duration-300 ease-in-out ${
						!isVisible
							? pathname !== "/home"
								? "translate-y-0"
								: "translate-y-7"
							: isMobile
							? isTop && isVisible && isCreatorOrExpertPath
								? "translate-y-[72px]"
								: "translate-y-[76px]"
							: "pt-24"
					}  md:px-10`}
				>
					<div className="size-full">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
