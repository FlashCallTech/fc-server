import React, { useRef, useState, useEffect } from "react";
import { CreatorFeedback } from "@/types";
import { Rating, ThinStar } from "@smastrom/react-rating";
import Slider from "react-slick";
import { getDisplayName } from "@/lib/utils";

// Custom hook to track screen size
const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 1280);
	};

	useEffect(() => {
		handleResize(); // Set initial value
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const ReviewSlider = ({
	creatorFeedbacks,
	fetchNextPage,
	hasNextPage,
}: {
	creatorFeedbacks: CreatorFeedback[];
	fetchNextPage: () => void;
	hasNextPage: boolean;
}) => {
	const isMobile = useScreenSize();
	const sliderRef = useRef<Slider>(null);
	const [expandedStates, setExpandedStates] = useState<Record<number, boolean>>(
		{}
	);

	const getClampedText = (text: string, isExpanded: boolean) => {
		if (!text) return;
		const charLen = 100;
		if (text.length > charLen && !isExpanded) {
			return text.slice(0, charLen) + "... ";
		}
		return text;
	};

	const toggleReadMore = (index: number) => {
		setExpandedStates((prevStates) => ({
			...prevStates,
			[index]: !prevStates[index],
		}));
	};

	// Carousel settings
	const settings = {
		infinite: creatorFeedbacks.length > 1,
		centerPadding: "60px",
		slidesToShow: isMobile ? 1 : 2,
		speed: 500,
		slidesToScroll: 1,
		rows: isMobile ? 2 : 1,
		slidesPerRow: 1,
		arrows: false,
		autoplay: true,
		autoplaySpeed: 5000,
		beforeChange: () => {
			setExpandedStates({});
		},
		afterChange: (current: number) => {
			if (hasNextPage && current === creatorFeedbacks.length - 1) {
				fetchNextPage();
			}
		},
	};

	const customStyles = {
		activeFillColor: "#f59e0b",
		inactiveFillColor: "#ffedd5",
	};

	return (
		<>
			<Slider {...settings} ref={sliderRef} className="py-4">
				{creatorFeedbacks.map((feedback, index) => {
					const isExpanded = expandedStates[index] || false;
					const fullName = getDisplayName(feedback.clientId);
					return (
						<div
							className="flex flex-col size-full items-center justify-center cursor-grabbing px-2"
							key={index}
						>
							<div
								className={`size-full flex flex-col items-center justify-center`}
							>
								{/* feedback section */}
								<div className="size-full flex flex-col items-start justify-between gap-4 w-full rounded-[24px] m-2 p-4 border-2 border-gray-300 overflow-hidden">
									<section className="size-full grid items-center gap-4">
										{/* Rating */}
										<div className="flex gap-1 items-center custom-rating">
											<Rating
												style={{
													maxWidth: 120,
													fill: "white",
													marginLeft: "-5px",
												}}
												value={Math.floor(feedback?.rating)}
												items={5}
												spaceBetween="medium"
												transition="zoom"
												readOnly
											/>
										</div>

										{/* Feedback */}

										<div className="text-sm pl-1 flex flex-col items-start justify-start gap-2 w-full h-full overflow-scroll no-scrollbar -ml-1 min-h-[4rem] max-h-[225px]">
											<span
												className={`text-[#121319] text-start block ${
													isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
												} ${
													isExpanded
														? "overflow-y-scroll no-scrollbar"
														: "overflow-hidden"
												}`}
											>
												{feedback?.feedback
													? getClampedText(feedback.feedback, isExpanded)
													: "No feedback provided"}
												{feedback?.feedback &&
													!isExpanded &&
													feedback.feedback.length > 100 && (
														<span className="font-semibold">
															<button
																onClick={() => toggleReadMore(index)}
																className="text-sm hover:opacity-80"
															>
																Read more
															</button>
														</span>
													)}
											</span>

											{isExpanded && (
												<button
													onClick={() => toggleReadMore(index)}
													className="text-sm font-semibold hoverScaleDownEffect mt-2"
												>
													Show Less
												</button>
											)}
										</div>
									</section>
									{/* User Details */}
									<div className="flex flex-col items-start justify-center gap-1 text-sm font-medium text-[#12131999]">
										{fullName}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</Slider>
		</>
	);
};

export default ReviewSlider;
