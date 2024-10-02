import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser, MemberRequest } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { analytics, db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import useChatRequest from "@/hooks/useChatRequest";
import { trackEvent } from "@/lib/mixpanel";

import {
	backendBaseUrl,
	isValidHexColor,
	updateFirestoreSessions,
	trackCallEvents,
	// fetchFCMToken,
	// sendNotification,
} from "@/lib/utils";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const client = useStreamVideoClient();
	const { clientUser, userType, setAuthenticationSheetOpen } =
		useCurrentUsersContext();
	const { toast } = useToast();
	const [isSheetOpen, setSheetOpen] = useState(false);
	const storedCallId = localStorage.getItem("activeCallId");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const { handleChat, chatRequestsRef } = useChatRequest();
	const [chatState, setChatState] = useState();
	const [chatReqSent, setChatReqSent] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isClientBusy, setIsClientBusy] = useState(false);
	const [onlineStatus, setOnlineStatus] = useState<String>("");

	const themeColor = isValidHexColor(creator.themeSelected)
		? creator.themeSelected
		: "#50A65C";

	const [updatedCreator, setUpdatedCreator] = useState<creatorUser>({
		...creator,
		videoRate: creator.videoRate,
		audioRate: creator.audioRate,
		chatRate: creator.chatRate,
		videoAllowed: creator.videoAllowed,
		audioAllowed: creator.audioAllowed,
		chatAllowed: creator.chatAllowed,
	});

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen, setAuthenticationSheetOpen]);

	// logic to show the updated creator services in realtime
	useEffect(() => {
		if (!creator?._id || !creator?.phone) return;
		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		let clientStatusDocRef: any;
		if (clientUser) {
			clientStatusDocRef = doc(db, "userStatus", clientUser.phone);
		}

		const unsubscribe = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				let prices = data.prices;
				let services = data.services;
				setUpdatedCreator((prev) => ({
					...prev,
					videoRate: prices?.videoCall ?? "",
					audioRate: prices?.audioCall ?? "",
					chatRate: prices?.chat ?? "",
					videoAllowed: services?.videoCall ?? false,
					audioAllowed: services?.audioCall ?? false,
					chatAllowed: services?.chat ?? false,
				}));

				// Check if any of the services is enabled
				const isOnline =
					services?.videoCall || services?.audioCall || services?.chat;

				setOnlineStatus(isOnline ? "Online" : "Offline");

				// Now listen for the creator's status
				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();

					if (statusData) {
						// Check if status is "Busy"
						if (statusData.status === "Busy") {
							setOnlineStatus("Busy");
						} else {
							// Update status based on services
							setOnlineStatus(isOnline ? "Online" : "Offline");
						}
					}
				});

				// Listen for the client's status only if clientUser is not null
				let unsubscribeClientStatus: any;
				if (clientUser) {
					// Listen for the client's status
					unsubscribeClientStatus = onSnapshot(
						clientStatusDocRef,
						(clientStatusDoc: any) => {
							const clientStatusData = clientStatusDoc.data();

							if (clientStatusData) {
								setIsClientBusy(clientStatusData.status === "Busy");
							} else {
								setIsClientBusy(false);
							}
						}
					);
				}

				// Clean up both status listeners
				return () => {
					unsubscribeStatus();
					unsubscribeClientStatus();
				};
			}
		});

		return () => unsubscribe();
	}, [creator._id, isAuthSheetOpen]);

	useEffect(() => {
		if (!chatReqSent) return;

		const intervalId = setInterval(() => {
			const chatRequestId = localStorage.getItem("chatRequestId");

			if (chatRequestId) {
				clearInterval(intervalId); // Clear the interval once the ID is found

				const chatRequestDoc = doc(db, "chatRequests", chatRequestId);

				const unsubscribe = onSnapshot(chatRequestDoc, (docSnapshot) => {
					const data = docSnapshot.data();
					if (data) {
						if (data.status === "ended" || data.status === "rejected") {
							setSheetOpen(false);
							setChatReqSent(false);
							setChatState(data.status);
							localStorage.removeItem("chatRequestId");
							localStorage.removeItem("user2");
							unsubscribe();
						} else if (
							data.status === "accepted" &&
							clientUser?._id === data.clientId
						) {
							setChatState(data.status);
							unsubscribe();
							logEvent(analytics, "call_connected", {
								clientId: clientUser?._id,
								creatorId: data.creatorId,
							});
							setChatReqSent(false);
							setTimeout(() => {
								router.push(
									`/chat/${data.chatId}?creatorId=${data.creatorId}&clientId=${data.clientId}`
								);
							}, 2000);
						} else {
							setChatState(data.status);
						}
					}
				});
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [clientUser?._id, router, chatReqSent]);

	useEffect(() => {
		let audio: HTMLAudioElement | null = null;

		if (chatState === "pending") {
			audio = new Audio("/sounds/outgoing.mp3");
			audio.loop = true;

			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						console.log("Audio autoplay started!");
					})
					.catch((error) => {
						Sentry.captureException(error);
						console.error("Audio autoplay was prevented:", error);
					});
			}
		}
		return () => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		};
	}, [chatState]);

	// defining the actions for call accept and call reject
	const handleCallAccepted = async (callType: string) => {
		setIsProcessing(false); // Reset processing state

		toast({
			variant: "destructive",
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});

		setSheetOpen(false);

		const createdAtDate = clientUser?.createdAt
			? new Date(clientUser.createdAt)
			: new Date();
		const formattedDate = createdAtDate.toISOString().split("T")[0];

		if (callType === "audio") {
			try {
				trackEvent("BookCall_Audio_Connected", {
					Client_ID: clientUser?._id,
					User_First_Seen: formattedDate,
					Creator_ID: creator._id,
				});
			} catch (error) {
				console.log(error);
			}
		} else {
			try {
				trackEvent("BookCall_Video_Connected", {
					Client_ID: clientUser?._id,
					User_First_Seen: formattedDate,
					Creator_ID: creator._id,
				});
			} catch (error) {
				console.log(error);
			}
		}

		// router.replace(`/meeting/${call.id}`);
	};

	const handleCallRejected = () => {
		setIsProcessing(false); // Reset processing state
		setSheetOpen(false);
	};

	const createMeeting = async (callType: string) => {
		if (!client || !clientUser) return;

		try {
			const id = crypto.randomUUID();
			const call =
				callType === "video"
					? client.call("default", id)
					: callType === "audio" && client.call("audio_room", id);

			if (!call) throw new Error("Failed to create meeting");

			const members = [
				{
					user_id: creator?._id,
					custom: {
						name: String(creator.username),
						type: "expert",
						image: creator.photo || "/images/defaultProfile.png",
						phone: creator.phone,
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
			let maxCallDuration = (walletBalance / ratePerMinute) * 60;
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
				});
				router.push(`/payment?callType=${callType}`);
				return;
			}

			trackEvent("MinimumBalance_Available", {
				Client_ID: clientUser?._id,
				User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
				Creator_ID: creator._id,
				Time_Duration_Available: maxCallDuration,
				Walletbalance_Available: clientUser?.walletBalance,
			});

			await call.getOrCreate({
				members_limit: 2,
				ring: true,
				data: {
					starts_at: startsAt,
					members: members,
					custom: {
						description,
					},
				},
			});

			// Utilize helper functions
			// const fcmToken = await fetchFCMToken(creator.phone);
			// if (fcmToken) {
			// 	sendNotification(
			// 		fcmToken,
			// 		`Incoming Call`,
			// 		`${callType} Call Request from ${clientUser.username}`,
			// 		creator,
			// 		`https:flashcall.me/meeting/${id}`
			// 	);
			// }

			trackCallEvents(callType, clientUser, creator);

			fetch(`${backendBaseUrl}/calls/registerCall`, {
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

			await updateFirestoreSessions(
				clientUser?._id as string,
				call.id,
				"ongoing",
				[
					{
						user_id: creator?._id,
						expert: creator?.username,
						status: "joining",
					},
					{
						user_id: clientUser?._id,
						client: clientUser?.username,
						status: "joining",
					},
				]
			);

			call.on("call.accepted", () => handleCallAccepted(callType));
			call.on("call.rejected", handleCallRejected);
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({ variant: "destructive", title: "Failed to create Meeting" });
		}
	};

	// if any of the calling option is selected open the respective modal
	const handleClickOption = (callType: string) => {
		if (isProcessing) return; // Prevent double-click
		setIsProcessing(true); // Set processing state

		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "Unable to Create Meeting",
				description: "You are a Creator",
			});

			return;
		}

		try {
			if (callType === "audio") {
				logEvent(analytics, "audio_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
				trackEvent("BookCall_Audio_Clicked", {
					utm_source: "google",
					Creator_ID: creator._id,
					status: onlineStatus,
				});
			} else {
				logEvent(analytics, "video_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
				trackEvent("BookCall_Video_Clicked", {
					utm_source: "google",
					Creator_ID: creator._id,
					status: onlineStatus,
				});
			}
			if (clientUser && !storedCallId) {
				createMeeting(callType);
				logEvent(analytics, "call_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
			} else if (clientUser && storedCallId) {
				toast({
					variant: "destructive",
					title: "Ongoing Call or Transaction Pending",
					description: "Redirecting you back ...",
				});
				router.replace(`/meeting/${storedCallId}`);
			} else {
				setIsAuthSheetOpen(true);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error in handleClickOption:", error);
		} finally {
			setIsProcessing(false); // Reset processing state after completion
		}
	};

	const handleChatClick = () => {
		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "Unable to Initiate Chat",
				description: "You are a Creator",
			});

			return;
		}
		if (clientUser) {
			trackEvent("BookCall_Chat_Clicked", {
				utm_source: "google",
				creator_id: creator._id,
				status: onlineStatus,
			});
			setChatReqSent(true);
			handleChat(creator, clientUser);
			let maxCallDuration =
				(walletBalance / parseInt(creator.chatRate, 10)) * 60;
			maxCallDuration =
				maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

			if (maxCallDuration > 300) {
				setSheetOpen(true);
			}

			// sendPushNotification();
		} else {
			setIsAuthSheetOpen(true);
		}
	};

	const theme = `5px 5px 0px 0px ${themeColor}`;

	if (isAuthSheetOpen && !clientUser)
		return (
			<AuthenticationSheet
				isOpen={isAuthSheetOpen}
				onOpenChange={setIsAuthSheetOpen} // Handle sheet close
			/>
		);

	const services = [
		{
			type: "video",
			enabled:
				!isClientBusy &&
				updatedCreator.videoAllowed &&
				parseInt(updatedCreator.videoRate, 10) > 0,
			rate: updatedCreator.videoRate,
			label: "Video Call",
			icon: video,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleClickOption("video");
				} else {
					setIsAuthSheetOpen(true);
				}
			},
		},
		{
			type: "audio",
			enabled:
				!isClientBusy &&
				updatedCreator.audioAllowed &&
				parseInt(updatedCreator.audioRate, 10) > 0,
			rate: updatedCreator.audioRate,
			label: "Audio Call",
			icon: audio,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleClickOption("audio");
				} else {
					setIsAuthSheetOpen(true);
				}
			},
		},
		{
			type: "chat",
			enabled:
				!isClientBusy &&
				updatedCreator.chatAllowed &&
				parseInt(updatedCreator.chatRate, 10) > 0,
			rate: updatedCreator.chatRate,
			label: "Chat Now",
			icon: chat,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleChatClick();
				} else {
					setIsAuthSheetOpen(true);
				}
			},
		},
	];

	// Sort services based on priority and enabled status
	const sortedServices = services.sort((a, b) => {
		if (a.enabled && !b.enabled) return -1;
		if (!a.enabled && b.enabled) return 1;

		const priority: any = { video: 1, audio: 2, chat: 3 };
		return priority[a.type] - priority[b.type];
	});

	return (
		<>
			<div className="flex flex-col w-full items-center justify-center gap-4">
				{sortedServices.map((service) => (
					<button
						disabled={!service.enabled}
						key={service.type}
						className={`callOptionContainer ${
							(isProcessing ||
								!service.enabled ||
								onlineStatus === "Busy" ||
								isClientBusy) &&
							"!cursor-not-allowed"
						}`}
						onClick={service.onClick}
					>
						<div className={`flex gap-4 items-center font-bold text-white`}>
							{service.icon}
							{service.label}
						</div>
						<p
							className={`font-medium tracking-widest rounded-[18px] px-4 h-[36px] text-black flex items-center justify-center ${
								(isProcessing ||
									!service.enabled ||
									onlineStatus === "Busy" ||
									isClientBusy) &&
								"border border-white/50 text-white"
							}`}
							style={{
								backgroundColor:
									isProcessing || !service.enabled || onlineStatus === "Busy"
										? "transparent"
										: themeColor,
							}}
						>
							Rs.<span className="ml-1">{service.rate}</span>/min
						</p>
					</button>
				))}

				<Sheet
					open={isSheetOpen}
					onOpenChange={async () => {
						setSheetOpen(false);
						try {
							const chatRequestId = localStorage.getItem("chatRequestId");
							await updateDoc(doc(chatRequestsRef, chatRequestId as string), {
								status: "ended",
							});
						} catch (error) {
							Sentry.captureException(error);
							console.error(error);
						}
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
