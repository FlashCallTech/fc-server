"use client";

import React, { useEffect, useState } from "react";
import CallFeedback from "@/components/feedbacks/CallFeedback";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

const CallFeedbackPage = () => {
	const { callId } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const [loadingFeedback, setLoadingFeedback] = useState(true);
	const [showFeedback, setShowFeedback] = useState(false);
	const creatorURL = localStorage.getItem("creatorURL");

	useEffect(() => {
		const fetchFeedbacks = async () => {
			try {
				const response = await fetch(
					`/api/v1/feedback/call/getFeedbacks?callId=${callId}`
				);
				const feedbacks = await response.json();

				if (feedbacks.length > 0) {
					toast({
						variant: "destructive",
						title: "Feedback Already Exists",
						description: "Returning to HomePage ...",
					});
					router.push(`${creatorURL ? creatorURL : "/home"}`);
				} else {
					setShowFeedback(true);
				}
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching feedbacks:", error);
				toast({
					variant: "destructive",
					title: "Error",
					description: "An error occurred while fetching feedbacks",
				});
			} finally {
				setLoadingFeedback(false);
			}
		};

		fetchFeedbacks();
	}, [callId, router, toast]);

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
		toast({
			variant: "destructive",
			title: "Thanks For The Feedback",
			description: "Hope to See You Again ...",
		});
		router.push(`${creatorURL ? creatorURL : "/home"}`);
	};

	if (loadingFeedback) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<SinglePostLoader />
			</section>
		);
	}

	return (
		<section
			style={{ height: "calc(var(--vh, 1vh) * 100)" }}
			className="w-full flex items-center justify-center"
		>
			<CallFeedback
				callId={callId as string}
				isOpen={showFeedback}
				onOpenChange={handleFeedbackClose}
			/>
		</section>
	);
};

export default CallFeedbackPage;
