"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import FeedbackCheck from "../feedbacks/FeedbackCheck";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface MeetingCardProps {
	title: string;
	date: string;
	icon: string;
	callId: string;
	members: Array<any>;
}

const MeetingCard = ({
	icon,
	title,
	date,
	callId,
	members,
}: MeetingCardProps) => {
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(true);

	const expert = members?.find((member) => member.custom.type === "expert");
	const client = members?.find((member) => member.custom.type === "client");

	const users = [expert, client];

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 2000); // Set the loading time to 2 seconds

		return () => clearTimeout(timer);
	}, []);

	return (
		<section
			className={`flex min-h-[258px] w-full flex-col justify-between rounded-[14px] px-5 py-8 xl:max-w-[568px] bg-green-1 ${
				pathname.includes("/profile") && "mx-auto"
			}`}
		>
			<article className="flex flex-col gap-5">
				<Image
					src={icon}
					alt="upcoming"
					width={28}
					height={28}
					className="invert-1 brightness-200"
				/>
				<div className="flex justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="text-2xl font-bold">{title}</h1>
						<p className="text-base font-normal">{date}</p>
					</div>
				</div>
			</article>
			<article
				className={cn(
					"flex flex-col sm:flex-row items-start justify-center sm:items-center sm:justify-between relative gap-7 pt-5"
				)}
			>
				{isLoading ? (
					<div className="flex items-center space-x-4 sm:w-1/2 w-full animate-pulse">
						<div className="flex-1 space-y-4 py-1">
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-4">
									<div className="h-2 bg-slate-300 rounded col-span-2"></div>
									<div className="h-2 bg-slate-300 rounded col-span-1"></div>
								</div>
								<div className="h-2 bg-slate-300 rounded w-full"></div>
							</div>
						</div>
					</div>
				) : (
					<div className="relative animate-enterFromBottom flex w-fit items-start justify-center gap-4 max-xs:hidden">
						{users.map((member, index) => (
							<Tooltip key={member?.user?.name}>
								<TooltipTrigger asChild>
									<article
										key={index}
										className="flex items-center justify-center gap-2 rounded-xl px-3 pl-1 py-1 cursor-pointer"
									>
										<img
											src={member?.user?.image}
											alt="attendees"
											className={
												"rounded-full w-10 h-10 shadow-md object-cover shadow-black/20"
											}
											onError={(e) => {
												e.currentTarget.src = "/images/defaultProfileImage.png";
											}}
										/>
										<div className="flex flex-col w-full">
											<span className="text-xs tracking-wider">
												{member?.user?.name ? member?.user?.name : "Guest"}
											</span>
											<span className="text-[10px]">
												{member?.custom?.type
													? member?.custom?.type
													: "Unknown"}
											</span>
										</div>
									</article>
								</TooltipTrigger>
								<TooltipContent>
									<p className="text-black">
										{member?.custom?.type ? member?.custom?.type : "Unknown"}
									</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				)}
				<FeedbackCheck callId={callId} />
			</article>
		</section>
	);
};

export default MeetingCard;
