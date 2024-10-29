"use client";

import { sidebarLinks, sidebarLinksCreator } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getDarkHexCode, getImageSource } from "@/lib/utils";
import { clientUser, creatorUser } from "@/types";

const Sidebar = () => {
	const pathname = usePathname();
	// const creatorURL = localStorage.getItem("creatorURL");

	const { currentUser, userType, currentTheme, creatorURL } =
		useCurrentUsersContext();
	const isExpertPath =
		creatorURL && creatorURL !== "" && pathname.includes(`${creatorURL}`);

	const handleLogEvent = () =>
		logEvent(analytics, "page_accessed", {
			userId: currentUser?._id,
			page: pathname,
		});

	const sidebarItems =
		userType === "creator" ? sidebarLinksCreator : sidebarLinks;

	const imageSrc =
		getImageSource(currentUser as clientUser | creatorUser) ?? "";

	return (
		<section
			className={`sticky left-0 top-[76px] flex h-screen flex-col justify-between p-6  max-md:hidden lg:w-[264px] shadow-md ${
				isExpertPath && "border-r border-white/20"
			}`}
			style={{
				maxHeight: `calc(100dvh - 76px)`,
				backgroundColor: isExpertPath ? "transparent" : "#ffffff",
			}}
		>
			<div className="flex flex-1 flex-col gap-3.5 max-h-[88%] overflow-y-scroll no-scrollbar">
				{sidebarItems.map((item, index) => {
					const isActive =
						pathname === item.route || pathname.startsWith(`${item.route}/`);

					return (
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
									key={item.label}
									className={`flex w-full gap-4 items-center p-4 rounded-lg justify-center lg:justify-start 
								group ${
									isExpertPath
										? "text-white bg-[#333333] hoverScaleDownEffect"
										: "text-black hover:bg-green-1"
								} ${isActive && " bg-green-1 text-white"}`}
									onClick={handleLogEvent}
								>
									<Image
										src={item.imgURL}
										alt={item.label}
										width={100}
										height={100}
										className={`w-6 h-6 object-cover invert group-hover:invert-0 group-hover:brightness-200 ${
											(isActive || isExpertPath) && "invert-0 brightness-200"
										}`}
										priority
									/>

									<p className="text-base max-lg:hidden group-hover:text-white">
										{item.label}
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
			{currentUser ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<Link
							href={`/profile/${currentUser?._id}`}
							className={`flex gap-4 items-center rounded-lg  justify-center lg:px-2 lg:justify-start hoverScaleDownEffect ${
								userType === "client" && isExpertPath && "bg-[#333333] py-2.5"
							}  ${pathname.includes("/profile/") && "opacity-80"}`}
						>
							<Image
								src={imageSrc}
								alt="Profile"
								width={1000}
								height={1000}
								className="rounded-full w-11 h-11 object-cover"
							/>
							<div className="flex flex-col items-start justify-center max-lg:hidden ">
								<span
									className={`${
										isExpertPath ? "text-white" : "text-black"
									} text-lg capitalize font-medium`}
								>
									{currentUser?.username || "Hello User"}
								</span>
								<span
									className="text-xs font-medium"
									style={{
										color: getDarkHexCode(currentTheme) as string,
									}}
								>
									{currentUser.phone
										? currentUser.phone.replace(
												/(\+91)(\d+)/,
												(match, p1, p2) => `${p1} ${p2}`
										  )
										: currentUser.username
										? `@${currentUser.username}`
										: "@guest"}
								</span>
							</div>
						</Link>
					</TooltipTrigger>
					<TooltipContent>
						<p>Profile</p>
					</TooltipContent>
				</Tooltip>
			) : (
				<Button
					asChild
					className={`text-white hoverScaleDownEffect `}
					style={{
						backgroundColor: isExpertPath
							? (getDarkHexCode(currentTheme) as string)
							: "#50a65c",
					}}
					size="lg"
				>
					<Link href="/authenticate">Login</Link>
				</Button>
			)}
		</section>
	);
};

export default Sidebar;
