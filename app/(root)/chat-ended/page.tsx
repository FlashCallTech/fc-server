"use client";
import React from "react";
import { useRouter } from "next/navigation";

const ChatEndedPage = () => {
	const router = useRouter();

	const handleGoBack = () => {
		router.push("/"); // Redirect to the homepage or any other page
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen bg-gray-100">
			<h1 className="text-3xl font-bold mb-4">Chat Ended</h1>
			<p className="mb-8">
				The chat session you were in has ended. You cannot access this chat
				anymore.
			</p>
			<button
				onClick={handleGoBack}
				className="bg-green-500 text-white px-4 py-2 rounded"
			>
				Go Back
			</button>
		</div>
	);
};

export default ChatEndedPage;
