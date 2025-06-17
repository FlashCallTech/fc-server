import { useState, useEffect, useRef } from "react";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl, updateFirestoreCallServices } from "@/lib/utils";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";

export const useServices = () => {
	const { creatorUser } = useCurrentUsersContext();
	const userId = creatorUser?._id;
	const userPhone = creatorUser?.phone;

	const [services, setServices] = useState(() => ({
		myServices: false,
		videoCall: false,
		audioCall: false,
		chat: false,
		isRestricted: false,
	}));

	const [isSyncedWithFirebase, setIsSyncedWithFirebase] = useState(false);
	const userToggledRef = useRef(false);

	// Fetch user status and services from Firebase
	useEffect(() => {
		if (!userId || !userPhone) return;

		const servicesRef = doc(db, "services", userId);
		const statusRef = doc(db, "userStatus", userPhone);

		let unsubscribe: any;

		const fetchUserStatusAndServices = async () => {
			try {
				// Fetch userStatus document
				const statusDoc = await getDoc(statusRef);
				const loginStatus = statusDoc.exists()
					? statusDoc.data()?.loginStatus
					: true;

				// Listen to real-time updates
				unsubscribe = onSnapshot(servicesRef, (snapshot) => {
					if (!snapshot.exists()) return;

					const firebaseServices = snapshot.data()?.services || {};
					const isRestricted = creatorUser.restricted || false;
					const shouldDisable = loginStatus === false;

					// Avoid overwriting user's toggle actions
					if (!userToggledRef.current) {
						setServices({
							myServices:
								shouldDisable || isRestricted
									? false
									: firebaseServices.videoCall ||
									  firebaseServices.audioCall ||
									  firebaseServices.chat,
							videoCall: shouldDisable ? false : firebaseServices.videoCall,
							audioCall: shouldDisable ? false : firebaseServices.audioCall,
							chat: shouldDisable ? false : firebaseServices.chat,
							isRestricted,
						});
					}

					setIsSyncedWithFirebase(true);
				});
			} catch (error) {
				Sentry.captureException(error);
				console.error("Error fetching user status or services:", error);
			}
		};

		fetchUserStatusAndServices();

		return () => unsubscribe && unsubscribe();
	}, [userId, userPhone]);

	// Update Firebase when local state changes
	useEffect(() => {
		if (isSyncedWithFirebase && userId) {
			const servicesRef = doc(db, "services", userId);

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
	}, [services, userId, isSyncedWithFirebase]);

	// Update backend whenever services change
	useEffect(() => {
		const updateBackendServices = async () => {
			try {
				await axios.put(`${backendBaseUrl}/creator/updateUser/${userId}`, {
					videoAllowed: services.videoCall,
					audioAllowed: services.audioCall,
					chatAllowed: services.chat,
				});
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
		userId,
		isSyncedWithFirebase,
		creatorUser,
	]);

	// Toggle handler with Firebase sync
	const handleToggle = async (
		service: "myServices" | "videoCall" | "audioCall" | "chat"
	) => {
		if (services.isRestricted) return;

		userToggledRef.current = true;

		let updatedServices = { ...services };

		if (service === "myServices") {
			const newState = !services.myServices;
			updatedServices = {
				myServices: newState,
				videoCall: newState,
				audioCall: newState,
				chat: newState,
				isRestricted: false,
			};
		} else {
			updatedServices[service] = !services[service];
			const isAnyServiceOn =
				updatedServices.videoCall ||
				updatedServices.audioCall ||
				updatedServices.chat;
			updatedServices.myServices = isAnyServiceOn;
		}

		setServices(updatedServices);

		updateFirestoreCallServices(creatorUser, updatedServices);

		if (creatorUser?._id) {
			const updatePayload: Record<string, boolean> = {};

			// Dynamically set keys based on what was toggled
			if (service === "myServices" || service === "videoCall") {
				updatePayload.videoAllowed = updatedServices.videoCall;
			}
			if (service === "myServices" || service === "audioCall") {
				updatePayload.audioAllowed = updatedServices.audioCall;
			}
			if (service === "myServices" || service === "chat") {
				updatePayload.chatAllowed = updatedServices.chat;
			}

			await axios.put(
				`${backendBaseUrl}/creator/updateUser/${creatorUser._id}`,
				updatePayload
			);
		}

		setTimeout(() => {
			userToggledRef.current = false;
		}, 500);
	};

	return { services, handleToggle, setServices };
};

export default useServices;
