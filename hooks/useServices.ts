// hooks/useServices.ts
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { updateFirestoreCallServices } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";

export const useServices = () => {
	const { creatorUser } = useCurrentUsersContext();
	const [services, setServices] = useState(() => ({
		myServices: false,
		videoCall: false,
		audioCall: false,
		chat: false,
	}));

	// Initialize services based on creatorUser
	useEffect(() => {
		if (creatorUser) {
			setServices({
				myServices:
					creatorUser.videoAllowed ||
					creatorUser.audioAllowed ||
					creatorUser.chatAllowed,
				videoCall: creatorUser.videoAllowed,
				audioCall: creatorUser.audioAllowed,
				chat: creatorUser.chatAllowed,
			});
		}
	}, [creatorUser]);

	// Real-time updates from Firebase
	useEffect(() => {
		if (creatorUser) {
			const sessionTriggeredRef = doc(db, "sessionTriggered", creatorUser._id);
			const unsubscribe = onSnapshot(
				sessionTriggeredRef,
				(docSnapshot) => {
					if (docSnapshot.exists()) {
						const currentCount = docSnapshot.data().count || 0;
						if (currentCount >= 3) {
							setServices({
								myServices: false,
								videoCall: false,
								audioCall: false,
								chat: false,
							});
						}
					}
				},
				(error) => {
					console.error("Error fetching session triggered snapshot: ", error);
					Sentry.captureException(error);
				}
			);

			return () => unsubscribe();
		}
	}, [creatorUser]);

	// Toggle handler
	const handleToggle = (
		service: "myServices" | "videoCall" | "audioCall" | "chat"
	) => {
		setServices((prev) => {
			let updatedServices = { ...prev };
			if (service === "myServices") {
				const newState = !prev.myServices;
				updatedServices = {
					myServices: newState,
					videoCall: newState,
					audioCall: newState,
					chat: newState,
				};
			} else {
				updatedServices[service] = !prev[service];
				const isAnyServiceOn =
					updatedServices.videoCall ||
					updatedServices.audioCall ||
					updatedServices.chat;
				updatedServices.myServices = isAnyServiceOn;
			}

			// Update Firestore
			updateFirestoreCallServices(creatorUser, updatedServices);
			return updatedServices;
		});
	};

	return { services, handleToggle, setServices };
};

export default useServices;
