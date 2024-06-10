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

interface CallingOptions {
	creator: creatorUser;
}

const initialValues = {
	link: "",
};

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
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
	const clientId = user?.publicMetadata?.userId as string;

	const handleCallAccepted = (call: Call) => {
		toast({
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});
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
					user_id: "6663fd3cc853de56645ccbae",
					custom: { name: String(creator.username), type: "expert" },
					role: "admin",
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

			await call.getOrCreate({
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
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
		try {
			const chatId = crypto.randomUUID();
			const newChatRequestRef = doc(chatRequestsRef);

			await setDoc(newChatRequestRef, {
				creatorId: "6663fd3cc853de56645ccbae",
				clientId: clientId,
				status: "pending",
				chatId,
				createdAt: serverTimestamp(),
			});

			localStorage.setItem(
				"user2",
				JSON.stringify({
					_id: "6663fd3cc853de56645ccbae",
					clientId: clientId,
					fullName: "Aseem Gupta",
					photo:
						"https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yZ3Y5REx5RkFsSVhIZTZUNUNFQ3FIZlozdVQiLCJyaWQiOiJ1c2VyXzJoUHZmcm1BZHlicUVmdjdyM09xa0w0WnVRRyIsImluaXRpYWxzIjoiQ0cifQ",
				})
			);

			const userDocRef = doc(
				db,
				"userchats",
				clientId as string
			);
			const creatorDocRef = doc(db, "userchats", "6663fd3cc853de56645ccbae");

			const userDocSnapshot = await getDoc(userDocRef);
			const creatorDocSnapshot = await getDoc(creatorDocRef);

			if (!userDocSnapshot.exists()) {
				await setDoc(userDocRef, { chats: [] });
			}

			if (!creatorDocSnapshot.exists()) {
				await setDoc(creatorDocRef, { chats: [] });
			}

			// toast({
			// 	title: "Chat Request Sent",
			// 	description: "Waiting for the expert to accept your chat request.",
			// });
			
			setSheetOpen(true);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to send chat request" });
		}
	};

	const listenForChatRequests = () => {
		const q = query(
			chatRequestsRef,
			where("creatorId", "==", "6663fd3cc853de56645ccbae"),
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
			await setDoc(doc(db, "chats", chatId), {
				createdAt: serverTimestamp(),
				clientId: clientId as string,
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
						updatedAt: Date.now(),
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
						updatedAt: Date.now(),
					}),
				}
			);
	
			await updateDoc(doc(chatRequestsRef, chatRequest.id), {
				status: "accepted",
			});
	
			await Promise.all([creatorChatUpdate, clientChatUpdate]);
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

				// console.log(chatRequest.chatId);
				router.push(`/chat/${chatRequest.chatId}`);
			}
		});

		return () => unsubscribe();
	}, [chatRequest, router]);

	useEffect(() => {
		const unsubscribe = listenForChatRequests();
		return () => {
			unsubscribe();
		};
	}, ["6663fd3cc853de56645ccbae"]);

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
				user?.publicMetadata?.userId === "6663fd3cc853de56645ccbae" && (
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
