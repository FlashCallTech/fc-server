import React, { useEffect, useRef, useState } from "react";
import { Call } from "@stream-io/video-react-sdk";
import { useToast } from "../ui/use-toast";

const MyIncomingCallUI = ({ call }: { call: Call }) => {
	const { toast } = useToast();
	const [callState, setCallState] = useState("incoming");
	const [shownNotification, setShownNotification] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const registerServiceWorker = async () => {
			if ("serviceWorker" in navigator) {
				try {
					await navigator.serviceWorker.register("/sw.js");
					console.log("Service Worker registered.");
				} catch (error) {
					console.error("Service Worker registration failed:", error);
				}
			}
		};

		registerServiceWorker();
	}, []);

	const showNotification = () => {
		if ("Notification" in window && Notification.permission === "granted") {
			navigator.serviceWorker.ready.then((registration) => {
				registration.showNotification("Incoming Call", {
					body: `Call from ${call.state.createdBy?.name}`,
					icon:
						call?.state?.createdBy?.image || "/images/defaultProfileImage.png",
					tag: "incoming-call",
					data: { url: `https://www.flashcall.me/meeting/${call.id}` },
				});
			});
		} else if ("Notification" in window) {
			Notification.requestPermission().then((result) => {
				if (result === "granted") {
					navigator.serviceWorker.ready.then((registration) => {
						registration.showNotification("Incoming Call", {
							body: `Call from ${call.state.createdBy?.name}`,
							icon:
								call?.state?.createdBy?.image ||
								"/images/defaultProfileImage.png",
							tag: "incoming-call",
							data: { url: `https://www.flashcall.me/meeting/${call.id}` },
						});
					});
				}
			});
		}
	};

	useEffect(() => {
		let audio: HTMLAudioElement | null = null;

		if (callState === "incoming") {
			audio = new Audio("/sounds/notification.mp3");
			audio.loop = true;

			const playPromise = audio.play();
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						console.log("Audio autoplay started!");
					})
					.catch((error) => {
						console.error("Audio autoplay was prevented:", error);
						// Show a UI element or prompt user to play the sound manually if needed
					});
			}

			if (!shownNotification) {
				showNotification();
				setShownNotification(true);
			}
		}

		// Clean up when callState changes or on component unmount
		return () => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		};
	}, [callState, shownNotification]);

	const handleCallState = async (action: string) => {
		if (action === "declined") {
			await call.leave({ reject: true });
			setCallState("declined");
		} else if (action === "accepted") {
			await call.accept();
			setCallState("accepted");
		} else if (action === "ended") {
			setCallState("ended");
		}

		toast({
			title: `${action === "declined" ? "Call Declined" : "Call Accepted"}`,
			description: `${
				action === "declined"
					? "Redirection Back ..."
					: "Redirection To Meeting"
			}`,
		});
	};

	return (
		<div className="text-center bg-dark-2 text-white fixed h-full sm:h-fit z-50 w-full sm:w-[35%] 3xl:[25%] flex flex-col items-center justify-between py-10 sm:rounded-xl bottom-0 right-0 sm:top-4 sm:right-4 gap-5">
			<h1 className="font-bold text-xl mb-2">Incoming Call ...</h1>
			<div className="flex flex-col items-center justify-center gap-10">
				<img
					src={
						call?.state?.createdBy?.image || "/images/defaultProfileImage.png"
					}
					alt=""
					className="rounded-full w-28 h-28 object-cover"
					onError={(e) => {
						e.currentTarget.src = "/images/defaultProfileImage.png";
					}}
				/>

				<div className="flex flex-col items-center justify-center gap-2">
					<p className="text-xs">Call From </p>
					<p className="font-semibold text-xl">{call.state.createdBy?.name}</p>
				</div>
			</div>
			<div className="flex items-center justify-evenly w-full">
				<button
					className="bg-green-500 text-white p-4 rounded-full hoverScaleEffect"
					onClick={() => {
						handleCallState("accepted");
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0 6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
						/>
					</svg>
				</button>
				<button
					className="bg-red-500 text-white p-4 rounded-full hoverScaleEffect"
					onClick={() => {
						handleCallState("declined");
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="size-6"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 0 1 4.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 0 0-.38 1.21 12.035 12.035 0 0 0 7.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 0 1 1.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25Z"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
};

export default MyIncomingCallUI;
