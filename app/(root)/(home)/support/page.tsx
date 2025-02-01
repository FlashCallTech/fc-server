"use client";
import Link from "next/link";
import React from "react";

const SupportPage = () => {
	const creatorURL = localStorage.getItem("creatorURL");

	return (
		<section className="w-full h-fit flex flex-col gap-6 items-start justify-start p-4 lg:p-8 xl:px-2">
			<h2 className="text-xl md:text-2xl lg:text-xl font-semibold text-black">
				Hey we&apos;re here to help
			</h2>
			<p className="text-base text-gray-700">
				If you have any questions or need assistance, don&apos;t hesitate to
				reach out to our support team.
			</p>

			<section className="flex flex-col items-start justify-start gap-3.5">
				<span className="text-gray-600 text-base mr-2">Reach out to us at</span>
				<section className="w-fit flex items-center justify-start gap-4">
					<a
						href="mailto:support@Flashcall.me"
						className="text-base font-medium hoverScaleDownEffect text-[#16BC88]"
					>
						support@flashcall.me
					</a>
					<span className="text-xs text-gray-500">Or</span>
					<a
						href="https://api.whatsapp.com/send?phone=919019082682"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center hoverScaleDownEffect"
					>
						<img
							src="/images/whatsappSupport.png"
							alt=""
							className="h-10 xl:h-12 w-full object-contain object-center"
						/>
					</a>
				</section>
			</section>
		</section>
	);
};

export default SupportPage;
