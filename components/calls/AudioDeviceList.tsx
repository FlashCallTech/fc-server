import {
	DeviceSelectorAudioInput,
	DeviceSelectorAudioOutput,
} from "@stream-io/video-react-sdk";
import React, { Dispatch, SetStateAction, useState } from "react";

const AudioDeviceList = ({
	showAudioDeviceList,
	setShowAudioDeviceList,
}: {
	showAudioDeviceList: boolean;
	setShowAudioDeviceList: Dispatch<SetStateAction<boolean>>;
}) => {
	const [isScaled, setIsScaled] = useState(false);
	const handleClick = () => {
		setShowAudioDeviceList((prev) => !prev);
		setIsScaled((prev) => !prev);
	};
	return (
		<>
			<button
				onClick={handleClick}
				className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[${
					isScaled && "#4c535b"
				}]  transition-all duration-300 active:scale-75  hover:${
					isScaled ? "scale-110" : "scale-100"
				} flex items-center`}
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
						d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
					/>
				</svg>
			</button>

			{showAudioDeviceList && (
				<div
					className="absolute bottom-16 left-0 bg-dark-1 rounded-t-xl w-full z-40"
					onChange={() => setShowAudioDeviceList(false)}
				>
					<DeviceSelectorAudioOutput title="Audio Out" />
					<DeviceSelectorAudioInput title="Audio In" />
				</div>
			)}
		</>
	);
};

export default AudioDeviceList;
