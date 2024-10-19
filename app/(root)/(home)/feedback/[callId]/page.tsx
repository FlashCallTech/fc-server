"use client";

import React, { useEffect, useState } from "react";
import CallFeedback from "@/components/feedbacks/CallFeedback";
import { useParams, useRouter } from "next/navigation";

const CallFeedbackPage = () => {
	const { callId } = useParams();
	const router = useRouter();
	const [showFeedback, setShowFeedback] = useState(true);
	const creatorURL = localStorage.getItem("creatorURL");

	useEffect(() => {
		const handleResize = () => {
			const height = window.innerHeight;
			document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
		};

		window.addEventListener("resize", handleResize);
		handleResize();

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleFeedbackClose = async () => {
		setShowFeedback(false);

		router.replace(`${creatorURL ? creatorURL : "/home"}`);
	};

	return (
		<section className="w-full h-dvh flex items-center justify-center">
			<CallFeedback
				callId={callId as string}
				isOpen={showFeedback}
				onOpenChange={handleFeedbackClose}
			/>
		</section>
	);
};

export default CallFeedbackPage;
