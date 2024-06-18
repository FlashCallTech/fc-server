import React, { useEffect, useState } from "react";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import Loader from "../shared/Loader";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/nextjs";
import { Input } from "../ui/input";
import MeetingModal from "../meeting/MeetingModal";
import { MemberRequest } from "@stream-io/video-react-sdk";
import { Button } from "../ui/button";
import {
	arrayUnion,
	collection,
	doc,
	serverTimestamp,
	setDoc,
	updateDoc,
	onSnapshot,
	query,
	where,
	getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";

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
	const [values, setValues] = useState(initialValues);
	const client = useStreamVideoClient();
	const [callType, setCallType] = useState("");
	const { user } = useUser();
	const { toast } = useToast();
	const [chatRequest, setChatRequest] = useState<any>(null);
	const [isSheetOpen, setSheetOpen] = useState(false);

	const chatRequestsRef = collection(db, "chatRequests");
	const chatRef = collection(db, "chats");
	const clientId = user?.publicMetadata?.userId as string;

	const handleCallAccepted = (call: Call) => {
		toast({
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});
		setSheetOpen(false);
		router.push(`/meeting/${call.id}?reload=true`);
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

			const members: MemberRequest[] = [
				{
					user_id: "66715dd9ed259b141bc99683",
					// user_id: "66681d96436f89b49d8b498b",
					custom: { name: String(creator.username), type: "expert" },
					role: "call_member",
				},
				{
					user_id: String(user?.publicMetadata?.userId),
					custom: { name: String(user.username), type: "client" },
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

				ring: true,
			});

			call.on("call.accepted", () => handleCallAccepted(call));
			call.on("call.rejected", handleCallRejected);

			toast({
				title: "Meeting Created",
			});
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to create Meeting" });
		}
	};

	const handleChat = async () => {
		let maxCallDuration = (walletBalance / parseInt(creator?.chatRate, 10)) * 60; // in seconds
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
		// console.log(chatRef);
		const chatRequestsRef = collection(db, "chatRequests");

		try {
			const userChatsDocRef = doc(db, "userchats", clientId);
			const creatorChatsDocRef = doc(
				db,
				"userchats",
				"66715dd9ed259b141bc99683"
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
						(chat: any) => chat.receiverId === "66715dd9ed259b141bc99683"
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
				creatorId: "66715dd9ed259b141bc99683",
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
							_id: "66715dd9ed259b141bc99683",
							clientId: data.clientId,
							creatorId: data.creatorId,
							requestId: doc.id,
							fullName: "Aseem Gupta",
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
			where("creatorId", "==", "66715dd9ed259b141bc99683"),
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
		const userChatsRef = collection(db, "userchats");
		const chatId = chatRequest.chatId;

		try {
			const existingChatDoc = await getDoc(doc(db, "chats", chatId));
			if (!existingChatDoc.exists()) {
				await setDoc(doc(db, "chats", chatId), {
					startedAt: Date.now(),
					endedAt: null,
					clientId: clientId,
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

			setSheetOpen(false);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to accept chat request" });
		}
	};

	const handleRejectChat = async () => {
		if (!chatRequest) return;

		try {
			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: "rejected",
			});

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
				router.push(
					`/chat/${chatRequest.chatId}?creatorId=${chatRequest.creatorId}&clientId=${chatRequest.clientId}&startedAt=${chatRequest.startedAt}`
				);
			}
		});

		return () => unsubscribe();
	}, [chatRequest, router]);

	useEffect(() => {
		const unsubscribe = listenForChatRequests();
		return () => {
			unsubscribe();
		};
	}, ["66715dd9ed259b141bc99683"]);

	if (!client || !user) return <Loader />;

	const theme = `5px 5px 5px 0px ${creator.themeSelected}`;

	return (
		<div className="flex flex-col w-full items-center justify-center gap-4">
			{/* Book Video Call */}
			<div
				className="callOptionContainer"
				style={{
					boxShadow: theme,
				}}
				onClick={() => {
					setMeetingState("isInstantMeeting");
					setCallType("video");
				}}
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
				onClick={() => {
					setMeetingState("isInstantMeeting");
					setCallType("audio");
				}}
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

			<MeetingModal
				isOpen={meetingState === "isJoiningMeeting"}
				onClose={() => setMeetingState(undefined)}
				title="Type the link here"
				className="text-center"
				buttonText="Join Meeting"
				handleClick={() => router.push(values.link)}
			>
				<Input
					placeholder="Meeting link"
					onChange={(e: any) => setValues({ ...values, link: e.target.value })}
					className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</MeetingModal>

			<MeetingModal
				isOpen={meetingState === "isInstantMeeting"}
				onClose={() => setMeetingState(undefined)}
				title="Request will be sent to Expert"
				className="text-center"
				buttonText="Start Session"
				handleClick={createMeeting}
			/>

			{chatRequest &&
				user?.publicMetadata?.userId === "66715dd9ed259b141bc99683" && (
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
