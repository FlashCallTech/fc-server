import React from "react";
import { creatorUser } from "@/types";
import UserReviews from "./UserReviews";
import { usePathname } from "next/navigation";
import { audio, chat, sparkles, video } from "@/constants/icons";
import CallingOptions from "./CallingOptions";
import CreatorDetails from "./CreatorDetails";

interface CreatorCardProps {
	creator: creatorUser;
}

const CreatorCard = ({ creator }: CreatorCardProps) => {
	return (
		<section
			key={creator._id}
			className="w-full xl:mx-auto h-full grid grid-cols-1 gap-10 items-start text-center justify-center"
		>
			{/* User Details */}
			<CreatorDetails creator={creator} />

			{/* Calling Options & User Reviews */}
			<div className="flex flex-col gap-7 items-center ">
				{/* Calling Options */}
				<CallingOptions creator={creator} />
				{/* User Reviews */}
				<UserReviews theme={creator.themeSelected} />
			</div>
		</section>
	);
};

export default CreatorCard;
