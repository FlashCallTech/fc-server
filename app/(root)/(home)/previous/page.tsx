"use client";

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import ChatList from "@/components/calls/ChatList";

const PreviousPage = () => {
	const [historyType, setHistoryType] = useState<"Calls" | "Chats">("Calls");
	const [isSticky, setIsSticky] = useState(false);
	const options: ("Calls" | "Chats")[] = ["Calls", "Chats"];
	const stickyRef = useRef<HTMLDivElement>(null);

	const handleScroll = () => {
		if (stickyRef.current) {
			setIsSticky(window.scrollY > stickyRef.current.offsetTop);
		}
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<section className="flex size-full flex-col gap-2 pb-5 md:pb-14">
			<div
				ref={stickyRef}
				className={`sticky top-16 bg-white z-30 w-full px-4 ${
					isSticky ? "pt-7" : "pt-2"
				} pb-4 flex items-center justify-between transition-all duration-300`}
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
			</div>
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
			{historyType === "Calls" ? <CallListMobile /> : <ChatList />}
		</section>
	);
};

export default PreviousPage;
