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

// Throttle function to limit the rate at which scroll handler is triggered
const throttle = (func: () => void, limit: number) => {
	let lastFunc: NodeJS.Timeout;
	let lastRan: number;

	return function (this: any, ...args: []) {
		if (!lastRan) {
			func.apply(this, args);
			lastRan = Date.now();
		} else {
			clearTimeout(lastFunc);
			lastFunc = setTimeout(() => {
				if (Date.now() - lastRan >= limit) {
					func.apply(this, args);
					lastRan = Date.now();
				}
			}, limit - (Date.now() - lastRan));
		}
	};
};

const HomeLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
	const pathname = usePathname();
	const { creatorURL } = useCurrentUsersContext();
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);
	const [isTop, setIsTop] = useState(true);
	const isMobile = useScreenSize();
	const SCROLL_THRESHOLD = 50;

	// Ensure the navbar is visible after every pathname change
	useEffect(() => {
		pathname !== creatorURL
			? resetBodyBackgroundColor()
			: setBodyBackgroundColor("#121319");
		setIsVisible(true);
		setLastScrollY(0);
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

	// Add scroll listener with throttle to improve performance and ensure frequent checks
	useEffect(() => {
		if (typeof window !== "undefined") {
			const throttledHandleScroll = throttle(handleScroll, 200); // Throttle by 200ms

			window.addEventListener("scroll", throttledHandleScroll);

			return () => {
				window.removeEventListener("scroll", throttledHandleScroll);
			};
		}
	}, [lastScrollY]);

	// If the device is not mobile, the navbar should always be visible
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
					className={`flex min-h-[calc(100vh-100px)] flex-1 flex-col  transition-all duration-300 ease-in-out ${
						!isVisible
							? pathname !== "/home"
								? "translate-y-0"
								: "translate-y-7"
							: isMobile
							? isTop && isVisible && "translate-y-[75px]"
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
