import React from "react";
import Link from "next/link";
import Image from "next/image";
import { externalLinks, socials } from "@/constants";
import { Button } from "../ui/button";

const Footer = () => {
	const theme = `5px 5px 5px 0px #232323`;

	return (
		<div className="flex flex-col items-center justify-center w-full bg-gradient-to-r from-[#ecf5de] via-white to-[#dff7fb] border border-t-gray-300 pt-12">
			<div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[1fr_2fr] items-center justify-center w-full gap-7 2xl:gap-14 pb-12 md:px-14 lg:px-24 max-md:px-4">
				<div className="w-full flex flex-col gap-4 items-center justify-center md:items-start">
					{/* logo */}
					<Image
						src="/icons/logo_footer.png"
						alt="logo"
						width={500}
						height={100}
						className="rounded-xl w-[120px]"
					/>

					<p className="text-center md:text-start text-[#4B4B57]">
						BHHI technologies private limited, 19th Main Rd, Vanganahalli, 1st
						Sector, HSR Layout, Bengaluru, Karnataka 560102
					</p>
					{/* socials */}
					<ul className="text-[14px] font-[400] flex gap-4">
						{socials.links.map((link, index) => (
							<li
								key={index}
								className="hoverScaleEffect w-fit bg-secondary p-2 rounded-full"
							>
								<Link href="https://forms.gle/bo42SCVG6T4YjJzg8">
									<Image
										src={link}
										alt="social logo"
										width={24}
										height={24}
										className="w-auto h-auto"
									/>
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div className="size-full grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-7 xl:gap-0 items-center justify-center">
					{/* External Links */}
					<div className="size-full flex flex-col items-start justify-center md:justify-start gap-[15px]">
						<p className="text-lg text-[#0F0F0F]">Quick Links</p>
						<ul className="w-full grid grid-cols-1 xs:grid-cols-2 2xl:grid-cols-3 gap-4 items-center ">
							{externalLinks.map((item) => (
								<li
									key={item.label}
									className="text-sm xl:text-[15px] hoverScaleDownEffect"
								>
									<Link href={item.route}>{item.label}</Link>
								</li>
							))}
						</ul>
					</div>

					<div className="size-full flex xl:flex-col justify-center items-center sm:justify-start sm:items-start gap-4 xl:gap-0">
						<Link
							href="https://play.google.com/store/apps/details?id=com.flashcall.me&hl=en_IN"
							target="_black"
							className="hoverScaleDownEffect"
						>
							<Image
								src="/icons/play.png"
								alt="social logo"
								width={500}
								height={500}
								className="size-full max-w-[165px] max-h-[60px] object-contain self-start"
							/>
						</Link>
						<Image
							src="/icons/store.png"
							alt="social logo"
							width={500}
							height={500}
							className="size-full max-w-[165px] max-h-[60px] object-contain self-start"
						/>
					</div>
				</div>
			</div>

			{/* other info */}
			<div className="min-h-[76px] flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 w-full bg-black text-white py-6 md:px-14 lg:px-24 max-md:px-4">
				<p className="text-xs sm:text-sm md:text-base w-full font-[400] text-center md:text-start capitalize">
					Copyright © BHHI technologies private limited. All Rights Reserved.
				</p>

				<p className="text-xs sm:text-sm md:text-base w-full flex items-center justify-center md:justify-end gap-2 whitespace-nowrap text-white">
					Contact Us:{" "}
					<a
						href="mailto:support@Flashcall.me"
						className="text-[#34EA6B] hoverScaleDownEffect"
					>
						support@Flashcall.me
					</a>
				</p>
			</div>
		</div>
	);
};

export default Footer;
