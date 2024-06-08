import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { video, videoOff } from "@/constants/icons";

export const VideoToggleButton = () => {
	const { useCameraState } = useCallStateHooks();
	const { camera, isMute } = useCameraState();
	return (
		<div
			onClick={() => camera.toggle()}
			className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] flex items-center"
		>
			{!isMute ? <button>{video}</button> : <button>{videoOff}</button>}
		</div>
	);
};
