import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { audio, mic, micOff } from "@/constants/icons";

export const AudioToggleButton = () => {
	const { useMicrophoneState } = useCallStateHooks();
	const { microphone, isMute } = useMicrophoneState();
	return (
		<div
			onClick={() => microphone.toggle()}
			className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] flex items-center"
		>
			{!isMute ? (
				<button>{mic}</button>
			) : (
				<button className=" fill-red-500">{micOff}</button>
			)}
		</div>
	);
};
