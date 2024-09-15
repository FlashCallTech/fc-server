// section 5

import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

const ShareLink = () => {
	const theme = `5px 5px 5px 0px #232323`;

	return (
		<section className="w-full h-fit flex items-center justify-center py-14 bg-[#E9C0E9] max-md:px-4">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-20  items-center md:p-7 text-white w-full lg:w-4/5 rounded-xl ">
				{/* banner */}
				<Image
					src="/web/images/group.png"
					alt="logo"
					width={1000}
					height={1000}
					className="hidden lg:block rounded-xl w-full h-full object-contain"
				/>

				<div className="flex flex-col items-start justify-center gap-14 md:gap-10 md:px-4">
					{/* heading and content */}
					<h2 className="text-4xl md:text-5xl text-center lg:text-start font-semibold !leading-snug text-[#502274]">
						Share your Flashcall link from your Instagram, YouTube, twitter and
						other channels{" "}
					</h2>

					<Image
						src="/web/images/group.png"
						alt="logo"
						width={1000}
						height={1000}
						className="lg:hidden rounded-xl w-full h-full object-contain"
					/>
					<Link
						href="https://forms.gle/bo42SCVG6T4YjJzg8"
						className="w-full lg:w-[320px]"
					>
						<Button
							className="flex items-center justify-center w-full gap-4 uppercase bg-transparent text-[#502274] hover:bg-transparent hoverScaleDownEffect border border-black !py-6"
							style={{
								boxShadow: theme,
							}}
						>
							<Image
								src="/web/icons/logoDarkCircle.png"
								alt="logo"
								width={200}
								height={200}
								className="rounded-xl w-6 h-6 "
							/>
							<p className="text-sm font-semibold">Get Your Link</p>
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default ShareLink;
