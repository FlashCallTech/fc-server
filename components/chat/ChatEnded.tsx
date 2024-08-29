"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ChatFeedback from "../feedbacks/ChatFeedback";
import { logEvent } from "firebase/analytics";
import { analytics } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const ChatEnded = () => {
	const [isFeedbackOpen, setIsFeedbackOpen] = useState(true);
	const router = useRouter();
	const { chatId, clientId } = useParams();
	const { currentUser } = useCurrentUsersContext();

	useEffect(() => {
		logEvent(analytics, "feedback_shown", {
			clientId: currentUser?._id,
		});
	}, []);

	const goToHomePage = () => {
		router.replace("/"); // For react-router-dom v6, use 'navigate('/')'
	};
	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100">
			<div className="p-8 bg-white shadow-lg rounded-lg text-center">
				<h1 className="text-2xl font-bold mb-4">Chat Ended</h1>
				<p className="text-gray-600 mb-6">Thank you for chatting with us.</p>
				<button
					onClick={goToHomePage}
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
				>
					Go to Homepage
				</button>

				{clientId === currentUser?._id && (
					<ChatFeedback
						chatId={chatId as string}
						isOpen={isFeedbackOpen}
						onOpenChange={setIsFeedbackOpen}
					/>
				)}
			</div>
		</div>
	);
};

export default ChatEnded;
