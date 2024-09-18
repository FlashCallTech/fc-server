// section 3

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { sparkles } from "@/constants/icons";
import { SwitchWeb } from "../ui/switchWeb";

const SwitchToggle = () => {
	const [showContent, setShowContent] = useState(false);
	const [toggleSwitch, setToggleSwitch] = useState(false);
	const { ref, inView } = useInView({
		threshold: 0.1,
		triggerOnce: true,
	});

	useEffect(() => {
		let timer: any;
		if (inView) {
			timer = setTimeout(() => {
				setToggleSwitch(true);
			}, 1000); // Delay before toggling the switch on
		}
		return () => clearTimeout(timer);
	}, [inView]);

	useEffect(() => {
		let timer: any;
		if (toggleSwitch) {
			timer = setTimeout(() => {
				setShowContent(true);
			}, 1000); // Additional delay before showing content
		}
		return () => clearTimeout(timer);
	}, [toggleSwitch]);

	const handleToggle = useCallback(() => {
		setToggleSwitch((prev) => !prev);
		if (!toggleSwitch) {
			setTimeout(() => {
				setShowContent((prev) => !prev);
			}, 1000);
		} else {
			setShowContent((prev) => !prev);
		}
	}, [toggleSwitch]);

	return (
		<section
			ref={ref}
			className={`flex flex-col gap-14 items-center justify-center py-20 max-md:px-4 ${
				showContent ? "bg-green-1 text-white" : "bg-[#232323] text-white"
			} transition-all duration-500 animate-accordion-down`}
		>
			<div className="relative w-full lg:max-w-[75%] md:px-14 lg:px-24 grid grid-cols-1 items-center text-center">
				<h2 className="relative text-4xl md:text-5xl font-semibold leading-relaxed">
					Receive calls only when you are online, no more late night disturbance
				</h2>
				<span className="absolute -top-10 right-0 md:-top-5 3xl:-top-10 md:right-[3.5%] 2xl:right-[5%]">
					{sparkles}
				</span>
				<span className="absolute -bottom-10 left-7 xl:-bottom-4 md:left-[10%] 2xl:left-[17.5%]">
					{sparkles}
				</span>
			</div>
			{!showContent ? (
				<div className="mt-8 flex flex-col items-center justify-center gap-4">
					<SwitchWeb
						className="bg-white/25 w-[133px] py-7"
						checked={toggleSwitch}
						onCheckedChange={handleToggle}
					/>
					<span className="text-white text-xs">Click to go Online</span>
				</div>
			) : (
				<div className="relative flex flex-col items-center justify-center px-2 w-full flex-1">
					<div className="relative flex flex-col items-center w-fit mx-auto gap-4 p-4 rounded-xl bg-black z-10">
						<Image
							src="/web/images/user.png"
							alt="profile picture"
							width={1000}
							height={1000}
							className="rounded-xl w-full h-56 md:h-60 object-cover"
						/>
						<div className="text-white flex flex-col items-start w-full">
							<p className="font-semibold text-3xl max-w-[90%] text-ellipsis whitespace-nowrap overflow-hidden">
								Nitra Sahgal
							</p>
							<div className="flex items-center justify-between w-full mt-2">
								<span className="text-md h-full">Astrologer</span>
								<span className="bg-green-500 text-xs rounded-xl px-4 py-2">
									Online
								</span>
							</div>
						</div>
						<span className="absolute top-1/2 -right-9 text-black">
							{sparkles}
						</span>
					</div>
					<p className="border-2 border-gray-200 bg-white text-black p-4 -mt-4 lg:-mt-7 pt-10 text-center text- rounded-3xl rounded-tr-none w-full md:w-3/4 lg:w-1/2 2xl:w-1/3  leading-normal relative">
						I have 10+ years of experience and a graduate in astrology from
						Ranchi University. I help to give you clarity and insight regarding
						your life and also to empower you with the spiritual knowledge of
						different energies that are revolving around us. Apart from this,
						you can also contact him regarding Marriage Consultation, Career and
						Business, Love and Relationship, Wealth and Property, Career issues
						and much more.
						<span className="absolute top-2.5 md:top-6 -left-6 md:-left-8 text-black">
							{sparkles}
						</span>
					</p>
				</div>
			)}
		</section>
	);
};

export default SwitchToggle;
