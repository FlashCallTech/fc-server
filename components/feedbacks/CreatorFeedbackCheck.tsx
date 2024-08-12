"use client";

import React, { useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { UserFeedback } from "@/types";
import { Rating } from "@smastrom/react-rating";
import Image from "next/image";

const CreatorFeedbackCheck = ({ feedback }: { feedback: UserFeedback }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const toggleReadMore = () => {
		setIsExpanded(!isExpanded);
	};

	let dummyFeedback =
		"Lorem ipsum dolor sit amet consectetur adipisicing elit. Culpa consequuntur ducimus repellendus non nam, laboriosam et ullam veniam? Voluptatum laboriosam mollitia expedita fugit iste repellendus suscipit nostrum. Inventore repudiandae, quibusdam voluptatibus facere minus officiis tenetur, obcaecati quos assumenda similique commodi magni maxime nobis suscipit distinctio eaque quisquam vel omnis. Eos, temporibus odit! Odit mollitia dolores repudiandae, pariatur magni dolorem, vel necessitatibus, beatae sequi aut iste culpa doloribus. Ab iusto quaerat officiis, id maxime ratione voluptatum quasi ex voluptas beatae ipsam et quo quia esse facilis quibusdam inventore error, magnam atque totam tenetur. Sed, vel delectus voluptatum earum autem quia inventore!";

	return (
		<div className="flex items-center justify-start w-full">
			<div className="flex flex-col gap-2 items-start justify-center w-full">
				<Rating
					style={{ maxWidth: 150, fill: "white" }}
					value={feedback.rating}
					items={5}
					spaceBetween="medium"
					transition="zoom"
					readOnly
				/>
				<div className="pl-1 flex flex-col items-start justify-start gap-2 w-full h-full overflow-scroll no-scrollbar">
					<span
						className={`no-scrollbar pl-1 ${
							isExpanded
								? "whitespace-pre-wrap overflow-x-hidden max-h-[150px]"
								: "text-ellipsis whitespace-nowrap overflow-x-hidden max-w-[95%]"
						}`}
					>
						{feedback.feedback}
					</span>
					{!isExpanded && feedback.feedback.length > 100 && (
						<button onClick={toggleReadMore} className="text-green-1 text-sm">
							Read More
						</button>
					)}
					{isExpanded && (
						<button onClick={toggleReadMore} className="text-red-500 text-sm">
							Show Less
						</button>
					)}
					<div className="flex items-center justify-start w-full gap-2 pt-2">
						<div className="flex items-center justify-start gap-2">
							<Image
								src={
									feedback?.clientId?.photo || "/images/defaultProfileImage.png"
								}
								alt={feedback?.clientId?.username}
								width={44}
								height={44}
								className="w-5 h-5 rounded-full"
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
							/>

							<span className="text-xs">{feedback?.clientId?.username}</span>
						</div>
						<span className="text-xs">|</span>
						<span className="text-xs">
							{formatDateTime(feedback?.createdAt).dateTime}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreatorFeedbackCheck;
