import React, { useState } from "react";
import { Button } from "../ui/button";

interface EditLinkProps {
  link: { title: string; url: string };
	onClose: () => void;
	onSave: (linkData: { title: string; url: string }) => void;
}

const EditLink: React.FC<EditLinkProps> = ({link, onClose, onSave }) => {
	const [linkData, setLinkData] = useState(link);

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
							value={linkData.url}
							onChange={handleChange}
							className="border-b p-2 focus:outline-none"
							placeholder="Paste URL link here"
						/>
					</div>
				</div>
				<div className="flex pt-4 w-full">
					<div className="flex flex-row w-full justify-between">
						<Button
							onClick={onClose}
							className="text-black rounded-md px-12 bg-gray-200 hover:bg-gray-400 hover:text-white"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							className="bg-green-600 text-white rounded-md px-12 hover:bg-green-700"
						>
							Save
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditLink;
