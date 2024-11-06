import React, { useState } from "react";
import { SwitchCamera } from "lucide-react";

const SwitchCameraType = ({
	toggleCamera,
}: {
	toggleCamera: () => Promise<void>;
}) => {
	const handleClick = () => {
		toggleCamera();
	};

	return (
		<section
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hoverScaleDownEffect flex items-center`}
		>
			<SwitchCamera size={24} className="text-white" />
		</section>
	);
};

export default SwitchCameraType;
