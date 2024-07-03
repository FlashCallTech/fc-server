import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { audio, mic, micOff } from "@/constants/icons";
import { useState } from "react";

export const AudioToggleButton = () => {
	const { useMicrophoneState } = useCallStateHooks();
	const { microphone, isMute } = useMicrophoneState();
	const [isScaled, setIsScaled] = useState(false);
	const handleClick = () => {
		microphone.toggle();
		setIsScaled((prev) => !prev);
	};

	return (
		<div
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[${
				isScaled && "#4c535b"
			}]  transition-all duration-300 active:scale-75 hover:${
				isScaled ? "scale-110" : "scale-100"
			} flex items-center`}
		>
			{!isMute ? (
				<button>{mic}</button>
			) : (
				<button className=" fill-red-500">{micOff}</button>
			)}
		</div>
	);
};
