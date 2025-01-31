"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import CallListMobileCreator from "@/components/calls/CallListMobileCreator";
import Link from "next/link";
import ContentLoading from "@/components/shared/ContentLoading";
import { serviceIconBold } from "@/constants/icons";

const PreviousPage = () => {
	const [creator, setCreator] = useState<creatorUser>();
	const [historyType, setHistoryType] = useState<
		"All" | "Audio" | "Video" | "Chat"
	>("All");
	const options: ("All" | "Audio" | "Video" | "Chat")[] = [
		"All",
		"Audio",
		"Video",
		"Chat",
	];
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();

	useEffect(() => {
		const storedCreator = localStorage.getItem("currentCreator");
		if (storedCreator) {
			const parsedCreator: creatorUser = JSON.parse(storedCreator);
			if (parsedCreator) {
				setCreator(parsedCreator);
			}
		}
	}, []);

	useEffect(() => {
		userType === "client" &&
			trackEvent("OrderHistory_Impression", {
				Client_ID: currentUser?._id,
				User_First_Seen: currentUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator?._id,
				Walletbalace_Available: currentUser?.walletBalance,
			});
	}, []);

	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<>
			<section
				className={`${
					userType === "creator" ? "lg:hidden" : "flex"
				} flex size-full flex-col gap-2 pb-5`}
			>
				<section
					className={`sticky top-0 bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
				>
					<section className="flex items-center gap-4">
						<Link
							href={`${creatorURL ? creatorURL : "/home"}`}
							className="text-xl font-bold"
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
						<h1 className="text-xl md:text-2xl font-bold">Order History</h1>
					</section>
					<div className="hidden xl:flex items-center justify-center w-fit gap-2">
						{options.map((option) => (
							<Button
								key={option}
								className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-black flex items-center gap-2 ${
									historyType === option && "bg-black text-white"
								}`}
								onClick={() => setHistoryType(option)}
							>
								{option !== "All" &&
									serviceIconBold(
										option.toLowerCase() as "video" | "audio" | "chat"
									)}
								{option}
							</Button>
						))}
					</div>
				</section>

				<div className="flex xl:hidden items-center justify-start w-full gap-2 px-4 pb-2">
					{options.map((option) => (
						<Button
							key={option}
							className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-black flex items-center gap-2 ${
								historyType === option && "bg-black text-white"
							}`}
							onClick={() => setHistoryType(option)}
						>
							{option !== "All" &&
								serviceIconBold(
									option.toLowerCase() as "video" | "audio" | "chat"
								)}
							{option}
						</Button>
					))}
				</div>

				{currentUser ? (
					userType === "client" ? (
						<CallListMobile callType={historyType} />
					) : (
						<CallListMobileCreator callType={historyType} />
					)
				) : fetchingUser ? (
					<div className="size-full h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-2xl font-semibold text-center">
						<ContentLoading />
					</div>
				) : (
					<div className="flex flex-col w-full items-center justify-center h-[calc(100vh-6rem)]">
						<h1 className="text-2xl font-semibold text-red-500">
							No Calls Found
						</h1>
						<h2 className="text-xl font-semibold text-red-500">
							Please sign in to continue.
						</h2>
					</div>
				)}
			</section>

			{/* New Design */}
			<section
				className={`${
					userType === "creator" ? "lg:flex" : "hidden"
				} hidden  size-full flex-col`}
			>
				<div className="flex w-full gap-2 p-8 pb-2 items-center justify-end">
					{options.map((option) => (
						<Button
							key={option}
							className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-black flex items-center gap-2 ${
								historyType === option && "bg-black text-white"
							}`}
							onClick={() => setHistoryType(option)}
						>
							{option !== "All" &&
								serviceIconBold(
									option.toLowerCase() as "video" | "audio" | "chat"
								)}
							{option}
						</Button>
					))}
				</div>

				{currentUser ? (
					<CallListMobileCreator callType={historyType} />
				) : (
					<div className="flex flex-col w-full items-center justify-center h-full">
						<h1 className="text-2xl font-semibold text-red-500">
							No Calls Found
						</h1>
						<h2 className="text-xl font-semibold text-red-500">
							Please sign in to continue.
						</h2>
					</div>
				)}
			</section>
		</>
	);
};

export default PreviousPage;
