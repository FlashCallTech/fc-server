import React, { useEffect, useState } from "react";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import MeetingModal from "../meeting/MeetingModal";
import { logEvent } from "firebase/analytics";
import { Button } from "../ui/button";
import {
	arrayUnion,
	collection,
	doc,
	setDoc,
	updateDoc,
	onSnapshot,
	query,
	where,
	getDoc,
} from "firebase/firestore";
import { analytics, db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import useChat from "@/hooks/useChat";
import ContentLoading from "../shared/ContentLoading";

interface CallingOptions {
	creator: creatorUser;
}

const initialValues = {
	link: "",
};

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const [meetingState, setMeetingState] = useState<
		"isJoiningMeeting" | "isInstantMeeting" | undefined
	>(undefined);
	const client = useStreamVideoClient();
	const [callType, setCallType] = useState("");
	const { user } = useUser();
	const { toast } = useToast();
	const [chatRequest, setChatRequest] = useState<any>(null);
	const [isSheetOpen, setSheetOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const chatRequestsRef = collection(db, "chatRequests");
	const chatRef = collection(db, "chats");
	const clientId = user?.publicMetadata?.userId as string;
	const storedCallId = localStorage.getItem("activeCallId");
	const { createChat } = useChat();

	const handleCallAccepted = async (call: Call) => {
		toast({
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});
		setSheetOpen(false);
		await call?.leave();
		router.push(`/meeting/${call.id}`);
	};

	const handleCallRejected = () => {
		toast({
			title: "Call Rejected",
			description: "The call was rejected. Please try again later.",
		});
		setSheetOpen(false);
	};

	const createMeeting = async () => {
		if (!client || !user) return;
		try {
			const id = crypto.randomUUID();
			const call =
				callType === "video"
					? client.call("default", id)
					: callType === "audio" && client.call("audio_room", id);

			if (!call) throw new Error("Failed to create meeting");

			setMeetingState(undefined);
			const members = [
				{
					user_id: "6687f5eeb51cc5626f5db5ea",
					// user_id: "66681d96436f89b49d8b498b",
					custom: {
						name: String(creator.username),
						type: "expert",
						image: creator.photo,
					},
					role: "call_member",
				},
				{
					user_id: String(user?.publicMetadata?.userId),
					custom: {
						name: String(user.username),
						type: "client",
						image: user.imageUrl,
					},
					role: "admin",
				},
			];

			const startsAt = new Date(Date.now()).toISOString();
			const description = `${
				callType === "video"
					? `Video Call With Expert ${creator.username}`
					: `Audio Call With Expert ${creator.username}`
			}`;

			const ratePerMinute =
				callType === "video"
					? parseInt(creator?.videoRate, 10)
					: parseInt(creator?.audioRate, 10);
			let maxCallDuration = (walletBalance / ratePerMinute) * 60; // in seconds
			maxCallDuration =
				maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

			// Check if maxCallDuration is less than 5 minutes (300 seconds)
			if (maxCallDuration < 300) {
				toast({
					title: "Insufficient Balance",
					description: "Your balance is below the minimum amount.",
				});
				router.push("/payment");
				return;
			}

			// console.log(maxCallDuration, ratePerMinute);

			await call.getOrCreate({
				ring: true,
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
					},
					settings_override: {
						limits: {
							max_duration_seconds: maxCallDuration,
							max_participants: 2,
						},
					},
				},
			});

			logEvent(analytics, "call_initiated", {
				callId: id,
				description: description,
			});

			fetch("/api/v1/calls/registerCall", {
				method: "POST",
				body: JSON.stringify({
					callId: id as string,
					type: callType as string,
					status: "Initiated",
					creator: String(user?.publicMetadata?.userId),
					members: members,
				}),
				headers: { "Content-Type": "application/json" },
			});

			call.on("call.accepted", () => handleCallAccepted(call));
			call.on("call.rejected", handleCallRejected);

			// toast({
			// 	title: "Meeting Created",
			// 	description: "Waiting for Expert to Respond",
			// });
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to create Meeting" });
		}
	};

	const handleChat = async () => {
		logEvent(analytics, "chat_now_click", {
			userId: user?.publicMetadata?.userId,
			creatorId: creator._id,
		});

		if (!user) router.push("sign-in");
		let maxCallDuration =
			(walletBalance / parseInt(creator?.chatRate, 10)) * 60; // in seconds
		maxCallDuration =
			maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

		// Check if maxCallDuration is less than 5 minutes (300 seconds)
		if (maxCallDuration < 60) {
			toast({
				title: "Insufficient Balance",
				description: "Your balance is below the minimum amount.",
			});
			router.push("/payment");
			return;
		}
		// console.log(chatRef);
		const chatRequestsRef = collection(db, "chatRequests");

		try {
			const userChatsDocRef = doc(db, "userchats", clientId);
			const creatorChatsDocRef = doc(
				db,
				"userchats",
				"6675197dc56dfe13b3ccabd3"
			);

			const userChatsDocSnapshot = await getDoc(userChatsDocRef);
			const creatorChatsDocSnapshot = await getDoc(creatorChatsDocRef);

			let existingChatId = null;

			if (userChatsDocSnapshot.exists() && creatorChatsDocSnapshot.exists()) {
				const userChatsData = userChatsDocSnapshot.data();
				const creatorChatsData = creatorChatsDocSnapshot.data();

				// console.log(userChatsData)

				const existingChat =
					userChatsData.chats.find(
						(chat: any) => chat.receiverId === "6675197dc56dfe13b3ccabd3"
					) ||
					creatorChatsData.chats.find(
						(chat: any) => chat.receiverId === clientId
					);

				if (existingChat) {
					existingChatId = existingChat.chatId;
				}
			}

			// Use existing chatId if found, otherwise create a new one
			const chatId = existingChatId || doc(chatRef).id;

			// Create a new chat request
			const newChatRequestRef = doc(chatRequestsRef);
			await setDoc(newChatRequestRef, {
				creatorId: "6675197dc56dfe13b3ccabd3",
				clientId: clientId,
				status: "pending",
				chatId: chatId,
				createdAt: Date.now(),
			});

			if (!userChatsDocSnapshot.exists()) {
				await setDoc(userChatsDocRef, { chats: [] });
			}

			if (!creatorChatsDocSnapshot.exists()) {
				await setDoc(creatorChatsDocRef, { chats: [] });
			}

			setSheetOpen(true);

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
							chatId: chatId,
							requestId: doc.id,
							fullName: "Chirag Goel(Creator)",
							photo:
								"https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yZ3Y5REx5RkFsSVhIZTZUNUNFQ3FIZlozdVQiLCJyaWQiOiJ1c2VyXzJoUHZmcm1BZHlicUVmdjdyM09xa0w0WnVRRyIsImluaXRpYWxzIjoiQ0cifQ",
						})
					);
					// router.push(`/chat/${data.chatId}?creatorId=${data.creatorId}&clientId=${data.clientId}&startedAt=${data.startedAt}`);
				}
			});
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to send chat request" });
		}
	};

	const listenForChatRequests = () => {
		const q = query(
			chatRequestsRef,
			where("creatorId", "==", "6675197dc56dfe13b3ccabd3"),
			where("status", "==", "pending")
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const chatRequests = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			if (chatRequests.length > 0) {
				setChatRequest(chatRequests[0]);
			}
		});

		return unsubscribe;
	};

	const handleAcceptChat = async () => {
		setLoading(true);
		const userChatsRef = collection(db, "userchats");
		const chatId = chatRequest.chatId;

		try {
			const existingChatDoc = await getDoc(doc(db, "chats", chatId));
			if (!existingChatDoc.exists()) {
				await setDoc(doc(db, "chats", chatId), {
					startedAt: Date.now(),
					endedAt: null,
					clientId: clientId,
					creatorId: chatRequest.creatorId,
					status: "active",
					messages: [],
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
					}
				);
				await Promise.all([creatorChatUpdate, clientChatUpdate]);
			} else {
				await updateDoc(doc(db, "chats", chatId), {
					startedAt: Date.now(),
					endedAt: null,
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
					chatId: chatRequest.chatId,
					requestId: chatRequest.id,
					fullName: "Chirag Goel",
					photo:
						"https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yZ3Y5REx5RkFsSVhIZTZUNUNFQ3FIZlozdVQiLCJyaWQiOiJ1c2VyXzJoUHZmcm1BZHlicUVmdjdyM09xa0w0WnVRRyIsImluaXRpYWxzIjoiQ0cifQ",
				})
			);

			setSheetOpen(false);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to accept chat request" });
		}
	};

	const handleRejectChat = async () => {
		if (!chatRequest) return;
		console.log("inside handle reject");

		try {
			const status = "rejected";
			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: status,
			});

			await createChat(chatRequest.chatId, status);
			setChatRequest(null);
			setSheetOpen(false);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to reject chat request" });
		}
	};

	useEffect(() => {
		if (!chatRequest) return;

		const chatRequestDoc = doc(chatRequestsRef, chatRequest.id);
		const unsubscribe = onSnapshot(chatRequestDoc, (doc) => {
			const data = doc.data();
			if (data && data.status === "accepted") {
				unsubscribe();
				setTimeout(() => {
					router.push(
						`/chat/${chatRequest.chatId}?creatorId=${chatRequest.creatorId}&clientId=${chatRequest.clientId}&startedAt=${chatRequest.startedAt}`
					);
				}, 3000);
			}
		});

		return () => unsubscribe();
	}, [chatRequest, router]);

	useEffect(() => {
		const unsubscribe = listenForChatRequests();
		return () => {
			unsubscribe();
		};
	}, ["6675197dc56dfe13b3ccabd3"]);

	const handleClickOption = (
		callType: string,
		modalType: "isJoiningMeeting" | "isInstantMeeting"
	) => {
		if (user && !storedCallId) {
			setMeetingState(`${modalType}`);
			setCallType(`${callType}`);
			if (callType === "audio") {
				logEvent(analytics, "audio_now_click", {
					userId: user?.publicMetadata?.userId,
					creatorId: creator._id,
				});
			} else {
				logEvent(analytics, "video_now_click", {
					userId: user?.publicMetadata?.userId,
					creatorId: creator._id,
				});
			}
		} else if (user && storedCallId) {
			router.push(`/meeting/${storedCallId}`);
		} else {
			router.replace("/sign-in");
		}
	};

	// if (!client || !user) return <Loader />;

	const theme = `5px 5px 5px 0px ${creator.themeSelected}`;

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<ContentLoading />
			</section>
		);
	}

	return (
		<div className="flex flex-col w-full items-center justify-center gap-4">
			{/* Book Video Call */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => handleClickOption("video", "isInstantMeeting")}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{video}
					Book Video Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.videoRate}/Min
				</span>
			</div>

			{/* Book Audio Call */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => handleClickOption("audio", "isInstantMeeting")}
			>
				<div
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{audio}
					Book Audio Call
				</div>
				<span className="text-xs tracking-widest">
					Rs. {creator.audioRate}/Min
				</span>
			</div>

			{/* Book Chat */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={handleChat}
			>
				<button
					className={`flex gap-4 items-center font-semibold`}
					style={{ color: creator.themeSelected }}
				>
					{chat}
					Chat Now
				</button>
				<span className="text-xs tracking-widest">
					Rs. {creator.chatRate}/Min
				</span>
			</div>

			{/* Call & Chat Modals */}
			<MeetingModal
				isOpen={meetingState === "isInstantMeeting"}
				onClose={() => setMeetingState(undefined)}
				title={`Send Request to Expert ${creator.username}`}
				className="text-center"
				buttonText="Start Session"
				image={creator.photo}
				handleClick={createMeeting}
				theme={creator.themeSelected}
			/>

			{chatRequest &&
				user?.publicMetadata?.userId === "6675197dc56dfe13b3ccabd3" && (
					<div className="chatRequestModal">
						<p>Incoming chat request from {chatRequest.clientId}</p>
						<Button onClick={handleAcceptChat}>Accept</Button>
						<Button onClick={handleRejectChat}>Reject</Button>
					</div>
				)}

			<Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
				<SheetTrigger asChild>
					<div className="hidden"></div>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[200px] max-h-fit w-full sm:max-w-[444px] mx-auto"
				>
					<div className="relative flex flex-col items-center gap-7">
						<div className="flex flex-col py-5 items-center justify-center gap-4 w-full text-center">
							<span className="font-semibold text-xl">
								Waiting for the creator to accept your chat request...
							</span>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export default CallingOptions;
