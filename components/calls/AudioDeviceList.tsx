import {
	DeviceSelectorAudioInput,
	DeviceSelectorAudioOutput,
} from "@stream-io/video-react-sdk";
import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";

const AudioDeviceList = ({
	micEnabled,
	showAudioDeviceList,
	setShowAudioDeviceList,
}: {
	micEnabled: boolean | undefined;
	showAudioDeviceList: boolean;
	setShowAudioDeviceList: Dispatch<SetStateAction<boolean>>;
}) => {
	const deviceListRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null); // Add ref for button

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// Ignore clicks on the button itself
			if (
				deviceListRef.current &&
				!deviceListRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node) // Check if clicked outside button
			) {
				setShowAudioDeviceList(false);
			}
		};

		if (showAudioDeviceList) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		// Cleanup event listener on unmount
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showAudioDeviceList, setShowAudioDeviceList]);

	const handleClick = () => {
		if (micEnabled) {
			setShowAudioDeviceList((prev) => !prev);
		}
	};

	return (
		<>
			<button
				ref={buttonRef} // Attach the ref to the button
				onClick={handleClick}
				className={`cursor-pointer rounded-full 
	${!micEnabled || showAudioDeviceList ? "bg-white/20" : "bg-[#ffffff14]"}
	p-3 hoverScaleDownEffect flex items-center ${
		!micEnabled ? "cursor-not-allowed" : ""
	}`}
				aria-disabled={!micEnabled}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className={`size-6 ${micEnabled ? "text-white" : "text-gray-400"}`}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
					/>
				</svg>
			</button>

			{showAudioDeviceList && micEnabled && (
				<div
					ref={deviceListRef}
					className="absolute bottom-16 left-0 bg-dark-1 rounded-t-xl w-full z-40 grid grid-cols-1 items-center"
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
