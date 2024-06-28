"use client";

import { formatDateTime } from "@/lib/utils";
import { RegisterCallParams } from "@/types";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import ContentLoading from "../shared/ContentLoading";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import SinglePostLoader from "../shared/SinglePostLoader";
import FeedbackCheck from "../feedbacks/FeedbackCheck";

const CallListMobile = () => {
	const [calls, setCalls] = useState<RegisterCallParams[]>([]);
	const [callsCount, setCallsCount] = useState(6);
	const [loading, setLoading] = useState(true);
	const { user } = useUser();
	const pathname = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - 2
			) {
				setCallsCount((prevCount) => prevCount + 6);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	useEffect(() => {
		const getCalls = async () => {
			try {
				const response = await fetch(
					`/api/v1/calls/getUserCalls?userId=${String(
						user?.publicMetadata?.userId
					)}`
				);
				const data = await response.json();
				setCalls(data);
			} catch (error) {
				console.warn(error);
			} finally {
				setTimeout(() => {
					setLoading(false);
				}, 1000);
			}
		};

		getCalls();
	}, [user]);

	const visibleCalls = calls.slice(0, callsCount);

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<>
			{calls && calls.length > 0 ? (
				<section
					className={`grid grid-cols-1 ${
						calls.length > 0 && "xl:grid-cols-2 3xl:grid-cols-3"
					} items-center gap-5 xl:gap-10 w-full h-fit text-black px-4`}
				>
					{visibleCalls.map((call, index) => {
						const formattedDate = formatDateTime(call.startedAt as Date);
						return (
							<div
								key={index}
								className={`flex h-full w-full items-start justify-between py-2 xl:max-w-[568px] border-b xl:border xl:rounded-xl xl:p-4 xl:shadow-md border-gray-300  ${
									pathname.includes("/profile") && "mx-auto"
								}`}
							>
								<div className="flex flex-col items-start justify-start w-full gap-2">
									{/* Expert's Details */}
									<Link
										href={`/creator/${call.members[0].user_id}`}
										className="w-1/2 flex items-center justify-start gap-4 hoverScaleDownEffect"
									>
										{/* creator image */}
										<Image
											src={call.members[0].custom.image}
											alt="Expert"
											height={1000}
											width={1000}
											className="rounded-full w-12 h-12 object-cover"
										/>
										{/* creator details */}
										<div className="flex flex-col">
											<p className="text-base tracking-wide">
												{call.members[0].custom.name}
											</p>
											<span className="text-sm text-green-1">Astrologer</span>
										</div>
									</Link>
									{/* call details */}
									<div className="flex items-center justify-start gap-2">
										<span
											className={`text-sm ${
												call.status === "Ended"
													? "text-green-1"
													: "text-red-500"
											}`}
										>
											{call.status}
										</span>
										<span className="text-[12.5px]">
											{call.duration
												? `${(parseInt(call.duration, 10) / 60).toFixed(
														2
												  )} Minutes`
												: "Call Was Rejected"}
										</span>
									</div>
								</div>
								{/* StartedAt & Feedbacks */}
								<div className="w-1/2 flex flex-col items-end justify-center gap-2">
									<span className="text-sm text-[#A7A8A1] pr-1 whitespace-nowrap">
										{formattedDate.dateTime}
									</span>
									<FeedbackCheck callId={call?.callId} />
								</div>
							</div>
						);
					})}
				</section>
			) : (
				<div className="flex flex-col w-full items-center justify-center h-full gap-7">
					<ContentLoading />
					<h1 className="text-2xl font-semibold text-black">No Orders Yet</h1>
					<Link
						href="/"
						className={`flex gap-4 items-center p-4 rounded-lg justify-center bg-green-1 hover:opacity-80 mx-auto w-fit`}
					>
						<Image
							src="/icons/Home.svg"
							alt="Home"
							width={24}
							height={24}
							className="brightness-200"
						/>
						<p className="text-lg font-semibold text-white">Return Home</p>
					</Link>
				</div>
			)}
		</>
	);
};

export default CallListMobile;
