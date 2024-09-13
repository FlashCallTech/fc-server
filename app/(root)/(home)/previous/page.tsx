"use client";

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import ChatList from "@/components/calls/ChatList";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import CreatorCallsFeedbacks from "@/components/creator/CreatorCallsFeedbacks";
import { creatorUser } from "@/types";
import { trackEvent } from "@/lib/mixpanel";

const PreviousPage = () => {
	const [historyType, setHistoryType] = useState<"Calls" | "Chats">("Calls");
	const [creator, setCreator] = useState<creatorUser>();
	const [isSticky, setIsSticky] = useState(false);
	const options: ("Calls" | "Chats")[] = ["Calls", "Chats"];
	const stickyRef = useRef<HTMLDivElement>(null);
	const { userType, clientUser } = useCurrentUsersContext();
	const handleScroll = () => {
		if (stickyRef.current) {
			setIsSticky(window.scrollY > stickyRef.current.offsetTop);
		}
	};

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
		trackEvent('OrderHistory_Impression', {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split('T')[0],
			Creator_ID: creator?._id,
			Walletbalace_Available: clientUser?.walletBalance,
		})
	}, [])

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<section
			ref={stickyRef}
			className="flex size-full flex-col gap-2 pb-5 md:pb-14"
		>
			<div
				className={`sticky top-16 bg-white z-30 w-full px-4 ${
					isSticky ? "pt-7" : "pt-2"
				} pb-4 flex items-center justify-between transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold">
					{userType === "creator" ? "User's Feedbacks" : "Order History"}
				</h1>
				{userType !== "creator" && (
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
				)}
			</div>
			{userType !== "creator" && (
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
			)}
			{userType !== "creator" ? (
				historyType === "Calls" ? (
					<CallListMobile />
				) : (
					<ChatList />
				)
			) : (
				<CreatorCallsFeedbacks />
			)}
		</section>
	);
};

export default PreviousPage;
