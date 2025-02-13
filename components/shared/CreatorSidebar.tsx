"use client";

import { newSidebarLinksCreator } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { frontendBaseUrl, getDisplayName, getImageSource } from "@/lib/utils";
import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";

const CreatorSidebar = () => {
	const [creator, setCreator] = useState<creatorUser>();
	const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false); // Dropdown state
	const pathname = usePathname();

	const { currentUser, fetchingUser, pendingNotifications } =
		useCurrentUsersContext();
	const fullName = getDisplayName({
		fullName: currentUser?.fullName,
		firstName: currentUser?.firstName,
		lastName: currentUser?.lastName,
		username: currentUser?.username as string,
	});

	useEffect(() => {
		if (pathname.includes("payment-settings") || pathname.includes("kyc"))
			setPaymentDropdownOpen(true);
	}, [pathname]);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	const handleLogEvent: any = (item: any) => {
		if (item?.label === "Order History")
			trackEvent("Menu_OrderHistory_Clicked", {
				Client_ID: currentUser?._id,
				User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: currentUser?.walletBalance,
			});

		if (item?.label === "Favorites")
			trackEvent("Menu_Favourites_Clicked", {
				Client_ID: currentUser?._id,
				User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: currentUser?.walletBalance,
			});

		if (item?.label === "Support")
			trackEvent("Menu_Support_Clicked", {
				Client_ID: currentUser?._id,
				User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: currentUser?.walletBalance,
			});
	};

	const sidebarItems = newSidebarLinksCreator;
	const paymentSubItems = [
		{
			label: "Payment Methods",
			route: `${frontendBaseUrl}/payment-settings`,
			protected: true,
		},
		{ route: `${frontendBaseUrl}/kyc`, label: "KYC", protected: true },
	];

	const activeSubItem = (label: string) => {
		if (pathname.includes("payment") && label === "Transaction History") {
			return true;
		}
		if (pathname.includes("kyc") && label === "KYC") {
			return true;
		}
		if (pathname.includes("payment-settings") && label === "Payment Methods") {
			return true;
		} else {
			return false;
		}
	};

	const imageSrc = getImageSource(currentUser as creatorUser) ?? "";
	return (
		<section
			id="sidebar"
			className={`sticky left-0 top-0 flex h-screen flex-col justify-between min-w-[264px] border shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-gradient-to-t from-[rgba(0,0,0,0.001)] to-[rgba(0,0,0,0.001)] max-lg:hidden`}
		>
			<div className="p-2 ml-2">
				<Image
					src="/icons/logo_new_light.png"
					width={1000}
					height={1000}
					alt="flashcall logo"
					className={`w-[150px]`}
					priority
				/>
			</div>
			{/* Sidebar Content */}
			<div
				className={`flex flex-1 flex-col gap-1 pt-1 px-2 py-4 overflow-y-scroll no-scrollbar`}
			>
				{sidebarItems.map((item, index) => {
					if (!item) return null;
					const isActive =
						pathname === item.route || pathname.startsWith(`${item.route}/`);
					const showBadge =
						item.label === "Notifications" && pendingNotifications > 0;

					if (item.label === "Payment Settings") {
						return (
							<div key={index}>
								<div
									className={`flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 text-[#4B5563]`}
									onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
								>
									<div className="flex items-center gap-5">
										<Image
											src={item.imgURL}
											alt={item.label}
											width={100}
											height={100}
											className={`size-4 object-cover gray-color`}
											priority
										/>
										<p className="text-[14px] tracking-wide font-medium">
											{item.label}
										</p>
									</div>
									<Image
										src={"/down.svg"}
										alt="toggle arrow"
										width={16}
										height={16}
									/>
								</div>
								{paymentDropdownOpen && (
									<div className="mt-1 pl-12">
										{paymentSubItems.map((subItem, subIndex) => (
											<Link
												key={subIndex}
												href={
													subItem.protected
														? currentUser
															? subItem.route
															: "/authenticate?usertype=creator"
														: subItem.route
												}
												className={`block mb-1 text-sm tracking-wide font-medium px-4 py-2 rounded-lg ${
													activeSubItem(subItem.label)
														? "bg-[#0000001A] text-black"
														: "bg-white text-[#4B5563] hover:bg-gray-100"
												}`}
											>
												{subItem.label}
											</Link>
										))}
									</div>
								)}
							</div>
						);
					}
					return (
						<Tooltip key={item.label + index}>
							<TooltipTrigger asChild>
								<Link
									href={
										item.protected
											? currentUser
												? item.route
												: "/authenticate?usertype=creator"
											: item.route
									}
									className={`flex w-full px-4 py-2 items-center gap-5 rounded-lg justify-start ${
										isActive
											? "bg-[#0000001A] text-black"
											: "bg-white text-[#4B5563] hover:bg-gray-100"
									}`}
									onClick={() => handleLogEvent(item)}
								>
									<Image
										src={item.imgURL}
										alt={item.label}
										width={100}
										height={100}
										className={`size-4 object-fit ${
											isActive ? "" : "gray-color"
										}`}
										priority
									/>
									<p className={`text-sm tracking-wide font-medium`}>
										{item.label}
										{showBadge && (
											<span className="ml-2 flex items-center justify-center bg-red-500 rounded-full text-white p-1 text-xs size-5">
												{pendingNotifications}
											</span>
										)}
									</p>
								</Link>
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-black">{item.label}</p>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>

			{/* Footer Section */}
			<div className={`flex flex-col`}>
				<div className="px-2">
					{/* Additional Links */}
					<Link
						href="/terms-and-conditions"
						className="flex items-center gap-5 text-sm tracking-wide font-medium text-[#4B5563] px-4 py-2 rounded-lg hover:bg-gray-100"
					>
						<Image
							src={"/creator/terms&conditions.svg"}
							width={100}
							height={100}
							alt="img"
							className="size-4 object-cover gray-color"
						/>
						Terms & Conditions
					</Link>
					<Link
						href="/support"
						className="flex items-center gap-5 text-sm tracking-wide font-medium text-[#4B5563] px-4 py-2 rounded-lg hover:bg-gray-100"
					>
						<Image
							src={"/creator/support.svg"}
							width={100}
							height={100}
							alt="img"
							className="size-4 object-cover gray-color"
						/>
						Support
					</Link>
				</div>
				{currentUser && !fetchingUser ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								href={`/profile/${currentUser?._id}`}
								className={`flex p-4 gap-5 items-center border-t mt-2 justify-center`}
							>
								<Image
									src={imageSrc}
									alt="Profile"
									width={1000}
									height={1000}
									className="rounded-full size-9 object-cover bg-white"
								/>
								<div
									className={`flex flex-col w-full items-start justify-center text-[#4B5563]`}
								>
									<span
										className={`text-[14px] tracking-wide font-medium capitalize max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap `}
									>
										{fullName}
									</span>
									<section className="flex items-center justify-between w-fit gap-2">
										<span className="text-[14px] tracking-wide font-medium">
											{currentUser?.phone?.replace(
												/(\+91)(\d+)/,
												(match, p1, p2) => `${p1} ${p2}`
											) || `@${fullName}`}
										</span>
									</section>
								</div>
							</Link>
						</TooltipTrigger>
						<TooltipContent>
							<p>Profile</p>
						</TooltipContent>
					</Tooltip>
				) : fetchingUser ? null : (
					<Button
						asChild
						className={`text-white hoverScaleDownEffect`}
						style={{
							backgroundColor: "#50A65C",
						}}
						size="lg"
					>
						<Link href="/authenticate">Login</Link>
					</Button>
				)}
			</div>
		</section>
	);
};

export default CreatorSidebar;
