"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import Head from "next/head";
import AuthenticateViaOTP from "@/components/forms/AuthenticateViaOTP";
import Slider from "react-slick";
import { authSliderContent } from "@/constants";
import Image from "next/image";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function AuthenticationPage() {
	const searchParams = useSearchParams();
	const userType = searchParams.get("usertype");
	const refId = searchParams.get("refId");
	const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 584);
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
		<main className="size-full inset-0 bg-[#111111] sm:bg-green-1 top-0 grid grid-cols-1 items-start h-dvh">
			<Head>
				<title>Authentication</title>
				<meta name="description" content="Authentication Form" />
				<link rel="icon" href="/icons/logo_icon.png" />
			</Head>

			{/* Authentication Form Section */}
			{isMobileView ? (
				<Sheet open={true}>
					<SheetContent
						onOpenAutoFocus={(e) => e.preventDefault()}
						side="bottom"
						className="flex flex-col items-start justify-between w-full h-full !p-0 !border-none"
					>
						{/* Slider Section */}
						<section className="relative flex flex-col gap-2 w-full h-fit justify-start items-start sm:hidden">
							<Slider
								{...settings}
								ref={sliderRef}
								className="size-full flex items-center justify-center"
							>
								{authSliderContent.map((item, index) => (
									<section
										className="flex flex-col h-full text-center gap-4 items-end justify-center px-4 pt-4 pb-2 text-white"
										key={index}
									>
										<Image
											src={item.imageURL || "/images/defaultProfileImage.png"}
											alt={`${item.heading}`}
											width={1000}
											height={1000}
											className="size-full max-h-[285px] xm:max-h-[300px] rounded-xl object-contain mx-auto"
											onError={(e) => {
												e.currentTarget.src = "/images/defaultProfileImage.png";
											}}
										/>
										<section className="w-[75%] m-auto flex flex-col items-center justify-center gap-2">
											<h1 className="text-base sm:text-lg md:text-2xl font-medium mt-4">
												{item.heading}
											</h1>
										</section>
									</section>
								))}
							</Slider>

							{/* Navigation Dots */}
							{authSliderContent?.length > 1 && (
								<div className=" flex items-center justify-center w-full">
									<div className="flex gap-2 items-center">
										{authSliderContent?.map((_, index) => (
											<button
												key={index}
												className={`${
													index === currentIndex ? "bg-white" : "bg-white/40"
												} w-2 h-2 rounded-full`}
												onClick={() => {
													sliderRef.current?.slickGoTo(index);
												}}
											/>
										))}
									</div>
								</div>
							)}
						</section>
						<SheetHeader className="sr-only">
							<SheetTitle className="sr-only">Authentication</SheetTitle>
							<SheetDescription className="sr-only">
								Authenticate via OTP to continue.
							</SheetDescription>
						</SheetHeader>
						<section className="h-fit">
							<AuthenticateViaOTP
								userType={userType as string}
								refId={refId as string}
							/>
						</section>
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={true}>
					<DialogContent className="flex flex-col items-center justify-center w-fit !p-0 border-none">
						<DialogHeader className="sr-only">
							<DialogTitle className="sr-only">Authentication</DialogTitle>
							<DialogDescription className="sr-only">
								Authenticate via OTP to continue.
							</DialogDescription>
						</DialogHeader>
						<AuthenticateViaOTP
							userType={userType as string}
							refId={refId as string}
						/>
					</DialogContent>
				</Dialog>
			)}
		</main>
	);
}
