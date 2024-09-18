// section 1

import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
	const theme = `5px 5px 5px 0px #232323`;
	return (
		<section className="w-full h-fit pt-10 pb-5 bg-hero bg-contain md:bg-none max-md:px-4">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-0 items-start md:px-14 lg:px-24">
				<div className="flex flex-col items-start justify-center gap-7">
					{/* heading and content */}
					<h1 className="text-4xl md:text-5xl font-semibold !leading-snug">
						Make your <br /> own app and start earning with pay-per-min chats. 
					</h1>
					<span className="text-xl text-[#707070] leading-loose hidden lg:block">
						Join 1000+ people who are earning upto 10 Lakhs a month just by
						talking to their followers. Stop worrying about scheduling calls or
						collecting payments, flashcall handles everything for you.
					</span>
					<Link href="https://forms.gle/bo42SCVG6T4YjJzg8">
						<Button
							className="hidden lg:flex items-center justify-center gap-4 uppercase bg-green-1 text-white grdientEffect border border-black w-[320px] !py-6 hoverScaleDownEffect"
							style={{
								boxShadow: theme,
							}}
						>
							<Image
								src="/web/icons/logo.png"
								alt="logo"
								width={100}
								height={100}
								className="rounded-xl w-6 h-6"
							/>
							<p className="text-sm font-semibold">Get Your Link</p>
						</Button>
					</Link>
				</div>
				{/* banner */}

				<Image
					src="/web/images/hero_web.png"
					alt="logo"
					width={1000}
					height={1000}
					className="hidden lg:block rounded-xl w-full h-full max-h-[480px] object-contain"
				/>
				<Image
					src="/web/images/hero_mobile.png"
					alt="logo"
					width={1000}
					height={1000}
					className="lg:hidden rounded-xl w-full h-full max-h-[480px] object-contain"
				/>

				{/* more content */}
				<span className="text-xl text-[#707070] leading-loose lg:hidden">
					Join 1000+ people who are earning upto 10 Lakhs a month just by
					talking to their followers. Stop worrying about scheduling calls or
					collecting payments, flashcall handles everything for you.
				</span>
				<Link
					href="https://forms.gle/bo42SCVG6T4YjJzg8"
					className="flex lg:hidden items-center justify-center w-full gap-4 uppercase bg-green-1 text-white grdientEffect border border-black py-4 hoverScaleDownEffect rounded-lg"
					style={{
						boxShadow: theme,
					}}
				>
					<Image
						src="/web/icons/logo.png"
						alt="logo"
						width={200}
						height={200}
						className="rounded-xl w-6 h-6"
					/>
					<p className="font-semibold">Get Your Link</p>
				</Link>
			</div>
		</section>
	);
};

export default Hero;
