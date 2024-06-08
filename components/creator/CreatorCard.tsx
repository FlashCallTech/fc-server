import React from "react";
import { creatorUser } from "@/types";
import CallingOptions from "../calls/CallingOptions";
import CreatorDetails from "./CreatorDetails";
import UserReviews from "./UserReviews";

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
			<div className="flex flex-col gap-10 items-center ">
				{/* Calling Options */}
				<CallingOptions creator={creator} />
				{/* User Reviews */}
				<UserReviews theme={creator.themeSelected} />
			</div>
		</section>
	);
};

export default CreatorCard;
