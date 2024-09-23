"use client";

import { useEffect, useState } from "react";
import {
	SfuModels,
	useCall,
	useCallStateHooks,
	useParticipantViewContext,
} from "@stream-io/video-react-sdk";
import {
	LucidePictureInPicture2,
	Mic,
	PictureInPicture,
	Video,
} from "lucide-react";

const PoorConnectionNotification = () => {
	const { participant } = useParticipantViewContext();
	const { connectionQuality, isLocalParticipant } = participant;

	if (
		isLocalParticipant &&
		connectionQuality === SfuModels.ConnectionQuality.POOR
	) {
		return (
			<span className="text-center py-5 fixed top-4 left-0 text-white bg-red-600 p-4 rounded-xl z-20">
				Poor connection quality
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
	const [isScaled, setIsScaled] = useState(false);

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
		setIsScaled((prev) => !prev);
	};

	return (
		<>
			{/* {call?.camera?.state?.status === "enabled" &&
				expert?.user_id !== participant.userId && (
					<button
						disabled={!document.pictureInPictureEnabled}
						onClick={handleClick}
						className={`lg:hidden cursor-pointer rounded-xl bg-[#ffffff14] p-2 hover:bg-[${
							isScaled && "#4c535b"
						}]  transition-all duration-300 active:scale-75 hover:${
							isScaled ? "scale-110" : "scale-100"
						} flex items-center absolute top-0 left-0`}
					>
						{pictureInPictureElement === videoElement ? (
							<LucidePictureInPicture2 />
						) : (
							<PictureInPicture />
						)}
					</button>
				)} */}

			<span
				className={`absolute   w-full text-sm text-ellipsis overflow-hidden ${
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
			</span>

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
