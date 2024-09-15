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

const Sidebar = () => {
	const pathname = usePathname();
	const { currentUser, userType } = useCurrentUsersContext();

	const handleLogEvent = () =>
		logEvent(analytics, "page_accessed", {
			userId: currentUser?._id,
			page: pathname,
		});

	const sidebarItems =
		userType === "creator" ? sidebarLinksCreator : sidebarLinks;

	return (
		<section className="sticky left-0 top-0 flex h-screen flex-col justify-between p-6 pt-24  max-md:hidden lg:w-[264px] shadow-md">
			<div className="flex flex-1 flex-col gap-5 max-h-[88%] overflow-y-scroll no-scrollbar">
				{sidebarItems.map((item, index) => {
					const isActive =
						pathname === item.route || pathname.startsWith(`${item.route}/`);

					return (
						<Tooltip key={item.label + index}>
							<TooltipTrigger asChild>
								<Link
									href={
										item.label === "Home"
											? "/home"
											: currentUser
											? item.route
											: userType === "creator"
											? "/authenticate?usertype=creator"
											: "/authenticate"
									}
									key={item.label}
									className={`flex w-full gap-4 items-center p-4 rounded-lg justify-center lg:justify-start 
								group hover:bg-green-1  ${isActive && "bg-green-1 text-white"}`}
									onClick={handleLogEvent}
								>
									<Image
										src={item.imgURL}
										alt={item.label}
										width={100}
										height={100}
										className={`w-6 h-6 object-cover invert group-hover:invert-0 group-hover:brightness-200 ${
											isActive && "invert-0 brightness-200"
										}`}
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
							className={`flex gap-4 items-center rounded-lg  justify-center lg:px-2 lg:justify-start hoverScaleDownEffect  ${
								pathname.includes("/profile/") && "opacity-80"
							}`}
						>
							<Image
								src={currentUser?.photo || "/images/defaultProfile.png"}
								alt="Profile"
								width={1000}
								height={1000}
								className="rounded-full w-11 h-11 object-cover"
							/>
							<div className="flex flex-col items-start justify-center max-lg:hidden">
								<span className="text-lg capitalize font-medium">
									{currentUser?.username || "Hello User"}
								</span>
								<span className="text-xs text-green-1 font-medium">
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
					className="text-white hover:opacity-80 bg-green-1"
					size="lg"
				>
					<Link href="/authenticate">Login</Link>
				</Button>
			)}
		</section>
	);
};

export default Sidebar;
