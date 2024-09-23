// section 2

import Image from "next/image";
import React from "react";

const About = () => {
	return (
		<section className="w-full h-fit py-10 md:py-20 bg-white grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0 items-center md:px-14 lg:px-24 max-md:px-4">
			{/* About Banner */}
			<Image
				src="/web/images/about_web.png"
				alt="logo"
				width={1000}
				height={1000}
				className="hidden lg:flex rounded-xl w-full h-full max-h-[444px] object-contain"
			/>
			{/* heading and content */}{" "}
			<div className="flex flex-col items-start justify-center gap-7">
				<h2 className="text-4xl md:text-5xl font-semibold !leading-relaxed">
					Pay-per-minute chats boost your conversion by 5X, so stop scheduling
					calls and offer consultation on demand.
				</h2>
				<Image
					src="/web/images/aboutObject.png"
					alt="logo"
					width={100}
					height={100}
					className="w-[150px] h-auto"
				/>
			</div>
			{/* About Banner Phone*/}
			<Image
				src="/web/images/about_mobile.png"
				alt="logo"
				width={1000}
				height={1000}
				className="rounded-xl w-full h-full max-h-[380px] object-contain lg:hidden"
			/>
		</section>
	);
};

export default About;
