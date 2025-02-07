"use client";

import React, { useEffect, useState } from "react";
import SinglePostLoader from "@/components/shared/SinglePostLoader";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import ChatFeedback from "@/components/feedbacks/ChatFeedback";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const ChatFeedbackPage = () => {
	const router = useRouter();
	const { toast } = useToast();
	const [loadingFeedback, setLoadingFeedback] = useState(false);
	const [showFeedback, setShowFeedback] = useState(true);
	const creatorURL = localStorage.getItem("creatorURL");
	const { chatId, callId } = useParams();
	const { currentUser, userType } = useCurrentUsersContext();

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
			toastStatus: "positive",
		});
		router.replace(`${creatorURL ? creatorURL : "/home"}`);
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
			className="w-full flex items-center justify-center bg-"
		>
			{userType === "client" ? (
				<ChatFeedback
					chatId={chatId as string}
					callId={callId as string}
					clientId={currentUser?._id as string}
					isOpen={showFeedback}
					onOpenChange={handleFeedbackClose}
				/>
			) : (
				<div>The chat you are looking for has ended</div>
			)}
		</section>
	);
};

export default ChatFeedbackPage;
