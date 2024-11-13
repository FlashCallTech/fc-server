"use client";

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import CallListMobileCreator from "@/components/calls/CallListMobileCreator";

const PreviousPage = () => {
	const [historyType, setHistoryType] = useState<
		"All" | "Audio" | "Video" | "Chat"
	>("All");
	const [creator, setCreator] = useState<creatorUser>();
	const options: ("All" | "Audio" | "Video" | "Chat")[] = [
		"All",
		"Audio",
		"Video",
		"Chat",
	];
	const { currentUser, userType } = useCurrentUsersContext();

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

	return (
		<section className="flex size-full flex-col gap-2 pb-5">
			<section
				className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold">Order History</h1>
				<div className="hidden xl:flex items-center justify-center w-fit gap-2">
					{options.map((option) => (
						<Button
							key={option}
							className={`text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 hover:text-white hover:bg-green-1 hoverScaleDownEffect ${
								historyType === option && "bg-green-1 text-white"
							}`}
							onClick={() => setHistoryType(option)}
						>
							{option}
						</Button>
					))}
				</div>
			</section>

			<div className="flex xl:hidden items-center justify-start w-full gap-2 px-4 pb-2">
				{options.map((option) => (
					<Button
						key={option}
						className={`text-sm font-medium px-[20px] py-[7px] rounded-3xl border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-green-1  ${
							historyType === option && "bg-green-1 text-white"
						}`}
						onClick={() => setHistoryType(option)}
					>
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
	);
};

export default PreviousPage;
