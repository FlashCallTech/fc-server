"use client";

// section 1

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Rating, ThinStar } from "@smastrom/react-rating";
import { clientUser, creatorUser } from "@/types";
import NavLoader from "../shared/NavLoader";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const customStyles = {
	itemShapes: ThinStar,
	activeBoxColor: ["#e7040f", "#ff6300", "#ffde37", "#61bb00", "#19a974"],
	inactiveBoxColor: "#C7C7C7",
	activeFillColor: "white",
};

const useScreenSize = () => {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			if (typeof window !== "undefined") {
				setIsMobile(window.innerWidth < 584);
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isMobile;
};

const CustomButton1 = ({ content }: { content: string }) => {
	const customText = content.split(" ")[0];
	const remainingText = content.split(" ").splice(1).join(" ");
	return (
		<div className="w-full flex items-center justify-center gap-1 text-lg font-semibold max-w-[280px] px-4 py-2.5 bg-white rounded-full shadow border-b-4 border-black/25">
			<span className="text-[#2C993D]">{customText}</span>
			<span>{remainingText}</span>
		</div>
	);
};

const Hero = ({
	userType,
	fetchingUser,
	currentUser,
}: {
	userType: string | null;
	fetchingUser: boolean;
	currentUser: clientUser | creatorUser | null;
}) => {
	const isMobile = useScreenSize();
	const [isModalOpen, setIsModalOpen] = useState(false);

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
				<div className="w-full mx-auto flex flex-col items-center justify-center gap-7 text-center">
					{/* heading and content */}
					<div className="flex flex-col items-center justify-center">
						<h1 className="text-3xl md:text-5xl font-semibold !leading-snug">
							Talk. Teach. Earn {" "}
						</h1>
						<span className="text-lg text-[#4B4B57] leading-relaxed">
							0% Commission for the first month
						</span>
					</div>

					<div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
						{
							<>
								{fetchingUser ? (
									<NavLoader />
								) : (
									<>
										{currentUser ? (
											<Link
												href={userType === "creator" ? "/home" : "/discover"}
												className="w-full max-w-[75%] sm:max-w-[180px] flex items-center justify-center text-center gap-2 bg-black text-white rounded-full px-5 py-[15px] hoverScaleDownEffect"
											>
												{userType === "creator"
													? "Explore"
													: "Connect With Creator"}
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
										) : (
											<Link
												href="/authenticate?usertype=creator"
												className="w-full max-w-[75%] sm:max-w-[180px] flex items-center justify-center text-center gap-2 bg-black text-white rounded-full px-5 py-[15px] hoverScaleDownEffect"
											>
												Creator Sign up
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
										)}
									</>
								)}

								<Dialog>
									<DialogTrigger asChild>
										<button className="w-full max-w-[75%] sm:max-w-[180px] flex items-center justify-center gap-2 text-center border border-black rounded-full px-5 py-[15px] hoverScaleDownEffect focus-visible:outline-none">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth={1.5}
												stroke="currentColor"
												className="size-6"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
												/>
											</svg>
											Watch Demo
										</button>
									</DialogTrigger>
									<DialogContent
										hideCloseButton={true}
										removePadding={true}
										className="max-w-3xl w-full"
									>
										<iframe
											width="100%"
											height="500"
											src="https://www.youtube.com/embed/KxjOpBRWgko?autoplay=1&controls=1"
											title="YouTube video player"
											frameBorder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
											className="rounded-lg w-full max-h-[80vh]"
										></iframe>
									</DialogContent>
								</Dialog>
							</>
						}
					</div>

					<div className="w-full hidden md:flex md:flex-row items-center justify-evenly gap-4 md:mt-20">
						<CustomButton1 content="Instant Withdrawl" />
						<CustomButton1 content="Run Campaigns" />
					</div>

					<div className="w-full grid grid-cols-1 md:grid-cols-3 items-start gap-10 md:gap-5 text-start mt-4 md:mt-0">
						{/* expert consultation */}
						<div className="w-full flex flex-col items-end justify-start gap-4 md:gap-7">
							<div className="w-full self-start bg-white rounded-2xl p-5 flex flex-col gap-2.5 md:max-w-[280px] mx-auto md:mr-8 items-start justify-center">
								<p className="text-lg md:text-xl font-bold">
									Expert Consultations Made Easy
								</p>
								<span className="text-sm text-[#4B4B57]">
									Get personalized consultations via video, audio, or chat. Pay
									only for the minutes you use.
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
										<p className="text-2xl font-bold">500+</p>
										<span className="text-sm text-[#4B4B57]">
											Consultations
										</span>
									</div>
								</div>
							</div>
							<CustomButton1 content={"Pay per minute"} />
						</div>

						<div className="w-full flex flex-col gap-7 items-center justify-between">
							{/* banner */}
							<Image
								src="/web/images/heroSection.png"
								alt="logo"
								width={1000}
								height={1000}
								className="rounded-xl w-full h-full max-h-[480px] object-contain"
								priority
								style={{
									maskImage:
										"linear-gradient(to bottom, white 80%, transparent 100%)",
									WebkitMaskImage:
										"linear-gradient(to bottom, white 80%, transparent 100%)",
								}}
							/>

							<div className="w-full flex items-center justify-center gap-1 text-[15px] font-semibold max-w-[280px] px-4 py-2.5 bg-white rounded-full border border-[#2C993D] border-b-4">
								<span>Set your</span>
								<span className="text-[#2C993D]"> own availability & rate</span>
							</div>
						</div>

						{/* more content */}
						<div className="w-full flex flex-col items-start justify-start gap-4 md:gap-10">
							<div className="self-start w-full bg-gradient-to-r from-[#E6F9FC] to-[#FAFAFA] rounded-2xl p-5 flex flex-col gap-2.5 md:max-w-[280px] mx-auto md:ml-8 items-start justify-center">
								{/* Rating */}
								<div className="flex gap-1 items-center">
									<Rating
										style={{
											maxWidth: 120,
											fill: "white",
										}}
										value={5}
										items={5}
										itemStyles={customStyles || {}}
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
								<p className="text-xs font-medium mt-2 text-[#0F0F0F]">
									Rajesh Gupta
								</p>
							</div>

							<CustomButton1 content={"Personalized booking link"} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
