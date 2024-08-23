"use client";
import React, { useEffect, useRef, useState } from "react";
import { Rating } from "@smastrom/react-rating";
import {
	HappyFace,
	NeutralFace,
	SadFace,
	SmilingFace,
	arrowLeft,
	arrowRight,
} from "@/constants/icons";
import SinglePostLoader from "../shared/SinglePostLoader";
import { CreatorFeedback } from "@/types";

const customStyles = {
	itemShapes: [SadFace, NeutralFace, NeutralFace, SmilingFace, HappyFace],
	activeFillColor: ["#ff3300", "#ffcc00", "#ffcc00", "#79ff4d", "#00cc99"],
	inactiveFillColor: "#a8a8a8",
};

const UserReviews = ({
	theme,
	creatorFeedback,
	loading,
}: {
	theme: string;
	creatorFeedback: Array<CreatorFeedback>;
	loading: boolean;
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const lastIndex = creatorFeedback?.length - 1;
	const [direction, setDirection] = useState("right");
	const [isHovering, setIsHovering] = useState(false);
	const sliderIntervalRef = useRef<any>(null);

	// Auto slider
	useEffect(() => {
		startAutoSlide();

		return () => {
			stopAutoSlide();
		};
	}, [currentIndex, isHovering]);

	const startAutoSlide = () => {
		if (sliderIntervalRef.current) {
			clearInterval(sliderIntervalRef.current);
		}

		if (creatorFeedback?.length > 1 && !isHovering) {
			sliderIntervalRef.current = setInterval(() => {
				setCurrentIndex((prev) => (prev + 1 > lastIndex ? 0 : prev + 1));
			}, 5000);
		}
	};

	const stopAutoSlide = () => {
		if (sliderIntervalRef.current) {
			clearInterval(sliderIntervalRef.current);
		}
	};

	const nextSlide = () => {
		setDirection("right");
		stopAutoSlide();

		setCurrentIndex((prev) => (prev + 1 > lastIndex ? 0 : prev + 1));
	};

	const previousSlide = () => {
		setDirection("left");
		stopAutoSlide();

		setCurrentIndex((prev) => (prev - 1 < 0 ? lastIndex : prev - 1));
	};

	const getSliderState = (feedbackIndex: number) => {
		if (feedbackIndex === currentIndex) return "active";
		else return "hidden";
	};

	if (loading)
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);

	return (
		<div
			className="flex overflow-x-scroll no-scrollbar items-center text-white w-full rounded-t-xl md:rounded-xl xl:w-[60%]"
			style={{ backgroundColor: theme }}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			{creatorFeedback?.map((feedback, index) => {
				const adjustedIndex =
					(index + creatorFeedback?.length) % creatorFeedback?.length;
				const slideState = getSliderState(adjustedIndex);

				let transitionClass = "";

				if (slideState === "active") {
					transitionClass =
						direction === "right"
							? "animate-enterFromRight"
							: "animate-enterFromLeft";
				} else {
					transitionClass =
						direction === "right"
							? "animate-exitToLeft"
							: "animate-exitToRight";
				}
				return (
					<div
						key={index + adjustedIndex}
						className={` ${slideState} relative`}
					>
						<h2 className="text-2xl font-semibold">Happy Client&apos;s</h2>
						<div
							className={`${transitionClass} flex flex-col items-center justify-center`}
						>
							{/* Profile Image */}
							<div className="flex w-fit mx-auto rounded-full items-center justify-center gap-2 bg-black px-4 py-2 z-10">
								<img
									src={
										feedback?.clientId?.photo ||
										"/images/defaultProfileImage.png"
									}
									alt={`${feedback?.clientId?.username} profile`}
									width={24}
									height={24}
									className="w-7 h-7 rounded-full object-cover"
									onError={(e) => {
										e.currentTarget.src = "/images/defaultProfileImage.png";
									}}
								/>
								<span className="text-3xl">😍</span>
							</div>
							<div className="flex flex-col items-start justfy-center gap-4 w-full rounded-xl px-5 pb-5 pt-10 -mt-4 bg-black/10">
								{/* Rating */}
								<div className="flex gap-1 items-center">
									<Rating
										style={{
											maxWidth: 180,
											fill: "white",
											marginLeft: "-10px",
										}}
										value={Math.floor(feedback.rating)}
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
									<p className="text-lg font-semibold">
										{feedback?.clientId?.username}
									</p>
									{/* <p className="text-sm font-semibold">
										{feedback.clientId.phone}
									</p> */}
								</div>
							</div>
						</div>

						{/* navigation arrow */}
						{creatorFeedback?.length > 1 && (
							<div className="flex items-center justify-evenly">
								<button
									className="bg-black/10 text-white w-10 h-10 rounded-full p-2 hoverScaleEffect hover:bg-black/50"
									onClick={previousSlide}
								>
									{arrowLeft}
								</button>
								<div className="flex gap-2 items-center max-w-[60%] md:max-w-[80%] py-2 overflow-x-scroll no-scrollbar">
									{creatorFeedback?.map((_, index) => (
										<button
											key={index}
											className={`${
												index === currentIndex && "!bg-black/50"
											} bg-black/10 w-5 h-5 rounded-full p-5 flex items-center justify-center hoverScaleEffect hover:bg-black/50`}
											onClick={() => setCurrentIndex(index)}
										>
											<span className="mx-auto">{index + 1}</span>
										</button>
									))}
								</div>
								<button
									className="bg-black/10 text-white w-10 h-10 rounded-full p-2 hoverScaleEffect hover:bg-black/50"
									onClick={nextSlide}
								>
									{arrowRight}
								</button>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default UserReviews;
