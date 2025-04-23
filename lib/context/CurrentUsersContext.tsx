"use client";

import {
	ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
	useRef,
} from "react";

import { clientUser, creatorUser } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import {
	arrayUnion,
	deleteDoc,
	doc,
	getDoc,
	onSnapshot,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { backendBaseUrl } from "../utils";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface CurrentUsersContextValue {
	clientUser: clientUser | null;
	creatorUser: creatorUser | null;
	currentUser: clientUser | creatorUser | null;
	setClientUser: (user: clientUser | null) => void;
	setCreatorUser: (user: creatorUser | null) => void;
	userType: string | null;
	refreshCurrentUser: () => Promise<void>;
	handleSignout: () => void;
	currentTheme: string;
	setCurrentTheme: any;
	authenticationSheetOpen: boolean;
	setAuthenticationSheetOpen: any;
	fetchingUser: boolean;
	creatorURL: string;
	updateCreatorURL: (url: any) => void;
	ongoingCallStatus: string;
	setOngoingCallStatus: any;
	region: string;
	userFetched: boolean;
	pendingNotifications: number;
	setPendingNotifications: any;
	setPreviousPendingNotifications: any;
	fetchNotificationsOnce: any;
}

// Create the context with a default value of null
const CurrentUsersContext = createContext<CurrentUsersContextValue | null>(
	null
);

// Custom hook to use the CurrentUsersContext
export const useCurrentUsersContext = () => {
	const context = useContext(CurrentUsersContext);
	if (!context) {
		throw new Error(
			"useCurrentUsersContext must be used within a CurrentUsersProvider"
		);
	}
	return context;
};

export const CurrentUsersProvider = ({
	children,
	region,
}: {
	children: ReactNode;
	region: string;
}) => {
	const [clientUser, setClientUser] = useState<clientUser | null>(null);
	const [creatorUser, setCreatorUser] = useState<creatorUser | null>(null);
	const [currentTheme, setCurrentTheme] = useState("");
	const [authenticationSheetOpen, setAuthenticationSheetOpen] = useState(false);
	const [fetchingUser, setFetchingUser] = useState(false);
	const [userType, setUserType] = useState<string | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [creatorURL, setCreatorURL] = useState("");
	const [ongoingCallStatus, setOngoingCallStatus] = useState("");
	const [userFetched, setUserFetched] = useState(false);
	const [pendingNotifications, setPendingNotifications] = useState(0);
	const [previousPendingNotifications, setPreviousPendingNotifications] =
		useState<number | null>(null);

	const { toast } = useToast();
	const router = useRouter();

	let currentUser = useMemo(
		() => creatorUser || clientUser,
		[creatorUser, clientUser]
	);

	const updateCreatorURL = (url: any) => {
		setCreatorURL(url);
		localStorage.setItem("creatorURL", url);
	};

	const checkFirestoreSession = (userId: string) => {
		const sessionDocRef = doc(db, "sessions", userId);
		const unsubscribe = onSnapshot(sessionDocRef, (sessionDoc) => {
			if (sessionDoc.exists()) {
				const { ongoingCall } = sessionDoc.data();

				if (ongoingCall && ongoingCall.status) {
					setOngoingCallStatus(ongoingCall.status);
				}
			}
		});

		return unsubscribe;
	};

	useEffect(() => {
		if (clientUser?._id) {
			const unsubscribe = checkFirestoreSession(clientUser._id);
			return () => {
				unsubscribe();
			};
		}
	}, [clientUser?._id]);

	useEffect(() => {
		// Initialize the creatorURL from localStorage on component mount
		const storedURL = localStorage.getItem("creatorURL");
		if (storedURL) {
			setCreatorURL(storedURL);
		}

		// Add event listener for localStorage changes
		const handleStorageChange = (event: any) => {
			if (event.key === "creatorURL") {
				setCreatorURL(event.newValue);
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	const listenerRef = useRef<(() => void) | null>(null);

	const initializeNotificationsListener = (creatorId: string) => {
		if (!creatorId) return;

		if (listenerRef.current) {
			listenerRef.current();
		}

		let lastNotificationCount = previousPendingNotifications ?? 0;

		const docRef = doc(db, "notifications", `notifications_${creatorId}`);
		listenerRef.current = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				const totalNotifications = data.notifications.length;

				// Play notification sound if the count has increased
				if (totalNotifications > lastNotificationCount) {
					const notificationSound = new Audio(
						"/sounds/pendingNotification.wav"
					);
					notificationSound.play();
				}

				// Update local and state variables
				lastNotificationCount = totalNotifications;
				setPendingNotifications(totalNotifications);
				setPreviousPendingNotifications(totalNotifications);
			} else {
				// Reset states if the document doesn't exist
				setPendingNotifications(0);
				setPreviousPendingNotifications(0);
			}
		});
	};

	const fetchNotificationsOnce = async (creatorId: string) => {
		try {
			const response = await axios.get(
				`${backendBaseUrl}/user/notification/getNotifications`,
				{
					params: { page: 1, limit: 10, creatorId },
				}
			);

			if (response.status === 200) {
				const totalNotifications = response.data.totalNotifications || 0;
				setPendingNotifications(totalNotifications);
				setPreviousPendingNotifications(totalNotifications);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error fetching notifications:", error);
		}
	};

	useEffect(() => {
		if (!creatorUser?._id) return;

		initializeNotificationsListener(creatorUser._id);

		return () => {
			if (listenerRef.current) {
				listenerRef.current();
				listenerRef.current = null;
			}
		};
	}, [creatorUser?._id]);

	// Function to handle user signout
	const handleSignout = async () => {
		if (!currentUser || !region) return;

		if (region !== "India") {
			await signOut(auth);
			localStorage.removeItem("currentUserID");
			setClientUser(null);
			setCreatorUser(null);
		} else {
			localStorage.removeItem("currentUserID");
			localStorage.removeItem("authToken");
			const creatorStatusDocRef = doc(
				db,
				"userStatus",
				currentUser?.phone as string
			);
			const creatorStatusDoc = await getDoc(creatorStatusDocRef);
			if (creatorStatusDoc.exists()) {
				await updateDoc(creatorStatusDocRef, {
					status: "Offline",
					loginStatus: false,
				});
			}
			// Clear user data and local storage
			await axios.post(`${backendBaseUrl}/user/endSession`);

			localStorage.setItem("userType", "client");

			setUserType("client");

			setClientUser(null);
			setCreatorUser(null);
			currentUser = null;
		}
	};

	const maskPhoneNumber = (phoneNumber: string) => {
		// Remove the '+91' prefix
		if (phoneNumber) {
			let cleanedNumber = phoneNumber.replace("+91", "");

			// Mask the next 5 digits, leaving the first 2 digits unmasked
			let maskedNumber =
				cleanedNumber.substring(0, 2) + "*****" + cleanedNumber.substring(7);

			return maskedNumber;
		}
	};

	const moveChatFromTempToMain = async (
		temporaryClientId: string,
		data: clientUser
	) => {
		if (!temporaryClientId || !data)
			return console.error("Missing temporaryClientId or data");

		const tempDocRef = doc(db, "userHelpChats", temporaryClientId);
		const mainDocRef = doc(db, "userHelpChats", data._id);

		try {
			console.log("Fetching temporary document from:", tempDocRef.path);
			const tempDocSnap = await getDoc(tempDocRef);
			if (!tempDocSnap.exists()) {
				console.error("Temporary document does not exist");
				return;
			}
			const tempData = tempDocSnap.data();
			console.log("Temporary document data:", tempData);
			if (!tempData.chats || !Array.isArray(tempData.chats)) {
				console.error("Invalid chats array in temporary document");
				return;
			}

			// Process each chat element from the temporary document
			for (const chatTemp of tempData.chats) {
				console.log("Processing chat element with chatId:", chatTemp.chatId);
				const chatElement: any = {
					chatId: chatTemp.chatId,
					creatorName: chatTemp.creatorName,
					creatorImg: chatTemp.creatorImg,
					receiverId: chatTemp.receiverId,
					isSeen: chatTemp.isSeen,
					updatedAt: chatTemp.updatedAt,
				};
				if (chatTemp.lastMessage) {
					chatElement.lastMessage = chatTemp.lastMessage;
				}
				console.log("Constructed chat element:", chatElement);

				// MAIN DOCUMENT PROCESSING
				console.log("Fetching main document from:", mainDocRef.path);
				const mainDocSnap = await getDoc(mainDocRef);
				let matchedIndex = -1;
				if (mainDocSnap.exists()) {
					const mainData = mainDocSnap.data();
					console.log("Main document data:", mainData);
					if (mainData.chats && Array.isArray(mainData.chats)) {
						matchedIndex = mainData.chats.findIndex(
							(el: any) => el.receiverId === chatTemp.receiverId
						);
						console.log(
							"Matched index in main document for receiverId",
							chatTemp.receiverId,
							":",
							matchedIndex
						);
						if (matchedIndex !== -1) {
							console.log("Updating existing chat element in main document");
							mainData.chats[matchedIndex].lastMessage = chatTemp.lastMessage;
							mainData.chats[matchedIndex].updatedAt =
								chatTemp.updatedAt || Date.now();
							await updateDoc(mainDocRef, { chats: mainData.chats });
							console.log(
								"Chat element updated in main document for receiver",
								chatTemp.receiverId
							);

							// Merge messages in corresponding helpChat document
							const targetChatId = mainData.chats[matchedIndex].chatId;
							console.log(
								"Fetching source helpChat document from:",
								`helpChat/${chatTemp.chatId}`
							);
							const sourceHelpChatRef = doc(db, "helpChat", chatTemp.chatId);
							const targetHelpChatRef = doc(db, "helpChat", targetChatId);
							const sourceHelpChatSnap = await getDoc(sourceHelpChatRef);
							if (sourceHelpChatSnap.exists()) {
								const sourceMessages = sourceHelpChatSnap.data().messages || [];
								console.log("Source messages:", sourceMessages);
								const modifiedMessages = sourceMessages.map((msg: any) =>
									msg.senderId === temporaryClientId
										? { ...msg, senderId: data._id }
										: msg
								);
								console.log("Modified messages:", modifiedMessages);
								console.log(
									"Fetching target helpChat document from:",
									targetHelpChatRef.path
								);
								const targetHelpChatSnap = await getDoc(targetHelpChatRef);
								const targetMessages = targetHelpChatSnap.exists()
									? targetHelpChatSnap.data().messages || []
									: [];
								console.log("Target messages:", targetMessages);
								const mergedMessages = [
									...targetMessages,
									...modifiedMessages,
								].sort((a, b) => a.createdAt - b.createdAt);
								console.log("Merged messages:", mergedMessages);
								await updateDoc(targetHelpChatRef, {
									messages: mergedMessages,
								});
								console.log(
									"Updated target helpChat document for chatId",
									targetChatId
								);
								await deleteDoc(sourceHelpChatRef);
								console.log(
									"Deleted source helpChat document for chatId",
									chatTemp.chatId
								);
							}
						} else {
							console.log(
								"No matching chat element found in main document; pushing new element"
							);
							await updateDoc(mainDocRef, { chats: arrayUnion(chatElement) });
							console.log(
								"Chat element pushed to main document for receiver",
								chatTemp.receiverId
							);
							console.log(
								"Fetching source helpChat document from:",
								`helpChat/${chatTemp.chatId}`
							);
							const sourceHelpChatRef = doc(db, "helpChat", chatTemp.chatId);
							const sourceHelpChatSnap = await getDoc(sourceHelpChatRef);
							if (sourceHelpChatSnap.exists()) {
								const sourceMessages = sourceHelpChatSnap.data().messages || [];
								console.log("Source messages:", sourceMessages);
								const modifiedMessages = sourceMessages.map((msg: any) =>
									msg.senderId === temporaryClientId
										? { ...msg, senderId: data._id }
										: msg
								);
								console.log("Modified messages:", modifiedMessages);
								await updateDoc(sourceHelpChatRef, {
									messages: modifiedMessages,
								});
								console.log(
									"Updated source helpChat document for chatId",
									chatTemp.chatId
								);
							}
						}
					} else {
						console.log(
							"Main document exists but no chats array found; pushing new element"
						);
						await updateDoc(mainDocRef, { chats: arrayUnion(chatElement) });
						console.log(
							"Chat element pushed to main document (no chats array found) for receiver",
							chatTemp.receiverId
						);
					}
				} else {
					console.log("Main document does not exist; creating new document");
					await setDoc(mainDocRef, { chats: [chatElement] });
					console.log(
						"Main document created with temporary document data for receiver",
						chatTemp.receiverId
					);
					console.log(
						"Fetching source helpChat document from:",
						`helpChat/${chatTemp.chatId}`
					);
					const sourceHelpChatRef = doc(db, "helpChat", chatTemp.chatId);
					const sourceHelpChatSnap = await getDoc(sourceHelpChatRef);
					if (sourceHelpChatSnap.exists()) {
						const sourceMessages = sourceHelpChatSnap.data().messages || [];
						console.log("Source messages:", sourceMessages);
						const modifiedMessages = sourceMessages.map((msg: any) =>
							msg.senderId === temporaryClientId
								? { ...msg, senderId: data._id }
								: msg
						);
						console.log("Modified messages:", modifiedMessages);
						await updateDoc(sourceHelpChatRef, { messages: modifiedMessages });
						console.log(
							"Updated source helpChat document for chatId",
							chatTemp.chatId
						);
					}
				}

				// OTHER DOCUMENT PROCESSING
				console.log(
					"Processing other document for receiver:",
					chatTemp.receiverId
				);
				const otherDocRef = doc(db, "userHelpChats", chatTemp.receiverId);
				const otherDocSnap = await getDoc(otherDocRef);
				if (otherDocSnap.exists()) {
					const otherData = otherDocSnap.data();
					console.log("Other document data:", otherData);
					if (otherData.chats && Array.isArray(otherData.chats)) {
						// First check: if any element has receiverId equal to data._id
						const indexReceiver = otherData.chats.findIndex(
							(el: any) => el.receiverId === data._id
						);
						console.log("Index for receiverId === data._id:", indexReceiver);
						if (indexReceiver !== -1) {
							console.log(
								"Found element with receiverId equal to data._id, updating lastMessage and updatedAt"
							);
							otherData.chats[indexReceiver].lastMessage = chatTemp.lastMessage;
							otherData.chats[indexReceiver].updatedAt = chatTemp.updatedAt;

							// Then find and remove any element with receiverId equal to temporaryClientId
							const indexTemp = otherData.chats.findIndex(
								(el: any) => el.receiverId === temporaryClientId
							);
							if (indexTemp !== -1) {
								console.log(
									"Found element with receiverId equal to temporaryClientId; removing it"
								);
								otherData.chats.splice(indexTemp, 1);
							}

							await updateDoc(otherDocRef, { chats: otherData.chats });
							console.log(
								"Updated other document after processing element with receiverId equal to data._id for receiver",
								chatTemp.receiverId
							);
							continue;
						}

						// Otherwise, check if an element with matching chatId exists.
						const indexChatId = otherData.chats.findIndex(
							(el: any) => el.chatId === chatTemp.chatId
						);
						console.log(
							"Index for chatId match in other document:",
							indexChatId
						);
						if (indexChatId !== -1) {
							console.log(
								"Found element with matching chatId; updating receiverId and other fields"
							);
							otherData.chats[indexChatId].receiverId = data._id;
							otherData.chats[indexChatId].clientImg = data.photo;
							otherData.chats[indexChatId].clientName =
								data.fullName || maskPhoneNumber(data.phone as string);
							otherData.chats[indexChatId].updatedAt = Date.now();
							await updateDoc(otherDocRef, { chats: otherData.chats });
							console.log(
								"Updated receiverId in other document for chatId",
								chatTemp.chatId
							);
						} else {
							console.log(
								"No matching element in other document for chatId",
								chatTemp.chatId
							);
						}
					} else {
						console.log("Other document has no chats array");
					}
				} else {
					console.log(
						"Other document does not exist for receiver:",
						chatTemp.receiverId
					);
				}
			}
			console.log("Deleting temporary document:", tempDocRef.path);
			await deleteDoc(tempDocRef);
			console.log("Removing temporaryClientId from localStorage");
			localStorage.removeItem("temporaryClientId");
		} catch (error) {
			console.error("Error moving chat:", error);
		}
	};

	// Function to fetch the current user
	const fetchCurrentUser = async () => {
		try {
			setFetchingUser(true);

			const response = await axios.get(`${backendBaseUrl}/user/getProfile`, {
				withCredentials: true,
			});

			const { success, data, token } = response.data;

			if (success && data) {
				if (data.userType === "creator") {
					setCreatorUser(data);
					setClientUser(null);
					setUserType("creator");
				} else {
					const temporaryClientId = localStorage.getItem("temporaryClientId");
					if (temporaryClientId && data) {
						console.log("Trying to move the chat...");
						await moveChatFromTempToMain(temporaryClientId, data);
						console.log("chat moved successfully...");
					}
					setClientUser(data);
					setCreatorUser(null);
					setUserType("client");
				}
				setAuthToken(token);
				localStorage.setItem("userType", data.userType);
			} else {
				handleSignout();
				toast({
					variant: "destructive",
					title: "Sign-out",
					description: "You have been signed out. Please log in again.",
					toastStatus: "positive",
				});
			}
		} catch (error: any) {
			if (error.response) {
				const {
					status,
					data: { message },
				} = error.response;

				if (status === 401) {
					handleSignout();
				}
			} else {
				toast({
					variant: "destructive",
					title: "Network Error",
					description: "A network error occurred. Please try again later.",
					toastStatus: "negative",
				});
			}
		} finally {
			setFetchingUser(false);
			setUserFetched(true);
		}
	};

	const fetchGlobalCurrentUser = async (email: string) => {
		try {
			console.log("Fetching global client");
			setFetchingUser(true);

			if (email) {
				const response = await axios.post(
					`${backendBaseUrl}/client/getGlobalUserByEmail/${email}`
				);

				const data = response.data;

				if (data.role === "client") {
					setClientUser(data);
					setCreatorUser(null);
					setUserType("client");
				}
				localStorage.setItem("userType", data.role);
			} else console.error("Email not provided");
		} catch (error) {
			console.error(error);
		} finally {
			setFetchingUser(false);
			setUserFetched(true);
		}
	};

	useEffect(() => {
		if (!region) return;

		if (region === "India") {
			fetchCurrentUser();
			return;
		}

		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user && user.email) {
				fetchGlobalCurrentUser(user.email);
			} else {
				console.error("Unauthorized");
				localStorage.removeItem("currentUserID");
				setClientUser(null);
				setCreatorUser(null);
				setUserFetched(true);
			}
		});

		return () => {
			unsubscribe();
		};
	}, [region]);

	const refreshCurrentUser = async () => {
		if (region === "India") await fetchCurrentUser();
		else {
			const email = auth.currentUser?.email;
			console.log("Email: ", email);
			if (email) await fetchGlobalCurrentUser(email);
		}
	};

	useEffect(() => {
		if (currentUser && userType === "creator" && !currentUser.firstName) {
			router.replace("/updateDetails");
			setTimeout(() => {
				toast({
					variant: "destructive",
					title: "Greetings Friend",
					description: "Complete Your Profile Details...",
					toastStatus: "positive",
				});
			}, 1000);
		}
	}, [router, userType, currentUser]);

	useEffect(() => {
		if (!currentUser || !region) {
			return;
		}

		if (region === "India") {
			const userAuthRef = doc(db, "authToken", currentUser.phone as string);

			const unsubscribe = onSnapshot(
				userAuthRef,
				(doc) => {
					try {
						if (doc.exists()) {
							const data = doc.data();

							if (data?.token && data.token !== authToken) {
								handleSignout();
								toast({
									variant: "destructive",
									title: "Another Session Detected",
									description: "Logging Out...",
									toastStatus: "positive",
								});
							}
						}
					} catch (error) {
						Sentry.captureException(error);
						console.error("Error processing the document: ", error);
					}
				},
				(error) => {
					console.error("Error fetching document: ", error);
				}
			);

			return () => {
				unsubscribe();
			};
		}
	}, [currentUser?._id, authToken]);

	return (
		<CurrentUsersContext.Provider
			value={{
				clientUser,
				creatorUser,
				currentUser,
				setClientUser,
				setCreatorUser,
				userType,
				refreshCurrentUser,
				handleSignout,
				currentTheme,
				setCurrentTheme,
				authenticationSheetOpen,
				setAuthenticationSheetOpen,
				fetchingUser,
				creatorURL,
				updateCreatorURL,
				ongoingCallStatus,
				setOngoingCallStatus,
				region,
				userFetched,
				pendingNotifications,
				setPendingNotifications,
				setPreviousPendingNotifications,
				fetchNotificationsOnce,
			}}
		>
			{children}
		</CurrentUsersContext.Provider>
	);
};

export default CurrentUsersProvider;
