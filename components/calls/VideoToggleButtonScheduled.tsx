import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { video, videoOff } from "@/constants/icons";
import { useEffect, useState } from "react";
import PermissionsModalVideo from "../meeting/PermissionsModalVideo";

export const VideoToggleButtonScheduled = () => {
	const { useCameraState } = useCallStateHooks();
	const { camera, isMute } = useCameraState();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);

	// Function to check camera permissions
	const checkPermissions = async () => {
		try {
			const permissionStatus = await navigator.permissions.query({
				name: "camera" as PermissionName,
			});
			setPermissionDenied(permissionStatus.state === "denied");

			// Listen to changes in permission state
			permissionStatus.onchange = () => {
				setPermissionDenied(permissionStatus.state === "denied");
			};
		} catch (error) {
			// Fallback if permissions API is unavailable
			try {
				await navigator.mediaDevices.getUserMedia({ video: true });
				setPermissionDenied(false);
			} catch (err) {
				setPermissionDenied(true);
			}
		}
	};

	useEffect(() => {
		checkPermissions();
	}, []);

	const handleClick = () => {
		if (permissionDenied) {
			setIsModalOpen(true);
		} else {
			camera.toggle();
		}
	};

	return (
		<>
			<div
				onClick={handleClick}
				className={`relative flex flex-row-reverse items-center justify-center gap-2 cursor-pointer rounded-full bg-black text-white px-4 py-2.5 w-full hoverScaleDownEffect`}
			>
				{permissionDenied && (
					<div className="" data-tooltip="Check browser's camera permissions">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="size-6 text-[#ffd646]"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
							/>
						</svg>
					</div>
				)}
				{!isMute ? (
					<button className="flex items-center gap-2 text-sm whitespace-nowrap">
						{video} Camera On
					</button>
				) : (
					<button className="flex items-center gap-2 fill-red-500 text-sm whitespace-nowrap">
						{videoOff} Camera Off
					</button>
				)}
			</div>

			{/* Permissions Modal */}
			{isModalOpen && (
				<PermissionsModalVideo
					isOpen={isModalOpen}
					onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
				/>
			)}
		</>
	);
};
