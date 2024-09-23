"use client";

import CallFeedback from "@/components/feedbacks/CallFeedback";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

const TriggerCallFeedback = ({ callId }: { callId: string }) => {
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
						description: "Returning back ...",
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
		<section className="w-full h-full flex items-center justify-center">
			<CallFeedback
				callId={callId as string}
				isOpen={showFeedback}
				onOpenChange={handleFeedbackClose}
			/>
		</section>
	);
};

export default TriggerCallFeedback;
