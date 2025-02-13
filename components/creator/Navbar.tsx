"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import { trackEvent } from "@/lib/mixpanel";
import { creatorUser } from "@/types";
import { getDarkHexCode } from "@/lib/utils";
import MobileNav from "../shared/MobileNav";

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

const CreatorNavbar = () => {
	const {
		currentUser,
		fetchingUser,
		userType,
		setAuthenticationSheetOpen,
		currentTheme,
		creatorURL,
	} = useCurrentUsersContext();
	const router = useRouter();
	const [creator, setCreator] = useState<creatorUser>();
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const pathname = usePathname();
	const isCreatorHome =
		pathname.includes("home") && userType === "creator" && currentUser;
	const isCreatorOrExpertPath =
		creatorURL && creatorURL !== "" && pathname.includes(`${creatorURL}`);
	const followCreatorTheme = isCreatorOrExpertPath ? "#ffffff" : "#000000";
	const invertCreatorTheme = isCreatorOrExpertPath
		? getDarkHexCode(currentTheme)
		: "#ffffff";

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
		if (userType === "creator") {
			router.push("/authenticate?usertype=creator");
		} else {
			trackEvent("Login_TopNav_Clicked", {
				// utm_source: "google",
				Creator_ID: creator?._id,
			});
			setIsAuthSheetOpen(true);
		}
	};

	const { walletBalance } = useWalletBalanceContext();

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	const pageName = () => {
		if (pathname.includes("blocked")) return "Blocked Account";
		else if (pathname.includes("notifications")) return "Notifications";
		else if (pathname.includes("refer")) return "Refer and Earn";
		else if (pathname.includes("meta-analytics")) return "Meta Pixel Analytics";
		else if (pathname.includes("kyc")) return "KYC";
		else if (pathname === "calendar") return "Calendar";
		else if (pathname.includes("calendar-event"))
			return "Calendar Event Consent";
		else if (pathname.includes("payment-settings")) return "Payment Method";
		else if (pathname.includes("payment")) return "Transaction History";
		else if (pathname.includes("previous")) return "Order History";
		else if (pathname.includes("userFeedbacks")) return "User Feedbacks";
		else if (pathname.includes("upcoming")) return "Upcoming Calls";
		else if (pathname.includes("campaign") || pathname.includes("discount"))
			return "Discount Campaign";
		else if (pathname.includes("service-management"))
			return "Service Management";
		else if (pathname.includes("terms-and-conditions"))
			return "Terms and Conditions";
		else if (pathname.includes("support")) return "Support";
		else if (pathname.includes("profile")) return "Edit Profile";
	};

	const handleAppRedirect = () => {
		trackEvent("Getlink_TopNav_Clicked");
		const url =
			"https://play.google.com/store/apps/details?id=com.flashcall.me";
		window.open(url, "_blank");
	};

	const AppLink = () => (
		<Button
			className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-[6px] hoverScaleDownEffect w-[128px] h-[40px] xl:w-[200px] xl:h-[48px]"
			style={{
				border: `1px solid #000000`,
			}}
			onClick={handleAppRedirect}
		>
			<Image
				src="/icons/logo_icon.png"
				width={100}
				height={100}
				alt="flashcall logo"
				className={`size-6 xl:w-[28px] xl:h-[36px] rounded-full`}
				priority
			/>
			<span className="w-fit whitespace-nowrap text-xs font-semibold">
				Get Your Link
			</span>
		</Button>
	);

	return (
		<nav
			id="navbar"
			className={`${
				isCreatorHome ? "lg:hidden" : ""
			} bg-white flex justify-between items-center sticky w-full h-[76px] z-40 top-0 left-[264px] px-4 py-4 transition-transform duration-300 shadow-sm blurEffect`}
		>
			{currentUser ? (
				<Link
					href="/home"
					className="lg:hidden flex items-center justify-center size-fit "
				>
					<Image
						src="/icons/logo_new_light.png"
						width={1000}
						height={1000}
						alt="flashcall logo"
						className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-full hoverScaleDownEffect w-[128px] h-[40px] xl:w-[150px] xl:h-[48px]"
						style={{
							border: `1px solid #000000`,
						}}
					/>
				</Link>
			) : (
				<AppLink />
			)}

			<div className="hidden lg:flex gap-4 items-center text-lg font-bold">
				<Link
					href={`${creatorURL ? creatorURL : "/home"}`}
					className="text-xl font-bold hoverScaleDownEffect"
				>
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
							d="M15.75 19.5 8.25 12l7.5-7.5"
						/>
					</svg>
				</Link>
				{pageName()}
			</div>

			{fetchingUser ? (
				<NavLoader />
			) : currentUser ? (
				<div className="flex justify-end items-center gap-4 h-full lg:text-[#16BC88]">
					<Link
						href="/payment"
						className={`w-fit flex items-center justify-center gap-2 p-3 rounded-[6px] hoverScaleDownEffect h-[40px] xl:h-[48px] lg:bg-[#def4ed] ${
							typeof window !== "undefined" && window.innerWidth >= 1024
								? ""
								: "rounded-full border-[1px] border-[#000000]"
						}`}
					>
						<svg
							width="100"
							height="100"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="w-4 h-4"
						>
							<path
								d="M15 12V13.25C15 13.9395 14.439 14.5 13.75 14.5H3C1.897 14.5 1 13.603 1 12.5C1 12.5 1 4.0075 1 4C1 2.897 1.897 2 3 2H12.25C12.6645 2 13 2.336 13 2.75C13 3.164 12.6645 3.5 12.25 3.5H3C2.7245 3.5 2.5 3.724 2.5 4C2.5 4.276 2.7245 4.5 3 4.5H13.75C14.439 4.5 15 5.0605 15 5.75V7H12.5C11.1215 7 10 8.1215 10 9.5C10 10.8785 11.1215 12 12.5 12H15Z"
								fill="currentColor"
							/>
							<path
								d="M15 8V11H12.5C11.6715 11 11 10.3285 11 9.5C11 8.6715 11.6715 8 12.5 8H15Z"
								fill="currentColor"
							/>
						</svg>

						<span className="w-full mt-[2px] text-center align-middle tracking-wide text-xs font-semibold">
							{`Rs. ${Math.round(walletBalance)}`}
						</span>
					</Link>

					<MobileNav />
				</div>
			) : (
				<Button
					className="hoverScaleDownEffect font-semibold w-fit h-[40px] xl:h-[48px] mr-1 rounded-md"
					size="lg"
					onClick={handleRouting}
					style={{
						color: `${followCreatorTheme}`,
						border: `1px solid #000000`,
						backgroundColor: `${invertCreatorTheme}`,
					}}
				>
					Login
				</Button>
			)}

			{isAuthSheetOpen && (
				<AuthenticationSheet
					isOpen={isAuthSheetOpen}
					onOpenChange={setIsAuthSheetOpen} // Handle sheet close
				/>
			)}
		</nav>
	);
};

export default CreatorNavbar;
