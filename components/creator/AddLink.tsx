import React, { useState } from "react";
import { Button } from "../ui/button";

interface AddLinkProps {
	onClose: () => void;
	onSave: (linkData: { title: string; link: string }) => void;
}

const AddLink: React.FC<AddLinkProps> = ({ onClose, onSave }) => {
	const [linkData, setLinkData] = useState({ title: "", link: "" });

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setLinkData({
			...linkData,
			[name]: value,
		});
	};

	const handleSave = () => {
		onSave(linkData);
		onClose();
	};

	return (
		<div className="flex bg-white border rounded-lg shadow-sm p-2">
			<div className="flex flex-col bg-white w-full">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<input
							type="text"
							name="title"
							value={linkData.title}
							onChange={handleChange}
							className="border-b p-2 focus:outline-none"
							placeholder="Enter Title Here"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<input
							type="url"
							name="link"
							value={linkData.link}
							onChange={handleChange}
							className="border-b p-2 focus:outline-none"
							placeholder="Paste URL link here"
						/>
					</div>
				</div>
				<div className="flex pt-4 w-full">
					<div className="flex flex-row w-full justify-between">
						<button
							onClick={onClose}
							className="text-grey-200 text-sm rounded-lg px-4 py-1 bg-white border border-grey-200 hoverScaleDownEffect"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="text-[#16BC88] text-sm rounded-lg border border-[#16BC88] px-4 py-1 hoverScaleDownEffect"
						>
							Save
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AddLink;
