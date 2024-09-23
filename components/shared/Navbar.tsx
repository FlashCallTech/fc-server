"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import MobileNav from "./MobileNav";

import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";

const NavLoader = () => {
	return (
		<div className="w-24 space-y-3">
			<div className="grid grid-cols-3 gap-4">
				<div className="h-2 bg-gray-300 rounded col-span-2"></div>
				<div className="h-2 bg-gray-300 rounded col-span-1"></div>
			</div>
			<div className="h-2 bg-gray-300 rounded"></div>
		</div>
	);
};

const Navbar = () => {
	const {
		currentUser,
		fetchingUser,
		userType,
		currentTheme,
		authenticationSheetOpen,
		setAuthenticationSheetOpen,
	} = useCurrentUsersContext();
	const router = useRouter();
	const [userTheme, setUserTheme] = useState("#000000");
	const [creator, setCreator] = useState<creatorUser>();
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false); // State to manage sheet visibility
	const pathname = usePathname();
	const creatorURL = localStorage.getItem("creatorURL");
	const currentCreatorUsername = creatorURL
		? creatorURL.split("/home").filter((url) => url)[0]
		: pathname.split("/home")[1];

	// const isCreatorOrExpertPath = pathname.includes(`/${currentCreatorUsername}`);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	const handleRouting = () => {
		// localStorage.setItem("userType", "client");
		if (userType === "creator") {
			router.push("/authenticate?usertype=creator");
		} else {
			trackEvent("Login_TopNav_Clicked", {
				utm_source: "google",
				Creator_ID: creator?._id,
			});
			setIsAuthSheetOpen(true);
		}
	};
	const { walletBalance } = useWalletBalanceContext();

	useEffect(() => {
		// Todo theme ko ek jaisa krne ka jugaad krna hai
		if (currentTheme) {
			const newTheme = currentTheme === "#50A65C" ? "#000000" : currentTheme;
			setUserTheme(newTheme);
		} else {
			setUserTheme("#000000");
		}
	}, [pathname, currentTheme]);

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	const handleAppRedirect = () => {
		trackEvent("Getlink_TopNav_Clicked");
		const isAndroid = /Android/i.test(navigator.userAgent);
		const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
		let url = "https://forms.gle/bo42SCVG6T4YjJzg8";

		// if (isAndroid) {
		// 	url = "https://play.google.com/store/apps?hl=en_US";
		// } else if (isIOS) {
		// 	url = "https://flashcall.me";
		// } else {
		// 	url = "https://flashcall.me";
		// }

		window.open(url, "_blank");
	};

	const AppLink = () => (
		<Button
			className="flex items-center gap-2 bg-green-1 py-2 px-4 lg:ml-2 text-white rounded-[4px] hoverScaleDownEffect"
			style={{
				boxShadow: `5px 5px 0px 0px ${userTheme}`,
			}}
			onClick={handleAppRedirect}
		>
			<Image
				src="/icons/logoDarkCircle.png"
				width={100}
				height={100}
				alt="flashcall logo"
				className="w-6 h-6 rounded-full"
			/>

			<span className="w-full whitespace-nowrap text-xs font-semibold">
				Get Your Link
			</span>
		</Button>
	);

	if (isAuthSheetOpen && !currentUser)
		return (
			<AuthenticationSheet
				isOpen={isAuthSheetOpen}
				onOpenChange={setIsAuthSheetOpen} // Handle sheet close
			/>
		);

	return (
		<nav
			className="justify-between items-center fixed z-40 top-0 left-0 w-full px-2 sm:px-4 py-4 bg-white shadow-sm"
			style={{
				display: `${authenticationSheetOpen && !currentUser ? "none" : "flex"}`,
			}}
		>
			{currentUser ? (
				userType === "creator" ? (
					<Link
						href="/home"
						className="flex items-center justify-center lg:ml-2"
					>
						<Image
							src="/icons/logoMain.png"
							width={1000}
							height={1000}
							alt="flashcall logo"
							className="w-[130px] md:w-[144px] h-[40px] p-2 bg-green-1 rounded-[4px] hoverScaleDownEffect"
							style={{
								boxShadow: `5px 5px 0px 0px ${userTheme}`,
							}}
						/>
					</Link>
				) : (
					<AppLink />
				)
			) : (
				<AppLink />
			)}

			{currentUser ? (
				<div className=" flex justify-end items-center gap-4 h-full text-white">
					{walletBalance >= 0 ? (
						<Link
							href="/payment"
							className={`w-fit flex items-center justify-center gap-2 text-black p-3 border border-black rounded-[4px] hover:bg-green-1 ${
								pathname.includes("/payment") && "bg-green-1 text-white"
							} group`}
							style={{
								boxShadow: `5px 5px 0px 0px ${userTheme}`,
							}}
						>
							<Image
								src="/wallet.svg"
								width={100}
								height={100}
								alt="wallet"
								className={`w-4 h-4 group-hover:text-white group-hover:invert ${
									pathname.includes("/payment") && "invert"
								}`}
							/>
							<span className="w-full text-xs whitespace-nowrap font-semibold group-hover:text-white">
								{`Rs. ${Math.round(walletBalance)}`}
							</span>
						</Link>
					) : (
						<NavLoader />
					)}
					<MobileNav />
				</div>
			) : fetchingUser ? (
				<NavLoader />
			) : (
				<Button
					className="hover:!bg-green-1 hover:!text-white transition-all duration-300 hover:bg-green-700font-semibold w-fit mr-1 rounded-md"
					size="lg"
					onClick={handleRouting}
					style={{
						boxShadow: `5px 5px 0px 0px ${userTheme}`,
						color: userTheme,
						border: `2px solid ${userTheme}`,
					}}
				>
					Login
				</Button>
			)}
		</nav>
	);
};

export default Navbar;
