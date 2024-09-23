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
import { useEffect, useState } from "react";
import useChat from "./useChat";
import { logEvent } from "firebase/analytics";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/mixpanel";
import usePlatform from "./usePlatform";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

const useChatRequest = (onChatRequestUpdate?: any) => {
	const [loading, setLoading] = useState(false);
	const { currentUser } = useCurrentUsersContext();
	const [SheetOpen, setSheetOpen] = useState(false); // State to manage sheet visibility
	const chatRequestsRef = collection(db, "chatRequests");
	const chatRef = collection(db, "chats");
	const router = useRouter();
	const { createChat } = useChat();
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

	const handleChat = async (creator: any, clientUser: any) => {
		logEvent(analytics, "chat_now_click", {
			clientId: clientUser?._id,
			creatorId: creator._id,
		});

		logEvent(analytics, "call_click", {
			clientId: clientUser?._id,
			creatorId: creator._id,
		});

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
			const newChatRequestRef = doc(chatRequestsRef);
			const createdAtDate = clientUser?.createdAt
				? new Date(clientUser.createdAt)
				: new Date();
			const formattedDate = createdAtDate.toISOString().split("T")[0];

			await setDoc(newChatRequestRef, {
				creatorId: creator?._id,
				clientId: clientUser?._id,
				client_first_seen: formattedDate,
				creator_first_seen: creator.createdAt.toString().split("T")[0],
				client_balance: clientUser.walletBalance,
				rate: creator.chatRate,
				clientName: clientUser?.username,
				status: "pending",
				chatId: chatId,
				chatRate: creator.chatRate,
				createdAt: Date.now(),
			});

			// Save chatRequest document ID in local storage
			localStorage.setItem("chatRequestId", newChatRequestRef.id);

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
		setLoading(true);
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
					// startedAt: Date.now(),
					// endedAt: null,
					clientId: chatRequest.clientId,
					clientName: chatRequest.clientName,
					creatorId: chatRequest.creatorId,
					status: "active",
					messages: [],
					maxChatDuration,
					walletBalance: response.walletBalance,
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
					clientName: chatRequest.clientName,
					maxChatDuration,
					clientBalance: response.walletBalance,
				});
			}

			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: "accepted",
			});

			await updateDoc(doc(chatRef, chatId), {
				status: "active",
			});

			localStorage.setItem(
				"user2",
				JSON.stringify({
					clientId: chatRequest.clientId,
					creatorId: chatRequest.creatorId,
					User_First_Seen: chatRequest.client_first_seen,
					chatId: chatRequest.chatId,
					requestId: chatRequest.id,
					fullName: response.firstName + " " + response.lastname,
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

			router.push(
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

			await createChat(chatRequest.chatId, status, chatRequest.clientId);

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
