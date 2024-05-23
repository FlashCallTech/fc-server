import { feedbacks } from "@/constants";
import React from "react";
import { Rating } from "@smastrom/react-rating";
import {
	HappyFace,
	NeutralFace,
	SadFace,
	SmilingFace,
} from "@/constants/icons";

const customStyles = {
	itemShapes: [SadFace, NeutralFace, NeutralFace, SmilingFace, HappyFace],
	activeFillColor: ["#ff3300", "#ffcc00", "#ffcc00", "#79ff4d", "#00cc99"],
	inactiveFillColor: "#a8a8a8",
};

const UserReviews = ({ theme }: any) => {
	return (
		<div className="flex overflow-x-scroll no-scrollbar items-center text-white  rounded-t-xl md:rounded-xl lg:w-[75%]">
			{feedbacks.map((feedback, index) => (
				<div
					key={index}
					className="min-w-full h-full grid grid-cols-1 gap-4 items-center text-center justify-center px-7 py-14"
					style={{ backgroundColor: theme }}
				>
					<h2 className="text-2xl font-semibold">Happy Client's</h2>
					<div className="relative flex flex-col items-center justify-center">
						{/* Profile Image */}
						<div className="flex w-fit mx-auto rounded-full items-center justify-center gap-2 bg-black px-4 py-2 z-10">
							<img
								src={feedback.imageURL}
								alt={`${feedback.username}'s profile`}
								width={24}
								height={24}
								className=" w-7 h-7 rounded-full object-cover"
							/>
							<span className="text-3xl">😍</span>
						</div>
						<div className="flex flex-col items-start justfy-center gap-4 w-full rounded-xl px-5 pb-5 pt-10 -mt-4 bg-black/10">
							{/* Rating */}
							<div className="flex gap-1 items-center">
								<Rating
									style={{ maxWidth: 150, fill: "white" }}
									value={Math.floor(feedback.ratings)}
									itemStyles={customStyles}
									items={5}
									spaceBetween="medium"
									transition="zoom"
									readOnly
								/>
							</div>

							{/* Feedback */}
							<p className="w-full h-[125px] overflow-y-scroll no-scrollbar text-start">
								{feedback.feedback}
							</p>

							{/* User Details */}
							<div className="flex flex-col items-start justify-center gap-1">
								<p className="text-lg font-semibold">{feedback.username}</p>
								<p className="text-sm font-semibold">{feedback.location}</p>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default UserReviews;
