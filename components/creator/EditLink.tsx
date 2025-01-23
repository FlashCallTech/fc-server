import React, { useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { LinkType } from "@/types";

interface EditLinkProps {
	link: LinkType;
	onClose: () => void;
	onSave: (linkData: LinkType) => void;
	setLink: any;
	isLoading: boolean;
}

const EditLink: React.FC<EditLinkProps> = ({ link, onClose, onSave, setLink, isLoading }) => {

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setLink({
			...link,
			[name]: value,
		});
	};

	const handleSave = () => {
		onSave(link);
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
			<div className="bg-white border rounded-lg shadow-lg w-full max-w-md p-6">
				<div className="flex justify-between mb-6 items-center">
					<h2 className="text-lg font-semibold">Edit Link</h2>
					<button
						className="text-gray-500 text-xl hover:text-gray-700"
						onClick={onClose}
					>
						&times;
					</button>
				</div>
				<div className="flex flex-col mb-6 gap-4">
					<div className="flex flex-col gap-2">
						<input
							type="text"
							name="title"
							value={link.title}
							onChange={handleChange}
							className="border rounded-lg p-2 focus:outline-none"
							placeholder="Enter Title Here"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<input
							type="url"
							name="url"
							value={link.url}
							onChange={handleChange}
							className="border rounded-lg p-2 focus:outline-none"
							placeholder="Paste URL link here"
						/>
					</div>
				</div>
				<div className="flex pt-4 justify-end space-x-4">
					<Button
						onClick={onClose}
						className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hoverScaleDownEffect"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="bg-black text-white rounded-full px-4 py-2 hoverScaleDownEffect"
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
							"Save"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default EditLink;
