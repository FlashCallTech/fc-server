"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MovePageToTop = () => {
	const [isVisible, setIsVisible] = useState(false);
	const pathname = usePathname();

	const toggleVisibility = () => {
		if (window.scrollY > 300) {
			setIsVisible(true);
		} else {
			setIsVisible(false);
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		window.addEventListener("scroll", toggleVisibility);
		return () => window.removeEventListener("scroll", toggleVisibility);
	}, []);

	const shouldDisplayButton =
		!pathname.includes("chat") && !pathname.includes("meeting");

	return (
		<>
			{isVisible && shouldDisplayButton && (
				<button
					onClick={scrollToTop}
					className="fixed bottom-5 right-5 lg:right-9 z-40 bg-gray-100 p-3 rounded-full shadow-lg hoverScaleDownEffect"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m4.5 15.75 7.5-7.5 7.5 7.5"
						/>
					</svg>
				</button>
			)}
		</>
	);
};

export default MovePageToTop;
