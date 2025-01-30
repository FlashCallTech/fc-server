// section 3

"use client";

import React from "react";
import Image from "next/image";

const SwitchToggle = () => {
	return (
		<section
			className={`flex flex-col gap-8 md:gap-12 items-center justify-center pb-10 md:pb-20 md:px-14 lg:px-24 max-md:px-4`}
		>
			<div className="relative w-full md:max-w-[80%] mx-auto md:px-14 lg:px-24 grid grid-cols-1 items-center text-center">
				<h2 className="text-3xl md:text-4xl font-semibold !leading-snug">
					Receive calls only when you are online, no more late night disturbance
				</h2>
			</div>

			<div className="relative flex flex-col md:flex-row items-center justify-center w-full flex-1 md:gap-16">
				<Image
					src="/web/images/section3.png"
					alt="profile picture"
					width={1000}
					height={1000}
					className="md:hidden rounded-xl size-full max-h-[460px] md:max-w-[575px] md:max-h-[500px] object-contain"
				/>

				<Image
					src="/web/images/section3_web.png"
					alt="profile picture"
					width={1000}
					height={1000}
					className="hidden md:block rounded-xl size-full max-w-[575px] max-h-[500px] object-contain"
				/>

				<div className="w-full flex flex-col items-center justify-center md:items-start text-lg font-semibold mt-5">
					<p>Nitra Sahgal</p>
					<span className="text-[#235BAF]">Astrologer</span>

					<span className="mt-4 text-[#4B4B57] font-normal text-base text-center md:text-start">
						I have 10+ years of experience and a graduate in astrology from
						Ranchi University. I help to give you clarity & insight regarding
						your life and also to empower you with the spiritual knowledge of
						different energies that are revolving around us. Apart from this,
						you can also contact him regarding Marriage Consultation, Career and
						Business, Love & Relationship, Wealth and Property, Career issues
					</span>
				</div>
			</div>
		</section>
	);
};

export default SwitchToggle;
