"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import Head from "next/head";
import AuthenticateViaOTP from "@/components/forms/AuthenticateViaOTP";
import Slider from "react-slick";
import { authSliderContent } from "@/constants";
import Image from "next/image";

export default function AuthenticationPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");
	const refId = searchParams.get("refId");

	const [currentIndex, setCurrentIndex] = useState(0);
	const sliderRef = useRef<Slider>(null);

	// Carousel settings
	const settings = {
		infinite: authSliderContent.length > 1,
		slidesToShow: 1,
		speed: 500,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 5000,
		arrows: false,
		dots: false,
		beforeChange: (oldIndex: number, newIndex: number) => {
			setCurrentIndex(newIndex);
		},
	};

	useEffect(() => {
		localStorage.setItem("userType", (userType as string) ?? "client");
		localStorage.setItem("refId", (refId as string) ?? undefined);
	}, [searchParams, refId, userType]);

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<main
			className="fixed w-full h-screen z-50 inset-0 bg-green-1 top-0 flex flex-col justify-between md:justify-center"
			style={{ height: "calc(var(--vh, 1vh) * 100)" }}
		>
			<Head>
				<title>Authentication</title>
				<meta name="description" content="Authentication Form" />
				<link rel="icon" href="/icons/logoDarkCircle.png" />
			</Head>

			{/* Slider Section */}
			<div className="flex flex-col gap-2 h-1/2 w-full justify-center items-end relative md:hidden">
				<Slider
					{...settings}
					ref={sliderRef}
					className="w-full h-fit flex items-center justify-center"
				>
					{authSliderContent.map((item, index) => (
						<section
							className="flex flex-col h-full text-center gap-4 items-end justify-center px-4 py-2.5 xm:py-5 text-white"
							key={index}
						>
							<Image
								src={item.imageURL || "/images/defaultProfileImage.png"}
								alt={`${item.heading}`}
								width={1000}
								height={1000}
								className="w-40 h-40 xm:w-52 xm:h-52 rounded-xl object-cover mx-auto"
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
							/>
							<section className="flex flex-col items-center justify-center gap-2">
								<h1 className="text-xl xm:text-2xl font-medium mt-4">
									{item.heading}
								</h1>
								{/* <h2 className="text-sm">{item.description}</h2> */}
							</section>
						</section>
					))}
				</Slider>

				{/* Navigation Dots */}
				{authSliderContent?.length > 1 && (
					<div className="flex items-center justify-center w-full">
						<div className="flex gap-2 items-center">
							{authSliderContent?.map((_, index) => (
								<button
									key={index}
									className={`${
										index === currentIndex ? "bg-white" : "bg-black/20"
									} w-2 h-2 rounded-full`}
									onClick={() => {
										sliderRef.current?.slickGoTo(index);
									}}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Authentication Form Section */}

			<AuthenticateViaOTP
				userType={userType as string}
				refId={refId as string}
			/>
		</main>
	);
}
