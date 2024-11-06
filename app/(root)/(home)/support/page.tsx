"use client";
import React from "react";

const SupportPage = () => {
	return (
		<section className="w-full h-fit flex flex-col gap-6 items-start justify-start p-4 lg:p-8">
			<h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#50a65c]">
				Hey we&apos;re here to help
			</h2>
			<p className="text-base text-gray-700">
				If you have any questions or need assistance, don&apos;t hesitate to
				reach out to our support team.
			</p>

			<section className="flex flex-col items-start justify-start gap-2">
				<span className="text-gray-600 text-base mr-2">Reach out to us at</span>
				<a
					href="mailto:support@Flashcall.me"
					className="text-base font-medium hoverScaleDownEffect text-green-1"
				>
					support@flashcall.me
				</a>
			</section>
		</section>
	);
};

export default SupportPage;
