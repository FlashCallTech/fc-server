import { toast } from "@/components/ui/use-toast";
import { getUserById } from "@/lib/actions/client.actions";
import { analytics, db } from "@/lib/firebase";
import {
	arrayUnion,
	collection,
	deleteField,
	doc,
	getDoc,
	onSnapshot,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logEvent } from "firebase/analytics";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "./usePlatform";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import {
	backendBaseUrl,
	backendUrl,
	fetchFCMToken,
	sendChatNotification,
	sendNotification,
} from "@/lib/utils";
import axios from "axios";
import { clientUser, creatorUser, Service } from "@/types";

const useChatRequest = (onChatRequestUpdate?: any) => {
	const [loading, setLoading] = useState(false);
	const { currentUser } = useCurrentUsersContext();
	const [isSheetOpen, setSheetOpen] = useState(false); // State to manage sheet visibility
	const chatRequestsRef = collection(db, "chatRequests");
	const chatRef = collection(db, "chats");
	const messagesRef = collection(db, "messages");
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const { getDevicePlatform } = usePlatform();

	// Function to update expert's status
	const updateExpertStatus = async (phone: string, status: string) => {
		try {
			const response = await fetch("/api/set-status", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ phone, status, global: currentUser?.global ?? false }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Failed to update status");
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating expert status:", error);
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
	}

	const getUserData = async (userId: string, global: boolean) => {
		try {
			const response = await axios.get(
				`${backendBaseUrl}/creator/getUser/${userId}`
			);
			return global
				? Number(response.data.globalChatRate)
				: parseInt(response.data.chatRate, 10);
		} catch (error) {
			console.error("Error fetching user data:", error);
			throw error;
		}
	};

	const handleChat = async (creator: creatorUser, clientUser: clientUser, setChatState: any, discounts?: Service) => {
		if (!clientUser) router.push("sign-in");

		const chatRate = await getUserData(creator._id, clientUser.global ?? false);

		let maxCallDuration = (walletBalance / chatRate) * 60;
		maxCallDuration =
			maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

		if (maxCallDuration < 300) {
			trackEvent("MinimumBalance_NotAvailable", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator._id,
				Time_Duration_Available: maxCallDuration,
				Walletbalance_Available: clientUser?.walletBalance,
			});
			toast({
				variant: "destructive",
				title: "Insufficient Balance",
				description: "Your balance is below the minimum amount.",
				toastStatus: "negative",
			});
			router.push("/payment?callType=chat");
			return;
		}

		trackEvent("MinimumBalance_Available", {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
			Creator_ID: creator._id,
			Time_Duration_Available: maxCallDuration,
			Walletbalance_Available: clientUser?.walletBalance,
		});

		const callId = crypto.randomUUID();
		localStorage.setItem("CallId", callId);

		try {
			setSheetOpen(true);
			const userChatsDocRef = doc(db, "userchats", clientUser?._id);
			const creatorChatsDocRef = doc(db, "userchats", creator?._id);

			const userChatsDocSnapshot = await getDoc(userChatsDocRef);
			const creatorChatsDocSnapshot = await getDoc(creatorChatsDocRef);

			let existingChatId = null;

			if (userChatsDocSnapshot.exists() && creatorChatsDocSnapshot.exists()) {
				const userChatsData = userChatsDocSnapshot.data();
				const creatorChatsData = creatorChatsDocSnapshot.data();

				const existingChat =
					userChatsData.chats.find(
						(chat: any) => chat.receiverId === creator?._id
					) &&
					creatorChatsData.chats.find(
						(chat: any) => chat.receiverId === clientUser?._id
					);

				if (existingChat) {
					existingChatId = existingChat.chatId;
				}
			} else {
				try {
					await setDoc(
						userChatsDocSnapshot.ref,
						{
							isTyping: false,
						},
						{ merge: true }
					);

					await setDoc(
						creatorChatsDocSnapshot.ref,
						{
							isTyping: false,
						},
						{ merge: true }
					);
				} catch (error) {
					console.error("Error updating isTyping field: ", error);
				}
			}

			const chatId = existingChatId || doc(chatRef).id;

			const messagesDocRef = doc(messagesRef, chatId);
			const messagesDocSnapshot = await getDoc(messagesDocRef);
			if (!messagesDocSnapshot.exists()) {
				await setDoc(messagesDocSnapshot.ref, {
					messages: []
				})
			}

			const chatDocRef = doc(db, "callTimer", chatId as string);
			const callDoc = await getDoc(chatDocRef);
			if (callDoc.exists()) {
				await updateDoc(chatDocRef, {
					timeLeft: maxCallDuration,
					timeUtilized: 0,
				});
			} else {
				await setDoc(chatDocRef, {
					timeLeft: maxCallDuration,
					timeUtilized: 0,
				});
			}
			await setDoc(
				doc(db, "chats", chatId),
				{
					clientId: clientUser?._id,
					creatorId: creator?._id,
					discounts: null,
				},
				{ merge: true }
			);
			localStorage.setItem("chatId", chatId);
			const newChatRequestRef = doc(chatRequestsRef);
			const createdAtDate = clientUser?.createdAt
				? new Date(clientUser.createdAt)
				: new Date();
			const formattedDate = createdAtDate.toISOString().split("T")[0];

			const chatRequestData: any = {
				id: newChatRequestRef.id,
				callId,
				creatorId: creator?._id,
				creatorImg: creator.photo,
				clientId: clientUser?._id,
				clientImg: clientUser?.photo,
				client_first_seen: formattedDate,
				creator_first_seen: creator.createdAt ? creator.createdAt.toString().split("T")[0] : "",
				client_balance: clientUser.walletBalance,
				status: "pending",
				chatId: chatId,
				chatRate: String(chatRate),
				maxCallDuration,
				global: currentUser?.global ?? false,
				createdAt: Date.now(),
				discounts: discounts ?? null,
			};

			console.log("discount...", discounts);

			// Conditionally add fields if they exist
			if (creator.fullName) {
				chatRequestData.creatorName = creator.fullName;
			} else if (creator.phone) {
				chatRequestData.creatorName = maskPhoneNumber(creator.phone as string);
			}

			if (creator.phone) {
				chatRequestData.creatorPhone = creator.phone;
			}

			if (clientUser?.phone) {
				chatRequestData.clientPhone = clientUser.phone;
			}

			if (clientUser?.email) {
				chatRequestData.clientEmail = clientUser.email;
			}

			if (clientUser?.fullName) {
				chatRequestData.clientName = clientUser.fullName;
			} else if (clientUser?.phone) {
				chatRequestData.clientName = maskPhoneNumber(clientUser.phone as string);
			}

			await setDoc(newChatRequestRef, chatRequestData);


			const docSnap = await getDoc(newChatRequestRef);

			if (docSnap.exists()) {
				const chatRequestData = docSnap.data();
				const fcmToken = await fetchFCMToken(creator.phone as string);
				if (fcmToken) {
					await sendChatNotification(
						creator.phone as string,
						"chat",
						clientUser.username,
						"chat.ring",
						chatRequestData,
						fetchFCMToken,
						sendNotification,
						backendUrl as string
					);
				}
			} else {
				console.log("No such document!");
			}

			const timer = setTimeout(async () => {
				// Fetch the current status after 60 seconds
				const latestDocSnap = await getDoc(chatRequestDoc);

				if (latestDocSnap.exists()) {
					const data = latestDocSnap.data();
					if (data?.status === "pending") {
						// If the status is still "pending", update it to "ended"
						await setDoc(chatRequestDoc, { status: "ended" }, { merge: true });
					}
					// localStorage.removeItem("chatRequestId");
				}
			}, 60000); // 60 seconds

			// Save chatRequest document ID in local storage
			localStorage.setItem("chatRequestId", newChatRequestRef.id);
			window.dispatchEvent(new Event("chatRequestIdUpdated"));

			if (!userChatsDocSnapshot.exists()) {
				await setDoc(userChatsDocRef, { chats: [] });
			}

			if (!creatorChatsDocSnapshot.exists()) {
				await setDoc(creatorChatsDocRef, { chats: [] });
			}

			logEvent(analytics, "call_initiated", {
				clientId: clientUser?._id,
				creatorId: creator._id,
			});

			const chatRequestDoc = doc(chatRequestsRef, newChatRequestRef.id);
			const unsubscribe = onSnapshot(chatRequestDoc, (doc) => {
				const data = doc.data();
				if (data) {
					if (
						data.status === "ended" ||
						data.status === "rejected" ||
						data.status === "cancelled"
					) {
						updateExpertStatus(
							clientUser?.global
								? (clientUser?.email as string)
								: (clientUser?.phone as string),
							"Online"
						);
						setSheetOpen(false);
						setChatState(data.status);
						if (data.status === "rejected") {
							toast({
								variant: "destructive",
								title: "The user is busy, please try again later",
								toastStatus: "negative",
							});
						}
						if (data.status === "ended") {
							toast({
								variant: "destructive",
								title: "User is not answering please try again later",
								toastStatus: "negative",
							});
						}
						if (data.status === "cancelled") {
							toast({
								variant: "destructive",
								title: "You cancelled the request",
								toastStatus: "negative",
							});
						}
						localStorage.removeItem("user2");
						localStorage.removeItem("chatRequestId");
						localStorage.removeItem("chatId");
						localStorage.removeItem("CallId");
						unsubscribe();
					} else if (
						data.status === "accepted" &&
						clientUser?._id === data.clientId
					) {
						setSheetOpen(false);
						setChatState(data.status);
						updateExpertStatus(creator.phone as string, "Busy");
						unsubscribe();
						trackEvent("BookCall_Chat_Connected", {
							Client_ID: data.clientId,
							User_First_Seen: data.client_first_seen,
							Creator_ID: data.creatorId,
							Time_Duration_Available: data.maxCallDuration,
							Walletbalance_Available: clientUser?.walletBalance,
						});
						updateExpertStatus(data.creatorPhone as string, "Busy");
						router.replace(`/chat/${data.callId}/${data.chatId}/${data.clientId}`);
					} else if (data.status === "accepted") {
						clearTimeout(timer);
						unsubscribe();
						localStorage.setItem(
							"user2",
							JSON.stringify({
								clientId: data.clientId,
								creatorId: data.creatorId,
								User_First_Seen: formattedDate,
								chatId: chatId,
								requestId: doc.id,
								fullName: creator.firstName + " " + creator?.lastName,
								photo: creator.photo,
							})
						);
					} else {
						setChatState(data.status);
					}
				}
			});

			updateExpertStatus(currentUser?.global ? currentUser?.email as string : currentUser?.phone as string, "Busy");

			trackEvent("BookCall_Chat_initiated", {
				Client_ID: clientUser._id,
				User_First_Seen: formattedDate,
				Creator_ID: creator._id,
				Time_Duration_Available: maxCallDuration,
				Walletbalace_Available: clientUser.walletBalance,
			});
		} catch (error) {
			setSheetOpen(false);
			Sentry.captureException(error);
			console.error(error);
			toast({
				variant: "destructive",
				title: "Failed to send chat request",
				toastStatus: "negative",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptChat = async (chatRequest: any) => {
		console.log("Inside Accept Function: ", chatRequest);
		const userChatsRef = collection(db, "userchats");
		const chatId = chatRequest.chatId;
		const response = await getUserById(chatRequest.clientId as string);
		let maxChatDuration =
			(response.walletBalance / parseInt(chatRequest.chatRate, 10)) * 60; // in seconds
		maxChatDuration =
			maxChatDuration > 3600 ? 3600 : Math.floor(maxChatDuration);

		try {
			const existingChatDoc = await getDoc(doc(db, "chats", chatId));
			if (!existingChatDoc.data()?.status) {
				const chatData: any = {
					callId: chatRequest.callId,
					chatId: chatRequest.chatId,
					clientId: chatRequest.clientId,
					clientName: chatRequest.clientName,
					clientImg: chatRequest.clientImg,
					creatorId: chatRequest.creatorId,
					creatorName: chatRequest.creatorName,
					creatorPhone: chatRequest.creatorPhone,
					creatorImg: chatRequest.creatorImg,
					status: "active",
					timerSet: false,
					global: chatRequest.global ?? false,
					chatRate: chatRequest.chatRate,
					discounts: chatRequest.discounts ?? null
				};

				// Only add `clientPhone` if it exists
				if (chatRequest.clientPhone) {
					chatData.clientPhone = chatRequest.clientPhone;
				}

				// Only add `clientEmail` if it exists
				if (chatRequest.clientEmail) {
					chatData.clientEmail = chatRequest.clientEmail;
				}

				await setDoc(doc(db, "chats", chatId), chatData);


				const creatorChatUpdate = updateDoc(
					doc(userChatsRef, chatRequest.creatorId),
					{
						chats: arrayUnion({
							chatId: chatId,
							lastMessage: "",
							receiverId: chatRequest.clientId,
							updatedAt: new Date(),
						}),
						online: false,
					}
				);

				const clientChatUpdate = updateDoc(
					doc(userChatsRef, chatRequest.clientId),
					{
						chats: arrayUnion({
							chatId: chatId,
							lastMessage: "",
							receiverId: chatRequest.creatorId,
							updatedAt: new Date(),
						}),
						online: false,
					}
				);
				await Promise.all([creatorChatUpdate, clientChatUpdate]);
			} else {
				const chatData: any = {
					callId: chatRequest.callId,
					chatId: chatRequest.chatId,
					clientId: chatRequest.clientId,
					clientName: chatRequest.clientName,
					clientImg: chatRequest.clientImg,
					creatorId: chatRequest.creatorId,
					creatorName: chatRequest.creatorName,
					creatorPhone: chatRequest.creatorPhone,
					creatorImg: chatRequest.creatorImg,
					status: "active",
					timerSet: false,
					global: chatRequest.global ?? false,
					chatRate: chatRequest.chatRate,
					discounts: chatRequest.discounts ?? null,
				};

				// Only add `clientPhone` if it exists
				if (chatRequest.clientPhone) {
					chatData.clientPhone = chatRequest.clientPhone;
				}

				// Only add `clientEmail` if it exists
				if (chatRequest.clientEmail) {
					chatData.clientEmail = chatRequest.clientEmail;
				}

				await updateDoc(doc(db, "chats", chatId), chatData);

			}

			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: "accepted",
			});

			localStorage.setItem(
				"user2",
				JSON.stringify({
					clientId: chatRequest.clientId,
					creatorId: chatRequest.creatorId,
					User_First_Seen: chatRequest.client_first_seen,
					chatId: chatRequest.chatId,
					requestId: chatRequest.id,
					fullName: response.firstName
						? response.firstName + " " + response.lastname
						: undefined,
					phone: response.phone ?? "",
					photo: response.photo,
				})
			);

			let maxCallDuration =
				(walletBalance / parseInt(chatRequest.rate, 10)) * 60;
			maxCallDuration =
				maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

			trackEvent("BookCall_Chat_Connected", {
				Client_ID: chatRequest.clientId,
				User_First_Seen: chatRequest.client_first_seen,
				Creator_ID: chatRequest.creatorId,
				Time_Duration_Available: maxCallDuration,
				Walletbalace_Available: chatRequest.client_balance,
			});

			trackEvent("Creator_Chat_Connected", {
				Client_ID: chatRequest.clientId,
				Creator_First_Seen: chatRequest.creator_first_seen,
				Creator_ID: chatRequest.creatorId,
				Platform: getDevicePlatform(),
			});

			updateExpertStatus(currentUser?.phone as string, "Busy");
			localStorage.setItem("CallId", chatRequest.callId);

			router.replace(
				`/chat/${chatRequest.chatId}?creatorId=${chatRequest.creatorId}&clientId=${chatRequest.clientId}`
			);
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({
				variant: "destructive",
				title: "Failed to accept chat request",
				toastStatus: "negative",
			});
		}
	};

	// actions if chat request is rejected
	const handleRejectChat = async (chatRequest: any) => {
		if (!chatRequest) return;

		const userChatsRef = collection(db, "userchats");
		const chatId = chatRequest.chatId;

		const creatorChatUpdate = updateDoc(
			doc(userChatsRef, chatRequest.creatorId),
			{
				chats: arrayUnion({
					chatId: chatId,
					lastMessage: "",
					receiverId: chatRequest.clientId,
					updatedAt: new Date(),
				}),
				online: false,
			}
		);

		const clientChatUpdate = updateDoc(
			doc(userChatsRef, chatRequest.clientId),
			{
				chats: arrayUnion({
					chatId: chatId,
					lastMessage: "",
					receiverId: chatRequest.creatorId,
					updatedAt: new Date(),
				}),
				online: false,
			}
		);
		await Promise.all([creatorChatUpdate, clientChatUpdate]);

		localStorage.setItem(
			"user2",
			JSON.stringify({
				clientId: chatRequest.clientId,
				creatorId: chatRequest.creatorId,
				User_First_Seen: chatRequest.client_first_seen,
				chatId: chatRequest.chatId,
				requestId: chatRequest.id,
			})
		);

		try {
			const status = "rejected";
			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: status,
			});

			// await createChat(chatRequest.chatId, status, chatRequest.clientId);

			if (onChatRequestUpdate) {
				onChatRequestUpdate(null);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({
				variant: "destructive",
				title: "Failed to reject chat request",
				toastStatus: "negative",
			});
		}
	};

	return {
		handleAcceptChat,
		handleRejectChat,
		handleChat,
		chatRequestsRef,
		isSheetOpen,
		setSheetOpen,
		loading,
		setLoading,
	};
};

export default useChatRequest;
