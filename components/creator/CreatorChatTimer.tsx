import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CreatorChatTimer = ({ chatId }: { chatId: string }) => {
	const [timeLeft, setTimeLeft] = useState("");
	const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds);
	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	useEffect(() => {
		if (!chatId) {
			console.error("callId is required to fetch the timer data.");
			return;
		}

		const chatDocRef = doc(db, "chats", chatId);

		const unsubscribe = onSnapshot(
			chatDocRef,
			(doc) => {
				if (doc.exists()) {
					const data = doc.data();
					setTimeLeft(data.timeLeft);
				} else {
					console.log("No such document!");
				}
			},
			(error) => {
				console.error("Error fetching document: ", error);
			}
		);

		// Cleanup listener on component unmount
		return () => unsubscribe();
	}, [chatId]);

	return (
		<div className="leading-5 text-center text-white font-bold py-1 bg-[rgba(255,255,255,0.36)] mb-4">
			{isLoading ? (
				<p>Loading...</p>
			) : (
				<p className={`${minutes < 5 ? "text-red-500" : "text-white"}`}>
					Time Left: {minutes}:{seconds}
				</p>
			)}
		</div>
	);
};

export default CreatorChatTimer;
