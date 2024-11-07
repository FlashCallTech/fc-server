import React, { useState, useEffect } from "react";
import { SwitchCamera } from "lucide-react";

const SwitchCameraType = ({
	toggleCamera,
	cameraEnabled,
}: {
	toggleCamera: () => Promise<void>;
	cameraEnabled: boolean | undefined;
}) => {
	const handleClick = () => {
		if (cameraEnabled) {
			toggleCamera();
		}
	};

	return (
		<section
			onClick={handleClick}
			className={`cursor-pointer rounded-full p-3 hoverScaleDownEffect flex items-center ${
				cameraEnabled ? "bg-[#ffffff14]" : "bg-white/20"
			}`}
			aria-disabled={!cameraEnabled}
		>
			<SwitchCamera
				size={24}
				className={cameraEnabled ? "text-white" : "text-gray-400"}
			/>
		</section>
	);
};

export default SwitchCameraType;
