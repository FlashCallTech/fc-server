import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { audio, chat, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { logEvent } from "firebase/analytics";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { analytics, db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useWalletBalanceContext } from "@/lib/context/WalletBalanceContext";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";
import AuthenticationSheet from "../shared/AuthenticationSheet";
import useChatRequest from "@/hooks/useChatRequest";
import { trackEvent } from "@/lib/mixpanel";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { walletBalance } = useWalletBalanceContext();
	const client = useStreamVideoClient();
	const { clientUser, setAuthenticationSheetOpen } = useCurrentUsersContext();
	const { toast } = useToast();
	const [isSheetOpen, setSheetOpen] = useState(false);
	const storedCallId = localStorage.getItem("activeCallId");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const { handleChat, chatRequestsRef } = useChatRequest();
	const [chatState, setChatState] = useState();
	const [chatReqSent, setChatReqSent] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const [updatedCreator, setUpdatedCreator] = useState<creatorUser>({
		...creator,
		videoRate: creator.videoRate,
		audioRate: creator.audioRate,
		chatRate: creator.chatRate,
		videoAllowed: creator.videoAllowed,
		audioAllowed: creator.audioAllowed,
		chatAllowed: creator.chatAllowed,
	});

	const [onlineStatus, setOnlineStatus] = useState<String>();

  useEffect(() => {
    const creatorDocRef = doc(db, "userStatus", creator.phone);

    // Set up a listener for real-time updates
    const unsubscribe = onSnapshot(creatorDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
				setOnlineStatus(data.status);
      } else {
        console.error("No such document!");
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);


	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen]);

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
	}, []);

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
							router.push(
								`/chat/${data.chatId}?creatorId=${data.creatorId}&clientId=${data.clientId}`
							);
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
	const handleCallAccepted = async (call: Call, callType: string) => {
		setIsProcessing(false); // Reset processing state
		toast({
			variant: "destructive",
			title: "Call Accepted",
			description: "The call has been accepted. Redirecting to meeting...",
		});
		setSheetOpen(false);
		await call?.leave();
		if (callType === "audio") {	
			trackEvent('BookCall_Audio_Connected', {
			Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toISOString().split('T')[0],
			Creator_ID: creator._id,
			})
		} else {
			trackEvent('BookCall_Video_Connected', {
				Client_ID: clientUser?._id,
			User_First_Seen: clientUser?.createdAt?.toISOString().split('T')[0],
			Creator_ID: creator._id,
			})
		}
		router.replace(`/meeting/${call.id}`);
	};

	const handleCallRejected = (callType: string) => {
		setIsProcessing(false); // Reset processing state
		toast({
			variant: "destructive",
			title: "Call Rejected",
			description: "The call was rejected. Please try again later.",
		});
		setSheetOpen(false);
	};

	// create new meeting
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
						name: String(
							clientUser?.username ? clientUser.username : clientUser.phone
						),
						type: "client",
						image: clientUser?.photo,
						phone: clientUser?.phone,
					},
					role: "admin",
				},
			];

			const startsAt = new Date(Date.now()).toISOString();
			const description = `${callType === "video"
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
				router.push(`/payment?callType=${callType}`);
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

			if (callType === "audio") {	
				trackEvent('BookCall_Audio_Clicked', {
					Client_ID: clientUser._id,
				User_First_Seen: clientUser.createdAt?.toISOString().split('T')[0],
				Creator_ID: creator._id,
				})
			} else {
				trackEvent('BookCall_Video_initiated', {
					Client_ID: clientUser._id,
				User_First_Seen: clientUser.createdAt?.toISOString().split('T')[0],
				Creator_ID: creator._id,
				})
			}

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

			call.on("call.accepted", () => handleCallAccepted(call, callType));
			call.on("call.rejected", () => handleCallRejected(callType));
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

		try { 
			if (callType === "audio") {
				logEvent(analytics, "audio_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
				trackEvent('BookCall_Audio_Clicked', {
					utm_source: 'google',
					Creator_ID: creator._id,
					status: onlineStatus,
				})
			} else {
				logEvent(analytics, "video_now_click", {
					clientId: clientUser?._id,
					creatorId: creator._id,
				});
				trackEvent('BookCall_Video_Clicked', {
					utm_source: 'google',
					Creator_ID: creator._id,
					status: onlineStatus,
				})
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

			// Optionally log a success message to Sentry
			Sentry.captureMessage("handleClickOption executed successfully", {
				level: "info",
				extra: {
					callType,
					clientUserId: clientUser?._id,
					creatorId: creator._id,
				},
			});
		} catch (error) {
			// Capture the exception and log it to Sentry
			Sentry.captureException(error);
			console.error("Error in handleClickOption:", error);
		} finally {
			setIsProcessing(false); // Reset processing state after completion
		}
	};

	const handleChatClick = () => {
		if (clientUser) {
			trackEvent('BookCall_Chat_Clicked', {
				utm_source: 'google',
				creator_id: creator._id,
				status: onlineStatus,
			})
			setChatReqSent(true);
			handleChat(creator, clientUser);
			setSheetOpen(true);
			// sendPushNotification();
		} else {
			setIsAuthSheetOpen(true);
		}
	};

	// const sendPushNotification = async () => {
	// 	const token = await fetchCreatorToken(creator);

	// 	try {
	// 		const response = await fetch("/api/send-notification", {
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 			},
	// 			body: JSON.stringify({
	// 				token: token,
	// 				title: "Test Notification",
	// 				message: "This is a test notification",
	// 				link: "/",
	// 			}),
	// 		});

	// 		const data = await response.json();
	// 		console.log(data);
	// 	} catch (error) {
	// 		console.error("Failed to send notification:", error);
	// 	}
	// };

	const theme = `5px 5px 0px 0px ${creator.themeSelected}`;

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
				{updatedCreator.videoAllowed &&
					parseInt(updatedCreator.videoRate, 10) > 0 && (
						<div
							className={`callOptionContainer ${isProcessing ? "opacity-50 cursor-not-allowed" : ""
								}`}
							style={{
								boxShadow: theme,
							}}
							onClick={() => handleClickOption("video")}
						>
							<div
								className={`flex gap-4 items-center font-semibold`}
								style={{ color: updatedCreator.themeSelected }}
							>
								{video}
								Book Video Call
							</div>
							<span className="text-sm tracking-widest">
								Rs. {updatedCreator.videoRate}/Min
							</span>
						</div>
					)}

				{/* Book Audio Call */}
				{updatedCreator.audioAllowed &&
					parseInt(updatedCreator.audioRate, 10) > 0 && (
						<div
							className={`callOptionContainer ${isProcessing ? "opacity-50 cursor-not-allowed" : ""
								}`}
							style={{
								boxShadow: theme,
							}}
							onClick={() => handleClickOption("audio")}
						>
							<div
								className={`flex gap-4 items-center font-semibold`}
								style={{ color: updatedCreator.themeSelected }}
							>
								{audio}
								Book Audio Call
							</div>
							<span className="text-sm tracking-widest">
								Rs. {updatedCreator.audioRate}/Min
							</span>
						</div>
					)}

				{/* Book Chat */}
				{updatedCreator.chatAllowed &&
					parseInt(updatedCreator.chatRate, 10) > 0 && (
						<div
							className="callOptionContainer"
							style={{
								boxShadow: theme,
							}}
							onClick={handleChatClick}
						>
							<button
								className={`flex gap-4 items-center font-semibold`}
								style={{ color: updatedCreator.themeSelected }}
							>
								{chat}
								Chat Now
							</button>
							<span className="text-sm tracking-widest">
								Rs. {updatedCreator.chatRate}/Min
							</span>
						</div>
					)}

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
