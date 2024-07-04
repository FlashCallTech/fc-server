"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import CallListMobile from "@/components/calls/CallListMobile";
import ChatList from "@/components/calls/ChatList";

const PreviousPage = () => {
	const [historyType, setHistoryType] = useState<"Calls" | "Chats">("Calls");
	const options: ("Calls" | "Chats")[] = ["Calls", "Chats"];

	return (
		<section className="flex size-full flex-col gap-2 pb-5 md:pb-14 ">
			<div className="sticky top-16 bg-white z-30 w-full px-4 py-4 pt-7 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Order History</h1>
				<div className="hidden xl:flex items-center justify-center w-fit gap-2">
					{options.map((option, index) => (
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
				{options.map((option, index) => (
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
