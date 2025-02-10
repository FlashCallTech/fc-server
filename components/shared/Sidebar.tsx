"use client";

import { sidebarLinks, sidebarLinksCreator } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getDarkHexCode, getDisplayName, getImageSource } from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import CreatorSidebar from "./CreatorSidebar";

const Sidebar = () => {
	const [creator, setCreator] = useState<creatorUser>();
	const pathname = usePathname();

	const {
		currentUser,
		userType,
		fetchingUser,
		creatorURL,
		pendingNotifications,
	} = useCurrentUsersContext();
	const fullName = getDisplayName({
		fullName: currentUser?.fullName,
		firstName: currentUser?.firstName,
		lastName: currentUser?.lastName,
		username: currentUser?.username as string,
	});
	const isCreatorHome = pathname.includes("home") && userType === "creator";
	const isExpertPath =
		creatorURL && creatorURL !== "" && pathname.includes(`${creatorURL}`);

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	const handleLogEvent = (item: any) => {
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

	const sidebarItems = sidebarLinks;

	const imageSrc =
		getImageSource(currentUser as clientUser | creatorUser) ?? "";

	if (userType === "creator") {
		return <CreatorSidebar />;
	}

	return (
		<section
			id="sidebar"
			className={`${isExpertPath && "hidden"} sticky left-0 ${
				isCreatorHome ? "top-0" : "top-[76px]"
			}  flex h-screen flex-col justify-between p-6 max-md:hidden lg:max-w-[264px] shadow-md`}
			style={{
				maxHeight: `calc(100dvh - ${isCreatorHome ? "0px" : "76px"} )`,
			}}
		>
			<div className="flex flex-1 flex-col gap-2.5 max-h-[88%] overflow-y-scroll no-scrollbar">
				{sidebarItems.map((item, index) => {
					const isActive =
						pathname === item.route || pathname.startsWith(`${item.route}/`);
					const showBadge =
						item.label === "Notifications" && pendingNotifications > 0;
					return (
						!(item.route === "/home") && (
							<Tooltip key={item.label + index}>
								<TooltipTrigger asChild>
									<Link
										href={
											item.protected
												? currentUser
													? item.route
													: userType === "creator"
													? "/authenticate?usertype=creator"
													: "/authenticate"
												: item.route
										}
										className={`flex w-full gap-4 items-center p-4 rounded-lg justify-center lg:justify-start 
                  group text-black hover:bg-green-1 ${
										isActive && " bg-green-1 text-white"
									}`}
										onClick={() => handleLogEvent(item)}
									>
										<Image
											src={item.imgURL}
											alt={item.label}
											width={100}
											height={100}
											className={`w-6 h-6 object-cover invert group-hover:invert-0 group-hover:brightness-200 ${
												isActive && "invert-0 brightness-200"
											}`}
											priority
										/>

										<p className="text-base max-lg:hidden group-hover:text-white flex items-center">
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
						)
					);
				})}
			</div>

			{currentUser && !fetchingUser ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<Link
							href={`/profile/${currentUser?._id}`}
							className={`flex gap-4 items-center rounded-lg  justify-center lg:px-2 lg:justify-start hoverScaleDownEffect overflow-hidden  ${
								pathname.includes("/profile/") && "opacity-80"
							}`}
						>
							<Image
								src={imageSrc}
								alt="Profile"
								width={1000}
								height={1000}
								className="rounded-full w-11 h-11 object-cover bg-white"
							/>
							<div className="flex flex-col w-full items-start justify-center max-lg:hidden">
								<span
									className={` text-lg capitalize max-w-[85%] overflow-hidden text-ellipsis whitespace-nowrap`}
								>
									{fullName}
								</span>
								<section className="flex items-center justify-between w-fit gap-2">
									<span className="text-sm text-green-1">
										{currentUser?.phone?.replace(
											/(\+91)(\d+)/,
											(match, p1, p2) => `${p1} ${p2}`
										) || `@${fullName}`}
									</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={2.5}
										stroke="currentColor"
										className="size-3.5 text-green-1"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="m8.25 4.5 7.5 7.5-7.5 7.5"
										/>
									</svg>
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
					className="hoverScaleDownEffect flex items-center gap-2 font-semibold w-full max-lg:hidden h-[40px] xl:h-[48px] mr-1 rounded-[24px] bg-black text-white"
					size="lg"
				>
					<Link href="/authenticate">
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
					</Link>
				</Button>
			)}
		</section>
	);
};

export default Sidebar;
