"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const OfficialPage = () => {
	const router = useRouter();
	const [countdown, setCountdown] = useState(5);

	useEffect(() => {
		if (countdown > 0) {
			const timer = setInterval(() => {
				setCountdown((prev) => prev - 1);
			}, 1000);

			return () => clearInterval(timer);
		} else {
			router.push("https://official.me");
		}
	}, [countdown, router]);

	const handleRedirect = () => {
		router.push("https://official.me");
	};

	return (
		<section className="flex flex-col items-center justify-center text-center h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
			<div className="bg-white shadow-lg rounded-xl p-8 max-w-md border-t-4 border-blue-600">
				<h1 className="text-2xl font-extrabold text-blue-600 tracking-wide">
					Thank You for Visiting
				</h1>
				<p className="text-base mt-6 text-gray-700 leading-relaxed font-medium">
					We appreciate your interest! Unfortunately, this page is not
					available, but don&apos;t worry—we&apos;re taking you back to the
					official site shortly.
				</p>
				<p className="mt-4 text-sm">
					Redirecting in{" "}
					<span className="font-semibold text-blue-600">
						{countdown} second{countdown > 1 ? "s" : ""}
					</span>
					...
				</p>
				<button
					onClick={handleRedirect}
					className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium text-sm rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
				>
					Take Me Back to Official Now
				</button>
			</div>
		</section>
	);
};

export default OfficialPage;
