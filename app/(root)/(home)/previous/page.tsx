"use client";

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import ChatList from "@/components/calls/ChatList";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";
import CallListMobileCreator from "@/components/calls/CallListMobileCreator";

const PreviousPage = () => {
	const [historyType, setHistoryType] = useState<"Calls" | "Chats">("Calls");
	const [creator, setCreator] = useState<creatorUser>();
	const options: ("Calls" | "Chats")[] = ["Calls", "Chats"];
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
							className={`text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition-transform duration-300 hover:text-white hover:bg-green-1 hover:scale-105 ${
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
						className={`text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition-transform duration-300 hover:text-white hover:bg-green-1 hover:scale-105 ${
							historyType === option && "bg-green-1 text-white"
						}`}
						onClick={() => setHistoryType(option)}
					>
						{option}
					</Button>
				))}
			</div>

			{historyType === "Calls" ? (
				userType === "client" ? (
					<CallListMobile />
				) : (
					<CallListMobileCreator />
				)
			) : (
				<ChatList />
			)}
		</section>
	);
};

export default PreviousPage;
