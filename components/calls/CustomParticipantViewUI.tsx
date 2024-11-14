"use client";

import { useEffect, useState } from "react";
import {
	SfuModels,
	useCall,
	useCallStateHooks,
	useParticipantViewContext,
} from "@stream-io/video-react-sdk";
import { Mic, Video } from "lucide-react";

const PoorConnectionNotification = () => {
	const { participant } = useParticipantViewContext();
	const { connectionQuality, isLocalParticipant } = participant;

	if (
		isLocalParticipant &&
		connectionQuality === SfuModels.ConnectionQuality.POOR
	) {
		return (
			<span className="fixed top-6 left-6 sm:top-4 sm:left-4 z-20 w-fit rounded-md px-4 py-2 h-10 bg-red-500 text-white flex items-center justify-center text-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="size-6 mr-1"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
					/>
				</svg>
				Weak conn.
			</span>
		);
	}

	return null;
};

const CustomParticipantViewUI = () => {
	const { videoElement, participant } = useParticipantViewContext();
	const [pictureInPictureElement, setPictureInPictureElement] = useState(
		document.pictureInPictureElement
	);
	const call = useCall();

	const { useMicrophoneState, useCameraState } = useCallStateHooks();
	const { isMute } = useMicrophoneState();
	const { isEnabled } = useCameraState();

	const { isLocalParticipant } = participant;

	const expert = call?.state?.members?.find(
		(member) => member.custom.type === "expert"
	);

	// Setting up event listeners for PiP mode
	useEffect(() => {
		if (!videoElement) return;

		const handlePictureInPicture = () => {
			setPictureInPictureElement(document.pictureInPictureElement);
		};

		videoElement.addEventListener(
			"enterpictureinpicture",
			handlePictureInPicture
		);
		videoElement.addEventListener(
			"leavepictureinpicture",
			handlePictureInPicture
		);

		const handleVisibilityChange = () => {
			if (document.hidden) {
				handleClick();
			} else if (pictureInPictureElement === videoElement) {
				handleClick();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			videoElement.removeEventListener(
				"enterpictureinpicture",
				handlePictureInPicture
			);
			videoElement.removeEventListener(
				"leavepictureinpicture",
				handlePictureInPicture
			);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [videoElement, pictureInPictureElement]);

	const togglePictureInPicture = () => {
		if (videoElement && pictureInPictureElement !== videoElement) {
			videoElement.requestPictureInPicture().catch(console.error);
		} else {
			document.exitPictureInPicture().catch(console.error);
		}
	};

	const handleClick = () => {
		togglePictureInPicture();
	};

	return (
		<>
			{/* <span
				className={`absolute w-full text-sm text-ellipsis overflow-hidden ${
					expert?.user_id !== participant.userId
						? "max-w-[85%] pb-2 bottom-0 left-3"
						: "max-w-[55%] sm:max-w-[65%] bottom-1.5 left-2.5"
				} overflow-scroll no-scrollbar`}
			>
				{participant.name.startsWith("+91")
					? participant.name.replace(
							/(\+91)(\d+)/,
							(match, p1, p2) => `${p1} ${p2.replace(/(\d{5})$/, "xxxxx")}`
					  )
					: participant.name}
			</span> */}

			<PoorConnectionNotification />

			{isLocalParticipant && (
				<div
					className={`flex items-center justify-center gap-2 absolute  ${
						expert?.user_id !== participant.userId
							? "top-2 right-2"
							: "top-2 left-2"
					}`}
				>
					{!isMute && <Mic className="w-4 h-4" />}

					{isEnabled && <Video className="w-4 h-4" />}
				</div>
			)}
		</>
	);
};

export default CustomParticipantViewUI;
