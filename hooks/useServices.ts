import { useState, useEffect } from "react";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl, updateFirestoreCallServices } from "@/lib/utils";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust the import path for your Firebase setup
import * as Sentry from "@sentry/nextjs";
import axios from "axios";

export const useServices = () => {
	const { creatorUser } = useCurrentUsersContext();
	const [services, setServices] = useState(() => ({
		myServices: false,
		videoCall: false,
		audioCall: false,
		chat: false,
		isRestricted: false,
	}));
	const [isSyncedWithFirebase, setIsSyncedWithFirebase] = useState(false);

	// Fetch services from Firebase and sync with local state
	useEffect(() => {
		if (creatorUser?._id) {
			const servicesRef = doc(db, "services", creatorUser._id);

			const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
				if (snapshot.exists()) {
					const firebaseServices = snapshot.data()?.services || {};
					const isRestricted = creatorUser.restricted || false;

					setServices({
						myServices:
							!isRestricted &&
							(firebaseServices.videoCall ||
								firebaseServices.audioCall ||
								firebaseServices.chat),
						videoCall: !isRestricted && firebaseServices.videoCall,
						audioCall: !isRestricted && firebaseServices.audioCall,
						chat: !isRestricted && firebaseServices.chat,
						isRestricted,
					});
					setIsSyncedWithFirebase(true);
				}
			});

			return () => unsubscribe();
		}
	}, [creatorUser]);

	// Update Firebase when local state changes
	useEffect(() => {
		if (isSyncedWithFirebase && creatorUser?._id) {
			const servicesRef = doc(db, "services", creatorUser._id);

			setDoc(
				servicesRef,
				{
					services: {
						videoCall: services.videoCall,
						audioCall: services.audioCall,
						chat: services.chat,
					},
				},
				{ merge: true }
			).catch((error) => {
				Sentry.captureException(error);
				console.error("Error syncing services with Firebase:", error);
			});
		}
	}, [services, creatorUser?._id, isSyncedWithFirebase]);

	// Update backend whenever services change
	useEffect(() => {
		const updateBackendServices = async () => {
			try {
				await axios.put(
					`${backendBaseUrl}/creator/updateUser/${creatorUser?._id}`,
					{
						videoAllowed: services.videoCall,
						audioAllowed: services.audioCall,
						chatAllowed: services.chat,
					}
				);
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error updating services on backend:", error);
			}
		};

		if (creatorUser && isSyncedWithFirebase) {
			updateBackendServices();
		}
	}, [
		services.videoCall,
		services.audioCall,
		services.chat,
		creatorUser,
		isSyncedWithFirebase,
	]);

	// Toggle handler with Firebase sync
	const handleToggle = (
		service: "myServices" | "videoCall" | "audioCall" | "chat"
	) => {
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
					isRestricted: false,
				};
			} else {
				updatedServices[service] = !prev[service];
				const isAnyServiceOn =
					updatedServices.videoCall ||
					updatedServices.audioCall ||
					updatedServices.chat;
				updatedServices.myServices = isAnyServiceOn;
			}

			updateFirestoreCallServices(creatorUser, updatedServices);
			return updatedServices;
		});
	};

	return { services, handleToggle, setServices };
};

export default useServices;
