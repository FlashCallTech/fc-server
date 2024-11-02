"use client";

import Blocked from "@/components/client/Blocked";
import ClientList from "@/components/client/ClientList";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

const BlockedClients = () => {
	const [clientListType, setClientListType] = useState<"All" | "Blocked">(
		"Blocked"
	);
	const options: ("Blocked" | "All")[] = ["Blocked", "All"];

	return (
		<section className="flex size-full flex-col gap-2 pb-5">
			<section
				className={`sticky top-0 md:top-[76px] bg-white z-30 w-full p-4 flex flex-wrap gap-2.5 items-center justify-between transition-all duration-300`}
			>
				<h1 className="text-3xl font-bold">{clientListType} Clients</h1>
				<div className="flex items-center justify-center w-fit gap-2">
					{options.map((option) => (
						<Button
							key={option}
							className={`text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 transition-transform duration-300 hover:text-white hover:bg-green-1 hover:scale-105 ${
								clientListType === option && "bg-green-1 text-white"
							}`}
							onClick={() => setClientListType(option)}
						>
							{option}
						</Button>
					))}
				</div>
			</section>
			{clientListType === "Blocked" ? <Blocked /> : <ClientList />}
		</section>
	);
};

export default BlockedClients;
