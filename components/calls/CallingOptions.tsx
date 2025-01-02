import React, { memo, useEffect, useMemo, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
	getDisplayName,
	fetchFCMToken,
	sendNotification,
	backendUrl,
	sendCallNotification,
} from "@/lib/utils";
import { trackPixelEvent } from "@/lib/analytics/pixel";
import NotifyConsentSheet from "../client/NotifyConsentSheet";
import { Cursor, Typewriter } from "react-simple-typewriter";
import usePlatform from "@/hooks/usePlatform";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = memo(({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const client = useStreamVideoClient();
	const { clientUser, userType, setAuthenticationSheetOpen, region } =
		useCurrentUsersContext();
	const { toast } = useToast();
	const [isSheetOpen, setSheetOpen] = useState(false);
	const storedCallId = localStorage.getItem("activeCallId");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [isConsentSheetOpen, setIsConsentSheetOpen] = useState(false);
	const { handleChat, chatRequestsRef } = useChatRequest();
	const [callInitiated, setcallInitiated] = useState(false);
	const [chatState, setChatState] = useState();
	const [chatReqSent, setChatReqSent] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isClientBusy, setIsClientBusy] = useState(false);
	const [onlineStatus, setOnlineStatus] = useState<String>("");
	const themeColor = isValidHexColor(creator?.themeSelected)
		? creator?.themeSelected
		: "#50A65C";

	const [updatedCreator, setUpdatedCreator] = useState<creatorUser>({
		...creator,
		videoRate:
			region === "Global" ? creator.globalVideoRate : creator.videoRate,
		audioRate:
			region === "Global" ? creator.globalAudioRate : creator.audioRate,
		chatRate: region === "Global" ? creator.globalChatRate : creator.chatRate,
		videoAllowed: creator.videoAllowed,
		audioAllowed: creator.audioAllowed,
		chatAllowed: creator.chatAllowed,
	});

	const fullName = getDisplayName(creator);

	const { getDevicePlatform } = usePlatform();

	const devicePlatform = getDevicePlatform();

	const handleTabClose = () => {
		const chatRequestId = localStorage.getItem("chatRequestId");
		const data = chatRequestId;
		const url = `${backendBaseUrl}endChat/rejectChat`;
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

	useEffect(() => {
		if (!creator?._id || !creator?.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		let clientStatusDocRef: any;
		if (clientUser) {
			const docId =
				clientUser.global === true ? clientUser.email : clientUser.phone;
			clientStatusDocRef = doc(db, "userStatus", docId as string);
		}

		const unsubscribe = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const prices = region === "Global" ? data.globalPrices : data.prices;
				const services = data.services;

				// Check if state really needs updating
				setUpdatedCreator((prev) => {
					const newVideoRate =
						region === "Global"
							? prices?.videoCall ?? creator.globalVideoRate
							: prices?.videoCall ?? creator.videoRate;
					const newAudioRate =
						region === "Global"
							? prices?.audioCall ?? creator.globalAudioRate
							: prices?.audioCall ?? creator.audioRate;
					const newChatRate =
						region === "Global"
							? prices?.chat ?? creator.globalChatRate
							: prices?.chat ?? creator.chatRate;
					const newVideoAllowed = services?.videoCall ?? false;
					const newAudioAllowed = services?.audioCall ?? false;
					const newChatAllowed = services?.chat ?? false;

					if (
						newVideoRate !== prev.videoRate ||
						newAudioRate !== prev.audioRate ||
						newChatRate !== prev.chatRate ||
						newVideoAllowed !== prev.videoAllowed ||
						newAudioAllowed !== prev.audioAllowed ||
						newChatAllowed !== prev.chatAllowed
					) {
						return {
							...prev,
							videoRate: newVideoRate,
							audioRate: newAudioRate,
							chatRate: newChatRate,
							videoAllowed: newVideoAllowed,
							audioAllowed: newAudioAllowed,
							chatAllowed: newChatAllowed,
						};
					}

					return prev;
				});

				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();

					if (statusData) {
						if (statusData.loginStatus === true) {
							if (statusData.status === "Busy") {
								setOnlineStatus("Busy");
							} else {
								setOnlineStatus(
									hasActiveService && statusData.status === "Online"
										? "Online"
										: "Offline"
								);
							}
						} else if (statusData.loginStatus === false) {
							setOnlineStatus("Offline");
						} else {
							if (statusData.status === "Busy") {
								setOnlineStatus("Busy");
							} else {
								setOnlineStatus(hasActiveService ? "Online" : "Offline");
							}
						}
					}
				});

				let unsubscribeClientStatus: any;
				if (clientUser) {
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

				return () => {
					unsubscribeStatus();
					if (unsubscribeClientStatus) unsubscribeClientStatus();
				};
			}
		});

		return () => unsubscribe();
	}, [creator._id, creator.phone, region]);

	useEffect(() => {
		if (!chatReqSent) {
			return;
		}

		const intervalId = setInterval(() => {
			const chatRequestId = localStorage.getItem("chatRequestId");

			if (chatRequestId && chatReqSent) {
				clearInterval(intervalId);

				const chatRequestDoc = doc(db, "chatRequests", chatRequestId);

				const unsubscribe = onSnapshot(chatRequestDoc, (docSnapshot) => {
					const data = docSnapshot.data();
					if (data) {
						if (data.status === "ended" || data.status === "rejected") {
							setSheetOpen(false);
							setChatReqSent(false);
							setChatState(data.status);
							if (data.status === "rejected") {
								toast({
									variant: "destructive",
									title: "The user is busy, please try again later",
									toastStatus: "negative",
								});
							} else {
								toast({
									variant: "destructive",
									title: "User is not answering please try again later",
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
							setChatState(data.status);
							unsubscribe();
							trackEvent("BookCall_Chat_Connected", {
								Client_ID: data.clientId,
								User_First_Seen: data.client_first_seen,
								Creator_ID: data.creatorId,
								Time_Duration_Available: data.maxCallDuration,
								Walletbalance_Available: clientUser?.walletBalance,
							});
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
	}, [router, chatReqSent]);

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
					? parseInt(
							clientUser.global ? creator.globalVideoRate : creator?.videoRate,
							10
					  )
					: parseInt(
							clientUser.global ? creator.globalAudioRate : creator?.audioRate,
							10
					  );
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
					toastStatus: "negative",
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

			await call
				.getOrCreate({
					members_limit: 2,
					ring: true,
					data: {
						starts_at: startsAt,
						members: members,
						custom: {
							description,
							global: clientUser?.global ?? false,
						},
					},
				})
				.then(async () => {
					localStorage.removeItem("hasVisitedFeedbackPage");

					if (callType === "audio") {
						trackEvent("BookCall_Audio_Initiated", {
							Client_ID: clientUser._id,
							User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
							Creator_ID: creator._id,
							Time_Duration_Available: maxCallDuration,
							Walletbalance_Available: clientUser?.walletBalance,
						});
					} else {
						trackEvent("BookCall_Video_Initiated", {
							Client_ID: clientUser._id,
							User_First_Seen: clientUser?.createdAt?.toString().split("T")[0],
							Creator_ID: creator._id,
							Time_Duration_Available: maxCallDuration,
							Walletbalance_Available: clientUser?.walletBalance,
						});
					}

					// await sendCallNotification(
					// 	creator.phone as string,
					// 	callType,
					// 	clientUser.username,
					// 	call,
					// 	"call.ring",
					// 	fetchFCMToken,
					// 	sendNotification,
					// 	backendUrl as string
					// );

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
						clientPhone: clientUser?.global
							? clientUser?.email
							: clientUser?.phone,
						global: clientUser?.global ?? false,
					});
				})
				.catch((err) => console.log("Unable to create Meeting", err));
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			toast({
				variant: "destructive",
				title: "Failed to create Meeting",
				toastStatus: "negative",
			});
		}
	};

	const handleClickOption = async (callType: string) => {
		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "Unable to Create Meeting",
				description: "You are a Creator",
				toastStatus: "negative",
			});

			return;
		}

		try {
			setcallInitiated(true);

			if (!clientUser) {
				setIsAuthSheetOpen(true);
				return;
			}

			if (onlineStatus === "Offline") {
				setIsConsentSheetOpen(true);
			} else if (onlineStatus === "Busy") {
				toast({
					variant: "destructive",
					title: "Creator is Busy",
					description: "Can't Initiate the Call",
					toastStatus: "negative",
				});
			} else if (
				(callType === "audio" && updatedCreator?.audioAllowed) ||
				(callType === "video" && updatedCreator?.videoAllowed)
			) {
				try {
					if (isProcessing) return;
					setIsProcessing(true);
					if (callType === "audio") {
						trackEvent("BookCall_Audio_Clicked", {
							utm_source: "google",
							Creator_ID: creator._id,
							status: onlineStatus,
							Walletbalance_Available: clientUser?.walletBalance,
						});

						trackPixelEvent("Audio Call Booked", {
							clientId: clientUser?._id as string,
							creatorId: creator?._id,
							rate: updatedCreator.audioRate,
						});
					} else {
						trackEvent("BookCall_Video_Clicked", {
							utm_source: "google",
							Creator_ID: creator._id,
							status: onlineStatus,
							Walletbalance_Available: clientUser?.walletBalance,
						});

						trackPixelEvent("Video Call Booked", {
							clientId: clientUser?._id as string,
							creatorId: creator?._id,
							rate: updatedCreator.videoRate,
						});
					}
					if (clientUser && !storedCallId) {
						createMeeting(callType);
					} else if (clientUser && storedCallId) {
						toast({
							variant: "destructive",
							title: "Ongoing Call or Transaction Pending",
							description: "Redirecting you back ...",
							toastStatus: "negative",
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
			} else {
				return;
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error in handleClickOption:", error);
		} finally {
			setcallInitiated(false);
		}
	};

	const handleChatClick = async () => {
		if (userType === "creator") {
			toast({
				variant: "destructive",
				title: "Unable to Initiate Chat",
				description: "You are a Creator",
				toastStatus: "negative",
			});

			return;
		}

		if (!clientUser) {
			setIsAuthSheetOpen(true);
			return;
		}

		if (onlineStatus === "Offline") {
			setIsConsentSheetOpen(true);
		} else if (onlineStatus === "Busy") {
			toast({
				variant: "destructive",
				title: "Creator is Busy",
				description: "Can't Initiate the Call",
				toastStatus: "negative",
			});
		} else if (updatedCreator?.chatAllowed) {
			trackEvent("BookCall_Chat_Clicked", {
				Creator_ID: creator._id,
				status: onlineStatus,
				Walletbalance_Available: clientUser?.walletBalance,
			});

			trackPixelEvent("Chat Booked", {
				clientId: clientUser?._id as string,
				creatorId: creator?._id,
				rate: updatedCreator.chatRate,
			});

			setChatReqSent(true);
			handleChat(creator, clientUser);
			let maxCallDuration =
				(walletBalance /
					(clientUser?.global
						? parseInt(creator.globalChatRate, 10)
						: parseInt(creator.chatRate, 10))) *
				60;
			maxCallDuration =
				maxCallDuration > 3600 ? 3600 : Math.floor(maxCallDuration);

			if (maxCallDuration > 300) {
				setSheetOpen(true);
			}
		}
	};

	const services = [
		{
			type: "video",
			label: "Video Call",
			icon: video,
			rate: updatedCreator.videoRate,
			enabled:
				onlineStatus === "Offline"
					? true
					: !updatedCreator?.blocked?.includes(clientUser?._id) &&
					  !isClientBusy &&
					  onlineStatus !== "Busy" &&
					  updatedCreator.videoAllowed &&
					  Number(updatedCreator.videoRate) > 0,
			onClick: () => handleClickOption("video"),
		},
		{
			type: "audio",
			label: "Audio Call",
			icon: audio,
			rate: updatedCreator.audioRate,
			enabled:
				onlineStatus === "Offline"
					? true
					: !updatedCreator?.blocked?.includes(clientUser?._id) &&
					  !isClientBusy &&
					  onlineStatus !== "Busy" &&
					  updatedCreator.audioAllowed &&
					  Number(updatedCreator.audioRate) > 0,
			onClick: () => handleClickOption("audio"),
		},

		{
			type: "chat",
			label: "Chat Now",
			icon: chat,
			rate: updatedCreator.chatRate,
			enabled:
				onlineStatus === "Offline"
					? true
					: !updatedCreator?.blocked?.includes(clientUser?._id) &&
					  !isClientBusy &&
					  onlineStatus !== "Busy" &&
					  updatedCreator.chatAllowed &&
					  Number(updatedCreator.chatRate) > 0,
			onClick: () => handleChatClick(),
		},
	];

	// Sort services based on priority and enabled status
	const sortedServices = useMemo(() => {
		return services.sort((a, b) => {
			if (a.enabled && !b.enabled) return -1;
			if (!a.enabled && b.enabled) return 1;

			const priority: Record<string, number> = { video: 1, audio: 2, chat: 3 };
			return priority[a.type] - priority[b.type];
		});
	}, [services]);

	return (
		<>
			<div className="flex flex-col w-full items-center justify-center gap-4">
				{sortedServices.map((service) => (
					<button
						disabled={!service.enabled}
						key={service.type}
						className={`callOptionContainer ${
							(!service.enabled || onlineStatus === "Busy" || isClientBusy) &&
							"!cursor-not-allowed"
						}`}
						onClick={service.onClick}
					>
						<div className={`flex gap-4 items-center font-bold text-white`}>
							{service.icon}
							{service.label}
						</div>
						<p
							className={`font-medium tracking-widest rounded-[18px] px-2 min-w-[100px] h-[36px] text-[15px] text-black flex items-center justify-center ${
								(!service.enabled || onlineStatus === "Busy" || isClientBusy) &&
								"border border-white/50 text-white"
							}`}
							style={{
								backgroundColor:
									!service.enabled || onlineStatus === "Busy"
										? "transparent"
										: themeColor,
							}}
						>
							{region === "India" ? "Rs." : "$"}
							<span>{service.rate}</span>/min
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
					onOpenChange={setIsAuthSheetOpen}
				/>
			)}

			{isConsentSheetOpen && (
				<NotifyConsentSheet
					isOpen={isConsentSheetOpen}
					onOpenChange={setIsConsentSheetOpen}
					clientId={(clientUser?._id as string) || ""}
					creatorId={creator._id}
					creatorName={fullName}
				/>
			)}

			{(callInitiated || isProcessing) && (
				<div
					className="fixed inset-0 bg-black/50 z-50 size-full flex items-center justify-center"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="text-center bg-dark-2 text-white h-full sm:h-fit w-full sm:max-w-sm flex flex-col items-center justify-between py-10 sm:rounded-xl gap-5">
						<h1 className="font-bold text-xl mb-2">Please Wait ...</h1>
						<div className="size-full flex flex-col items-center justify-center gap-10">
							<img
								src={creator?.photo || "/icons/logo_icon_dark.png"}
								alt=""
								className="rounded-full w-28 h-28 object-cover bg-white"
								onError={(e) => {
									e.currentTarget.src = "/images/defaultProfileImage.png";
								}}
							/>
							<div className="flex flex-col items-center justify-center gap-2">
								<p className="text-xs">Connecting Call With </p>
								<p className="font-semibold text-xl">
									{creator?.username?.startsWith("+91")
										? creator?.username?.replace(
												/(\+91)(\d+)/,
												(match, p1, p2) =>
													`${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
										  )
										: creator?.username}
								</p>
							</div>
						</div>
						<div className="w-full h-fit flex items-center justify-center">
							<h1
								className="text-xl md:text-lg font-semibold"
								style={{ color: "#ffffff" }}
							>
								<Typewriter
									words={["Connecting  to the expert", "Hang tight"]}
									loop={true}
									cursor
									cursorStyle="_"
									typeSpeed={50}
									deleteSpeed={50}
									delaySpeed={2000}
								/>
								<Cursor cursorColor="#ffffff" />
							</h1>
						</div>
					</div>
				</div>
			)}
		</>
	);
});

CallingOptions.displayName = "CallingOptions";

export default CallingOptions;
