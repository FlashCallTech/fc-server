"use client";

import CallFeedback from "@/components/feedbacks/CallFeedback";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const CallFeedbackPage = () => {
	const { callId } = useParams();
	const router = useRouter();
	const { toast } = useToast();
	const [loadingFeedback, setLoadingFeedback] = useState(true);
	const [showFeedback, setShowFeedback] = useState(false);

	useEffect(() => {
		const fetchFeedbacks = async () => {
			try {
				const response = await fetch(
					`/api/v1/feedback/call/getFeedbacks?callId=${callId}`
				);
				const feedbacks = await response.json();

				if (feedbacks.length > 0) {
					toast({
						title: "Feedback Already Exists",
						description: "Returning to HomePage ...",
					});
					router.push("/");
				} else {
					setShowFeedback(true);
				}
			} catch (error) {
				console.error("Error fetching feedbacks:", error);
				toast({
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
			title: "Thanks For The Feedback",
			description: "Hope to See You Again ...",
		});
		router.push("/");
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

export default CallFeedbackPage;
