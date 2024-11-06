import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { video, videoOff } from "@/constants/icons";
import { useState } from "react";

export const VideoToggleButton = () => {
	const { useCameraState } = useCallStateHooks();
	const { camera, isMute } = useCameraState();
	const handleClick = () => {
		camera.toggle();
	};
	return (
		<div
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3   hoverScaleDownEffect flex items-center`}
		>
			{!isMute ? <button>{video}</button> : <button>{videoOff}</button>}
		</div>
	);
};
