"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { clientUser, creatorUser } from "@/types";
import NavLoader from "./NavLoader";

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			if (typeof window !== "undefined") {
				setIsMobile(window.innerWidth < 584);
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const NavbarWeb = ({
	fetchingUser,
	currentUser,
	handleSignout,
	userType,
}: {
	fetchingUser: boolean;
	currentUser: clientUser | creatorUser | null;
	handleSignout: () => void;
	userType: string | null;
}) => {
	const isMobile = useScreenSize();
	const [toggleMenu, setToggleMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleClickOutside = (event: MouseEvent) => {
		if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
			setToggleMenu(false);
		}
	};

	useEffect(() => {
		if (toggleMenu) {
			document.addEventListener("click", handleClickOutside);
		} else {
			document.removeEventListener("click", handleClickOutside);
		}

		return () => document.removeEventListener("click", handleClickOutside);
	}, [toggleMenu]);

	const renderContent = () => {
		return (
			<>
				{currentUser ? (
					<>
						{/* Home Button */}
						<Link href={userType === "creator" ? "/home" : "/discover"}>
							<Button className="min-w-[130px] bg-black text-white rounded-full hoverScaleDownEffect text-sm border border-black md:!px-7">
								Home
							</Button>
						</Link>
						{/* Sign Out Button */}
						<Button
							className="min-w-[130px] bg-white rounded-full hoverScaleDownEffect text-sm border border-black md:!px-7"
							onClick={handleSignout}
						>
							Sign Out
						</Button>
					</>
				) : (
					<>
						{/* Sign Up Button */}
						<Link href="/authenticate?usertype=creator" className="w-full">
							<Button className="min-w-[130px] w-full bg-black text-white rounded-full hoverScaleDownEffect text-sm border border-black md:!px-7">
								Creator Login
							</Button>
						</Link>
						{/* Login Button */}
						<Link href="/discover" className="w-full">
							<Button className="min-w-[130px] w-full bg-white rounded-full hoverScaleDownEffect text-sm border border-black md:!px-7">
								Connect With Creators
							</Button>
						</Link>
					</>
				)}
			</>
		);
	};

	return (
		<nav className="sticky top-0 blurEffect bg-gradient-to-r from-[#ecf5de] via-white to-[#dff7fb] w-full px-6 py-4 md:px-14 lg:px-24 z-40">
			<section className="flex bg-white items-center justify-between p-4 rounded-full border border-gray-300">
				{/* logo */}
				<Link href="/home" className="hidden md:block">
					<Image
						src="/icons/newLogo.png"
						alt="logo"
						width={1000}
						height={1000}
						className="w-[120px] h-[25px] ml-7"
						priority
					/>
				</Link>

				<Link href="/home" className="md:hidden">
					<Image
						src="/icons/newLogo.png"
						alt="logo"
						width={1000}
						height={1000}
						className="w-[120px] h-[25px]"
						priority
					/>
				</Link>

				{/* navLinks */}
				{fetchingUser ? (
					<NavLoader />
				) : (
					<div className="relative flex items-center justify-center gap-2.5">
						{isMobile ? (
							<>
								<button
									className="hoverScaleDownEffect flex items-center"
									onClick={() => setToggleMenu((prev) => !prev)}
								>
									{toggleMenu ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-6"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M6 18 18 6M6 6l12 12"
											/>
										</svg>
									) : (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-6"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
											/>
										</svg>
									)}
								</button>

								{toggleMenu && (
									<div
										ref={menuRef}
										className="absolute right-4 top-4 mt-2 bg-white border border-gray-300 shadow-lg rounded-lg p-4 flex flex-col items-center gap-2.5"
									>
										{renderContent()}
									</div>
								)}
							</>
						) : (
							<div className="flex items-center gap-2">{renderContent()}</div>
						)}
					</div>
				)}
			</section>
		</nav>
	);
};

export default NavbarWeb;
