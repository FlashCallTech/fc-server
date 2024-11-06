import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { mic, micOff } from "@/constants/icons";
import { useState } from "react";

export const AudioToggleButton = () => {
	const { useMicrophoneState } = useCallStateHooks();
	const { microphone, isMute } = useMicrophoneState();
	const handleClick = () => {
		microphone.toggle();
	};

	return (
		<div
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hoverScaleDownEffect flex items-center`}
		>
			{!isMute ? (
				<button>{mic}</button>
			) : (
				<button className=" fill-red-500">{micOff}</button>
			)}
		</div>
	);
};
