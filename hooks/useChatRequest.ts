import { toast } from "@/components/ui/use-toast";
import { getUserById } from "@/lib/actions/client.actions";
import { analytics, db } from "@/lib/firebase";
import {
	arrayUnion,
	collection,
	doc,
	getDoc,
	onSnapshot,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logEvent } from "firebase/analytics";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "./usePlatform";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import { backendBaseUrl, fetchFCMToken, sendNotification } from "@/lib/utils";
import axios from "axios";

const useChatRequest = (onChatRequestUpdate?: any) => {
	const [loading, setLoading] = useState(false);
	const { currentUser } = useCurrentUsersContext();
	const [SheetOpen, setSheetOpen] = useState(false); // State to manage sheet visibility
	const chatRequestsRef = collection(db, "chatRequests");
	const chatRef = collection(db, "chats");
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
				body: JSON.stringify({ phone, status }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || "Failed to update status");
			}

			console.log("Expert status updated to:", status);
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error updating expert status:", error);
		}
	};

	function maskPhoneNumber(phoneNumber: string) {
		// Remove the '+91' prefix
		if (phoneNumber) {
			let cleanedNumber = phoneNumber.replace("+91", "");

			// Mask the next 5 digits, leaving the first 2 digits unmasked
			let maskedNumber =
				cleanedNumber.substring(0, 2) + "*****" + cleanedNumber.substring(7);

			return maskedNumber;
		}
	}

	const getUserData = async (userId: string) => {
		try {
			const response = await axios.get(
				`${backendBaseUrl}/creator/getUser/${userId}`
			);
			console.log("User data:", response.data.chatRate);
			return response.data.chatRate;
		} catch (error) {
			console.error("Error fetching user data:", error);
			throw error;
		}
	};

	const handleChat = async (creator: any, clientUser: any) => {
		if (!clientUser) router.push("sign-in");

		let maxCallDuration = (walletBalance / parseInt(creator.chatRate, 10)) * 60;
		maxCallDuration =
			maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

		if (maxCallDuration < 300) {
			toast({
				variant: "destructive",
				title: "Insufficient Balance",
				description: "Your balance is below the minimum amount.",
			});
			router.push("/payment?callType=chat");
			return;
		}

		console.log("Trying to set the callID");
		const callId = crypto.randomUUID();
		console.log("CallId: ", callId);
		localStorage.setItem("CallId", callId);

		setSheetOpen(true);

		try {
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
			}

			const chatId = existingChatId || doc(chatRef).id;
			localStorage.setItem("chatId", chatId);
			const newChatRequestRef = doc(chatRequestsRef);
			const createdAtDate = clientUser?.createdAt
				? new Date(clientUser.createdAt)
				: new Date();
			const formattedDate = createdAtDate.toISOString().split("T")[0];

			const chatRate = await getUserData(creator._id);

			await setDoc(newChatRequestRef, {
				id: newChatRequestRef.id,
				callId,
				creatorId: creator?._id,
				creatorName: creator.fullName
					? creator.fullName
					: maskPhoneNumber(creator.phone),
				creatorPhone: creator.phone,
				creatorImg: creator.photo,
				clientId: clientUser?._id,
				clientPhone: clientUser?.phone,
				clientName: clientUser?.fullName
					? clientUser.fullName
					: maskPhoneNumber(clientUser.phone),
				clientImg: clientUser?.photo,
				client_first_seen: formattedDate,
				creator_first_seen: creator.createdAt.toString().split("T")[0],
				client_balance: clientUser.walletBalance,
				status: "pending",
				chatId: chatId,
				chatRate,
				createdAt: Date.now(),
			});

			const docSnap = await getDoc(newChatRequestRef);

			if (docSnap.exists()) {
				const chatRequestData = docSnap.data();
				const fcmToken = await fetchFCMToken(creator.phone);
				if (fcmToken) {
					sendNotification(
						fcmToken,
						`Incoming Chat Request`,
						`Chat Request from ${clientUser.username}`,
						{
							clientId: chatRequestData.clientId,
							clientName: chatRequestData.clientName,
							clientPhone: chatRequestData.clientPhone,
							clientImg: chatRequestData.clientImg,
							creatorId: chatRequestData.creatorId,
							creatorName: chatRequestData.creatorName,
							creatorPhone: chatRequestData.creatorPhone,
							creatorImg: chatRequestData.creatorImg,
							chatId: chatRequestData.chatId,
							chatRequestId: chatRequestData.id,
							callId: chatRequestData.callId,
							chatRate: chatRequestData.chatRate,
							client_first_seen: chatRequestData.client_first_seen,
							creator_first_seen: chatRequestData.creator_first_seen,
							createdAt: String(chatRequestData.createdAt)
						},
						`https:flashcall.me/`
					);
				}
				console.log("Document data:", chatRequestData);
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
						console.log(
							"Chat request status updated to 'ended' due to timeout"
						);
					}
					// localStorage.removeItem("chatRequestId");
				}
			}, 30000); // 60 seconds

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
				if (data && data.status === "accepted") {
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
				}
			});
			trackEvent("BookCall_Chat_initiated", {
				Client_ID: clientUser._id,
				User_First_Seen: formattedDate,
				Creator_ID: creator._id,
				Time_Duration_Available: maxCallDuration,
				Walletbalace_Available: clientUser.walletBalance,
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({ variant: "destructive", title: "Failed to send chat request" });
		}
	};

	const handleAcceptChat = async (chatRequest: any) => {
		console.log("Trying to accept the chat");
		const userChatsRef = collection(db, "userchats");
		const chatId = chatRequest.chatId;
		const response = await getUserById(chatRequest.clientId as string);
		let maxChatDuration =
			(response.walletBalance / parseInt(chatRequest.chatRate, 10)) * 60; // in seconds
		maxChatDuration =
			maxChatDuration > 3600 ? 3600 : Math.floor(maxChatDuration);

		try {
			const existingChatDoc = await getDoc(doc(db, "chats", chatId));
			if (!existingChatDoc.exists()) {
				await setDoc(doc(db, "chats", chatId), {
					callId: chatRequest.callId,
					chatId: chatRequest.chatId,
					clientId: chatRequest.clientId,
					clientName: chatRequest.clientName,
					clientPhone: response.phone,
					clientImg: response.photo,
					creatorId: chatRequest.creatorId,
					creatorName: chatRequest.creatorName,
					creatorPhone: chatRequest.creatorPhone,
					creatorImg: chatRequest.creatorImg,
					status: "active",
					messages: [],
					timerSet: false,
					chatRate: chatRequest.rate,
				});

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
				await updateDoc(doc(db, "chats", chatId), {
					callId: chatRequest.callId,
					clientName: chatRequest.clientName,
					maxChatDuration,
					chatId: chatRequest.chatId,
					clientBalance: response.walletBalance,
					timerSet: false,
				});
			}

			await updateDoc(doc(chatRef, chatId), {
				status: "active",
			});

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
					phone: response.phone,
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
			toast({ variant: "destructive", title: "Failed to accept chat request" });
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
			toast({ variant: "destructive", title: "Failed to reject chat request" });
		}
	};

	return {
		handleAcceptChat,
		handleRejectChat,
		handleChat,
		chatRequestsRef,
		SheetOpen,
	};
};

export default useChatRequest;
