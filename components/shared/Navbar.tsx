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
import { getDarkHexCode } from "@/lib/utils";
import CreatorNavbar from "../creator/Navbar";

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
		setAuthenticationSheetOpen,
		currentTheme,
		creatorURL,
	} = useCurrentUsersContext();
	const router = useRouter();
	const [creator, setCreator] = useState<creatorUser>();
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const pathname = usePathname();
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
				Creator_ID: creator?._id,
			});
			setIsAuthSheetOpen(true);
		}
	};

	const { walletBalance } = useWalletBalanceContext();

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

	const handleAppRedirect = () => {
		trackEvent("Getlink_TopNav_Clicked");
		const url =
			"https://play.google.com/store/apps/details?id=com.flashcall.me";
		window.open(url, "_blank");
	};

	const AppLink = () => (
		<Button
			className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-full hoverScaleDownEffect h-[40px] xl:h-[48px]"
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
				className={`size-6 rounded-full`}
				priority
			/>
			<span className="w-fit whitespace-nowrap text-xs font-semibold">
				Get Your Link
			</span>
		</Button>
	);

	if (userType === "creator") {
		return <CreatorNavbar />;
	}

	return (
		<nav
			id="navbar"
			className={`bg-white flex justify-between items-center sticky h-[76px] z-40 top-0 left-0 ${
				isCreatorOrExpertPath
					? "border-b border-white/20"
					: "border-b border-[#A7A8A180]/50 md:border-none"
			} w-full px-4  md:px-10 xl:px-14 py-4 transition-transform duration-300 shadow-sm blurEffect`}
		>
			{currentUser ? (
				userType === "creator" ? (
					<Link
						href="/home"
						className="flex items-center justify-center size-fit"
					>
						<Image
							src="/icons/logo_new_light.png"
							width={1000}
							height={1000}
							alt="flashcall logo"
							className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-[24px] hoverScaleDownEffect w-[128px] h-[40px] xl:w-[150px] xl:h-[48px]"
							style={{
								border: `1px solid #000000`,
							}}
						/>
					</Link>
				) : (
					<AppLink />
				)
			) : (
				<AppLink />
			)}

			{fetchingUser ? (
				<NavLoader />
			) : currentUser ? (
				<div className="flex justify-end items-center gap-4 h-full">
					<Link
						href="/payment"
						className={`w-fit flex items-center justify-center gap-2 p-3 rounded-full hoverScaleDownEffect h-[40px] xl:h-[48px] ${
							pathname.includes("/payment") && "!bg-black !text-white"
						}`}
						style={{
							border: `1px solid #000000`,
						}}
					>
						<Image
							src="/wallet.svg"
							width={100}
							height={100}
							alt="wallet"
							className={`w-4 h-4 ${pathname.includes("/payment") && "invert"}`}
						/>
						<span className="w-full mt-[2px] text-center align-middle text-xs font-semibold">
							{`${currentUser.global ? "$" : "RS."} ${Math.round(
								walletBalance
							)}`}
						</span>
					</Link>

					<MobileNav />
				</div>
			) : (
				<Button
					className="hoverScaleDownEffect flex items-center gap-2 font-semibold w-fit h-[40px] xl:h-[48px] mr-1 rounded-[24px] bg-black text-white"
					size="lg"
					onClick={handleRouting}
				>
					<span>Login</span>
					<div className="border-2 border-white/40 rounded-full p-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2.5}
							stroke="currentColor"
							className="size-2.5"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
							/>
						</svg>
					</div>
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

export default Navbar;
