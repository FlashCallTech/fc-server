import { isValidUrl } from "@/lib/utils";
import { CreatorFeedback } from "@/types";
import GetRandomImage from "@/utils/GetRandomImage";
import { Rating } from "@smastrom/react-rating";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import Slider from "react-slick";

const ReviewSlider = ({
	creatorFeedbacks,
	getClampedText,
	isExpanded,
	setIsExpanded,
	toggleReadMore,
	theme,
	fetchNextPage,
	hasNextPage,
}: {
	creatorFeedbacks: CreatorFeedback[];
	getClampedText: (text: string) => string;
	isExpanded: boolean;
	setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
	toggleReadMore: () => void;
	theme?: string;
	fetchNextPage: () => void;
	hasNextPage: boolean;
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef<Slider>(null);

	const getImageSrc = (feedback: any) => {
		return isValidUrl(feedback?.clientId?.photo || "")
			? feedback?.clientId?.photo
			: GetRandomImage();
	};

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

		afterChange: (current: number) => {
			// Check if we need to fetch the next page
			if (hasNextPage && current === creatorFeedbacks.length - 1) {
				fetchNextPage(); // Trigger fetching the next page
			}
		},
	};

	useEffect(() => {
		// Find all elements with the .rr--on and .rr--svg classes and apply the theme color
		const ratingElements = document.querySelectorAll(".rr--on .rr--svg");
		const ratingOffElements = document.querySelectorAll(".rr--off .rr--svg");
		ratingElements.forEach((element: any) => {
			element.style.fill = theme;
			element.style.stroke = theme;
		});
		ratingOffElements.forEach((element: any) => {
			element.style.stroke = "none";
		});
	}, [theme]);

	let dummyFeedback =
		"Lorem ipsum dolor sit amet consect adipisicing elit. Culpa consequuntur ducimus repellendus non nam, laboriosam et ullam veniam? Voluptatum laboriosam mollitia expedita fugit iste repellendus suscipit nostrum. Inventore repudiandae, quibusdam voluptatibus facere minus officiis tenetur, obcaecati quos assumenda similique commodi magni maxime nobis suscipit distinctio eaque quisquam vel omnis. Eos, temporibus odit! Odit mollitia dolores repudiandae, pariatur magni dolorem, vel necessitatibus, beatae sequi aut iste culpa doloribus. Ab iusto quaerat officiis, id maxime ratione voluptatum quasi ex voluptas beatae ipsam et quo quia esse facilis quibusdam inventore error, magnam atque totam tenetur. Sed, vel delectus voluptatum earum autem quia inventore!";

	return (
		<>
			<Slider {...settings} ref={sliderRef} className="pt-4 pb-7">
				{creatorFeedbacks.map((feedback, index) => (
					<div
						className="flex flex-col size-full items-center justify-center cursor-grabbing"
						key={index}
					>
						<div
							className={`size-full flex flex-col items-center justify-center`}
						>
							{/* Profile Image */}
							<div
								className="flex w-[80px] height-[40px] mx-auto rounded-full items-center justify-center py-1 px-2 z-10"
								style={{ background: theme ? theme : "#ffffff" }}
							>
								<Image
									src={getImageSrc(feedback)}
									alt={`${feedback?.clientId?.username} profile`}
									width={100}
									height={100}
									className="w-8 h-8 rounded-full object-cover bg-white"
									onError={(e) => {
										e.currentTarget.src = "/images/defaultProfileImage.png";
									}}
								/>
								<span className="text-3xl -mr-1">😍</span>
							</div>

							{/* feedback section */}
							<div className="size-full flex flex-col items-start justify-between gap-4 w-full rounded-[24px] px-5 pb-5 pt-10 -mt-4 bg-black/10 border-b-2 border-white/50">
								<section className="size-full grid items-center gap-4">
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

									<div className="pl-1 flex flex-col items-start justify-start gap-2 w-full h-full overflow-hidden -ml-1 min-h-[4rem] max-h-[225px]">
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
								</section>
								{/* User Details */}
								<div className="flex flex-col items-start justify-center gap-1">
									{feedback?.clientId?.username ? (
										// Check if username starts with '+91'
										feedback.clientId.username.startsWith("+91") ? (
											<p className="text-sm font-semibold">
												{feedback.clientId.username.replace(
													/(\+91)(\d+)/,
													(match, p1, p2) =>
														`${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
												)}
											</p>
										) : (
											<p className="text-sm font-semibold">
												{feedback.clientId.username}
											</p>
										)
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
					<div className="flex items-center max-w-[100px] py-[0.75px] overflow-x-scroll no-scrollbar bg-[#7070703D] rounded-xl">
						{creatorFeedbacks?.map((_, index) => (
							<button
								key={index}
								className={`w-10 h-1 rounded-xl flex gap-2 items-center justify-center hover:!bg-white`}
								style={{
									background: index === currentIndex ? theme : "transparent",
								}}
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
