import React, { useState } from "react";
import { SwitchCamera } from "lucide-react";

const SwitchCameraType = ({
	toggleCamera,
}: {
	toggleCamera: () => Promise<void>;
}) => {
	const [isScaled, setIsScaled] = useState(false);
	const handleClick = () => {
		toggleCamera();
		setIsScaled((prev) => !prev);
	};

	return (
		<button
			onClick={handleClick}
			className={`cursor-pointer rounded-full bg-[#ffffff14] p-3 hover:bg-[${
				isScaled && "#4c535b"
			}]  transition-all duration-300 active:scale-75  hover:${
				isScaled ? "scale-110" : "scale-100"
			} flex items-center`}
		>
			<SwitchCamera size={24} className="text-white" />
		</button>
	);
};

export default SwitchCameraType;
