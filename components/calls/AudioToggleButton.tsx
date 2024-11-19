import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { mic, micOff } from "@/constants/icons";
import { useEffect, useState } from "react";
import PermissionsModalAudio from "../meeting/PermissionsModalAudio";

export const AudioToggleButton = () => {
	const { useMicrophoneState } = useCallStateHooks();
	const { microphone, isMute } = useMicrophoneState();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);

	// Function to check audio permissions
	const checkPermissions = async () => {
		try {
			const permissionStatus = await navigator.permissions.query({
				name: "microphone" as PermissionName,
			});

			setPermissionDenied(permissionStatus.state === "denied");

			// Listen to changes in permission state
			permissionStatus.onchange = () => {
				setPermissionDenied(permissionStatus.state === "denied");
			};
		} catch (error) {
			// Fallback if permissions API is unavailable
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				setPermissionDenied(false);
			} catch (err) {
				setPermissionDenied(true);
			}
		}
	};

	useEffect(() => {
		checkPermissions();
	}, []);

	// Re-check permissions when manually toggled by the user
	useEffect(() => {
		if (permissionDenied) {
			(async () => {
				try {
					// Request audio permission again to verify access
					await navigator.mediaDevices.getUserMedia({ audio: true });
					setPermissionDenied(false);
					setIsModalOpen(false); // Close modal if permission is now allowed
				} catch {
					setPermissionDenied(true);
				}
			})();
		}
	}, [permissionDenied]);

	const handleClick = () => {
		if (permissionDenied) {
			setIsModalOpen(true);
		} else {
			microphone.toggle();
		}
	};

	return (
		<>
			<div
				onClick={handleClick}
				className={`relative cursor-pointer rounded-full bg-[#ffffff14] p-3 hoverScaleDownEffect flex items-center`}
			>
				{permissionDenied && (
					<div
						className="absolute -top-1 -right-2"
						data-tooltip="Check browser's audio permissions"
					>
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
					<button>{mic}</button>
				) : (
					<button className="fill-red-500">{micOff}</button>
				)}
			</div>
			{/* Permissions Modal */}
			{isModalOpen && (
				<PermissionsModalAudio
					isOpen={isModalOpen}
					onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
				/>
			)}
		</>
	);
};
