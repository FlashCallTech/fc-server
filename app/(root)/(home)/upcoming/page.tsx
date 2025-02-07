"use client";

import { useState } from "react";
import ScheduledMeetingList from "@/components/availabilityServices/ScheduledMeetingList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import Image from "next/image";
import { serviceIconBold } from "@/constants/icons";

const UpcomingPage = () => {
	const creatorURL = localStorage.getItem("creatorURL");
	const { currentUser, userType, fetchingUser } = useCurrentUsersContext();
	const [historyType, setHistoryType] = useState<
		"All" | "Audio" | "Video" | "Chat"
	>("All");

	const [listType, setListType] = useState<"Upcoming" | "Previous">("Upcoming");

	const listOptions: ("Upcoming" | "Previous")[] = ["Upcoming", "Previous"];

	const options: ("All" | "Audio" | "Video" | "Chat")[] = [
		"All",
		"Audio",
		"Video",
		"Chat",
	];
	return (
		<section className="h-[calc(100vh-6rem)] flex size-full flex-col gap-2 pb-5">
			<section
				className={`sticky top-0 lg:top-[76px] bg-white z-30 w-full p-4  pb-4 flex items-center justify-between transition-all duration-300`}
			>
				<section
					className={`flex items-center justify-start gap-4 ${
						userType === "creator" && "lg:hidden"
					} text-xl font-bold`}
				>
					<Link href={`${creatorURL ? creatorURL : "/home"}`}>
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
					<h1 className="text-xl md:text-2xl font-bold">Upcoming Calls</h1>

					<div className="hidden xl:flex items-center justify-center w-fit gap-2">
						{listOptions.map((option) => (
							<Button
								key={option}
								className={`text-sm font-medium px-4 py-2 rounded-full border border-gray-300 hover:text-white hover:bg-black hoverScaleDownEffect flex items-center gap-2 ${
									listType === option && "bg-black text-white"
								}`}
								onClick={() => setListType(option)}
							>
								{option}
							</Button>
						))}
					</div>
				</section>

				<div className="hidden xl:flex items-center justify-center w-fit gap-2">
					{options.map((option) => (
						<Button
							key={option}
							className={`text-sm font-medium px-4 py-2 rounded-full border border-gray-300 hover:text-white hover:bg-black hoverScaleDownEffect flex items-center gap-2 ${
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
				{listOptions.map((option) => (
					<Button
						key={option}
						className={`text-sm font-medium px-[20px] py-[7px] rounded-full border border-gray-300 hoverScaleDownEffect hover:text-white hover:bg-black flex items-center gap-2 ${
							listType === option && "bg-black text-white"
						}`}
						onClick={() => setListType(option)}
					>
						{option}
					</Button>
				))}
			</div>

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

			{!fetchingUser ? (
				currentUser ? (
					<ScheduledMeetingList callType={historyType} listType={listType} />
				) : (
					<div className="size-full mt-4 md:mt-10 xl:mt-12 flex flex-col gap-2 items-center justify-center  text-center">
						<div className="bg-black/10 size-20 rounded-full flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-[35px]"
							>
								<path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
								<path
									fillRule="evenodd"
									d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
									clipRule="evenodd"
								/>
							</svg>
						</div>

						<p className="mt-2.5 font-bold text-lg text-[#111827]">
							No Calls Scheduled
						</p>
						<span className="text-base text-[#6B7280]">
							Authenticate to see your upcoming calls here
						</span>

						{userType === "creator" && (
							<Link
								href="/service-management"
								className="flex items-center mt-2 gap-2 px-6 py-3 bg-black text-white rounded-full hoverScaleDownEffect"
							>
								<section className="flex items-center justify-center text-sm sm:text-base">
									Add/Manage you services
								</section>
							</Link>
						)}

						<div className="w-full px-4 flex items-start text-center justify-center text-sm text-[#6B7280] mt-2 gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="size-4 text-black self-start hidden md:block"
							>
								<path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
								<path
									fillRule="evenodd"
									d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z"
									clipRule="evenodd"
								/>
							</svg>
							<span className="text-xs">
								Tip: You can add multiple services like audio, video or chat
								sessions. Once clients book a service, you will see it here.
							</span>
						</div>
					</div>
				)
			) : (
				<section className={`w-full h-full flex items-center justify-center`}>
					<SinglePostLoader />
				</section>
			)}
		</section>
	);
};

export default UpcomingPage;
