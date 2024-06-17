"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { avatarImages } from "@/constants";
import { usePathname } from "next/navigation";
import FeedbackCheck from "../feedbacks/FeedbackCheck";

interface MeetingCardProps {
	title: string;
	date: string;
	icon: string;
	callId: string;
}

const MeetingCard = ({ icon, title, date, callId }: MeetingCardProps) => {
	const pathname = usePathname();
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
					"flex flex-col sm:flex-row items-start justify-center sm:items-center relative gap-7 pt-5"
				)}
			>
				<div className="relative flex w-full max-xs:hidden">
					{avatarImages.map((img, index) => (
						<Image
							key={index}
							src={img}
							alt="attendees"
							width={40}
							height={40}
							className={cn("rounded-full", { absolute: index > 0 })}
							style={{ top: 0, left: index * 28 }}
						/>
					))}
					<div className="flex items-center justify-center absolute left-[136px] size-10 rounded-full border-[5px] border-dark-3 bg-dark-4">
						+5
					</div>
				</div>
				<FeedbackCheck callId={callId} />
			</article>
		</section>
	);
};

export default MeetingCard;
