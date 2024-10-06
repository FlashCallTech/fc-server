"use client";

import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/shared/Sidebar";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { resetBodyBackgroundColor, setBodyBackgroundColor } from "@/lib/utils";
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

// Throttle function with requestAnimationFrame for better scroll performance
const throttleWithRaf = (func: () => void) => {
	let isRunning = false;
	return function (this: any, ...args: []) {
		if (!isRunning) {
			isRunning = true;
			window.requestAnimationFrame(() => {
				func.apply(this, args);
				isRunning = false;
			});
		}
	};
};

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	const pathname = usePathname();
	const { creatorURL } = useCurrentUsersContext();
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const isMobile = useScreenSize();
	const SCROLL_THRESHOLD = 50;

	// Ensure the navbar is visible after every pathname change
	useEffect(() => {
		pathname !== creatorURL
			? resetBodyBackgroundColor()
			: setBodyBackgroundColor("#121319");
		setIsVisible(true);
		setLastScrollY(0);
	}, [pathname, creatorURL]);

	// Handle scroll event with optimized logic
	const handleScroll = () => {
		if (typeof window !== "undefined") {
			const scrollY = window.scrollY;
			const maxScrollY =
				document.documentElement.scrollHeight - window.innerHeight;

			// Check if the user is at the bottom
			const isAtBottom = scrollY >= maxScrollY;

			// Only apply navbar visibility changes on mobile
			if (isMobile) {
				if (isAtBottom) {
					// Hide the navbar when at the bottom
					setIsVisible(false);
				} else if (Math.abs(scrollY - lastScrollY) > SCROLL_THRESHOLD) {
					// Toggle visibility based on scroll direction and threshold
					setIsVisible(scrollY < lastScrollY);
					setLastScrollY(scrollY);
				}
			} else {
				// On non-mobile, always show the navbar
				setIsVisible(true);
			}
		}
	};

	// Add scroll listener with throttling using requestAnimationFrame
	useEffect(() => {
		const throttledHandleScroll = throttleWithRaf(handleScroll);
		window.addEventListener("scroll", throttledHandleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", throttledHandleScroll);
		};
	}, [isMobile, lastScrollY]);

	// Always make the navbar visible when not on mobile
	useEffect(() => {
		if (!isMobile) {
			setIsVisible(true);
		}
	}, [isMobile]);

	return (
		<main className="relative">
			<Navbar isVisible={isVisible} isMobile={isMobile} />
			<div className="flex">
				<Sidebar />
				<section
					className={`flex min-h-[calc(100vh-100px)] flex-1 flex-col transition-all duration-300 ease-in-out ${
						isMobile
							? isVisible
								? "translate-y-[76px]"
								: "translate-y-0"
							: "pt-[76px]"
					} md:px-10`}
				>
					<div className="size-full">{children}</div>
				</section>
			</div>
		</main>
	);
};

export default HomeLayout;
