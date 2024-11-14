import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { updateFirestoreCallServices } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";

export const useServices = () => {
	const { creatorUser } = useCurrentUsersContext();
	const [services, setServices] = useState(() => ({
		myServices:
			creatorUser && !creatorUser.restricted
				? creatorUser.videoAllowed ||
				  creatorUser.audioAllowed ||
				  creatorUser.chatAllowed
				: false,
		videoCall:
			creatorUser && !creatorUser.restricted ? creatorUser.videoAllowed : false,
		audioCall:
			creatorUser && !creatorUser.restricted ? creatorUser.audioAllowed : false,
		chat:
			creatorUser && !creatorUser.restricted ? creatorUser.chatAllowed : false,
		isRestricted: creatorUser ? creatorUser.restricted : false, // Track restriction state
	}));

	// Initialize services based on creatorUser
	useEffect(() => {
		if (creatorUser) {
			const isRestricted = creatorUser.restricted || false;
			setServices({
				myServices:
					!isRestricted &&
					(creatorUser.videoAllowed ||
						creatorUser.audioAllowed ||
						creatorUser.chatAllowed),
				videoCall: !isRestricted && creatorUser.videoAllowed,
				audioCall: !isRestricted && creatorUser.audioAllowed,
				chat: !isRestricted && creatorUser.chatAllowed,
				isRestricted: isRestricted,
			});

			// Automatically update Firebase if restricted
			if (isRestricted) {
				updateFirestoreCallServices(creatorUser, {
					myServices: false,
					videoCall: false,
					audioCall: false,
					chat: false,
				});
			}
		}
	}, [creatorUser]);

	// Real-time updates from Firebase session trigger and restricted status
	useEffect(() => {
		if (creatorUser) {
			const sessionTriggeredRef = doc(db, "sessionTriggered", creatorUser._id);
			const unsubscribe = onSnapshot(
				sessionTriggeredRef,
				(docSnapshot) => {
					if (docSnapshot.exists()) {
						const currentCount = docSnapshot.data().count || 0;
						if (currentCount >= 3 || creatorUser.restricted) {
							setServices({
								myServices: false,
								videoCall: false,
								audioCall: false,
								chat: false,
								isRestricted: true,
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

	// Toggle handler with restricted check
	const handleToggle = (
		service: "myServices" | "videoCall" | "audioCall" | "chat"
	) => {
		// Prevent toggling if restricted
		if (services.isRestricted) return;

		setServices((prev) => {
			let updatedServices = { ...prev };
			if (service === "myServices") {
				const newState = !prev.myServices;
				updatedServices = {
					myServices: newState,
					videoCall: newState,
					audioCall: newState,
					chat: newState,
					isRestricted: false, // Not restricted if toggle is allowed
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
