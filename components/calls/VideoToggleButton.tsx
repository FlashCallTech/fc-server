import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { video, videoOff } from "@/constants/icons";
import { useState } from "react";

export const VideoToggleButton = () => {
	const { useCameraState } = useCallStateHooks();
	const { camera, isMute } = useCameraState();
	const [isScaled, setIsScaled] = useState(false);
	const handleClick = () => {
		camera.toggle();
		setIsScaled((prev) => !prev);
	};
	return (
		<div
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[${
				isScaled && "#4c535b"
			}]  transition-all duration-300 active:scale-75  hover:${
				isScaled ? "scale-110" : "scale-100"
			} flex items-center`}
		>
			{!isMute ? <button>{video}</button> : <button>{videoOff}</button>}
		</div>
	);
};
