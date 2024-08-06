import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CreatorCallTimer = ({ callId }: { callId: string }) => {
	const [timeLeft, setTimeLeft] = useState("");
	const timeLeftInSeconds = parseFloat(timeLeft);
	const isLoading = isNaN(timeLeftInSeconds);
	const minutes = Math.floor(timeLeftInSeconds / 60);
	const seconds = Math.floor(timeLeftInSeconds % 60)
		.toString()
		.padStart(2, "0");

	useEffect(() => {
		if (!callId) {
			console.error("callId is required to fetch the timer data.");
			return;
		}

		const callDocRef = doc(db, "calls", callId);

		const unsubscribe = onSnapshot(
			callDocRef,
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
	}, [callId]);

	return (
		<div
			className={`fixed top-4 right-4 font-semibold ${
				minutes < 5 ? "bg-[#ffffff21]" : "bg-green-1"
			}  p-4 rounded-lg`}
		>
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

export default CreatorCallTimer;
