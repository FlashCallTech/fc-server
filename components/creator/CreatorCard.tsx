"use client";

import React, { useEffect, useState } from "react";
import { creatorUser } from "@/types";
import CallingOptions from "../calls/CallingOptions";
import CreatorDetails from "./CreatorDetails";
import UserReviews from "./UserReviews";
import axios from "axios";

interface CreatorCardProps {
	creator: creatorUser;
}

const CreatorCard = ({ creator }: CreatorCardProps) => {
	const [creatorFeedback, setCreatorFeedback] = useState<any>([]);
	const [loading, setLoading] = useState(true);

	const getCreatorFeedback = async () => {
		try {
			const response = await axios.get(
				`/api/v1/feedback/creator/selected?creatorId=${creator._id}`
			);

			setCreatorFeedback(response.data.feedbacks);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getCreatorFeedback();
	}, [creator._id]);

	const backgroundImageStyle = {
		backgroundImage: `url(/images/grid.png)`,
		backgroundSize: "contain",
		backgroundPosition: "top",
		width: "100%",
		zIndex: 0,
	};

	return (
		<section
			key={creator._id}
			className="w-full xl:mx-auto grid grid-cols-1 gap-7 items-start text-center justify-center h-[50%] lg:h-[70%] 3xl:[80%]"
			style={backgroundImageStyle}
		>
			{/* User Details */}
			<CreatorDetails creator={creator} />

			{/* Calling Options & User Reviews */}
			<div className="flex flex-col gap-10 items-center">
				{/* Calling Options */}
				<CallingOptions creator={creator} />
				{/* User Reviews */}
				<UserReviews
					theme={creator.themeSelected}
					creatorFeedback={creatorFeedback[0]?.feedbacks}
					loading={loading}
				/>
			</div>
		</section>
	);
};

export default CreatorCard;
