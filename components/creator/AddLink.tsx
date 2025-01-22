import Image from "next/image";
import React, { useState } from "react";

interface AddLinkProps {
	onClose: () => void;
	onSave: (linkData: { title: string; link: string }) => void;
	linkData: any;
	setLinkData: any;
	isLoading: boolean;
}

const AddLink: React.FC<AddLinkProps> = ({ onClose, onSave, linkData, setLinkData, isLoading }) => {
	const [error, setError] = useState<string | null>(null);

	// Validate the URL format
	const isValidUrl = (url: string) => {
		try {
			new URL(url); // This throws an error if the URL is invalid
			return true;
		} catch (e) {
			return false;
		}
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setLinkData({
			...linkData,
			[name]: value,
		});

		if (name === "link") {
			if (!isValidUrl(value)) {
				setError("Please enter a valid URL.");
			} else {
				setError(null);
			}
		}
	};

	const handleSave = () => {
		if (!isValidUrl(linkData.link)) {
			setError("Please enter a valid URL.");
			return;
		}
		onSave(linkData);
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white border rounded-lg shadow-lg w-full max-w-md p-6">
				<div className="flex justify-between mb-6 items-center">
					<h2 className="text-lg font-semibold">Add New Link</h2>
					<button
						className="text-gray-500 text-xl hover:text-gray-700"
						onClick={onClose}
					>
						&times;
					</button>
				</div>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<input
							type="text"
							name="title"
							value={linkData.title}
							onChange={handleChange}
							className="border rounded-lg p-2 focus:outline-none"
							placeholder="Enter Title Here"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<input
							type="url"
							name="link"
							value={linkData.link}
							onChange={handleChange}
							className={`border rounded-lg p-2 focus:outline-none ${error ? "border-red-500" : ""
								}`}
							placeholder="Paste URL link here"
						/>
						{error && <p className="text-red-500 text-sm">{error}</p>}
					</div>
				</div>
				<div className="flex justify-end gap-3 w-full mt-6">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={!!error || !linkData.title || !linkData.link}
						className={`px-4 py-2 text-sm text-white rounded-full hoverScaleDownEffect ${!!error || !linkData.title || !linkData.link
							? "bg-gray-400 cursor-not-allowed"
							: "bg-black"
							}`}
					>
						{isLoading ? (
							<Image
								src="/icons/loading-circle.svg"
								alt="Loading..."
								width={24}
								height={24}
								priority
							/>
						) : (
							"Add Link"
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AddLink;
