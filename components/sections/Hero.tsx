"use client";

// section 1

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Rating, ThinStar } from "@smastrom/react-rating";

const customStyles = {
	itemShapes: ThinStar,
	activeBoxColor: ["#e7040f", "#ff6300", "#ffde37", "#61bb00", "#19a974"],
	inactiveBoxColor: "#C7C7C7",
	activeFillColor: "white",
};

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 584);
	};

	useEffect(() => {
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const Hero = () => {
	const isMobile = useScreenSize();

	return (
		<section
			className="w-full h-fit pt-10 pb-10 md:pb-20 bg-gradient-to-r from-[#ecf5de] via-white to-[#dff7fb] max-md:px-4"
			style={{
				maskImage: !isMobile
					? "linear-gradient(to bottom, white 90%, transparent 100%)"
					: "",
				WebkitMaskImage: !isMobile
					? "linear-gradient(to bottom, white 90%, transparent 100%)"
					: "",
			}}
		>
			<div className="grid grid-cols-1 gap-14 items-center md:px-14 lg:px-24">
				<div className="w-full md:max-w-[80%] mx-auto flex flex-col items-center justify-center gap-7 text-center">
					{/* heading and content */}
					<h1 className="text-3xl md:text-4xl font-semibold !leading-snug">
						Make your own app and Start earning with pay-per-min chats.
					</h1>
					<span className="text-xl text-[#4B4B57] leading-relaxed">
						Join 1000+ people who are earning upto 10 Lakhs a month just by
						talking to their followers. Stop worrying about scheduling calls or
						collecting payments, flashcall handles everything for you.
					</span>

					<div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="https://play.google.com/store/apps/details?id=com.flashcall.me&hl=en_IN"
							target="_black"
							className="w-full max-w-[75%] sm:max-w-[180px] flex items-center justify-center text-center gap-2 bg-black text-white rounded-full px-5 py-[15px] hoverScaleDownEffect"
						>
							Get Your Link
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								className="size-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
								/>
							</svg>
						</Link>
						<Link
							href="https://play.google.com/store/apps/details?id=com.flashcall.me&hl=en_IN"
							className="w-full max-w-[75%] sm:max-w-[180px] flex items-center justify-center text-center border border-black rounded-full px-5 py-[15px] hoverScaleDownEffect"
						>
							Download the app
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 items-center gap-10">
					{/* expert consultation */}
					<div className="w-full bg-white rounded-2xl p-5 flex flex-col gap-2.5 md:max-w-[300px] mx-auto items-start justify-center">
						<p className="text-lg font-bold">Expert Consultations Made Easy</p>
						<span className="text-sm text-[#4B4B57]">
							Get personalized consultations via video, audio, or chat. Pay only
							for the minutes you use.
						</span>
						<div className="w-full flex items-center justify-between">
							<div className="flex items-center">
								{["person1", "person2", "person3"].map((person, index) => (
									<Image
										key={index}
										src={`/web/images/${person}.png`}
										alt="User"
										width={100}
										height={100}
										className={`rounded-full size-[44px] object-cover`}
										style={{
											marginLeft: index === 0 ? 0 : `-${10}px`,
											border: index === 0 ? "none" : "2.5px solid white",
										}}
									/>
								))}
							</div>
							<div className="flex flex-col items-start justify-center">
								<p className="text-2xl font-bold">50K</p>
								<span className="text-sm text-[#4B4B57]">Active Users</span>
							</div>
						</div>
					</div>
					{/* banner */}
					<Image
						src="/web/images/heroSection.png"
						alt="logo"
						width={1000}
						height={1000}
						className="rounded-xl w-full h-full max-h-[480px] object-contain"
						priority
						style={{
							maskImage: isMobile
								? "linear-gradient(to bottom, white 80%, transparent 100%)"
								: "",
							WebkitMaskImage: isMobile
								? "linear-gradient(to bottom, white 80%, transparent 100%)"
								: "",
						}}
					/>

					{/* more content */}
					<div className="self-start w-full bg-white rounded-2xl p-5 flex flex-col gap-2.5 md:max-w-[300px] mx-auto items-start justify-center">
						{/* Rating */}
						<div className="flex gap-1 items-center">
							<Rating
								style={{
									maxWidth: 120,
									fill: "white",
									marginLeft: "-5px",
								}}
								value={5}
								items={5}
								itemStyles={customStyles}
								halfFillMode="box"
								spaceBetween="small"
								transition="zoom"
								readOnly
							/>
						</div>
						<p className="text-lg font-bold">Amazing App!</p>
						<span className="text-sm text-[#4B4B57]">
							Flashcall has transformed my consulting business with seamless
							video calls. Highly recommend it!
						</span>
						<p className="text-xs text-[#0F0F0F]">Rajesh Gupta</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
