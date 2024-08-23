import React, { useEffect, useState } from "react";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import MeetingModal from "../meeting/MeetingModal";
import { logEvent } from "firebase/analytics";
import {
	doc,
	updateDoc,
	onSnapshot,
	collection,
	query,
	where,
	getDoc,
	setDoc,
	arrayUnion,
} from "firebase/firestore";
import { analytics, db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import ContentLoading from "../shared/ContentLoading";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import useChatRequest from "@/hooks/useChatRequest";
import { useChatRequestContext } from "@/lib/context/ChatRequestContext";
import useFcmToken from "@/hooks/useFcmToken";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const [meetingState, setMeetingState] = useState<
		"isJoiningMeeting" | "isInstantMeeting" | undefined
	>(undefined);
	const client = useStreamVideoClient();
	const [callType, setCallType] = useState("");
	const { clientUser } = useCurrentUsersContext();
	const { toast } = useToast();
	const [isSheetOpen, setSheetOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const storedCallId = localStorage.getItem("activeCallId");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false); // State to manage sheet visibility
	const { handleChat, chatRequestsRef } = useChatRequest();
	const { chatRequest, setChatRequest } = useChatRequestContext();
	const { fetchCreatorToken } = useFcmToken();

	const [updatedCreator, setUpdatedCreator] = useState<creatorUser>({
		...creator,
		videoRate: creator.videoRate,
		audioRate: creator.audioRate,
		chatRate: creator.chatRate,
		videoAllowed: creator.videoAllowed,
		audioAllowed: creator.audioAllowed,
		chatAllowed: creator.chatAllowed,
	});

	// logic to show the updated creator services in realtime
	useEffect(() => {
		const creatorRef = doc(db, "services", creator._id);
		const unsubscribe = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				let prices = data.prices;
				let services = data.services;
				setUpdatedCreator((prev) => ({
					...prev,
					videoRate: prices.videoCall,
					audioRate: prices.audioCall,
					chatRate: prices.chat,
					videoAllowed: services.videoCall,
					audioAllowed: services.audioCall,
					chatAllowed: services.chat,
				}));
			}
		});

		isAuthSheetOpen && setIsAuthSheetOpen(false);
		return () => unsubscribe();
	}, [creator._id]);

	// logic to get the info about the chat
	useEffect(() => {
		if (!chatRequest) return;

		const chatRequestDoc = doc(chatRequestsRef, chatRequest.id);
		const unsubscribe = onSnapshot(chatRequestDoc, (doc) => {
			const data = doc.data();
			if (
				data &&
				data.status === "accepted" &&
				clientUser?._id === chatRequest.clientId
			) {
				unsubscribe();
				logEvent(analytics, "call_connected", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
				router.push(
					`/chat/${chatRequest.chatId}?creatorId=${chatRequest.creatorId}&clientId=${chatRequest.clientId}`
				);
			}
		});

		return () => unsubscribe();
	}, [chatRequest, router]);

	// Example of calling the sendNotification API route
	const sendPushNotification = async () => {
		const token = await fetchCreatorToken(creator);

		try {
			const response = await fetch("/api/send-notification", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					token: token,
					title: "Test Notification",
					message: "This is a test notification",
					link: "/",
				}),
			});

			const data = await response.json();
			console.log(data);
		} catch (error) {
			console.error("Failed to send notification:", error);
		}
	};

	// defining the actions for call accept and call reject

	const handleCallAccepted = async (call: Call) => {
		toast({
			variant: "destructive",
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});
		setSheetOpen(false);
		await call?.leave();
		router.push(`/meeting/${call.id}`);
	};

	const handleCallRejected = () => {
		toast({
			variant: "destructive",
			title: "Call Rejected",
			description: "The call was rejected. Please try again later.",
		});
		setSheetOpen(false);
	};

	// create new meeting

	const createMeeting = async () => {
		if (!client || !clientUser) return;
		try {
			const id = crypto.randomUUID();
			const call =
				callType === "video"
					? client.call("default", id)
					: callType === "audio" && client.call("audio_room", id);

			if (!call) throw new Error("Failed to create meeting");

			setMeetingState(undefined);
			const members = [
				// creator
				{
					user_id: creator?._id,
					custom: {
						name: String(creator.username),
						type: "expert",
						image: creator.photo || "/images/defaultProfile.png",
						phone: creator.phone,
					},
					role: "call_member",
				},
				// client
				{
					user_id: String(clientUser?._id),
					custom: {
						name: String(clientUser?.username),
						type: "client",
						image: clientUser?.photo,
						phone: clientUser?.phone,
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
					variant: "destructive",
					title: "Insufficient Balance",
					description: "Your balance is below the minimum amount.",
				});
				router.push("/payment");
				return;
			}

			await call.getOrCreate({
				ring: true,
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
					},
				},
			});

			logEvent(analytics, "call_initiated", {
				clientId: clientUser?._id,
				creatorId: creator._id,
			});

			fetch("/api/v1/calls/registerCall", {
				method: "POST",
				body: JSON.stringify({
					callId: id as string,
					type: callType as string,
					status: "Initiated",
					creator: String(clientUser?._id),
					members: members,
				}),
				headers: { "Content-Type": "application/json" },
			});

			call.on("call.accepted", () => handleCallAccepted(call));
			call.on("call.rejected", handleCallRejected);
		} catch (error) {
			console.error(error);
			toast({ title: "Failed to create Meeting" });
		}
	};

	// if any of the calling option is selected open the respective modal
	const handleClickOption = (
		callType: string,
		modalType: "isJoiningMeeting" | "isInstantMeeting"
	) => {
		if (clientUser && !storedCallId) {
			setMeetingState(`${modalType}`);
			setCallType(`${callType}`);
			logEvent(analytics, "call_click", {
				clientId: clientUser?._id,
				creatorId: creator._id,
			});
			if (callType === "audio") {
				logEvent(analytics, "audio_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
			} else {
				logEvent(analytics, "video_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
			}
		} else if (clientUser && storedCallId) {
			toast({
				title: "Ongoing Call or Transaction Pending",
				description: "Redirecting you back ...",
			});
			router.push(`/meeting/${storedCallId}`);
		} else {
			// router.replace("/authenticate");
			setIsAuthSheetOpen(true);
		}
	};

	const theme = `5px 5px 5px 0px ${creator.themeSelected}`;

	if (loading) {
		return (
			<section className="w-full h-full flex items-center justify-center">
				<ContentLoading />
			</section>
		);
	}

	if (isAuthSheetOpen && !clientUser)
		return (
			<AuthenticationSheet
				isOpen={isAuthSheetOpen}
				onOpenChange={setIsAuthSheetOpen} // Handle sheet close
			/>
		);
	return (
		<>
			<div className="flex flex-col w-full items-center justify-center gap-4">
				{!updatedCreator.videoAllowed &&
					!updatedCreator.audioAllowed &&
					!updatedCreator.chatAllowed && (
						<span className="text-red-500 font-medium text-lg">
							None of the Services are Available Right Now
						</span>
					)}

				{/* Book Video Call */}
				{updatedCreator.videoAllowed && (
					<div
						className="callOptionContainer"
						style={{
							boxShadow: theme,
						}}
						onClick={() => handleClickOption("video", "isInstantMeeting")}
					>
						<div
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: updatedCreator.themeSelected }}
						>
							{video}
							Book Video Call
						</div>
						<span className="text-xs tracking-widest">
							Rs. {updatedCreator.videoRate}/Min
						</span>
					</div>
				)}

				{/* Book Audio Call */}
				{updatedCreator.audioAllowed && (
					<div
						className="callOptionContainer"
						style={{
							boxShadow: theme,
						}}
						onClick={() => handleClickOption("audio", "isInstantMeeting")}
					>
						<div
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: updatedCreator.themeSelected }}
						>
							{audio}
							Book Audio Call
						</div>
						<span className="text-xs tracking-widest">
							Rs. {updatedCreator.audioRate}/Min
						</span>
					</div>
				)}

				{/* Book Chat */}
				{updatedCreator.chatAllowed && (
					<div
						className="callOptionContainer"
						style={{
							boxShadow: theme,
						}}
						onClick={() => {
							handleChat(creator, clientUser);
							setSheetOpen(true);
							sendPushNotification();
						}}
					>
						<button
							className={`flex gap-4 items-center font-semibold`}
							style={{ color: updatedCreator.themeSelected }}
						>
							{chat}
							Chat Now
						</button>
						<span className="text-xs tracking-widest">
							Rs. {updatedCreator.chatRate}/Min
						</span>
					</div>
				)}

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

				<Sheet
					open={isSheetOpen}
					onOpenChange={async () => {
						setSheetOpen(false);
						try {
							await updateDoc(doc(chatRequestsRef, chatRequest.id), {
								status: "ended",
							});
						} catch (error) {
							console.error(error);
						}
						setChatRequest(null);
					}}
				>
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
		</>
	);
};

export default CallingOptions;
