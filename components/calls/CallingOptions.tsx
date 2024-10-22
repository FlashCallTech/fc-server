import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { analytics, db } from "@/lib/firebase";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "../ui/sheet";
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
	getDisplayName,
} from "@/lib/utils";
import useChat from "@/hooks/useChat";
import Loader from "../shared/Loader";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const { loading } = useChat();
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

	const fullName = getDisplayName(creator);

	const handleTabClose = () => {
		console.log("Tab Closed");
		const chatRequestId = localStorage.getItem("chatRequestId");
		const data = chatRequestId;
		const url = `${backendBaseUrl}endChat/rejectChat`; // Example endpoint
		navigator.sendBeacon(url, data);
	};

	useEffect(() => {
		window.addEventListener("unload", handleTabClose);
		return () => {
			window.removeEventListener("unload", handleTabClose);
		};
	}, []);

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
		if (!chatReqSent) {
			return;
		}

		const intervalId = setInterval(() => {
			const chatRequestId = localStorage.getItem("chatRequestId");

			if (chatRequestId && chatReqSent) {
				clearInterval(intervalId); // Clear the interval once the ID is found

				const chatRequestDoc = doc(db, "chatRequests", chatRequestId);

				const unsubscribe = onSnapshot(chatRequestDoc, (docSnapshot) => {
					const data = docSnapshot.data();
					if (data) {
						if (data.status === "ended" || data.status === "rejected") {
							setSheetOpen(false);
							console.log("Chat Request Ended or Rejected");
							setChatReqSent(false);
							setChatState(data.status);
							if (data.status === "rejected") {
								toast({
									variant: "destructive",
									title: "The user is busy, please try again later",
								});
							} else {
								toast({
									variant: "destructive",
									title: "User is not asnwering please try again later",
								});
							}
							localStorage.removeItem("user2");
							localStorage.removeItem("chatRequestId");
							localStorage.removeItem("chatId");
							// updateExpertStatus(creator.phone as string, "Online");
							unsubscribe();
						} else if (
							data.status === "accepted" &&
							clientUser?._id === data.clientId
						) {
							setChatState(data.status);
							unsubscribe();
							console.log("Chat Accepted");
							// updateExpertStatus(data.creatorPhone as string, "Busy");
							setTimeout(() => {
								router.replace(
									`/chat/${data.chatId}?creatorId=${data.creatorId}&clientId=${data.clientId}`
								);
							});
							setChatReqSent(false);
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
						name: fullName,
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

			await call.create({
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

			trackCallEvents(callType, clientUser, creator);

			await fetch(`${backendBaseUrl}/calls/registerCall`, {
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

			await updateFirestoreSessions(clientUser?._id as string, {
				callId: call.id,
				status: "initiated",
				clientId: clientUser?._id as string,
				expertId: creator._id,
				isVideoCall: callType,
				creatorPhone: creator.phone,
				clientPhone: clientUser?.phone,
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({ variant: "destructive", title: "Failed to create Meeting" });
		}
	};

	const handleClickOption = async (callType: string) => {
		if (isProcessing) return;
		setIsProcessing(true);

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

	const handleChatClick = async () => {
		console.log("Chat now clicked");
		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "Unable to Initiate Chat",
				description: "You are a Creator",
			});

			return;
		}
		if (clientUser) {
			// updateExpertStatus(creator.phone as string, "Busy");
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

	const services = [
		{
			type: "video",
			enabled:
				!clientUser ||
				(!updatedCreator?.blocked?.some(
					(clientId) => clientId === clientUser?._id
				) &&
					!isClientBusy &&
					updatedCreator.videoAllowed &&
					parseInt(updatedCreator.videoRate, 10) > 0),
			rate: updatedCreator.videoRate,
			label: "Video Call",
			icon: video,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleClickOption("video");
				} else if (clientUser && onlineStatus === "Busy") {
					toast({
						variant: "destructive",
						title: "Creator is Busy",
						description: "Can't Initiate the Call",
					});
					return;
				} else {
					setIsAuthSheetOpen(true);
				}
			},
		},
		{
			type: "audio",
			enabled:
				!clientUser ||
				(!updatedCreator?.blocked?.some(
					(clientId) => clientId === clientUser?._id
				) &&
					!isClientBusy &&
					updatedCreator.audioAllowed &&
					parseInt(updatedCreator.audioRate, 10) > 0),
			rate: updatedCreator.audioRate,
			label: "Audio Call",
			icon: audio,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleClickOption("audio");
				} else if (clientUser && onlineStatus === "Busy") {
					toast({
						variant: "destructive",
						title: "Creator is Busy",
						description: "Can't Initiate the Call",
					});
					return;
				} else {
					setIsAuthSheetOpen(true);
				}
			},
		},
		{
			type: "chat",
			enabled:
				!clientUser ||
				(!updatedCreator?.blocked?.some(
					(clientId) => clientId === clientUser?._id
				) &&
					!isClientBusy &&
					updatedCreator.chatAllowed &&
					parseInt(updatedCreator.chatRate, 10) > 0),
			rate: updatedCreator.chatRate,
			label: "Chat Now",
			icon: chat,
			onClick: () => {
				if (clientUser && onlineStatus !== "Busy") {
					handleChatClick();
				} else if (clientUser && onlineStatus === "Busy") {
					toast({
						variant: "destructive",
						title: "Creator is Busy",
						description: "Can't Initiate the Call",
					});
					return;
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

	if (loading) {
		return <Loader />;
	}

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
						} finally {
							localStorage.removeItem("chatRequestId");
							localStorage.removeItem("chatId");
						}
					}}
				>
					<SheetTrigger asChild>
						<div className="hidden"></div>
					</SheetTrigger>
					<SheetContent
						side="bottom"
						onInteractOutside={(event) => {
							// Prevent sheet from closing when clicking outside
							event.preventDefault();
						}}
						className="flex flex-col items-center justify-center border-none rounded-t-xl px-10 py-7 bg-white min-h-[200px] max-h-fit w-full sm:max-w-[444px] mx-auto"
					>
						<SheetTitle></SheetTitle>
						<SheetDescription></SheetDescription>
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

			{isAuthSheetOpen && (
				<AuthenticationSheet
					isOpen={isAuthSheetOpen}
					onOpenChange={setIsAuthSheetOpen} // Handle sheet close
				/>
			)}
		</>
	);
};

export default CallingOptions;
