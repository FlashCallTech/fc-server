import React, { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { audio, video } from "@/constants/icons";
import { creatorUser } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUsersContext } from "@/lib/context/CurrentUsersContext";

import { isValidHexColor, getDisplayName, backendBaseUrl } from "@/lib/utils";
import { Cursor, Typewriter } from "react-simple-typewriter";

interface CallingOptions {
	creator: creatorUser;
}

const CallingOptions = ({ creator }: CallingOptions) => {
	const router = useRouter();
	const { clientUser, userType, setAuthenticationSheetOpen } =
		useCurrentUsersContext();
	const { toast } = useToast();
	const storedCallId = localStorage.getItem("activeCallId");
	const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
	const [callInitiated, setcallInitiated] = useState(false);
	const [callType, setCallType] = useState<"video" | "audio">("video");
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

	const copyToClipboard = (text: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast({
					variant: "destructive",
					title: "Meeting Link Copied",
					toastStatus: "positive",
				});
			})
			.catch((err) => {
				Sentry.captureException(err);
				console.error("Failed to copy text: ", err);
			});
	};

	const fullName = getDisplayName(creator);

	useEffect(() => {
		setAuthenticationSheetOpen(isAuthSheetOpen);
	}, [isAuthSheetOpen, setAuthenticationSheetOpen]);

	useEffect(() => {
		if (!creator?._id || !creator?.phone) return;

		const creatorRef = doc(db, "services", creator._id);
		const statusDocRef = doc(db, "userStatus", creator.phone);

		let clientStatusDocRef: any;
		if (clientUser) {
			clientStatusDocRef = doc(db, "userStatus", clientUser?.phone as string);
		}

		const unsubscribe = onSnapshot(creatorRef, (doc) => {
			const data = doc.data();

			if (data) {
				const prices = data.prices;
				const services = data.services;

				setUpdatedCreator((prev) => ({
					...prev,
					videoRate: prices?.videoCall ?? "",
					audioRate: prices?.audioCall ?? "",
					chatRate: prices?.chat ?? "",
					videoAllowed: services?.videoCall ?? false,
					audioAllowed: services?.audioCall ?? false,
					chatAllowed: services?.chat ?? false,
				}));

				// Check if any of the services are enabled
				const hasActiveService =
					services?.videoCall || services?.audioCall || services?.chat;

				// Now listen for the creator's status
				const unsubscribeStatus = onSnapshot(statusDocRef, (statusDoc) => {
					const statusData = statusDoc.data();

					if (statusData) {
						// Prioritize loginStatus
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
							// Fallback to services and status
							if (statusData.status === "Busy") {
								setOnlineStatus("Busy");
							} else {
								setOnlineStatus(hasActiveService ? "Online" : "Offline");
							}
						}
					}
				});

				// Listen for the client's status only if clientUser is not null
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
	}, [creator._id, creator.phone, clientUser, isAuthSheetOpen]);

	const createMeeting = async () => {
		if (!clientUser || !creator) return;

		try {
			setcallInitiated(true);

			const payload = {
				creator: {
					creatorId: creator._id,
					creatorFullName: fullName,
					creatorImage: creator.photo || "",
					creatorPhone: creator.phone,
				},
				client: {
					clientId: clientUser._id,
					clientName: clientUser.username || "Flashcall Client",
					clientImage: clientUser.photo || "",
					clientPhone: clientUser.phone,
					clientRole: "client",
				},
				call: {
					callType: callType === "video" ? "default" : "audio_room",
					membersCount: 2,
				},
				createdById: clientUser._id,
				customCallData: {
					meetingTitle: `${
						callType === "video" ? "Video Call" : "Audio Call"
					} With Expert ${creator.username}`,
					meetingAgenda: `Consultation With Expert ${creator.username}`,
					duration: "600",
				},
				validity: 10000,
			};

			// Make the API request to /setupFlow
			const response = await fetch(`${backendBaseUrl}/stream/setupFlow`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error("Failed to create meeting via /setupFlow endpoint");
			}

			const { meetingLink, meetingId } = await response.json();

			// Copy the meeting link to the clipboard
			copyToClipboard(meetingLink);

			// Redirect to the meeting page
			router.push(`/official/meeting/${meetingId}`);
		} catch (error) {
			console.error("Error creating meeting:", error);
			Sentry.captureException(error);
			toast({
				variant: "destructive",
				title: "Failed to create Meeting",
				toastStatus: "negative",
			});
		} finally {
			setTimeout(() => {
				setcallInitiated(false);
			}, 1000);
		}
	};

	const handleClickOption = async (callType: "video" | "audio") => {
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
			setCallType(callType);
			if (!clientUser) {
				setIsAuthSheetOpen(true);
				return;
			}

			if (onlineStatus === "Busy") {
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

					if (clientUser && !storedCallId) {
						createMeeting();
					} else if (clientUser && storedCallId) {
						toast({
							variant: "destructive",
							title: "Ongoing Call or Transaction Pending",
							description: "Redirecting you back ...",
							toastStatus: "negative",
						});
						router.replace(`/official/meeting/${storedCallId}`);
					} else {
						setIsAuthSheetOpen(true);
					}
				} catch (error) {
					Sentry.captureException(error);
					console.error("Error in handleClickOption:", error);
				} finally {
					setIsProcessing(false);
				}
			} else {
				return;
			}
		} catch (error) {
			Sentry.captureException(error);
			console.error("Error in handleClickOption:", error);
		}
	};

	const services = [
		{
			type: "video",
			label: "Video Call",
			icon: video,
			rate: updatedCreator.videoRate,
			enabled:
				!updatedCreator?.blocked?.includes(clientUser?._id) &&
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
				!updatedCreator?.blocked?.includes(clientUser?._id) &&
				!isClientBusy &&
				onlineStatus !== "Busy" &&
				updatedCreator.audioAllowed &&
				Number(updatedCreator.audioRate) > 0,
			onClick: () => handleClickOption("audio"),
		},
	];

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
							Rs.<span>{service.rate}</span>/min
						</p>
					</button>
				))}
			</div>

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
};

export default CallingOptions;
