"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { externalLinks } from "@/constants";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { Button } from "../ui/button";

const Footer = () => {
	const { currentTheme } = useCurrentUsersContext();
	const [userTheme, setUserTheme] = useState("#000000");
	useEffect(() => {
		if (currentTheme) {
			const newTheme = currentTheme === "#50A65C" ? "#000000" : currentTheme;
			setUserTheme(newTheme);
		} else {
			setUserTheme("#000000");
		}
	}, [currentTheme]);
	return (
		<>
			<div className="flex flex-col items-center justify-center w-full pt-7 pb-5 gap-7">
				{/* logo */}
				<Image
					src="/icons/logoFooter.png"
					alt="logo"
					width={500}
					height={100}
					className="rounded-xl w-[333px] h-auto"
				/>

				{/* get link button5*/}
				<Link href="https://forms.gle/bo42SCVG6T4YjJzg8">
					<Button
						className="flex items-center justify-center gap-4 uppercase bg-primary text-white grdientEffect  border border-black w-[320px] !py-6 hoverScaleDownEffect"
						style={{
							boxShadow: `5px 5px 0px 0px ${userTheme}`,
						}}
					>
						<Image
							src="/icons/logo.png"
							alt="logo"
							width={1000}
							height={1000}
							className="rounded-xl w-7 h-7"
						/>
						<p className="text-sm font-semibold">Get Your Link</p>
					</Button>
				</Link>

				{/* External Links */}
				<ul className="flex gap-4 items-center justify-center px-4 flex-wrap overflow-hidden z-10">
					{externalLinks.map((item) => (
						<li
							key={item.label}
							className="text-white underline underline-offset-2 text-sm hover:scale-95 transition-all duration-300 ease-in-out"
						>
							<Link href={item.route}>{item.label}</Link>
						</li>
					))}
				</ul>
			</div>
			{/* other info */}
			<div className="flex flex-col items-center justify-center w-full bg-black text-white py-2.5">
				<p className="text-[14px] font-[400] text-center w-full capitalize">
					BHHI technologies private limited | All rights reserved
				</p>
				{/* address */}
				<span className="text-white text-xs text-center">
					19th Main Rd, Vanganahalli, 1st Sector, HSR Layout, Bengaluru,
					Karnataka 560102
				</span>
				<p className="text-white text-sm mt-2">
					Contact Us:{" "}
					<a
						href="mailto:support@Flashcall.me"
						className="text-[#50a65c] hoverScaleDownEffect"
					>
						support@Flashcall.me
					</a>
				</p>
			</div>
		</>
	);
};

export default Footer;
