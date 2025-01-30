// section 5

import React from "react";
import Link from "next/link";
import Image from "next/image";

const ShareLink = () => {
	return (
		<section className="w-full h-fit pb-10 md:pb-20 bg-white md:px-14 lg:px-24 max-md:px-4">
			<div className="bg-[#AFDDF5] w-full text-start grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-10 items-center rounded-xl p-4 pb-0 md:p-10 md:pb-0">
				<div className="flex flex-col items-start justify-center gap-5 md:gap-10 md:p-8 md:pb-20">
					{/* heading and content */}
					<h2 className="text-3xl md:text-4xl font-semibold !leading-relaxed">
						Share your Flashcall link from your Instagram, YouTube, twitter and
						other channels{" "}
					</h2>

					<Link
						href="https://play.google.com/store/apps/details?id=com.flashcall.me&hl=en_IN"
						target="_black"
						className="w-full max-w-[180px] flex items-center justify-center text-center gap-2 bg-black text-white rounded-full px-5 py-[15px] hoverScaleDownEffect"
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
				</div>
				<div className="relative flex items-center justify-center self-end">
					<div className="absolute -top-10 right-1/3 md:top-0 md:-left-20  bg-white rounded-full size-5" />
					<div className=" hidden md:block absolute bottom-24 -left-4 bg-white rounded-full size-5" />

					<Image
						src="/web/images/section5.png"
						alt="profile picture"
						width={1000}
						height={1000}
						className="rounded-xl size-full max-h-[400px] md:max-w-[400px] md:max-h-[520px] object-contain mx-auto self-end"
					/>
				</div>
			</div>
		</section>
	);
};

export default ShareLink;
