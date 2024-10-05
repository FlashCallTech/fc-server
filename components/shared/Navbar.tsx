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

const Navbar = ({
	isVisible,
	isMobile,
}: {
	isVisible: boolean;
	isMobile: boolean;
}) => {
	const {
		currentUser,
		fetchingUser,
		userType,
		authenticationSheetOpen,
		setAuthenticationSheetOpen,
		currentTheme,
	} = useCurrentUsersContext();
	const router = useRouter();
	const [creator, setCreator] = useState<creatorUser>();
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

	const pathname = usePathname();
	const creatorURL = localStorage.getItem("creatorURL");

	const isCreatorOrExpertPath = pathname.includes(`${creatorURL}`);
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
			className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-[6px] hoverScaleDownEffect w-[128px] h-[40px] xl:w-[200px] xl:h-[48px]"
			style={{
				boxShadow: `4px 4px 0px 0px #000000`,
				color: `${
					isMobile && followCreatorTheme ? "#000000" : followCreatorTheme
				}`,
				border: `1px solid #000000`,
				backgroundColor: `${
					isCreatorOrExpertPath
						? isMobile
							? currentTheme
							: "#333333"
						: "#ffffff"
				}`,
			}}
			onClick={handleAppRedirect}
		>
			<Image
				src="/icons/logo_icon.png"
				width={100}
				height={100}
				alt="flashcall logo"
				className={`size-6 xl:w-[28px] xl:h-[36px] rounded-full`}
			/>

			<span className="w-fit whitespace-nowrap text-xs font-semibold">
				Get Your Link
			</span>
		</Button>
	);

	return (
		<nav
			className={`flex justify-between items-center fixed h-[76px] z-40 top-0 left-0 ${
				isCreatorOrExpertPath && "border-b border-white/20"
			}  ${
				isVisible ? "translate-y-0" : "-translate-y-full"
			} w-full px-4 py-4 transition-transform duration-300 shadow-sm blurEffect
			 `}
			style={{
				background: `${
					isCreatorOrExpertPath
						? isMobile
							? currentTheme
							: "#000000"
						: "#ffffff"
				} `,
			}}
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
							className="flex items-center justify-center gap-2 px-4 lg:ml-2 rounded-[6px] hoverScaleDownEffect w-[128px] h-[40px] xl:w-[175px] xl:h-[48px]"
							style={{
								boxShadow: `4px 4px 0px 0px #000000`,
								color: `${
									isMobile && followCreatorTheme
										? "#000000"
										: followCreatorTheme
								}`,
								border: `1px solid #000000`,
								backgroundColor: `${
									isCreatorOrExpertPath
										? isMobile
											? currentTheme
											: "#333333"
										: "#ffffff"
								}`,
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
							className={`w-fit flex items-center justify-center gap-2 p-3 rounded-[6px] hoverScaleDownEffect h-[40px] xl:h-[48px] ${
								pathname.includes("/payment") && "!bg-green-1 !text-white"
							}`}
							style={{
								boxShadow: `4px 4px 0px 0px #000000`,
								color: `${
									isMobile && followCreatorTheme
										? "#000000"
										: followCreatorTheme
								}`,
								border: `1px solid #000000`,
								backgroundColor: `${
									isCreatorOrExpertPath
										? isMobile
											? currentTheme
											: invertCreatorTheme
										: "#ffffff"
								}`,
							}}
						>
							<Image
								src="/wallet.svg"
								width={100}
								height={100}
								alt="wallet"
								className={`w-4 h-4 ${
									(pathname.includes("/payment") ||
										(isCreatorOrExpertPath && !isMobile)) &&
									"invert"
								}`}
							/>
							<span className="w-full mt-[2px] text-center align-middle text-xs font-semibold">
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
					className="hoverScaleDownEffect font-semibold w-fit h-[40px] xl:h-[48px]  mr-1 rounded-md"
					size="lg"
					onClick={handleRouting}
					style={{
						boxShadow: `4px 4px 0px 0px #000000`,
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

export default Navbar;
