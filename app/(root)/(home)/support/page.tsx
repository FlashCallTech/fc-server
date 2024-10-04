"use client";

import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { getDarkHexCode } from "@/lib/utils";
import React from "react";

const SupportPage = () => {
	return (
		<section className="w-full h-fit flex flex-col gap-6 items-start justify-start p-4 lg:p-8">
			<h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#50a65c]">
				Hey There We&apos;re Here to Help
			</h2>
			<p className="text-base text-gray-700">
				If you have any questions or need assistance, don&apos;t hesitate to
				reach out to our support team.
			</p>

			<section className="flex flex-col items-start justify-start gap-2">
				<span className="text-gray-600 text-sm mr-2">
					Need help? Reach out to us at
				</span>
				<a
					href="mailto:support@Flashcall.me"
					className="text-sm font-medium hoverScaleDownEffect text-green-1"
				>
					support@Flashcall.me
				</a>
			</section>
		</section>
	);
};

export default SupportPage;
