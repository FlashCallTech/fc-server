// section 7

import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

const OwnApp = () => {
	const theme = `5px 5px 0px 0px #ffffff`;

	return (
		<section
			className={`flex flex-col gap-14 items-center justify-center py-20 max-md:px-4 bg-[#232323] text-white`}
		>
			<div className="grid grid-cols-1 lg:grid-cols-2 items-start md:px-14 lg:px-24">
				<div className="flex flex-col items-start justify-center h-full gap-7">
					{/* heading and content */}

					<h2 className="text-4xl lg:text-5xl font-semibold !leading-snug">
						Add all your links in one place{" "}
					</h2>

					{/* more content */}
					<span className="text-xl leading-loose">
						Connect your profiles in one place for your followers. You can add
						Twitter, Website, Store, Youtube and many more. Anything and
						everything
					</span>
					<Link href="https://forms.gle/bo42SCVG6T4YjJzg8">
						<Button
							className="hidden lg:flex items-center justify-center gap-4 uppercase bg-transparent text-white border border-white w-[320px] !py-6 md:mt-4 hoverScaleDownEffect"
							style={{
								boxShadow: theme,
							}}
						>
							<Image
								src="/web/icons/logoDarkCircle.png"
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
					src="/web/images/ownApp.png"
					alt="logo"
					width={1000}
					height={1000}
					className="rounded-xl w-full h-full max-h-[480px] object-contain"
				/>

				<Button
					className="flex lg:hidden items-center justify-center w-[95%] mx-auto gap-4 uppercase bg-transparent text-white border border-white !py-8 mt-7 lg:mt-0 hoverScaleDownEffect"
					style={{
						boxShadow: theme,
					}}
				>
					<Image
						src="/web/icons/logoDarkCircle.png"
						alt="logo"
						width={200}
						height={200}
						className="rounded-xl w-6 h-6"
					/>
					<p className="text-xl font-semibold">Get Your Link</p>
				</Button>
			</div>
		</section>
	);
};

export default OwnApp;
