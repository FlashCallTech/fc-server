// section 7

import React from "react";
import Link from "next/link";

const OwnApp = () => {
	const theme = `5px 5px 0px 0px #ffffff`;

	return (
		<section
			className={`flex flex-col gap-8 md:gap-12 items-center justify-center pb-10 md:pb-20 md:px-14 lg:px-24 max-md:px-4`}
		>
			{/* heading and content */}
			<div className="relative w-full md:max-w-[80%] mx-auto md:px-14 lg:px-24 grid grid-cols-1 gap-4 items-center text-center">
				<h2 className="text-3xl md:text-4xl font-semibold !leading-snug">
					Add all your links in one place{" "}
				</h2>

				{/* more content */}
				<span className="text-xl text-[#4B4B57]">
					Connect your profiles in one place for your followers. You can add
					Twitter, Website, Store, Youtube and many more. Anything and
					everything
				</span>

				<Link
					href="https://play.google.com/store/apps/details?id=com.flashcall.me&hl=en_IN"
					target="_black"
					className="w-full max-w-[180px] mt-2.5 mx-auto flex items-center justify-center text-center gap-2 bg-black text-white rounded-full px-5 py-[15px] hoverScaleDownEffect"
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
		</section>
	);
};

export default OwnApp;
