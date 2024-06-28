"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useParticipantViewContext } from "@stream-io/video-react-sdk";
import { PictureInPictureIcon } from "lucide-react";
const PictureInPicture = () => {
	const { videoElement } = useParticipantViewContext();
	const [pictureInPictureElement, setPictureInPictureElement] = useState(
		document.pictureInPictureElement
	);

	useEffect(() => {
		if (!videoElement) return;

		// sync local state
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

		return () => {
			videoElement.removeEventListener(
				"enterpictureinpicture",
				handlePictureInPicture
			);
			videoElement.removeEventListener(
				"leavepictureinpicture",
				handlePictureInPicture
			);
		};
	}, [videoElement]);

	const togglePictureInPicture = () => {
		if (videoElement && pictureInPictureElement !== videoElement)
			return videoElement.requestPictureInPicture().catch(console.error);

		document.exitPictureInPicture().catch(console.error);
	};

	return (
		<>
			<button
				disabled={!document.pictureInPictureEnabled}
				style={{ position: "absolute", top: 10, right: 10 }}
				onClick={togglePictureInPicture}
			>
				{pictureInPictureElement === videoElement ? "Leave" : "Enter"}{" "}
				<PictureInPictureIcon />
			</button>
		</>
	);
};

export default PictureInPicture;
