import { CreatorFeedback } from "@/types";
import { Rating } from "@smastrom/react-rating";
import React, { useState, useRef } from "react";
import Slider from "react-slick";

const ReviewSlider = ({
	creatorFeedbacks,
	getClampedText,
	isExpanded,
	setIsExpanded,
	toggleReadMore,
}: {
	creatorFeedbacks: CreatorFeedback[];
	getClampedText: (text: string) => string;
	isExpanded: boolean;
	setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
	toggleReadMore: () => void;
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef<Slider>(null);
	const dummyFeedbacks = ["1", "2", "3", "4", "5", "6", "7"];
	// Carousel settings
	const settings = {
		infinite: creatorFeedbacks.length > 1,
		centerPadding: "60px",
		slidesToShow: 1,
		speed: 500,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 5000,
		arrows: false,
		beforeChange: (oldIndex: number, newIndex: number) => {
			setCurrentIndex(newIndex);
			setIsExpanded(false);
		},
	};

	let dummyFeedback =
		"Lorem ipsum dolor sit amet consect adipisicing elit. Culpa consequuntur ducimus repellendus non nam, laboriosam et ullam veniam? Voluptatum laboriosam mollitia expedita fugit iste repellendus suscipit nostrum. Inventore repudiandae, quibusdam voluptatibus facere minus officiis tenetur, obcaecati quos assumenda similique commodi magni maxime nobis suscipit distinctio eaque quisquam vel omnis. Eos, temporibus odit! Odit mollitia dolores repudiandae, pariatur magni dolorem, vel necessitatibus, beatae sequi aut iste culpa doloribus. Ab iusto quaerat officiis, id maxime ratione voluptatum quasi ex voluptas beatae ipsam et quo quia esse facilis quibusdam inventore error, magnam atque totam tenetur. Sed, vel delectus voluptatum earum autem quia inventore!";

	return (
		<>
			<Slider {...settings} ref={sliderRef} className="py-7">
				{creatorFeedbacks.map((feedback, index) => (
					<div
						className="flex flex-col items-center justify-center px-4 cursor-grabbing"
						key={index}
					>
						<div className={`flex flex-col items-center justify-center`}>
							{/* Profile Image */}
							<div className="flex w-fit mx-auto rounded-full items-center justify-center  bg-black py-1 px-2 z-10">
								<img
									src={
										feedback?.clientId?.photo ||
										"/images/defaultProfileImage.png"
									}
									alt={`${feedback?.clientId?.username} profile`}
									width={24}
									height={24}
									className="w-8 h-8 rounded-full object-cover"
									onError={(e) => {
										e.currentTarget.src = "/images/defaultProfileImage.png";
									}}
								/>
								<span className="text-3xl -mr-1">😍</span>
							</div>

							{/* feedback section */}
							<div className="flex flex-col items-start justfy-center gap-4 w-full rounded-[24px] px-5 pb-5 pt-10 -mt-4 bg-black/10 border-x border-b-2 border-white/50">
								{/* Rating */}
								<div className="flex gap-1 items-center">
									<Rating
										style={{
											maxWidth: 180,
											fill: "white",
											marginLeft: "-10px",
										}}
										value={Math.floor(feedback?.rating)}
										items={5}
										spaceBetween="medium"
										transition="zoom"
										readOnly
									/>
								</div>

								{/* Feedback */}

								<div className="pl-1 flex flex-col items-start justify-start gap-2 w-full h-full overflow-hidden -ml-1 min-h-[4rem]">
									<span
										className={`text-start block ${
											isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
										} ${
											isExpanded
												? "overflow-y-scroll no-scrollbar"
												: "overflow-hidden"
										}`}
										style={{ maxHeight: isExpanded ? "10rem" : "7rem" }}
									>
										{getClampedText(feedback?.feedback)}
										{!isExpanded && feedback?.feedback?.length > 100 && (
											<span className="text-white">
												<button
													onClick={toggleReadMore}
													className="underline underline-offset-2 hover:opacity-80"
												>
													Read more
												</button>
											</span>
										)}
									</span>

									{isExpanded && (
										<button
											onClick={toggleReadMore}
											className="text-red-400 hover:opacity-80 text-sm font-bold mt-2"
										>
											Show Less
										</button>
									)}
								</div>

								{/* User Details */}
								<div className="flex flex-col items-start justify-center gap-1">
									{feedback?.clientId?.username ? (
										<p className="text-sm font-semibold">
											{feedback?.clientId?.username}
										</p>
									) : (
										<p className="text-sm font-semibold">
											{feedback?.clientId?.phone?.replace(
												/(\+91)(\d+)/,
												(match, p1, p2) =>
													`${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
											)}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				))}
			</Slider>
			{/* navigation */}
			{creatorFeedbacks?.length > 1 && (
				<div className="flex items-center justify-center w-full">
					<div className="flex gap-2 items-center max-w-[75%] md:max-w-[85%] py-[0.75px] overflow-x-scroll no-scrollbar bg-black/10 rounded-xl">
						{creatorFeedbacks?.map((_, index) => (
							<button
								key={index}
								className={`${
									index === currentIndex
										? "!bg-[#F6B656]"
										: "opacity-0 hover:opacity-100"
								} w-10 h-1 rounded-xl flex items-center justify-center hoverScaleEffect hover:bg-black/20`}
								onClick={() => {
									sliderRef.current?.slickGoTo(index);
								}}
							/>
						))}
					</div>
				</div>
			)}
		</>
	);
};

export default ReviewSlider;
