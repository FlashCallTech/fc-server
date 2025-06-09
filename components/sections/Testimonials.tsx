import React, { useState } from "react";
import Image from "next/image";
import { feedbacks } from "@/constants";

const Testimonials = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);

	const handlePrev = () => {
		triggerAnimation(() => {
			setCurrentIndex((prevIndex) =>
				prevIndex === 0 ? feedbacks.length - 1 : prevIndex - 1
			);
		});
	};

	const handleNext = () => {
		triggerAnimation(() => {
			setCurrentIndex((prevIndex) =>
				prevIndex === feedbacks.length - 1 ? 0 : prevIndex + 1
			);
		});
	};

	const triggerAnimation = (callback: any) => {
		setIsAnimating(true);
		setTimeout(() => {
			callback();
			setIsAnimating(false);
		}, 300);
	};

	const currentFeedback = feedbacks[currentIndex];

	return (
		<div
			className={`relative flex flex-col gap-4 md:gap-8 items-center justify-center py-14 md:py-20 md:px-14 lg:px-24 max-md:px-4 bg-gradient-to-r from-[#ecf5de] via-white to-[#dff7fb]`}
		>
			<div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
			<div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none"></div>

			{/* Ratings */}
			<div className="flex items-center justify-center">
				{Array.from({ length: 5 }, (_, i) => {
					const fullStars = Math.floor(currentFeedback.ratings);
					const hasHalfStar = currentFeedback.ratings - fullStars >= 0.5;

					let fillColor = "#f0f0f0";
					let isHalf = false;

					if (i < fullStars) {
						fillColor = "#FBBF24"; // full star
					} else if (i === fullStars && hasHalfStar) {
						isHalf = true;
					}

					return (
						<svg
							key={i}
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							className="h-6 w-6 md:h-7 md:w-7"
							fill={isHalf ? "url(#halfGradient)" : fillColor}
							stroke="none"
						>
							{isHalf && (
								<defs>
									<linearGradient id="halfGradient">
										<stop offset="50%" stopColor="#FBBF24" />
										<stop offset="50%" stopColor="#f0f0f0" />
									</linearGradient>
								</defs>
							)}
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 
             5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
							/>
						</svg>
					);
				})}
			</div>

			{/* Feedback Heading */}

			<blockquote
				className={`text-center text-[#0F0F0F] text-lg md:text-xl max-w-2xl font-semibold leading-relaxed transition-opacity duration-300 `}
			>
				“{currentFeedback.title}”
			</blockquote>

			{/* Feedback Text with Fade Animation */}
			<blockquote
				className={`text-center text-[#0F0F0F] text-base md:text-xl max-w-2xl  leading-relaxed transition-opacity duration-300 ${
					isAnimating ? "opacity-0" : "opacity-100"
				}`}
			>
				“{currentFeedback.feedback}”
			</blockquote>

			{/* User Information with Fade Animation */}
			<div
				className={`flex flex-col items-center transition-opacity duration-300 ${
					isAnimating ? "opacity-0" : "opacity-100"
				}`}
			>
				<Image
					src={currentFeedback.imageURL}
					alt={currentFeedback.username}
					width={500}
					height={500}
					className="rounded-full size-[60px] object-cover shadow-lg"
				/>
				<p className="text-lg font-semibold mt-4">{currentFeedback.username}</p>
			</div>

			{/* Slider Navigation */}
			<div className="flex items-center gap-4 mt-2">
				<button
					className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
					onClick={handlePrev}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						className="w-5 h-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<button
					className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition"
					onClick={handleNext}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						className="w-5 h-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
};

export default Testimonials;
